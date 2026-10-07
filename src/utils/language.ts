export const SUPPORTED_LANGUAGES = [
  { id: 'auto', label: 'Auto-detect', monacoLang: 'plaintext', ext: 'txt' },
  { id: 'python', label: 'Python', monacoLang: 'python', ext: 'py' },
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', monacoLang: 'typescript', ext: 'ts' },
  { id: 'java', label: 'Java', monacoLang: 'java', ext: 'java' },
  { id: 'cpp', label: 'C++', monacoLang: 'cpp', ext: 'cpp' },
  { id: 'go', label: 'Go', monacoLang: 'go', ext: 'go' },
] as const;

export function getMonacoLanguage(langId: string): string {
  const match = SUPPORTED_LANGUAGES.find((l) => l.id.toLowerCase() === langId.toLowerCase());
  if (match) return match.monacoLang;

  const lower = langId.toLowerCase();
  if (lower.includes('python') || lower.includes('py')) return 'python';
  if (lower.includes('typescript') || lower.includes('ts')) return 'typescript';
  if (lower.includes('javascript') || lower.includes('js')) return 'javascript';
  if (lower.includes('java')) return 'java';
  if (lower.includes('c++') || lower.includes('cpp')) return 'cpp';
  if (lower.includes('go')) return 'go';

  return 'plaintext';
}

export function detectLanguageFromCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return 'auto';

  if (/def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import|:\s*(\n|$)|#/.test(trimmed) &&
      !/[{};]/.test(trimmed)) {
    return 'python';
  }

  if (/package\s+main|func\s+\w+\s*\(|fmt\.Print/.test(trimmed)) {
    return 'go';
  }

  if (/#include\s*<|std::|cout\s*<<|cin\s*>>|nullptr/.test(trimmed)) {
    return 'cpp';
  }

  if (/public\s+class\s+\w+|System\.out\.println|public\s+static\s+void\s+main/.test(trimmed)) {
    return 'java';
  }

  if (/interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|any)[\s;,)=]/.test(trimmed)) {
    return 'typescript';
  }

  if (/const\s+\w+|let\s+\w+|function\s+\w+|console\.log|=>/.test(trimmed)) {
    return 'javascript';
  }

  return 'auto';
}
