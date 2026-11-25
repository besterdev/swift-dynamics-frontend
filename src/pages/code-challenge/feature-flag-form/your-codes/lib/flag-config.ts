import { z } from 'zod'

import { conditionSources, operators, valueTypes } from './flag-options'
import type {
  AudienceGroup,
  Condition,
  DraftGroup,
  FlagDraft,
  Group,
  Role,
  RuleOutcome,
  ValueType,
} from '../types/flag'

const nameSchema = z.string().trim().min(1, 'Enter a name.')
const identifier = nameSchema.regex(
  /^[\w.-]+$/,
  'Use letters, numbers, dots, hyphens, or underscores.',
)
const namedItem = z.object({ id: z.string(), name: nameSchema })
const audienceGroup = namedItem.extend({ roleIds: z.array(z.string()) })
const jsonValueSchema = z.json()

const comparisonValue = (
  raw: string,
): string | number | boolean | undefined => {
  const text = raw.trim()
  if (text === '') return undefined
  try {
    const value: unknown = JSON.parse(text)
    if (typeof value === 'string' || typeof value === 'boolean') return value
    if (typeof value === 'number' && Number.isFinite(value)) return value
  } catch {
    if (text.startsWith('"')) return undefined
  }
  return text
}

const conditionSchema = z
  .object({
    id: z.string(),
    kind: z.literal('condition'),
    source: z.enum(conditionSources).optional(),
    attribute: z.string(),
    operator: z.enum(operators),
    value: z.string(),
  })
  .superRefine((condition, ctx) => {
    if (condition.source && condition.source !== 'attribute') return
    if (!condition.attribute.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['attribute'],
        message: 'Choose or enter an attribute.',
      })
    }
    if (comparisonValue(condition.value) === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Enter a value or a valid double-quoted string.',
      })
    }
  })

export const editConditionTree = (
  group: Group,
  id: string,
  next: Condition | Group | null,
): Group => {
  if (group.id === id) return next?.kind === 'group' ? next : group

  const children = group.children.flatMap((child) => {
    if (child.id === id) return next ? [next] : []
    return [child.kind === 'group' ? editConditionTree(child, id, next) : child]
  })
  if (
    children.length === group.children.length &&
    children.every((child, index) => child === group.children[index])
  )
    return group
  return { ...group, children }
}

const groupSchema = z.object({
  id: z.string(),
  kind: z.literal('group'),
  match: z.enum(['all', 'any']),
  children: z.lazy(
    (): z.ZodType<Group['children'], unknown[]> =>
      z
        .array(z.discriminatedUnion('kind', [conditionSchema, groupSchema]))
        .min(1, 'Add a condition or group.'),
  ),
})

const outcomeSchema = z.object({
  mode: z.enum(['variation', 'percentage']),
  variationId: z.string(),
  weights: z.record(z.string(), z.string()),
})

const flagFields = z.object({
  key: identifier,
  description: z.string(),
  enabled: z.boolean(),
  valueType: z.enum(valueTypes),
  variations: z
    .array(namedItem.extend({ name: identifier, value: z.string() }))
    .min(1, 'Add at least one variation.'),
  roles: z.array(namedItem),
  audienceGroups: z.array(audienceGroup),
  rules: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      // An opaque tree keeps TanStack Form's paths finite. inspectGroup validates it below.
      group: z.custom<DraftGroup>(),
      outcome: outcomeSchema,
    }),
  ),
  defaultRule: outcomeSchema,
}) satisfies z.ZodType<FlagDraft, FlagDraft>

const readValue = (type: ValueType, raw: string) => {
  if (type === 'String') return raw
  try {
    const parsed: unknown = JSON.parse(raw)
    const result = jsonValueSchema.safeParse(parsed)
    if (!result.success || result.data === null) return undefined

    const value = result.data
    if (type === 'Boolean' && typeof value === 'boolean') return value
    if (type === 'Number' && typeof value === 'number') return value
    if (type === 'Array' && Array.isArray(value)) return value
    if (type === 'Object' && typeof value === 'object' && !Array.isArray(value))
      return value
  } catch {
    return undefined
  }
}

export const defaultValuesByType: Record<ValueType, string> = {
  Boolean: 'false',
  String: '',
  Number: '0',
  Object: '{}',
  Array: '[]',
}

type Location = (string | number)[]
type ReportIssue = (path: Location, message: string) => void
type AudienceReference = { type: 'group' | 'role'; id: string; path: Location }

// Groups are replaced immutably. Unedited rules reuse their parsed tree and references.
const groupInspections = new WeakMap<
  object,
  {
    issues: { path: Location; message: string }[]
    references: AudienceReference[]
  }
>()

const inspectGroup = (group: unknown) => {
  if (typeof group !== 'object' || group === null) {
    return {
      issues: [{ path: [], message: 'Add a condition group.' }],
      references: [],
    }
  }

  const cached = groupInspections.get(group)
  if (cached) return cached

  const result = groupSchema.safeParse(group)
  const references: AudienceReference[] = []
  const visit = (node: unknown, path: Location) => {
    if (!node || typeof node !== 'object' || !('kind' in node)) return

    if (
      node.kind === 'group' &&
      'children' in node &&
      Array.isArray(node.children)
    ) {
      node.children.forEach((child: unknown, index) =>
        visit(child, [...path, 'children', index]),
      )
    } else if (
      node.kind === 'condition' &&
      'source' in node &&
      (node.source === 'group' || node.source === 'role') &&
      'value' in node &&
      typeof node.value === 'string'
    ) {
      references.push({
        type: node.source,
        id: node.value,
        path: [...path, 'value'],
      })
    }
  }
  visit(result.success ? result.data : group, [])

  const issues =
    result.error?.issues.map(({ path, message }) => ({
      path: path.map((part) =>
        typeof part === 'number' ? part : String(part),
      ),
      message,
    })) ?? []
  const inspection = { issues, references }
  groupInspections.set(group, inspection)
  return inspection
}

const checkNames = (
  items: Role[],
  field: 'variations' | 'roles' | 'audienceGroups',
  report: ReportIssue,
) => {
  const names = new Set<string>()
  items.forEach(({ name }, index) => {
    if (names.has(name)) report([field, index, 'name'], 'Use a unique name.')
    names.add(name)
  })
}

export const readWeight = (raw: string) => {
  const text = raw.trim()
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return undefined
  const value = Number(text)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

const checkOutcome = (
  outcome: RuleOutcome,
  ids: Set<string>,
  path: Location,
  report: ReportIssue,
) => {
  if (outcome.mode === 'variation') {
    if (!ids.has(outcome.variationId))
      report([...path, 'variationId'], 'Select an available variation.')
    return
  }

  let total = 0
  for (const [id, raw] of Object.entries(outcome.weights)) {
    if (!ids.has(id)) {
      report(
        [...path, 'weights'],
        'Remove the weight for the deleted variation.',
      )
      continue
    }
    const weight = readWeight(raw)
    if (weight === undefined)
      report([...path, 'weights', id], 'Enter a finite, non-negative weight.')
    else total += weight
  }
  if (!(total > 0 && Number.isFinite(total))) {
    report(
      [...path, 'weights'],
      'Enter at least one positive weight with a finite total.',
    )
  }
}

export const flagSchema = flagFields.superRefine((flag, ctx) => {
  const report: ReportIssue = (path, message) =>
    ctx.addIssue({ code: 'custom', path, message })
  const variationIds = new Set(flag.variations.map(({ id }) => id))
  const roleIds = new Set(flag.roles.map(({ id }) => id))
  const groupIds = new Set(flag.audienceGroups.map(({ id }) => id))
  checkNames(flag.variations, 'variations', report)
  checkNames(flag.roles, 'roles', report)
  checkNames(flag.audienceGroups, 'audienceGroups', report)

  flag.variations.forEach(({ value }, index) => {
    if (readValue(flag.valueType, value) === undefined) {
      report(
        ['variations', index, 'value'],
        `Enter a valid ${flag.valueType.toLowerCase()} value.`,
      )
    }
  })

  flag.audienceGroups.forEach((group, index) => {
    if (group.roleIds.some((id) => !roleIds.has(id))) {
      report(
        ['audienceGroups', index, 'roleIds'],
        'Remove the deleted roles from this group.',
      )
    }
  })

  flag.rules.forEach((rule, index) => {
    const path = ['rules', index]
    const inspection = inspectGroup(rule.group)
    for (const issue of inspection.issues)
      report([...path, 'group', ...issue.path], issue.message)
    for (const ref of inspection.references) {
      const ids = ref.type === 'role' ? roleIds : groupIds
      if (!ids.has(ref.id))
        report(
          [...path, 'group', ...ref.path],
          `Select an available ${ref.type}.`,
        )
    }
    checkOutcome(rule.outcome, variationIds, [...path, 'outcome'], report)
  })
  checkOutcome(flag.defaultRule, variationIds, ['defaultRule'], report)
})

export const newCondition = (): Condition => {
  return {
    id: crypto.randomUUID(),
    kind: 'condition',
    attribute: 'group',
    operator: 'equals',
    value: '',
  }
}

export const newGroup = (): Group => {
  return {
    id: crypto.randomUUID(),
    kind: 'group',
    match: 'all',
    children: [newCondition()],
  }
}

export const newOutcome = (variationId: string): RuleOutcome => {
  return { mode: 'variation', variationId, weights: {} }
}

export const sampleFlag: FlagDraft = {
  key: 'checkout-redesign',
  description: 'Enable the new checkout experience for early access users.',
  enabled: true,
  valueType: 'Boolean',
  variations: [
    { id: 'on', name: 'on', value: 'true' },
    { id: 'off', name: 'off', value: 'false' },
  ],
  roles: [{ id: 'tester-role', name: 'tester' }],
  audienceGroups: [
    { id: 'beta-group', name: 'beta', roleIds: ['tester-role'] },
  ],
  rules: [
    {
      id: 'early-access',
      name: 'Early access',
      outcome: newOutcome('on'),
      group: {
        id: 'early-access-group',
        kind: 'group',
        match: 'all',
        children: [
          {
            id: 'group',
            kind: 'condition',
            attribute: 'group',
            operator: 'equals',
            value: 'beta',
          },
          {
            id: 'role',
            kind: 'condition',
            attribute: 'role',
            operator: 'equals',
            value: 'tester',
          },
        ],
      },
    },
  ],
  defaultRule: newOutcome('off'),
}

type Query = { [operator: string]: unknown }
type Audience = { roles: Map<string, Role>; groups: Map<string, AudienceGroup> }

const combine = (operator: 'and' | 'or', clauses: Query[]): Query => {
  return clauses.length === 1 ? clauses[0] : { [operator]: clauses }
}

const matchesAudience = (type: 'group' | 'role', name: string): Query => {
  return {
    or: [
      { '===': [{ var: type }, name] },
      { in: [name, { var: [type + 's', []] }] },
    ],
  }
}

const audienceQuery = (
  type: 'group' | 'role',
  id: string,
  audience: Audience,
): Query => {
  const noMatch = { '===': [true, false] }
  if (type === 'role') {
    const role = audience.roles.get(id)
    return role ? matchesAudience('role', role.name.trim()) : noMatch
  }

  const group = audience.groups.get(id)
  if (!group) return noMatch
  const membership = matchesAudience('group', group.name.trim())
  if (group.roleIds.length === 0) return membership
  return {
    and: [
      membership,
      combine(
        'or',
        group.roleIds.map((roleId) => audienceQuery('role', roleId, audience)),
      ),
    ],
  }
}

const toQuery = (node: Group | Condition, audience: Audience): Query => {
  if (node.kind === 'group') {
    return combine(
      node.match === 'all' ? 'and' : 'or',
      node.children.map((child) => toQuery(child, audience)),
    )
  }
  if (node.source && node.source !== 'attribute')
    return audienceQuery(node.source, node.value, audience)

  const attribute = { var: node.attribute.trim() }
  const value = comparisonValue(node.value) ?? null
  if (node.operator === 'contains') return { in: [value, attribute] }
  return { [node.operator === 'equals' ? '===' : '!==']: [attribute, value] }
}

const encodeOutcome = (outcome: RuleOutcome, names: Map<string, string>) => {
  if (outcome.mode === 'variation')
    return { variation: names.get(outcome.variationId) ?? '' }

  return {
    percentage: Object.fromEntries(
      [...names]
        .filter(([id]) => Object.hasOwn(outcome.weights, id))
        .map(([id, name]) => [name, readWeight(outcome.weights[id]) ?? null]),
    ),
  }
}

export const flagJson = (flag: FlagDraft) => {
  const names = new Map(
    flag.variations.map(({ id, name }) => [id, name.trim()]),
  )
  const audience = {
    roles: new Map(flag.roles.map((role) => [role.id, role])),
    groups: new Map(flag.audienceGroups.map((group) => [group.id, group])),
  }
  return JSON.stringify(
    {
      [flag.key.trim()]: {
        variations: Object.fromEntries(
          flag.variations.map(({ name, value }) => [
            name.trim(),
            readValue(flag.valueType, value) ?? null,
          ]),
        ),
        targeting: flag.rules.length
          ? flag.rules.map((rule) => ({
              ...(rule.name.trim() && { name: rule.name.trim() }),
              query: JSON.stringify(toQuery(rule.group as Group, audience)),
              ...encodeOutcome(rule.outcome, names),
            }))
          : undefined,
        defaultRule: encodeOutcome(flag.defaultRule, names),
        disabled: !flag.enabled,
        metadata: flag.description.trim()
          ? { description: flag.description.trim() }
          : undefined,
      },
    },
    null,
    2,
  )
}
