import { useStore } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  FieldError,
  FieldLabel,
  VariationSelect,
  errorProps,
} from './editor-fields'
import type { RuleOutcome, Variation } from '../types/flag'
import { useFlagError } from '../hooks/use-flag-form'
import type { FlagForm } from '../hooks/use-flag-form'

type OutcomePath = 'defaultRule' | `rules[${number}].outcome`

export const RolloutFields = ({
  form,
  name,
  id,
}: {
  form: FlagForm
  name: OutcomePath
  id: string
}) => {
  const variations = useStore(form.store, (state) => state.values.variations)
  const selectionError = useFlagError(form, name + '.variationId')
  const weightsError = useFlagError(form, name + '.weights')

  return (
    <form.Field name={name}>
      {(field) => {
        const outcome = field.state.value
        const missingWeights = Object.keys(outcome.weights).filter(
          (key) => !variations.some((variation) => variation.id === key),
        )
        const setWeight = (variationId: string, value: string) => {
          const weights = { ...outcome.weights }
          if (value === '') delete weights[variationId]
          else weights[variationId] = value
          field.handleChange({ ...outcome, weights })
        }
        return (
          <div className="space-y-2.5">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <FieldLabel id={id + '-mode'}>Serve by</FieldLabel>
                <NativeSelect
                  id={id + '-mode'}
                  className="w-full"
                  value={outcome.mode}
                  onChange={(event) => {
                    const mode: RuleOutcome['mode'] =
                      event.target.value === 'percentage'
                        ? 'percentage'
                        : 'variation'
                    field.handleChange({ ...outcome, mode })
                  }}
                >
                  <NativeSelectOption value="variation">
                    Single variation
                  </NativeSelectOption>
                  <NativeSelectOption value="percentage">
                    Percentage rollout
                  </NativeSelectOption>
                </NativeSelect>
              </div>
              {outcome.mode === 'variation' && (
                <div>
                  <FieldLabel id={id + '-choice'}>
                    {name === 'defaultRule'
                      ? 'Default variation'
                      : 'Serve variation'}
                  </FieldLabel>
                  <VariationSelect
                    id={id + '-choice'}
                    variations={variations}
                    value={outcome.variationId}
                    onChange={(variationId) =>
                      field.handleChange({ ...outcome, variationId })
                    }
                    error={selectionError}
                  />
                </div>
              )}
            </div>
            {outcome.mode === 'percentage' && (
              <fieldset className="space-y-2.5 rounded-md border border-border p-3">
                <legend className="px-1 text-xs font-medium">
                  Variation weights
                </legend>
                <p className="text-xs text-muted-foreground">
                  Leave unused variations blank. Traffic is split in proportion
                  to the weights.
                </p>
                {variations.map((variation) => (
                  <WeightField
                    key={variation.id}
                    variation={variation}
                    id={id}
                    name={name}
                    form={form}
                    value={outcome.weights[variation.id] ?? ''}
                    onChange={setWeight}
                  />
                ))}
                {missingWeights.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      field.handleChange({
                        ...outcome,
                        weights: Object.fromEntries(
                          Object.entries(outcome.weights).filter(
                            ([key]) => !missingWeights.includes(key),
                          ),
                        ),
                      })
                    }
                  >
                    Remove weights for deleted variations
                  </Button>
                )}
                <FieldError id={id + '-weights'} error={weightsError} />
              </fieldset>
            )}
          </div>
        )
      }}
    </form.Field>
  )
}

const WeightField = ({
  variation,
  id,
  name,
  form,
  value,
  onChange,
}: {
  variation: Variation
  id: string
  name: OutcomePath
  form: FlagForm
  value: string
  onChange: (variationId: string, value: string) => void
}) => {
  const inputId = id + '-weight-' + variation.id
  const error = useFlagError(form, name + '.weights.' + variation.id)
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-2">
        <label htmlFor={inputId} className="truncate text-sm">
          {variation.name.trim() || 'Unnamed variation'}
        </label>
        <Input
          id={inputId}
          inputMode="decimal"
          value={value}
          placeholder="0"
          onChange={(event) => onChange(variation.id, event.target.value)}
          {...errorProps(inputId, error)}
        />
      </div>
      <FieldError id={inputId} error={error} />
    </div>
  )
}
