import { useStore } from '@tanstack/react-form'
import { Plus, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  EditorSection,
  FieldError,
  FieldLabel,
  addButtonClass,
  errorProps,
} from './editor-fields'
import { SortControls } from './sort-controls'
import { useListDrag } from '../hooks/use-list-drag'
import type { FlagForm } from '../hooks/use-flag-form'

export const AudienceSection = ({ form }: { form: FlagForm }) => {
  return (
    <EditorSection
      id="audiences"
      icon={Users}
      title="Groups & roles"
      description="Define audiences once and select them in targeting conditions."
    >
      <form.Field name="roles" mode="array">
        {(roles) => (
          <fieldset className="min-w-0 space-y-2">
            <legend className="text-sm font-semibold">Roles</legend>
            {roles.state.value.map(({ id }, index) => (
              <div
                key={id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"
              >
                <AudienceName
                  form={form}
                  name={`roles[${index}].name`}
                  id={'role-' + id}
                  label={`Role ${index + 1} name`}
                  placeholder="e.g. tester"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove role ${index + 1}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => void roles.removeValue(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className={addButtonClass}
              onClick={() =>
                void roles.pushValue({ id: crypto.randomUUID(), name: '' })
              }
            >
              <Plus /> Add role
            </Button>
          </fieldset>
        )}
      </form.Field>
      <UserGroups form={form} />
    </EditorSection>
  )
}

const UserGroups = ({ form }: { form: FlagForm }) => {
  const order = useStore(form.store, (state) =>
    state.values.audienceGroups.map(({ id }) => id).join(','),
  )
  const groupIds = order ? order.split(',') : []
  const [announcement, setAnnouncement] = useState('')

  const moveGroup = (source: string, target: string) => {
    const groups = form.getFieldValue('audienceGroups')
    const from = groups.findIndex((group) => group.id === source)
    const to = groups.findIndex((group) => group.id === target)
    if (from < 0 || to < 0 || from === to) return

    void form.moveFieldValues('audienceGroups', from, to)
    const name = groups[from].name.trim() || 'User group ' + (from + 1)
    setAnnouncement(`${name} moved to position ${to + 1} of ${groups.length}.`)
  }

  const { dropClass, handleProps, dropProps } = useListDrag(moveGroup)

  return (
    <fieldset className="min-w-0 space-y-2 border-t border-border pt-3">
      <legend className="text-sm font-semibold">User groups</legend>
      <p className="text-xs text-muted-foreground">
        A group with assigned roles requires membership and at least one
        assigned role.
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {groupIds.map((id, index) => {
        const previous = index > 0 ? groupIds[index - 1] : undefined
        const next = groupIds.at(index + 1)
        return (
          <div key={id} className={dropClass(id)} {...dropProps(id)}>
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-start gap-2">
                {groupIds.length > 1 && (
                  <SortControls
                    label={'user group ' + (index + 1)}
                    handle={handleProps(id)}
                    moveUp={
                      previous ? () => moveGroup(id, previous) : undefined
                    }
                    moveDown={next ? () => moveGroup(id, next) : undefined}
                  />
                )}
                <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <AudienceName
                    form={form}
                    name={`audienceGroups[${index}].name`}
                    id={'audience-' + id}
                    label={`User group ${index + 1} name`}
                    placeholder="e.g. early-access"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove user group ${index + 1}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      void form.removeFieldValue('audienceGroups', index)
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <AssignedRoles form={form} index={index} groupId={id} />
            </div>
          </div>
        )
      })}
      <form.Field name="audienceGroups" mode="array">
        {(groups) => (
          <Button
            type="button"
            variant="outline"
            className={addButtonClass}
            onClick={() =>
              void groups.pushValue({
                id: crypto.randomUUID(),
                name: '',
                roleIds: [],
              })
            }
          >
            <Plus /> Add user group
          </Button>
        )}
      </form.Field>
    </fieldset>
  )
}

const AudienceName = ({
  form,
  name,
  id,
  label,
  placeholder,
}: {
  form: FlagForm
  name: `roles[${number}].name` | `audienceGroups[${number}].name`
  id: string
  label: string
  placeholder: string
}) => {
  return (
    <form.Field name={name}>
      {(field) => {
        const error = field.state.meta.errors[0]?.message
        return (
          <div>
            <FieldLabel id={id} hidden>
              {label}
            </FieldLabel>
            <Input
              id={id}
              value={field.state.value}
              placeholder={placeholder}
              onChange={(event) => field.handleChange(event.target.value)}
              {...errorProps(id, error)}
            />
            <FieldError id={id} error={error} />
          </div>
        )
      }}
    </form.Field>
  )
}

const AssignedRoles = ({
  form,
  index,
  groupId,
}: {
  form: FlagForm
  index: number
  groupId: string
}) => {
  const roles = useStore(form.store, (state) => state.values.roles)
  const id = 'assigned-roles-' + groupId
  return (
    <form.Field name={`audienceGroups[${index}].roleIds`}>
      {(field) => {
        const selected = field.state.value
        const missing = selected.filter(
          (key) => !roles.some((role) => role.id === key),
        )
        const error = field.state.meta.errors[0]?.message
        return (
          <fieldset aria-describedby={error ? id + '-error' : undefined}>
            <legend className="mb-1.5 text-xs font-medium">
              Assigned roles
            </legend>
            {roles.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Add a role to assign it here.
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {roles.map((role) => {
                const active = selected.includes(role.id)
                return (
                  <Button
                    key={role.id}
                    type="button"
                    size="sm"
                    variant={active ? 'default' : 'outline'}
                    aria-pressed={active}
                    onClick={() =>
                      field.handleChange(
                        active
                          ? selected.filter((key) => key !== role.id)
                          : [...selected, role.id],
                      )
                    }
                  >
                    {role.name.trim() || 'Unnamed role'}
                  </Button>
                )
              })}
              {missing.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    field.handleChange(
                      selected.filter((key) => !missing.includes(key)),
                    )
                  }
                >
                  Remove deleted roles
                </Button>
              )}
            </div>
            <FieldError id={id} error={error} />
          </fieldset>
        )
      }}
    </form.Field>
  )
}
