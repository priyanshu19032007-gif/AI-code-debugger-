export type Severity = 'critical' | 'major' | 'minor';

export type BugCategory = 'syntax' | 'logic' | 'runtime' | 'performance' | 'security' | 'style' | string;

export interface BugItem {
  id?: string;
  lines: number[];
  severity: Severity;
  category: BugCategory;
  explanation: string;
  fix: string;
}

export interface AnalysisResponse {
  language: string;
  summary: string;
  bugs: BugItem[];
  corrected_code: string;
  prevention_tip: string;
  provider?: string;
  model?: string;
  durationMs?: number;
}

export interface AnalysisRequest {
  code: string;
  language?: string;
  errorMessage?: string;
  expectedBehavior?: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  code: string;
  language: string;
  errorMessage?: string;
  expectedBehavior?: string;
  result: AnalysisResponse;
}

export interface BackendStatus {
  status: 'ok';
  provider: 'ollama' | 'gemini' | 'none';
  model: string;
  ollamaConfigured: boolean;
  geminiConfigured: boolean;
  ollamaUrl?: string;
}
