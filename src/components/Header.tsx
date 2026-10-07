import React from 'react';
import { Bug, Moon, Sun, History, Settings, Sparkles, Terminal } from 'lucide-react';
import { SAMPLE_SNIPPETS, SampleSnippet } from '../sampleSnippets';
import { BackendStatus } from '../types';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onOpenConfig: () => void;
  backendStatus: BackendStatus | null;
  onSelectSample: (sample: SampleSnippet) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenHistory,
  historyCount,
  onOpenConfig,
  backendStatus,
  onSelectSample,
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* App Title & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Bug className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                Code Debugging Assistant
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelligent Bug Detection • Root Cause Diagnosis • Auto-Fix Diff
            </p>
          </div>
        </div>

        {/* Quick Samples Dropdown & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sample Snippets Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
              title="Load standard test snippets"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Test Presets</span>
              <span className="md:hidden">Presets</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>
            <div className="absolute right-0 mt-1 w-64 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                Sample Buggy Snippets
              </div>
              {SAMPLE_SNIPPETS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample)}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-indigo-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 flex flex-col gap-0.5 transition-colors"
                >
                  <div className="font-medium flex items-center justify-between">
                    <span>{sample.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                      {sample.language}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {sample.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Model / Provider Status Pill */}
          <button
            onClick={onOpenConfig}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            title="Configure or inspect LLM backend"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              {backendStatus?.provider === 'ollama'
                ? `Ollama: ${backendStatus.model}`
                : backendStatus?.provider === 'gemini'
                ? 'Gemini 2.5'
                : 'LLM Active'}
            </span>
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="View debugging history"
            aria-label="View history"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                {historyCount > 99 ? '99+' : historyCount}
              </span>
            )}
          </button>

          {/* Settings / Config Button */}
          <button
            type="button"
            onClick={onOpenConfig}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Backend provider info"
            aria-label="Backend provider info"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Dark/Light Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
