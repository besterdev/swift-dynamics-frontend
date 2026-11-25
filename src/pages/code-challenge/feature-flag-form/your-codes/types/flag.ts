import type {
  conditionSources,
  operators,
  valueTypes,
} from '../lib/flag-options'

export type ValueType = (typeof valueTypes)[number]

export type Condition = {
  id: string
  kind: 'condition'
  source?: (typeof conditionSources)[number]
  attribute: string
  operator: (typeof operators)[number]
  value: string
}

export type Group = {
  id: string
  kind: 'group'
  match: 'all' | 'any'
  children: (Condition | Group)[]
}

// The editor treats a condition tree as one field. Zod validates its descendants.
export type DraftGroup = Omit<Group, 'children'> & { children: unknown[] }

type NamedItem = {
  id: string
  name: string
}

export type Role = NamedItem
export type AudienceGroup = NamedItem & { roleIds: string[] }
export type Variation = NamedItem & { value: string }

export type RuleOutcome = {
  mode: 'variation' | 'percentage'
  variationId: string
  weights: Record<string, string>
}

export type FlagDraft = {
  key: string
  description: string
  enabled: boolean
  valueType: ValueType
  variations: Variation[]
  roles: Role[]
  audienceGroups: AudienceGroup[]
  rules: {
    id: string
    name: string
    group: DraftGroup
    outcome: RuleOutcome
  }[]
  defaultRule: RuleOutcome
}
