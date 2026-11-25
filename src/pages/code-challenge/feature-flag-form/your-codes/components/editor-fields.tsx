import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import type { Variation } from '../types/flag'

export const EditorSection = ({
  id,
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  id: string
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) => {
  return (
    <Card className="gap-0 rounded-xl border border-border bg-card py-0 ring-0 shadow-sm">
      <section aria-labelledby={id} className="scroll-mt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-editor-accent-soft text-editor-accent">
              <Icon className="size-[17px]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2
                id={id}
                className="scroll-mt-4 text-[15px] font-semibold leading-tight"
              >
                {title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          {action}
        </div>
        <div className="space-y-4 p-4 sm:px-5">{children}</div>
      </section>
    </Card>
  )
}

export const FieldError = ({ id, error }: { id: string; error?: string }) => {
  if (!error) return null
  return (
    <p
      id={id + '-error'}
      role="alert"
      className="mt-1.5 text-xs text-destructive"
    >
      {error}
    </p>
  )
}

export const errorProps = (id: string, error?: string) => {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? id + '-error' : undefined,
  }
}

export const FieldLabel = ({
  id,
  children,
  hidden,
}: {
  id: string
  children: ReactNode
  hidden?: boolean
}) => {
  return (
    <label
      htmlFor={id}
      className={hidden ? 'sr-only' : 'mb-1.5 block text-xs font-medium'}
    >
      {children}
    </label>
  )
}

export const VariationSelect = ({
  variations,
  value,
  onChange,
  id,
  error,
}: {
  variations: Variation[]
  value: string
  onChange: (value: string) => void
  id: string
  error?: string
}) => {
  const hasSelection = variations.some((variation) => variation.id === value)
  return (
    <>
      <NativeSelect
        id={id}
        className="w-full"
        value={hasSelection ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        {...errorProps(id, error)}
      >
        <NativeSelectOption value="" disabled>
          Select variation
        </NativeSelectOption>
        {variations.map((variation) => (
          <NativeSelectOption key={variation.id} value={variation.id}>
            {variation.name.trim() || 'Unnamed variation'}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <FieldError id={id} error={error} />
    </>
  )
}

export const addButtonClass =
  'h-8 border-editor-accent/20 bg-editor-accent-soft text-editor-accent hover:bg-editor-accent/15 hover:text-editor-accent'
