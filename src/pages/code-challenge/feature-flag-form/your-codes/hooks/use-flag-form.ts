import { useForm, useStore } from '@tanstack/react-form'
import type { FormValidateFn } from '@tanstack/react-form'
import { flagJson, flagSchema, sampleFlag } from '../lib/flag-config'
import type { FlagDraft } from '../types/flag'

const downloadJson = (json: string, filename: string) => {
  const url = URL.createObjectURL(
    new Blob([json + '\n'], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename + '.goff.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Keep the recursive Zod schema out of the options serialized by TanStack devtools.
const validateFlag = ({
  formApi,
}: Parameters<FormValidateFn<FlagDraft>>[0]) => {
  return formApi.parseValuesWithSchema(flagSchema)
}

export const useFlagForm = () => {
  return useForm({
    defaultValues: sampleFlag,
    validators: { onChange: validateFlag, onSubmit: validateFlag },
    onSubmit: ({ value }) => downloadJson(flagJson(value), value.key.trim()),
  })
}

export type FlagForm = ReturnType<typeof useFlagForm>

export const useFlagError = (form: FlagForm, path: string) => {
  return useStore(
    form.store,
    (state) =>
      state.errorMap.onChange?.[path]?.[0]?.message ??
      state.errorMap.onSubmit?.[path]?.[0]?.message,
  )
}
