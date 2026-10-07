import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
  Code2,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, getMonacoLanguage } from '../utils/language';
import { BugItem } from '../types';

interface CodeInputSectionProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  language: string;
  onChangeLanguage: (newLang: string) => void;
  errorMessage: string;
  onChangeErrorMessage: (msg: string) => void;
  expectedBehavior: string;
  onChangeExpectedBehavior: (behavior: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  isAnalyzing: boolean;
  theme: 'dark' | 'light';
  activeBugHighlight: BugItem | null;
}

export const CodeInputSection: React.FC<CodeInputSectionProps> = ({
  code,
  onChangeCode,
  language,
  onChangeLanguage,
  errorMessage,
  onChangeErrorMessage,
  expectedBehavior,
  onChangeExpectedBehavior,
  onSubmit,
  onReset,
  isAnalyzing,
  theme,
  activeBugHighlight,
}) => {
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const lineCount = code ? code.split('\n').length : 0;
  const isOverLineLimit = lineCount > 500;
  const isEmpty = !code.trim();

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add keyboard shortcut for analysis: Cmd+Enter or Ctrl+Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!isAnalyzing && !isEmpty && !isOverLineLimit) {
        onSubmit();
      }
    });
  };

  // Line highlighting when activeBugHighlight changes
  useEffect(() => {
    if (!editorRef.current || !activeBugHighlight) return;

    const editor = editorRef.current;
    const lines = activeBugHighlight.lines;
    if (!lines || lines.length === 0) return;

    const targetLine = lines[0];

    // Scroll to line smoothly
    editor.revealLineInCenter(targetLine);
    editor.setPosition({ lineNumber: targetLine, column: 1 });
    editor.focus();

    // Apply decorations
    const sevClass =
      activeBugHighlight.severity === 'critical'
        ? 'monaco-bug-line-highlight-critical'
        : activeBugHighlight.severity === 'major'
        ? 'monaco-bug-line-highlight-major'
        : 'monaco-bug-line-highlight-minor';

    const glyphClass =
      activeBugHighlight.severity === 'critical'
        ? 'monaco-bug-glyph-critical'
        : activeBugHighlight.severity === 'major'
        ? 'monaco-bug-glyph-major'
        : 'monaco-bug-glyph-minor';

    const newDecorations = lines.map((lineNum) => ({
      range: {
        startLineNumber: lineNum,
        startColumn: 1,
        endLineNumber: lineNum,
        endColumn: 1000,
      },
      options: {
        isWholeLine: true,
        className: sevClass,
        glyphMarginClassName: glyphClass,
        hoverMessage: {
          value: `**[${activeBugHighlight.severity.toUpperCase()}]** ${activeBugHighlight.category}: ${activeBugHighlight.explanation}`,
        },
      },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [activeBugHighlight]);

  const handleCopyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const monacoLanguage = getMonacoLanguage(language);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Editor Header Toolbar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Code2 className="w-4 h-4 text-indigo-500" />
            <span>Target Code</span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="language-select" className="sr-only">
              Select Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Indicators & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Line Counter & Limit Check */}
          <div
            className={`text-xs font-mono px-2 py-0.5 rounded ${
              isOverLineLimit
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold'
                : 'text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800'
            }`}
          >
            {lineCount} / 500 lines
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyCode}
            disabled={isEmpty}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onReset}
            disabled={isEmpty && !errorMessage && !expectedBehavior}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-40 transition-colors"
            title="Reset code and inputs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Over-Limit Warning */}
      {isOverLineLimit && (
        <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>
            Code exceeds the 500 lines limit ({lineCount} lines). Please trim your code before analyzing.
          </span>
        </div>
      )}

      {/* Monaco Code Editor */}
      <div className="relative h-[380px] sm:h-[420px] w-full border-b border-slate-200 dark:border-slate-800">
        <Editor
          height="100%"
          language={monacoLanguage}
          value={code}
          onChange={(val) => onChangeCode(val || '')}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'Fira Code', Menlo, Monaco, Consolas, monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            glyphMargin: true,
            folding: true,
            renderLineHighlight: 'line',
            padding: { top: 12, bottom: 12 },
          }}
        />

        {/* Empty State Overlay */}
        {isEmpty && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center bg-slate-50/20 dark:bg-slate-950/20 backdrop-blur-[1px]">
            <Code2 className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Paste or type your code here to debug
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
              Supports Python, JS, TS, Java, C++, Go. Choose a preset from "Test Presets" at the top to try immediately.
            </p>
          </div>
        )}
      </div>

      {/* Optional Context Accordion (Stack trace & Expected Behavior) */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>Optional Context: Stack Trace & Expected Behavior</span>
            {(errorMessage || expectedBehavior) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Optional context provided" />
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[11px]">{showOptionalFields ? 'Collapse' : 'Expand'}</span>
            {showOptionalFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showOptionalFields && (
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label
                htmlFor="error-trace"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Error Message / Stack Trace (Optional)</span>
              </label>
              <textarea
                id="error-trace"
                rows={2}
                value={errorMessage}
                onChange={(e) => onChangeErrorMessage(e.target.value)}
                placeholder="e.g., TypeError: Cannot read property 'map' of undefined at processData (app.ts:42)"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="expected-behavior"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-sky-500" />
                <span>What should the code do? / Expected Behavior (Optional)</span>
              </label>
              <textarea
                id="expected-behavior"
                rows={2}
                value={expectedBehavior}
                onChange={(e) => onChangeExpectedBehavior(e.target.value)}
                placeholder="e.g., Should filter active users, calculate total revenue, and handle empty arrays gracefully."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Enter
          </kbd>
          <span className="hidden sm:inline">to start debugging</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isEmpty || isOverLineLimit || isAnalyzing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/30"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Logic & Bugs...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Analyze & Debug Code</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
