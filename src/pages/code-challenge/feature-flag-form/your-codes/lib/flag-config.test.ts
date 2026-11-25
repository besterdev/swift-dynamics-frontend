import { describe, expect, it } from 'vitest'
import {
  editConditionTree,
  flagJson,
  flagSchema,
  newOutcome,
  sampleFlag,
} from './flag-config'
import type { Condition, Group } from '../types/flag'

describe('feature flag configuration', () => {
  it('preserves match logic and typed values in the GO Feature Flag file', () => {
    const flag = structuredClone(sampleFlag)
    const nested: Group = {
      id: 'location-or-admin',
      kind: 'group',
      match: 'any',
      children: [
        {
          id: 'country',
          kind: 'condition',
          attribute: 'country',
          operator: 'equals',
          value: 'TH',
        },
        {
          id: 'admin',
          kind: 'condition',
          attribute: 'admin',
          operator: 'equals',
          value: 'true',
        },
      ],
    }
    flag.rules[0].group.children.push(nested)
    flag.variations[0].name = 'redesign'

    expect(flagSchema.safeParse(flag).success).toBe(true)

    const output = JSON.parse(flagJson(flag))['checkout-redesign']
    expect(output.variations).toEqual({ redesign: true, off: false })
    expect(output.defaultRule).toEqual({ variation: 'off' })
    expect(output.targeting[0].variation).toBe('redesign')
    expect(JSON.parse(output.targeting[0].query)).toEqual({
      and: [
        { '===': [{ var: 'group' }, 'beta'] },
        { '===': [{ var: 'role' }, 'tester'] },
        {
          or: [
            { '===': [{ var: 'country' }, 'TH'] },
            { '===': [{ var: 'admin' }, true] },
          ],
        },
      ],
    })
  })

  it('reports a deeply nested incomplete condition at its own field', () => {
    const flag = structuredClone(sampleFlag)
    flag.rules[0].group.children.push({
      id: 'nested',
      kind: 'group',
      match: 'any',
      children: [
        {
          id: 'condition',
          kind: 'condition',
          attribute: 'role',
          operator: 'equals',
          value: ' ',
        },
      ],
    } satisfies Group)

    const result = flagSchema.safeParse(flag)
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['rules', 0, 'group', 'children', 2, 'children', 0, 'value'],
        }),
      ]),
    )
  })

  it('reports references to a removed variation in both rule types', () => {
    const flag = structuredClone(sampleFlag)
    flag.defaultRule.variationId = 'on'
    flag.variations = flag.variations.filter(
      (variation) => variation.id !== 'on',
    )

    const result = flagSchema.safeParse(flag)
    const paths = result.error?.issues.map((issue) => issue.path)
    expect(paths).toEqual(
      expect.arrayContaining([
        ['defaultRule', 'variationId'],
        ['rules', 0, 'outcome', 'variationId'],
      ]),
    )
  })
})

describe('audience targeting and weighted rollout', () => {
  it('compiles a group with any of its assigned roles using current names', () => {
    const flag = structuredClone(sampleFlag)
    flag.roles.push({ id: 'analyst-role', name: 'analyst' })
    flag.roles[0].name = 'qa'
    flag.audienceGroups[0].roleIds.push('analyst-role')
    flag.rules[0].group.children = [
      {
        id: 'saved-audience',
        kind: 'condition',
        source: 'group',
        value: 'beta-group',
        attribute: '',
        operator: 'equals',
      } satisfies Condition,
    ]

    expect(flagSchema.safeParse(flag).success).toBe(true)
    const output = JSON.parse(flagJson(flag))['checkout-redesign']
    const condition = JSON.parse(output.targeting[0].query)
    expect(condition.and[0].or[0]).toEqual({
      '===': [{ var: 'group' }, 'beta'],
    })
    expect(
      condition.and[1].or.map((role: { or: unknown[] }) => role.or[0]),
    ).toEqual([
      { '===': [{ var: 'role' }, 'qa'] },
      { '===': [{ var: 'role' }, 'analyst'] },
    ])

    flag.roles.shift()
    const deletedRolePaths = flagSchema
      .safeParse(flag)
      .error?.issues.map((issue) => issue.path)
    expect(deletedRolePaths).toContainEqual(['audienceGroups', 0, 'roleIds'])
    flag.audienceGroups = []
    const deletedGroupPaths = flagSchema
      .safeParse(flag)
      .error?.issues.map((issue) => issue.path)
    expect(deletedGroupPaths).toContainEqual([
      'rules',
      0,
      'group',
      'children',
      0,
      'value',
    ])
  })

  it('keeps quoted strings distinct from numbers and rejects malformed quotes', () => {
    const flag = structuredClone(sampleFlag)
    const condition: Condition = {
      id: 'tier',
      kind: 'condition',
      value: '"7"',
      attribute: 'tier',
      operator: 'equals',
    }
    flag.rules[0].group.children = [condition]
    const getQuery = () =>
      JSON.parse(
        JSON.parse(flagJson(flag))['checkout-redesign'].targeting[0].query,
      )
    expect(getQuery()).toEqual({ '===': [{ var: 'tier' }, '7'] })

    flag.rules[0].group.children = [
      { ...condition, value: '7', operator: 'not-equals' },
    ]
    expect(getQuery()).toEqual({ '!==': [{ var: 'tier' }, 7] })

    flag.rules[0].group.children = [{ ...condition, value: '"7' }]
    expect(flagSchema.safeParse(flag).success).toBe(false)
  })

  it('encodes the rollout mode and validates weights on targeting and default rules', () => {
    const flag = structuredClone(sampleFlag)
    flag.rules[0].outcome = {
      ...newOutcome('on'),
      mode: 'percentage',
      weights: { on: '25.5', off: '74.5' },
    }
    flag.defaultRule = {
      ...newOutcome('off'),
      mode: 'percentage',
      weights: { off: '100' },
    }
    flag.variations[0].name = 'redesign'

    expect(flagSchema.safeParse(flag).success).toBe(true)
    const output = JSON.parse(flagJson(flag))['checkout-redesign']
    expect(output.targeting[0]).toMatchObject({
      percentage: { redesign: 25.5, off: 74.5 },
    })
    expect(output.targeting[0]).not.toHaveProperty('variation')
    expect(output.defaultRule).toEqual({ percentage: { off: 100 } })

    flag.rules[0].outcome.weights = { on: '-1', unknown: '50' }
    flag.defaultRule.weights = { off: '0' }
    const paths = flagSchema
      .safeParse(flag)
      .error?.issues.map((issue) => issue.path)
    expect(paths).toEqual(
      expect.arrayContaining([
        ['rules', 0, 'outcome', 'weights', 'on'],
        ['rules', 0, 'outcome', 'weights'],
        ['defaultRule', 'weights'],
      ]),
    )
  })

  it('keeps untouched condition objects stable when editing a sibling', () => {
    const left: Condition = {
      id: 'left',
      kind: 'condition',
      value: 'left',
      attribute: 'key',
      operator: 'equals',
    }
    const right: Condition = { ...left, id: 'right', value: 'right' }
    const group: Group = {
      id: 'group',
      kind: 'group',
      match: 'all',
      children: [left, right],
    }
    const edited = editConditionTree(group, left.id, {
      ...left,
      value: 'changed',
    })
    expect(edited).not.toBe(group)
    expect(edited.children[1]).toBe(right)
    expect(group.children[0]).toBe(left)
  })
})

it('reports missing audience references even when a sibling condition is incomplete', () => {
  const flag = structuredClone(sampleFlag)
  flag.rules[0].group.children = [
    {
      id: 'missing-role',
      kind: 'condition',
      source: 'role',
      attribute: '',
      operator: 'equals',
      value: 'removed-role',
    },
    {
      id: 'incomplete',
      kind: 'condition',
      attribute: 'country',
      operator: 'equals',
      value: '',
    },
  ] satisfies Condition[]

  const issues = flagSchema.safeParse(flag).error?.issues
  expect(issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: ['rules', 0, 'group', 'children', 0, 'value'],
        message: 'Select an available role.',
      }),
      expect.objectContaining({
        path: ['rules', 0, 'group', 'children', 1, 'value'],
        message: 'Enter a value or a valid double-quoted string.',
      }),
    ]),
  )
})
