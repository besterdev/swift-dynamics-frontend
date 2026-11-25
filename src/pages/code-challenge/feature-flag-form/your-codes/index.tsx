import { Download, Flag, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  EditorSection,
  FieldError,
  FieldLabel,
  errorProps,
} from './components/editor-fields'
import { flagJson } from './lib/flag-config'
import { JsonPreview } from './components/json-preview'
import { AudienceSection } from './components/audience-section'
import { RolloutFields } from './components/rollout-fields'
import { TargetingSection } from './components/targeting-section'
import { useFlagForm } from './hooks/use-flag-form'
import { VariationsSection } from './components/variations-section'

const editorSections = [
  { id: 'flag-details', label: 'Flag details' },
  { id: 'variations', label: 'Variations' },
  { id: 'audiences', label: 'Groups & roles' },
  { id: 'targeting', label: 'Targeting rules' },
  { id: 'default-rule', label: 'Default rule' },
]

const FeatureFlagEditor = () => {
  const form = useFlagForm()

  return (
    <section
      id="feature-flag-editor"
      aria-labelledby="feature-flag-editor-title"
      className="feature-flag-workspace @container min-w-0 scroll-mt-4 rounded-xl border border-border bg-background text-foreground"
    >
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-4 pb-5">
            <div>
              <h2
                id="feature-flag-editor-title"
                className="text-[2rem] leading-none font-semibold tracking-[-0.055em] sm:text-[2.7rem]"
              >
                Feature flag editor
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                Configure variations, define targeting, and export your flag.
              </p>
              <a
                href="#preview-title"
                className="mt-2.5 inline-block text-xs font-medium text-editor-accent underline underline-offset-4 @min-[960px]:hidden"
              >
                Jump to live preview
              </a>
            </div>
            <form.Subscribe selector={(state) => state.isValid}>
              {(valid) => (
                <Button
                  type="submit"
                  disabled={!valid}
                  className="h-9 bg-editor-accent px-3.5 text-editor-accent-foreground hover:bg-editor-accent/90"
                >
                  <Download /> Download JSON
                </Button>
              )}
            </form.Subscribe>
          </div>

          <nav
            aria-label="Editor sections"
            className="mb-6 flex flex-wrap gap-x-2 gap-y-1 border-y border-border py-2"
          >
            {editorSections.map(({ id, label }) => (
              <a
                key={id}
                href={'#' + id}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-editor-accent-soft hover:text-editor-accent focus-visible:bg-editor-accent-soft focus-visible:text-editor-accent focus-visible:outline-2 focus-visible:outline-editor-accent"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="grid items-start gap-5 @min-[960px]:grid-cols-[minmax(0,1.26fr)_minmax(0,1fr)] @min-[960px]:gap-6">
            <div className="min-w-0 space-y-4">
              <EditorSection
                id="flag-details"
                icon={Flag}
                title="Flag details"
                description="Set the identifier and availability of this flag."
                action={
                  <form.Field name="enabled">
                    {(field) => (
                      <div
                        className={
                          'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ' +
                          (field.state.value
                            ? 'border-editor-success/20 bg-editor-success-soft text-editor-success'
                            : 'border-border bg-muted text-muted-foreground')
                        }
                      >
                        <label
                          htmlFor={field.name}
                          className="text-xs font-medium"
                        >
                          {field.state.value ? 'Enabled' : 'Disabled'}
                        </label>
                        <Switch
                          id={field.name}
                          aria-label="Flag enabled"
                          className="data-checked:bg-editor-success"
                          checked={field.state.value}
                          onCheckedChange={field.handleChange}
                        />
                      </div>
                    )}
                  </form.Field>
                }
              >
                <form.Field name="key">
                  {(field) => {
                    const error = field.state.meta.errors[0]?.message
                    return (
                      <div>
                        <FieldLabel id="flag-key">Flag key</FieldLabel>
                        <Input
                          id="flag-key"
                          className="h-9 font-mono"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          {...errorProps('flag-key', error)}
                        />
                        <FieldError id="flag-key" error={error} />
                      </div>
                    )
                  }}
                </form.Field>
                <form.Field name="description">
                  {(field) => (
                    <div>
                      <FieldLabel id={field.name}>
                        Description{' '}
                        <span className="ml-1 font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </FieldLabel>
                      <Textarea
                        id={field.name}
                        rows={2}
                        className="min-h-14 resize-y"
                        value={field.state.value}
                        placeholder="What does this flag control?"
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </div>
                  )}
                </form.Field>
              </EditorSection>

              <VariationsSection form={form} />
              <AudienceSection form={form} />
              <TargetingSection form={form} />

              <EditorSection
                id="default-rule"
                icon={Route}
                title="Default rule"
                description="Choose what to serve when no targeting rule matches."
              >
                <RolloutFields
                  form={form}
                  name="defaultRule"
                  id="default-rule-outcome"
                />
              </EditorSection>
            </div>

            <form.Subscribe
              selector={(state) => [state.values, state.isValid] as const}
            >
              {([values, valid]) => (
                <JsonPreview json={flagJson(values)} valid={valid} />
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </section>
  )
}

export default FeatureFlagEditor
