import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AlertCircle, Braces, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MonacoPreview = lazy(() => import('./monaco-preview'))

export const JsonPreview = ({
  json,
  valid,
}: {
  json: string
  valid: boolean
}) => {
  const [copyResult, setCopyResult] = useState<{
    json: string
    status: 'copied' | 'error'
  }>()
  const status = copyResult?.json === json ? copyResult.status : undefined
  const hasError = !valid || status === 'error'
  const previewSurface = useRef<HTMLDivElement>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    const surface = previewSurface.current
    if (!surface) return
    if (typeof IntersectionObserver === 'undefined') {
      setShowEditor(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        setShowEditor(true)
      },
      { rootMargin: '200px' },
    )
    observer.observe(surface)
    return () => observer.disconnect()
  }, [])

  const fallback = (
    <pre className="h-full w-full overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-xs leading-relaxed text-foreground">
      {json}
    </pre>
  )

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopyResult({ json, status: 'copied' })
    } catch {
      setCopyResult({ json, status: 'error' })
    }
  }

  return (
    <aside
      aria-labelledby="preview-title"
      className="min-w-0 scroll-mt-4 @min-[960px]:sticky @min-[960px]:top-[calc(var(--app-header-height)+1rem)]"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-editor-accent-soft text-editor-accent">
              <Braces className="size-[17px]" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="preview-title"
                className="scroll-mt-4 text-[15px] font-semibold leading-tight"
              >
                Live preview
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Updates as you edit
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!valid}
            onClick={copyJson}
            className="h-8"
          >
            {status === 'copied' ? <Check /> : <Copy />}{' '}
            {status === 'copied' ? 'Copied' : 'Copy JSON'}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted px-4 py-2.5 font-mono text-[11px] sm:px-5">
          <span className="text-muted-foreground">flags.goff.json</span>
          <span className="rounded border border-border px-1.5 py-0.5 text-muted-foreground">
            JSON
          </span>
        </div>
        <div
          ref={previewSurface}
          className="relative h-[min(440px,65vh)] min-h-72 [&_.monaco-editor]:absolute"
        >
          {showEditor ? (
            <Suspense fallback={fallback}>
              <MonacoPreview json={json} fallback={fallback} />
            </Suspense>
          ) : (
            fallback
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted px-4 py-3 text-xs sm:px-5">
          <span
            role="status"
            className={
              'inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium ' +
              (hasError
                ? 'bg-destructive/10 text-destructive'
                : 'bg-editor-success-soft text-editor-success')
            }
          >
            {hasError ? (
              <AlertCircle className="size-3.5" aria-hidden="true" />
            ) : (
              <Check className="size-3.5" aria-hidden="true" />
            )}
            {status === 'error'
              ? 'Clipboard unavailable. Use Download JSON.'
              : valid
                ? 'Valid configuration'
                : 'Fix the highlighted fields to export'}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {json.split('\n').length} lines
          </span>
        </div>
      </div>
    </aside>
  )
}
