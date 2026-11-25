import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'
import { useTheme } from '@/hooks/use-theme'

self.MonacoEnvironment = {
  getWorker: (_moduleId, label) =>
    label === 'json' ? new JsonWorker() : new EditorWorker(),
}

loader.config({ monaco })
const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  ariaLabel: 'Live JSON configuration',
  readOnly: true,
  domReadOnly: true,
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  folding: false,
  glyphMargin: false,
  lineDecorationsWidth: 12,
  lineNumbersMinChars: 3,
  renderLineHighlight: 'none',
  overviewRulerLanes: 0,
  wordWrap: 'on',
  fontSize: 13,
  lineHeight: 23,
  padding: { top: 14, bottom: 14 },
  scrollbar: { alwaysConsumeMouseWheel: false },
}

const MonacoPreview = ({
  json,
  fallback,
}: {
  json: string
  fallback: React.ReactNode
}) => {
  const theme = useTheme() === 'dark' ? 'vs-dark' : 'vs'

  return (
    <Editor
      value={json}
      language="json"
      theme={theme}
      loading={fallback}
      options={editorOptions}
    />
  )
}

export default MonacoPreview
