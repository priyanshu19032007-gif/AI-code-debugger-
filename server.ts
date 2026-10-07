import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { AnalysisRequest, AnalysisResponse, BugItem, Severity } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '2mb' }));

const SYSTEM_PROMPT = `You are an expert code reviewer and debugger. Analyze the user's code.
Respond ONLY with valid JSON in this schema:
{
  "language": string,
  "summary": string,
  "bugs": [
    {
      "lines": [number],
      "severity": "critical" | "major" | "minor",
      "category": string,
      "explanation": string,
      "fix": string
    }
  ],
  "corrected_code": string,
  "prevention_tip": string
}
If the code has no bugs, return an empty bugs array and say so in summary.
Do not invent bugs. Do not include text outside the JSON.`;

// Configuration for LLMs
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.MODEL_NAME || 'gemma2';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Clean and extract JSON from model responses
function extractAndParseJSON(rawText: string): AnalysisResponse | null {
  if (!rawText) return null;

  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Find boundaries of the outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validate schema
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (typeof parsed.summary !== 'string' || typeof parsed.corrected_code !== 'string') return null;

    const validatedBugs: BugItem[] = [];
    if (Array.isArray(parsed.bugs)) {
      for (let i = 0; i < parsed.bugs.length; i++) {
        const bug = parsed.bugs[i];
        if (typeof bug !== 'object' || bug === null) continue;

        let lines: number[] = [];
        if (Array.isArray(bug.lines)) {
          lines = bug.lines
            .map((n: unknown) => (typeof n === 'number' ? n : parseInt(String(n), 10)))
            .filter((n: number) => !isNaN(n) && n > 0);
        } else if (typeof bug.line === 'number') {
          lines = [bug.line];
        }

        let severity: Severity = 'major';
        const rawSev = String(bug.severity || '').toLowerCase();
        if (rawSev === 'critical' || rawSev === 'major' || rawSev === 'minor') {
          severity = rawSev;
        }

        validatedBugs.push({
          lines,
          severity,
          category: String(bug.category || 'logic'),
          explanation: String(bug.explanation || 'No explanation provided'),
          fix: String(bug.fix || ''),
        });
      }
    }

    return {
      language: String(parsed.language || 'auto'),
      summary: String(parsed.summary || ''),
      bugs: validatedBugs,
      corrected_code: String(parsed.corrected_code || ''),
      prevention_tip: String(parsed.prevention_tip || ''),
    };
  } catch (err) {
    return null;
  }
}

// Check if Ollama is actively reachable
async function isOllamaAvailable(): Promise<boolean> {
  if (!process.env.OLLAMA_URL) return false;
  try {
    const res = await fetch(`${OLLAMA_URL.replace(/\/$/, '')}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Call Ollama endpoint
async function queryOllama(userPrompt: string, isRetry = false, previousBadOutput = ''): Promise<string> {
  const url = `${OLLAMA_URL.replace(/\/$/, '')}/api/chat`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  if (isRetry && previousBadOutput) {
    messages.push({ role: 'assistant', content: previousBadOutput });
    messages.push({
      role: 'user',
      content: 'Your previous response was not valid JSON. Please return valid JSON only matching the schema exactly, with no markdown code blocks or text outside the JSON.',
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2,
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed with HTTP ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content || '';
}

// Call Gemini API via @google/genai with automatic fallback across valid models
async function queryGemini(userPrompt: string, isRetry = false, previousBadOutput = ''): Promise<{ text: string; model: string }> {
  const ai = new GoogleGenAI();
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

  const contents: string[] = [userPrompt];
  if (isRetry && previousBadOutput) {
    contents.push(previousBadOutput);
    contents.push('Your previous response was not valid JSON. Return ONLY valid JSON matching the exact schema specified earlier.');
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
        contents,
      });

      if (response.text) {
        return { text: response.text, model };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${model} failed, trying next model...`, err?.message || err);
    }
  }

  throw lastError || new Error('All Gemini models failed to generate content');
}

// Build user prompt from input fields
function buildUserPrompt(reqBody: AnalysisRequest): string {
  const { code, language, errorMessage, expectedBehavior } = reqBody;

  let prompt = `Analyze this code for any bugs, defects, security vulnerabilities, or logical mistakes:\n\n`;

  if (language && language !== 'auto') {
    prompt += `Programming Language: ${language}\n\n`;
  }

  prompt += `\`\`\`${language && language !== 'auto' ? language : ''}\n${code}\n\`\`\`\n\n`;

  if (errorMessage && errorMessage.trim()) {
    prompt += `Observed Error Message / Stack Trace:\n${errorMessage.trim()}\n\n`;
  }

  if (expectedBehavior && expectedBehavior.trim()) {
    prompt += `Expected Behavior / Requirements:\n${expectedBehavior.trim()}\n\n`;
  }

  prompt += `Please identify all bugs with exact line numbers, categorize them, explain why they occur, suggest minimal code fixes, and provide the complete corrected code and a prevention tip.`;
  return prompt;
}

// API Health / Config endpoint
app.get('/api/config', async (req: Request, res: Response) => {
  let ollamaReachable = false;
  try {
    const check = await fetch(`${OLLAMA_URL.replace(/\/$/, '')}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    ollamaReachable = check.ok;
  } catch {
    ollamaReachable = false;
  }

  res.json({
    status: 'ok',
    ollamaConfigured: Boolean(process.env.OLLAMA_URL),
    ollamaReachable,
    ollamaUrl: OLLAMA_URL,
    modelName: DEFAULT_MODEL,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    activeProvider: ollamaReachable ? 'ollama' : (GEMINI_API_KEY ? 'gemini' : 'none'),
  });
});

// Code Analysis Endpoint
app.post('/api/analyze', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { code, language, errorMessage, expectedBehavior } = req.body as AnalysisRequest;

  // Input Validation
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Code cannot be empty. Please paste or enter the code you want to debug.' });
  }

  const lineCount = code.split('\n').length;
  if (lineCount > 500) {
    return res.status(400).json({
      error: `Code exceeds the 500 lines limit (received ${lineCount} lines). Please debug in smaller modules or snippets.`,
    });
  }

  const userPrompt = buildUserPrompt({ code, language, errorMessage, expectedBehavior });

  let rawOutput = '';
  let providerUsed = '';
  let modelUsed = '';
  let parsed: AnalysisResponse | null = null;

  // Decide provider priority:
  // If local Ollama is actively reachable, use it; otherwise use Gemini API.
  const ollamaOnline = await isOllamaAvailable();

  if (ollamaOnline) {
    try {
      rawOutput = await queryOllama(userPrompt);
      providerUsed = 'Ollama';
      modelUsed = DEFAULT_MODEL;
      parsed = extractAndParseJSON(rawOutput);

      // Retry once if parsing failed
      if (!parsed) {
        console.warn('Ollama first JSON parse attempt failed, retrying once...');
        const retryOutput = await queryOllama(userPrompt, true, rawOutput);
        parsed = extractAndParseJSON(retryOutput);
      }
    } catch (ollamaErr: any) {
      console.warn('Ollama query failed:', ollamaErr?.message || ollamaErr);
      if (!GEMINI_API_KEY) {
        return res.status(502).json({
          error: `Could not connect to Ollama at ${OLLAMA_URL} (${ollamaErr?.message || 'Connection failed'}). Please make sure Ollama is running or configure GEMINI_API_KEY.`,
        });
      }
      // Fallback to Gemini
      console.info('Falling back to Google Gemini...');
    }
  } else if (!GEMINI_API_KEY && process.env.OLLAMA_URL) {
    // If Ollama was explicitly wanted but is offline and no Gemini key is set:
    return res.status(502).json({
      error: `Local Ollama server is offline or unreachable at ${OLLAMA_URL}. Start Ollama ('ollama serve') or set GEMINI_API_KEY in your environment.`,
    });
  }

  // If not parsed yet and Gemini is available, use Gemini
  if (!parsed && GEMINI_API_KEY) {
    try {
      const geminiResult = await queryGemini(userPrompt);
      rawOutput = geminiResult.text;
      providerUsed = 'Gemini';
      modelUsed = geminiResult.model;
      parsed = extractAndParseJSON(rawOutput);

      // Retry once if parsing failed
      if (!parsed) {
        console.warn('Gemini first JSON parse attempt failed, retrying once...');
        const retryResult = await queryGemini(userPrompt, true, rawOutput);
        rawOutput = retryResult.text;
        modelUsed = retryResult.model;
        parsed = extractAndParseJSON(rawOutput);
      }
    } catch (geminiErr: any) {
      console.error('Gemini error:', geminiErr);
      return res.status(500).json({
        error: `LLM service error: ${geminiErr?.message || 'Unknown error occurred while analyzing code.'}`,
      });
    }
  }

  // If still not parsed
  if (!parsed) {
    if (!ollamaOnline && !GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'No active LLM provider found. Set GEMINI_API_KEY or start Ollama and configure OLLAMA_URL.',
      });
    }
    return res.status(502).json({
      error: 'The LLM failed to return a valid structured JSON response after retry. Please try again or simplify the prompt.',
    });
  }

  parsed.provider = providerUsed;
  parsed.model = modelUsed;
  parsed.durationMs = Date.now() - startTime;

  // Ensure line numbers fall within the actual code line count
  parsed.bugs = parsed.bugs.map((bug, idx) => ({
    ...bug,
    id: `bug-${idx + 1}-${Date.now()}`,
    lines: bug.lines.filter((l) => l <= lineCount),
  }));

  // Sort bugs by severity: critical > major > minor
  const severityRank: Record<Severity, number> = {
    critical: 3,
    major: 2,
    minor: 1,
  };
  parsed.bugs.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  return res.json(parsed);
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Code Debugging Assistant server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
