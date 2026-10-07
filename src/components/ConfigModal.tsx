import React from 'react';
import { X, CheckCircle2, AlertCircle, Terminal, Cpu, Key, HelpCircle } from 'lucide-react';
import { BackendStatus } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: BackendStatus | null;
  onRefresh: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              LLM Backend Configuration
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Active Provider Indicator */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white text-xs">
                  Active Provider:{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 capitalize">
                    {status?.provider || 'Automatic (Gemini / Ollama)'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Target model: <span className="font-mono">{status?.model || 'gemma2 / gemini-2.5-flash'}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
            >
              Refresh
            </button>
          </div>

          {/* Provider Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Provider Status
            </h4>

            {/* Ollama Status */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <Terminal className="w-4 h-4 text-slate-500 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    Local Ollama Server
                  </span>
                  {status?.ollamaConfigured ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Default fallback</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {status?.ollamaUrl || 'http://localhost:11434'} (Model: {status?.model || 'gemma2'})
                </p>
              </div>
            </div>

            {/* Gemini Cloud Fallback Status */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <Key className="w-4 h-4 text-slate-500 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    Google Gemini AI (Cloud)
                  </span>
                  {status?.geminiConfigured ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Key Detected
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> No key set
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Provides high-speed, guaranteed JSON responses with zero local GPU setup required.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>How to run Ollama locally</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              1. Install Ollama from <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">ollama.com</a>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-slate-200/60 dark:bg-slate-800 p-1.5 rounded">
              ollama run gemma2
            </p>
            <p className="text-[11px] text-slate-500">
              Set <code className="font-mono text-slate-700 dark:text-slate-300">OLLAMA_URL="http://localhost:11434"</code> in your <code className="font-mono">.env</code>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
