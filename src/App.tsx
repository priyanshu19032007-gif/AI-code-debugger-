/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CodeInputSection } from './components/CodeInputSection';
import { ResultsSection } from './components/ResultsSection';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ConfigModal } from './components/ConfigModal';
import { SAMPLE_SNIPPETS, SampleSnippet } from './sampleSnippets';
import { detectLanguageFromCode } from './utils/language';
import {
  AnalysisRequest,
  AnalysisResponse,
  BugItem,
  HistoryRecord,
  BackendStatus,
} from './types';
import { AlertTriangle, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

const STORAGE_THEME_KEY = 'cda_theme';
const STORAGE_HISTORY_KEY = 'cda_history';

export default function App() {
  // Theme state: dark by default per dark developer environment preferences
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  // Editor and Input states
  const [code, setCode] = useState<string>(SAMPLE_SNIPPETS[0].code);
  const [language, setLanguage] = useState<string>(SAMPLE_SNIPPETS[0].language);
  const [errorMessage, setErrorMessage] = useState<string>(SAMPLE_SNIPPETS[0].errorMessage || '');
  const [expectedBehavior, setExpectedBehavior] = useState<string>(SAMPLE_SNIPPETS[0].expectedBehavior || '');

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [activeBugHighlight, setActiveBugHighlight] = useState<BugItem | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Config Modal & Backend Status
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Synchronize document theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  }, [theme]);

  // Synchronize history in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn('Failed to save history to localStorage', err);
    }
  }, [history]);

  // Fetch backend status on mount
  const fetchBackendConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setBackendStatus({
          status: 'ok',
          provider: data.activeProvider || 'none',
          model: data.modelName || 'gemma2',
          ollamaConfigured: data.ollamaConfigured,
          geminiConfigured: data.geminiConfigured,
          ollamaUrl: data.ollamaUrl,
        });
      }
    } catch (err) {
      console.warn('Could not fetch backend config', err);
    }
  };

  useEffect(() => {
    fetchBackendConfig();
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectSample = (sample: SampleSnippet) => {
    setCode(sample.code);
    setLanguage(sample.language);
    setErrorMessage(sample.errorMessage || '');
    setExpectedBehavior(sample.expectedBehavior || '');
    setErrorBanner(null);
    setAnalysisResult(null);
    setActiveBugHighlight(null);
  };

  const handleReset = () => {
    setCode('');
    setLanguage('auto');
    setErrorMessage('');
    setExpectedBehavior('');
    setErrorBanner(null);
    setAnalysisResult(null);
    setActiveBugHighlight(null);
  };

  const handleAnalyze = async () => {
    setErrorBanner(null);

    if (!code || !code.trim()) {
      setErrorBanner('Code cannot be empty. Please enter or paste the code you want to debug.');
      return;
    }

    const lineCount = code.split('\n').length;
    if (lineCount > 500) {
      setErrorBanner(`Code exceeds the 500 lines limit (${lineCount} lines). Please debug in smaller modules.`);
      return;
    }

    setIsAnalyzing(true);
    setActiveBugHighlight(null);

    // Auto-detect language if 'auto'
    let effectiveLanguage = language;
    if (language === 'auto') {
      const detected = detectLanguageFromCode(code);
      if (detected !== 'auto') {
        effectiveLanguage = detected;
        setLanguage(detected);
      }
    }

    const payload: AnalysisRequest = {
      code,
      language: effectiveLanguage,
      errorMessage: errorMessage.trim() || undefined,
      expectedBehavior: expectedBehavior.trim() || undefined,
    };

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      setAnalysisResult(data);

      // Save to history
      const newRecord: HistoryRecord = {
        id: `hist-${Date.now()}`,
        timestamp: Date.now(),
        code,
        language: data.language || effectiveLanguage,
        errorMessage: errorMessage.trim() || undefined,
        expectedBehavior: expectedBehavior.trim() || undefined,
        result: data,
      };

      setHistory((prev) => [newRecord, ...prev.slice(0, 49)]); // keep last 50

      // Scroll smoothly to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorBanner(
        err.message || 'An unexpected error occurred while analyzing the code. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyFixToInput = () => {
    if (analysisResult?.corrected_code) {
      setCode(analysisResult.corrected_code);
      setActiveBugHighlight(null);
    }
  };

  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    setCode(record.code);
    setLanguage(record.language);
    setErrorMessage(record.errorMessage || '');
    setExpectedBehavior(record.expectedBehavior || '');
    setAnalysisResult(record.result);
    setErrorBanner(null);
    setActiveBugHighlight(null);
  };

  const handleDeleteHistoryRecord = (id: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all analysis history?')) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar */}
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onOpenConfig={() => setIsConfigOpen(true)}
        backendStatus={backendStatus}
        onSelectSample={handleSelectSample}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Hero & Instruction Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-transparent dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/10 p-5 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/40 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Zap className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Find bugs, learn why they happen, and get verified fixes.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Paste your snippet below or select one of the test presets (Off-by-one, Null reference, Wrong operator).
              Get line-by-line diagnostics and clean side-by-side diffs.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Strict JSON Contract</span>
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorBanner && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-in fade-in duration-150">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold mb-0.5">Analysis Failed</div>
              <p className="leading-relaxed">{errorBanner}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 font-bold p-1 text-base leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Code Input Section */}
        <section aria-label="Code Input Area">
          <CodeInputSection
            code={code}
            onChangeCode={setCode}
            language={language}
            onChangeLanguage={setLanguage}
            errorMessage={errorMessage}
            onChangeErrorMessage={setErrorMessage}
            expectedBehavior={expectedBehavior}
            onChangeExpectedBehavior={setExpectedBehavior}
            onSubmit={handleAnalyze}
            onReset={handleReset}
            isAnalyzing={isAnalyzing}
            theme={theme}
            activeBugHighlight={activeBugHighlight}
          />
        </section>

        {/* Results Section */}
        <section ref={resultsRef} aria-label="Analysis Results">
          {analysisResult && (
            <ResultsSection
              result={analysisResult}
              originalCode={code}
              theme={theme}
              activeBugHighlight={activeBugHighlight}
              onSelectBug={(bug) => setActiveBugHighlight(bug)}
              onApplyFixToInput={handleApplyFixToInput}
            />
          )}
        </section>
      </main>

      {/* History Slide-Over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRecord={handleSelectHistoryRecord}
        onDeleteRecord={handleDeleteHistoryRecord}
        onClearHistory={handleClearHistory}
      />

      {/* Backend Config Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        status={backendStatus}
        onRefresh={fetchBackendConfig}
      />
    </div>
  );
}
