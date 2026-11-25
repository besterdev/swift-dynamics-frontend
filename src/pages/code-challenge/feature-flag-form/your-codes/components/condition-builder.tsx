import { useStore } from '@tanstack/react-form'
import { GitMerge, Plus, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { JSX } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { FieldError, FieldLabel, errorProps } from './editor-fields'
import { newCondition, newGroup } from '../lib/flag-config'
import { conditionSources, operators } from '../lib/flag-options'
import type { Condition, Group } from '../types/flag'
import { SortControls } from './sort-controls'
import { useFlagError } from '../hooks/use-flag-form'
import { useListDrag } from '../hooks/use-list-drag'
import type { FlagForm } from '../hooks/use-flag-form'

type Node = Condition | Group
type EditNode = (id: string, next: Node | null) => void
type TreeProps = { form: FlagForm; path: string; edit: EditNode }

const GroupFields = ({
  group,
  form,
  path,
  edit,
  nested = false,
}: TreeProps & {
  group: Group
  nested?: boolean
}): JSX.Element => {
  const error = useFlagError(form, path + '.children')
  const id = 'group-' + group.id

  const [announcement, setAnnouncement] = useState('')
  const children = group.children

  const moveChild = (source: string, target: string) => {
    const from = children.findIndex((child) => child.id === source)
    const to = children.findIndex((child) => child.id === target)
    if (from < 0 || to < 0 || from === to) return

    const ordered = [...children]
    const [moved] = ordered.splice(from, 1)
    ordered.splice(to, 0, moved)
    edit(group.id, { ...group, children: ordered })
    const label = moved.kind === 'group' ? 'Nested group' : 'Condition'
    setAnnouncement(
      `${label} moved to position ${to + 1} of ${children.length}.`,
    )
  }

  const { dropClass, handleProps, dropProps } = useListDrag(moveChild)

  return (
    <div
      role="group"
      aria-label={nested ? 'Nested condition group' : 'Rule conditions'}
      aria-describedby={error ? id + '-error' : undefined}
      className="@container min-w-0 space-y-2.5 rounded-lg border border-border bg-muted/45 p-2.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Match</span>
        <NativeSelect
          aria-label="Match conditions"
          size="sm"
          value={group.match}
          onChange={(event) =>
            edit(group.id, {
              ...group,
              match: event.target.value === 'any' ? 'any' : 'all',
            })
          }
        >
          <NativeSelectOption value="all">
            All conditions (AND)
          </NativeSelectOption>
          <NativeSelectOption value="any">
            Any condition (OR)
          </NativeSelectOption>
        </NativeSelect>
        {nested && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-muted-foreground hover:text-destructive"
            aria-label="Remove nested group"
            onClick={() => edit(group.id, null)}
          >
            <X />
          </Button>
        )}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {children.map((child, index) => {
        const childPath = `${path}.children[${index}]`
        const previous = index > 0 ? children[index - 1] : undefined
        const next = children.at(index + 1)
        const label = child.kind === 'group' ? 'Nested group' : 'Condition'
        return (
          <div
            key={child.id}
            className={dropClass(child.id)}
            {...dropProps(child.id)}
          >
            {children.length > 1 && (
              <div className="mb-1 flex items-center justify-between gap-1 text-xs text-muted-foreground">
                <span>
                  {label} {index + 1}
                </span>
                <SortControls
                  label={label.toLowerCase() + ' ' + (index + 1)}
                  handle={handleProps(child.id)}
                  moveUp={
                    previous
                      ? () => moveChild(child.id, previous.id)
                      : undefined
                  }
                  moveDown={
                    next ? () => moveChild(child.id, next.id) : undefined
                  }
                />
              </div>
            )}
            {child.kind === 'group' ? (
              <ConditionBuilder
                group={child}
                form={form}
                path={childPath}
                edit={edit}
                nested
              />
            ) : (
              <ConditionRow
                condition={child}
                form={form}
                path={childPath}
                edit={edit}
              />
            )}
          </div>
        )
      })}
      <FieldError id={id} error={error} />
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() =>
            edit(group.id, {
              ...group,
              children: [...group.children, newCondition()],
            })
          }
        >
          <Plus /> Condition
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() =>
            edit(group.id, {
              ...group,
              children: [...group.children, newGroup()],
            })
          }
        >
          <GitMerge /> Group
        </Button>
      </div>
    </div>
  )
}

export const ConditionBuilder = memo(GroupFields)

const ConditionFields = ({
  condition,
  form,
  path,
  edit,
}: TreeProps & { condition: Condition }) => {
  const source = condition.source ?? 'attribute'
  const id = 'condition-' + condition.id
  const attributeError = useFlagError(form, path + '.attribute')
  const valueError = useFlagError(form, path + '.value')
  const audience = useStore(form.store, (state) =>
    source === 'group'
      ? state.values.audienceGroups
      : source === 'role'
        ? state.values.roles
        : undefined,
  )
  const sourceLabel = source === 'group' ? 'User group' : 'Role'

  return (
    <div className="space-y-1.5 rounded-md border border-border bg-card p-2">
      <div className="flex items-center justify-between gap-2">
        <NativeSelect
          aria-label="Condition source"
          size="sm"
          value={source}
          onChange={(event) => {
            const nextSource = conditionSources.find(
              (entry) => entry === event.target.value,
            )
            if (nextSource)
              edit(condition.id, {
                ...condition,
                source: nextSource,
                value: '',
              })
          }}
        >
          <NativeSelectOption value="attribute">Attribute</NativeSelectOption>
          <NativeSelectOption value="group">User group</NativeSelectOption>
          <NativeSelectOption value="role">Role</NativeSelectOption>
        </NativeSelect>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-destructive"
          aria-label="Remove condition"
          onClick={() => edit(condition.id, null)}
        >
          <X />
        </Button>
      </div>

      {source === 'attribute' ? (
        <div className="grid min-w-0 gap-1.5 @min-[390px]:grid-cols-[minmax(0,1fr)_minmax(0,.85fr)_minmax(0,1fr)]">
          <div>
            <FieldLabel id={id + '-attribute'} hidden>
              Attribute
            </FieldLabel>
            <Input
              id={id + '-attribute'}
              list="targeting-attributes"
              value={condition.attribute}
              placeholder="Attribute"
              onChange={(event) =>
                edit(condition.id, {
                  ...condition,
                  attribute: event.target.value,
                })
              }
              {...errorProps(id + '-attribute', attributeError)}
            />
            <FieldError id={id + '-attribute'} error={attributeError} />
          </div>
          <NativeSelect
            aria-label="Operator"
            className="w-full"
            value={condition.operator}
            onChange={(event) => {
              const operator = operators.find(
                (entry) => entry === event.target.value,
              )
              if (operator) edit(condition.id, { ...condition, operator })
            }}
          >
            <NativeSelectOption value="equals">equals</NativeSelectOption>
            <NativeSelectOption value="not-equals">
              not equal
            </NativeSelectOption>
            <NativeSelectOption value="contains">contains</NativeSelectOption>
          </NativeSelect>
          <div>
            <FieldLabel id={id + '-value'} hidden>
              Comparison value
            </FieldLabel>
            <Input
              id={id + '-value'}
              value={condition.value}
              placeholder="Value"
              onChange={(event) =>
                edit(condition.id, { ...condition, value: event.target.value })
              }
              {...errorProps(id + '-value', valueError)}
            />
            <FieldError id={id + '-value'} error={valueError} />
          </div>
        </div>
      ) : (
        <>
          <FieldLabel id={id + '-value'} hidden>
            {sourceLabel}
          </FieldLabel>
          <NativeSelect
            id={id + '-value'}
            className="w-full"
            value={
              audience?.some((entry) => entry.id === condition.value)
                ? condition.value
                : ''
            }
            onChange={(event) =>
              edit(condition.id, { ...condition, value: event.target.value })
            }
            {...errorProps(id + '-value', valueError)}
          >
            <NativeSelectOption value="" disabled>
              Select {sourceLabel.toLowerCase()}
            </NativeSelectOption>
            {audience?.map((entry) => (
              <NativeSelectOption key={entry.id} value={entry.id}>
                {entry.name.trim() || 'Unnamed'}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError id={id + '-value'} error={valueError} />
        </>
      )}
    </div>
  )
}

const ConditionRow = memo(ConditionFields)
