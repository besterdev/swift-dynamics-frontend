import { useStore } from '@tanstack/react-form'
import {
  ArrowDown,
  ArrowUp,
  GitBranch,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import type { HTMLAttributes } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConditionBuilder } from './condition-builder'
import { EditorSection, FieldLabel, addButtonClass } from './editor-fields'
import { editConditionTree, newGroup, newOutcome } from '../lib/flag-config'
import type { Condition, Group } from '../types/flag'
import { RolloutFields } from './rollout-fields'
import type { FlagForm } from '../hooks/use-flag-form'
import { useListDrag } from '../hooks/use-list-drag'

export const TargetingSection = ({ form }: { form: FlagForm }) => {
  // Subscribe to order only. Editing a condition or name renders its own field.
  const ruleOrder = useStore(form.store, (state) =>
    state.values.rules.map(({ id }) => id).join(','),
  )
  const ruleIds = ruleOrder ? ruleOrder.split(',') : []

  const [announcement, setAnnouncement] = useState('')
  const moveRule = useCallback(
    (source: string, target: string) => {
      const rules = form.getFieldValue('rules')
      const from = rules.findIndex((rule) => rule.id === source)
      const to = rules.findIndex((rule) => rule.id === target)
      if (from < 0 || to < 0 || from === to) return

      void form.moveFieldValues('rules', from, to)
      setAnnouncement(
        `${rules[from].name.trim() || 'Rule ' + (from + 1)} moved to position ${to + 1} of ${rules.length}.`,
      )
    },
    [form],
  )
  const { dropClass, handleProps, dropProps } = useListDrag(moveRule)

  return (
    <EditorSection
      id="targeting"
      icon={GitBranch}
      title="Targeting rules"
      description="Rules run in order. The first match wins."
      action={
        <form.Field name="rules" mode="array">
          {(field) => (
            <Button
              type="button"
              variant="outline"
              className={addButtonClass}
              onClick={() =>
                void field.pushValue({
                  id: crypto.randomUUID(),
                  name: '',
                  group: newGroup(),
                  outcome: newOutcome(form.getFieldValue('variations')[0].id),
                })
              }
            >
              <Plus /> Add rule
            </Button>
          )}
        </form.Field>
      }
    >
      <datalist id="targeting-attributes">
        <option value="group" />
        <option value="role" />
        <option value="targetingKey" />
        <option value="country" />
        <option value="plan" />
      </datalist>
      {ruleIds.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No rules yet. All users receive the default rollout.
        </p>
      )}
      {ruleIds.length > 1 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <GripVertical className="size-4" aria-hidden="true" />
          Drag a rule by its handle or use the up/down buttons.
        </p>
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {ruleIds.map((id, index) => (
        <div
          key={id}
          data-rule-drop={id}
          className={dropClass(id)}
          {...dropProps(id)}
        >
          <RuleFields
            id={id}
            index={index}
            lastIndex={ruleIds.length - 1}
            form={form}
            handle={handleProps(id)}
            onMove={moveRule}
            previousId={ruleIds[index - 1]}
            nextId={ruleIds[index + 1]}
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Use double quotes to match a string such as &quot;7&quot;. Unquoted
        numbers and booleans match by type.
      </p>
    </EditorSection>
  )
}

const TargetingRuleFields = ({
  form,
  id,
  index,
  lastIndex,
  handle,
  onMove,
  previousId,
  nextId,
}: {
  form: FlagForm
  id: string
  index: number
  lastIndex: number
  handle: HTMLAttributes<HTMLSpanElement>
  onMove: (source: string, target: string) => void
  previousId?: string
  nextId?: string
}) => {
  const groupPath = `rules[${index}].group` as const
  const edit = useCallback(
    (nodeId: string, next: Condition | Group | null) => {
      form.setFieldValue(groupPath, (group) =>
        editConditionTree(group as Group, nodeId, next),
      )
    },
    [form, groupPath],
  )

  return (
    <div
      role="group"
      aria-label={`Rule ${index + 1}`}
      className="space-y-3 rounded-lg border border-border p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {lastIndex > 0 && (
            <span
              draggable
              title="Drag to reorder rule"
              data-rule-grip
              aria-hidden="true"
              className="grid size-9 cursor-grab touch-none place-items-center rounded-md border border-border bg-muted text-muted-foreground select-none hover:text-foreground active:cursor-grabbing"
              {...handle}
            >
              <GripVertical className="size-4" />
            </span>
          )}
          <h3 className="text-xs font-semibold">Rule {index + 1}</h3>
        </div>
        <div className="flex items-center gap-0.5 text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Move rule ${index + 1} up`}
            disabled={!previousId}
            onClick={() => {
              if (previousId) onMove(id, previousId)
            }}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Move rule ${index + 1} down`}
            disabled={!nextId}
            onClick={() => {
              if (nextId) onMove(id, nextId)
            }}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove rule ${index + 1}`}
            className="hover:text-destructive"
            onClick={() => void form.removeFieldValue('rules', index)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <form.Field name={`rules[${index}].name`}>
        {(field) => (
          <div>
            <FieldLabel id={'rule-name-' + id}>Rule name</FieldLabel>
            <Input
              id={'rule-name-' + id}
              value={field.state.value}
              placeholder="Optional"
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </div>
        )}
      </form.Field>
      <form.Field name={groupPath}>
        {(field) => (
          <ConditionBuilder
            group={field.state.value as Group}
            form={form}
            path={groupPath}
            edit={edit}
          />
        )}
      </form.Field>
      <RolloutFields
        form={form}
        name={`rules[${index}].outcome`}
        id={'rule-' + id}
      />
    </div>
  )
}

const RuleFields = memo(TargetingRuleFields)
