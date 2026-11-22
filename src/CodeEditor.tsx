import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Bundle Monaco locally (no CDN) so the editor also works offline inside the APK.
(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = { getWorker: () => new editorWorker() };
loader.config({ monaco });

export default function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Editor
      height="100%"
      language="html"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v || '')}
      options={{ fontSize: 12, minimap: { enabled: false }, wordWrap: 'on', automaticLayout: true, scrollBeyondLastLine: false }}
    />
  );
}
