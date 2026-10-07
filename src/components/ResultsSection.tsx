import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileCode2,
  ListFilter,
  Check,
  Copy,
  Clock,
  Cpu,
  Layers,
} from 'lucide-react';
import { AnalysisResponse, BugItem, Severity } from '../types';
import { BugCard } from './BugCard';
import { DiffSection } from './DiffSection';

interface ResultsSectionProps {
  result: AnalysisResponse;
  originalCode: string;
  theme: 'dark' | 'light';
  activeBugHighlight: BugItem | null;
  onSelectBug: (bug: BugItem) => void;
  onApplyFixToInput?: () => void;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  result,
  originalCode,
  theme,
  activeBugHighlight,
  onSelectBug,
  onApplyFixToInput,
}) => {
  const [activeTab, setActiveTab] = useState<'bugs' | 'diff' | 'both'>('both');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [copiedTip, setCopiedTip] = useState(false);

  const bugs = result.bugs || [];
  const criticalCount = bugs.filter((b) => b.severity === 'critical').length;
  const majorCount = bugs.filter((b) => b.severity === 'major').length;
  const minorCount = bugs.filter((b) => b.severity === 'minor').length;

  const filteredBugs = bugs.filter((b) => {
    if (severityFilter === 'all') return true;
    return b.severity === severityFilter;
  });

  const handleCopyTip = async () => {
    if (!result.prevention_tip) return;
    await navigator.clipboard.writeText(result.prevention_tip);
    setCopiedTip(true);
    setTimeout(() => setCopiedTip(false), 2000);
  };

  const hasNoBugs = bugs.length === 0;

  return (
    <div className="space-y-6">
      {/* High-Level Summary Card */}
      <div
        className={`rounded-2xl p-5 border shadow-sm transition-all ${
          hasNoBugs
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {hasNoBugs ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {hasNoBugs
                    ? 'No Bugs Detected!'
                    : `Identified ${bugs.length} Issue${bugs.length > 1 ? 's' : ''}`}
                </h3>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {result.language || 'Code'}
                </span>
              </div>

              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Metadata badges (duration, provider, severity breakdown) */}
          <div className="flex flex-wrap items-center gap-2 self-start">
            {criticalCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                {criticalCount} Critical
              </span>
            )}
            {majorCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {majorCount} Major
              </span>
            )}
            {minorCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {minorCount} Minor
              </span>
            )}

            {result.durationMs && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                <Clock className="w-3 h-3" />
                {(result.durationMs / 1000).toFixed(1)}s
              </span>
            )}
            {result.provider && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                <Cpu className="w-3 h-3 text-indigo-500" />
                {result.provider} {result.model ? `(${result.model})` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Prevention Tip Callout */}
      {result.prevention_tip && (
        <div className="rounded-2xl p-4.5 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-blue-50/80 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-blue-950/40 border border-indigo-200/70 dark:border-indigo-800/60 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <span>How to avoid this next time</span>
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                  {result.prevention_tip}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyTip}
              className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
              title="Copy prevention tip"
            >
              {copiedTip ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-indigo-500" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Navigation View Switcher (Bug Cards vs Side-by-Side Diff vs Both) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'both'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Full View (All)</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bugs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'bugs'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5" />
              <span>Bug Cards ({bugs.length})</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'diff'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Diff View</span>
            </span>
          </button>
        </div>

        {/* Severity Filter Buttons when bug list is visible */}
        {(activeTab === 'bugs' || activeTab === 'both') && bugs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
              Filter by:
            </span>
            {(['all', 'critical', 'major', 'minor'] as const).map((sev) => {
              const count =
                sev === 'all'
                  ? bugs.length
                  : bugs.filter((b) => b.severity === sev).length;
              if (sev !== 'all' && count === 0) return null;

              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                    severityFilter === sev
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {sev} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Bug Breakdown Cards */}
        {(activeTab === 'bugs' || activeTab === 'both') && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Detailed Issues & Explanations</span>
                <span className="text-xs font-normal text-slate-500">
                  (Sorted by severity: Critical → Major → Minor)
                </span>
              </h4>
            </div>

            {hasNoBugs ? (
              <div className="rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800/80 p-8 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Clean bill of health! No syntax, logical, or runtime errors were found.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  The model did not invent any artificial bugs.
                </p>
              </div>
            ) : filteredBugs.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500">
                No bugs match the "{severityFilter}" filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredBugs.map((bug, index) => (
                  <BugCard
                    key={bug.id || `bug-${index}`}
                    bug={bug}
                    index={index}
                    isActive={
                      activeBugHighlight !== null &&
                      activeBugHighlight.explanation === bug.explanation
                    }
                    onSelect={onSelectBug}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Side-by-Side Diff Section */}
        {(activeTab === 'diff' || activeTab === 'both') && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Code Comparison & Full Corrected Version</span>
              </h4>
            </div>

            <DiffSection
              originalCode={originalCode}
              correctedCode={result.corrected_code || originalCode}
              language={result.language || 'text'}
              theme={theme}
              onApplyFixToInput={onApplyFixToInput}
            />
          </div>
        )}
      </div>
    </div>
  );
};
