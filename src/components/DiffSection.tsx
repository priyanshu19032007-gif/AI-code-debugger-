import React, { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import {
  Copy,
  Check,
  Download,
  ArrowRightLeft,
  Columns,
  Rows,
  Sparkles,
} from 'lucide-react';
import { getMonacoLanguage } from '../utils/language';

interface DiffSectionProps {
  originalCode: string;
  correctedCode: string;
  language: string;
  theme: 'dark' | 'light';
  onApplyFixToInput?: () => void;
}

export const DiffSection: React.FC<DiffSectionProps> = ({
  originalCode,
  correctedCode,
  language,
  theme,
  onApplyFixToInput,
}) => {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [inlineView, setInlineView] = useState(false);

  const monacoLanguage = getMonacoLanguage(language);

  const handleCopy = async () => {
    if (!correctedCode) return;
    await navigator.clipboard.writeText(correctedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyFixToInput) {
      onApplyFixToInput();
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([correctedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `corrected_code.${language === 'python' ? 'py' : language === 'typescript' ? 'ts' : language === 'go' ? 'go' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : 'js'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simple line diff stats
  const origLines = originalCode.split('\n');
  const modLines = correctedCode.split('\n');
  const lineDiffCount = Math.abs(modLines.length - origLines.length);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/90">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
            <span>Side-by-Side Diff (Original vs. Corrected)</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-medium">
            {lineDiffCount === 0 ? 'Same length' : `${lineDiffCount} line delta`}
          </span>
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle Side-by-side vs Inline */}
          <button
            type="button"
            onClick={() => setInlineView(!inlineView)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title={inlineView ? 'Switch to side-by-side view' : 'Switch to unified inline view'}
          >
            {inlineView ? <Columns className="w-3.5 h-3.5" /> : <Rows className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{inlineView ? 'Side-by-Side' : 'Inline'}</span>
          </button>

          {/* Copy Fixed Code Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                <span>Copy Fixed Code</span>
              </>
            )}
          </button>

          {/* Apply to editor button */}
          {onApplyFixToInput && (
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              title="Replace the input code with this corrected version"
            >
              {applied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Use in Editor</span>
                </>
              )}
            </button>
          )}

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Download fixed code"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diff Subheader for left/right columns */}
      <div className="grid grid-cols-2 text-xs font-mono font-medium px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Original Code (with defects)</span>
        </div>
        <div className="flex items-center gap-1.5 pl-4 border-l border-slate-200 dark:border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Corrected Code (repaired)</span>
        </div>
      </div>

      {/* Monaco Diff Editor */}
      <div className="h-[420px] w-full">
        <DiffEditor
          height="100%"
          language={monacoLanguage}
          original={originalCode}
          modified={correctedCode}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            renderSideBySide: !inlineView,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'Fira Code', Menlo, Monaco, Consolas, monospace",
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            diffWordWrap: 'on',
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
};
