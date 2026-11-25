import { Layers2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import {
  EditorSection,
  FieldError,
  FieldLabel,
  addButtonClass,
  errorProps,
} from './editor-fields'
import { defaultValuesByType } from '../lib/flag-config'
import { valueTypes } from '../lib/flag-options'
import type { FlagForm } from '../hooks/use-flag-form'

export const VariationsSection = ({ form }: { form: FlagForm }) => {
  return (
    <form.Field name="variations" mode="array">
      {(variationsField) => (
        <EditorSection
          id="variations"
          icon={Layers2}
          title="Variations"
          description="Define the values returned during evaluation."
          action={
            <Button
              type="button"
              variant="outline"
              className={addButtonClass}
              onClick={() => {
                const names = new Set(
                  form
                    .getFieldValue('variations')
                    .map(({ name }) => name.trim()),
                )
                let suffix = names.size + 1
                while (names.has('variation-' + suffix)) suffix += 1
                void variationsField.pushValue({
                  id: crypto.randomUUID(),
                  name: 'variation-' + suffix,
                  value: defaultValuesByType[form.getFieldValue('valueType')],
                })
              }}
            >
              <Plus /> Add variation
            </Button>
          }
        >
          <form.Field name="valueType">
            {(field) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/45 px-3 py-2">
                <label htmlFor="value-type" className="text-xs font-medium">
                  Value type
                </label>
                <NativeSelect
                  id="value-type"
                  className="[&_select]:bg-card"
                  value={field.state.value}
                  onChange={(event) => {
                    const type = valueTypes.find(
                      (valueType) => valueType === event.target.value,
                    )
                    if (type) field.handleChange(type)
                  }}
                >
                  {valueTypes.map((type) => (
                    <NativeSelectOption key={type} value={type}>
                      {type}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
          </form.Field>
          <div className="space-y-2.5">
            {variationsField.state.value.map((variation, index) => (
              <div
                key={variation.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2"
              >
                <form.Field name={`variations[${index}].name`}>
                  {(field) => {
                    const id = 'variation-name-' + variation.id
                    const error = field.state.meta.errors[0]?.message
                    return (
                      <div>
                        <FieldLabel id={id} hidden={index > 0}>
                          Variation name
                        </FieldLabel>
                        <Input
                          id={id}
                          className="font-mono"
                          value={field.state.value}
                          placeholder="Name"
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          {...errorProps(id, error)}
                        />
                        <FieldError id={id} error={error} />
                      </div>
                    )
                  }}
                </form.Field>
                <form.Field name={`variations[${index}].value`}>
                  {(field) => {
                    const id = 'variation-value-' + variation.id
                    const error = field.state.meta.errors[0]?.message
                    const booleanValue = field.state.value.trim()
                    return (
                      <div>
                        <FieldLabel id={id} hidden={index > 0}>
                          Value
                        </FieldLabel>
                        <form.Subscribe
                          selector={(state) => state.values.valueType}
                        >
                          {(type) =>
                            type === 'Boolean' ? (
                              <NativeSelect
                                id={id}
                                className="w-full [&_select]:font-mono"
                                value={
                                  booleanValue === 'true' ||
                                  booleanValue === 'false'
                                    ? booleanValue
                                    : ''
                                }
                                onChange={(event) =>
                                  field.handleChange(event.target.value)
                                }
                                {...errorProps(id, error)}
                              >
                                <NativeSelectOption value="" disabled>
                                  Select value
                                </NativeSelectOption>
                                <NativeSelectOption value="true">
                                  true
                                </NativeSelectOption>
                                <NativeSelectOption value="false">
                                  false
                                </NativeSelectOption>
                              </NativeSelect>
                            ) : type === 'Object' || type === 'Array' ? (
                              <Textarea
                                id={id}
                                className="min-h-8 font-mono"
                                rows={1}
                                value={field.state.value}
                                placeholder={defaultValuesByType[type]}
                                onChange={(event) =>
                                  field.handleChange(event.target.value)
                                }
                                {...errorProps(id, error)}
                              />
                            ) : (
                              <Input
                                id={id}
                                className="font-mono"
                                value={field.state.value}
                                onChange={(event) =>
                                  field.handleChange(event.target.value)
                                }
                                {...errorProps(id, error)}
                              />
                            )
                          }
                        </form.Subscribe>
                        <FieldError id={id} error={error} />
                      </div>
                    )
                  }}
                </form.Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={
                    'text-muted-foreground hover:text-destructive ' +
                    (index === 0 ? 'mt-[22px]' : '')
                  }
                  aria-label={`Remove variation ${index + 1}`}
                  disabled={variationsField.state.value.length === 1}
                  onClick={() => void variationsField.removeValue(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </EditorSection>
      )}
    </form.Field>
  )
}
