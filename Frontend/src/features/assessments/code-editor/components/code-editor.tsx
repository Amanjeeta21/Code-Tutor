import { useRef, useEffect, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { SupportedLanguage } from '../types/editor-types';

export interface LineIssue {
  line: number;
  message: string;
  type: 'warning' | 'error' | 'naming' | 'performance' | 'complexity';
  hint: string;
}

interface CodeEditorProps {
  language: SupportedLanguage;
  value: string;
  onChange: (value: string) => void;
  isCodeLoading?: boolean;
  lineIssues?: LineIssue[];
}

const FILE_EXTENSIONS: Record<SupportedLanguage, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  cpp: 'cpp',
};

/** Maps our language keys to Monaco's language identifiers */
const MONACO_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
};

// Type → colour / decoration lookup
const TYPE_MAP: Record<string, { decoration: string; bubble: string; emoji: string; label: string }> = {
  error:       { decoration: 'red-box-decoration',    bubble: 'red',    emoji: '🐛', label: 'Error'       },
  naming:      { decoration: 'orange-box-decoration', bubble: 'orange', emoji: '🏷️', label: 'Naming'      },
  warning:     { decoration: 'yellow-box-decoration', bubble: 'yellow', emoji: '⚠️', label: 'Style'       },
  performance: { decoration: 'blue-box-decoration',   bubble: 'blue',   emoji: '⚡', label: 'Performance' },
  complexity:  { decoration: 'purple-box-decoration', bubble: 'purple', emoji: '🔮', label: 'Complexity'  },
};

export function CodeEditor({
  language,
  value,
  onChange,
  isCodeLoading = false,
  lineIssues = [],
}: CodeEditorProps) {
  // Load user editor preferences with safe fallbacks
  const fontSize = parseInt(localStorage.getItem('editor-fontSize') || '14');
  const tabSize = parseInt(localStorage.getItem('editor-tabSize') || '2');
  const wordWrap = localStorage.getItem('skill-lens-wordWrap') !== 'false' ? 'on' : 'off';
  const minimapEnabled = localStorage.getItem('skill-lens-minimap') === 'true';
  const editorThemePreference = localStorage.getItem('editor-theme') || 'VS Code Dark';

  const editorRef    = useRef<any>(null);
  const monacoRef    = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const overlayRef   = useRef<HTMLDivElement | null>(null);
  const [editorMounted, setEditorMounted] = useState(false);

  const monacoTheme = ['dracula', 'monokai', 'vs code dark', 'github dark'].some((t) =>
    editorThemePreference.toLowerCase().includes(t),
  )
    ? 'vs-dark'
    : 'vs';

  // ─── Hover-overlay effect ────────────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    // 1. Clear old decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

    // 2. Remove previous overlay
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }

    if (!lineIssues || lineIssues.length === 0) return;

    // 3. Add coloured box decorations (the dashed borders on each line)
    const newDecorations = lineIssues.map((issue) => {
      const { decoration } = TYPE_MAP[issue.type] ?? TYPE_MAP['warning'];
      return {
        range: new monaco.Range(issue.line, 1, issue.line, 1),
        options: { isWholeLine: true, className: decoration },
      };
    });
    decorationsRef.current = editor.deltaDecorations([], newDecorations);

    // 4. Build line → issues lookup
    const issuesByLine: Record<number, LineIssue[]> = {};
    lineIssues.forEach((issue) => {
      (issuesByLine[issue.line] ??= []).push(issue);
    });

    // 5. Create a single floating overlay div inside the editor DOM
    const editorDom = editor.getDomNode() as HTMLElement | null;
    if (!editorDom) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      z-index: 60;
      display: none;
      padding: 0 16px 0 64px;
      box-sizing: border-box;
      pointer-events: none;
    `;
    editorDom.appendChild(overlay);
    overlayRef.current = overlay;

    /** Render bubbles for a set of issues and position the overlay */
    const showOverlay = (issues: LineIssue[], lineNumber: number) => {
      const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight) as number;
      const lineTop    = editor.getTopForLineNumber(lineNumber) as number;
      const scrollTop  = editor.getScrollTop() as number;

      overlay.style.top    = `${lineTop - scrollTop + lineHeight + 2}px`;
      overlay.style.display = 'block';
      overlay.innerHTML = issues
        .map((issue) => {
          const { bubble, emoji, label } = TYPE_MAP[issue.type] ?? TYPE_MAP['warning'];
          return `
            <div class="speech-bubble bubble-${bubble}" style="margin-bottom:6px;">
              <div style="font-weight:700;margin-bottom:3px;display:flex;align-items:center;gap:6px;">
                <span style="font-size:13px;">${emoji}</span>
                <span style="opacity:0.65;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">${label}</span>
                <span style="opacity:0.3;">·</span>
                <span>${issue.message}</span>
              </div>
              <div style="opacity:0.85;font-size:10.5px;line-height:1.6;">${issue.hint}</div>
            </div>`;
        })
        .join('');
    };

    const hideOverlay = () => {
      overlay.style.display = 'none';
    };

    // 6. Track the currently shown line so we don't re-render on every pixel move
    let activeLine: number | null = null;

    const mouseMoveDisposable = editor.onMouseMove((e: any) => {
      const line: number | undefined = e.target?.position?.lineNumber;
      if (!line || !issuesByLine[line]) {
        if (activeLine !== null) { hideOverlay(); activeLine = null; }
        return;
      }
      if (line === activeLine) return; // already showing this line's bubble
      activeLine = line;
      showOverlay(issuesByLine[line], line);
    });

    // Hide when mouse leaves the editor
    const onEditorMouseLeave = () => { hideOverlay(); activeLine = null; };
    editorDom.addEventListener('mouseleave', onEditorMouseLeave);

    // Reposition on scroll (hide rather than mis-position)
    const scrollDisposable = editor.onDidScrollChange(() => {
      if (activeLine !== null) showOverlay(issuesByLine[activeLine] ?? [], activeLine);
    });

    return () => {
      mouseMoveDisposable.dispose();
      scrollDisposable.dispose();
      editorDom.removeEventListener('mouseleave', onEditorMouseLeave);
      if (overlayRef.current) { overlayRef.current.remove(); overlayRef.current = null; }
    };
  }, [lineIssues, editorMounted]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current  = editor;
    monacoRef.current  = monaco;
    setEditorMounted(true);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-800/80 bg-[#1e1e1e]">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-900/10 px-4">
        <div className="flex items-center gap-4">
          <div className="flex h-9 items-center gap-2 border-r border-slate-800/40 bg-slate-950/20 px-3 text-xs font-semibold text-slate-300">
            <span
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${isCodeLoading ? 'animate-pulse bg-blue-400' : 'bg-amber-400'}`}
            />
            <span>
              {isCodeLoading
                ? 'Syncing latest code...'
                : `source_file.${FILE_EXTENSIONS[language]}`}
            </span>
          </div>
        </div>

        <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
          {isCodeLoading ? 'Loading...' : language}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={MONACO_LANGUAGE_MAP[language]}
          value={value}
          onChange={(val) => onChange(val ?? '')}
          theme={monacoTheme}
          onMount={handleEditorMount}
          loading={
            <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-slate-500">
              Loading editor...
            </div>
          }
          options={{
            readOnly: isCodeLoading,
            fontSize: fontSize,
            fontFamily:
              "'Geist Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            minimap: { enabled: minimapEnabled },
            scrollBeyondLastLine: false,
            wordWrap: wordWrap,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            tabSize: tabSize,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
          }}
        />
      </div>
    </div>
  );
}
