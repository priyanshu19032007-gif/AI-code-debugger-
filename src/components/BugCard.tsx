import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  Check,
  Copy,
  Hash,
  Tag,
  ArrowRight,
  Code,
} from 'lucide-react';
import { BugItem, Severity } from '../types';

interface BugCardProps {
  bug: BugItem;
  index: number;
  isActive: boolean;
  onSelect: (bug: BugItem) => void;
}

export const BugCard: React.FC<BugCardProps> = ({ bug, index, isActive, onSelect }) => {
  const [copiedFix, setCopiedFix] = useState(false);

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <AlertOctagon className="w-3.5 h-3.5" />,
          label: 'Critical',
          badgeClass:
            'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          borderClass: 'border-l-rose-500',
        };
      case 'major':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: 'Major',
          badgeClass:
            'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          borderClass: 'border-l-amber-500',
        };
      case 'minor':
      default:
        return {
          icon: <Info className="w-3.5 h-3.5" />,
          label: 'Minor',
          badgeClass:
            'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800',
          borderClass: 'border-l-sky-500',
        };
    }
  };

  const sevInfo = getSeverityBadge(bug.severity);

  const handleCopyFix = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bug.fix) return;
    await navigator.clipboard.writeText(bug.fix);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(bug)}
      className={`rounded-xl border p-4 bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all border-l-4 ${
        sevInfo.borderClass
      } ${
        isActive
          ? 'ring-2 ring-indigo-500 shadow-md border-indigo-300 dark:border-indigo-600'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow'
      }`}
    >
      {/* Top Metadata Row: Severity, Category, and Lines */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          {/* Severity Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sevInfo.badgeClass}`}
          >
            {sevInfo.icon}
            <span>{sevInfo.label}</span>
          </span>

          {/* Category Badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 capitalize">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>{bug.category}</span>
          </span>
        </div>

        {/* Line Numbers Badge */}
        {bug.lines && bug.lines.length > 0 && (
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 group hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            title="Click to view and jump to this line in the code editor"
          >
            <Hash className="w-3 h-3 text-indigo-500" />
            <span>
              Line{bug.lines.length > 1 ? 's' : ''} {bug.lines.join(', ')}
            </span>
            <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}
      </div>

      {/* Plain-English Explanation */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Root Cause & Explanation
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
          {bug.explanation}
        </p>
      </div>

      {/* Suggested Fix Code Snippet */}
      {bug.fix && (
        <div className="mt-3 bg-slate-900 rounded-lg p-3 text-slate-100 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>Suggested Fix</span>
            </div>
            <button
              type="button"
              onClick={handleCopyFix}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Copy fix snippet"
            >
              {copiedFix ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-emerald-300/90 bg-black/40 p-2 rounded">
            {bug.fix}
          </pre>
        </div>
      )}
    </div>
  );
};
