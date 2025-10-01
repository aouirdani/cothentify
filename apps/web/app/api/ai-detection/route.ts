import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const PYTHON_TIMEOUT_MS = Number(process.env['AI_DETECT_TIMEOUT_MS'] || 15000);
const PYTHON_CANDIDATES = (() => {
  const fromEnv = process.env['AI_DETECT_PYTHON'];
  if (fromEnv) return [fromEnv];
  const repoRoot = path.resolve(process.cwd(), '..', '..');
  const venvPaths = [
    path.join(repoRoot, 'ai-vs-human', 'env', 'bin', 'python'),
    path.join(repoRoot, 'ai-vs-human', 'env', 'Scripts', 'python.exe'),
    path.join(repoRoot, 'ai-detection-small', 'env', 'bin', 'python'),
    path.join(repoRoot, 'ai-detection-small', 'env', 'Scripts', 'python.exe'),
  ];

  const discovered = venvPaths.filter((candidatePath) => {
    try {
      return fs.statSync(candidatePath).isFile();
    } catch (error) {
      return false;
    }
  });

  return [...discovered, 'python3', 'python3.11', 'python'];
})();

const repoRoot = path.resolve(process.cwd(), '..', '..');

const pythonBridgeScript = `
import sys, json, time, re

sys.path.append('ai-vs-human')

try:
    from predictor import predict_text, lexical_diversity, calculate_readability, sentence_length
except Exception as exc:
    json.dump({'error': f'Failed to load model: {exc.__class__.__name__}: {exc}'}, sys.stdout)
    sys.exit(1)


def safe_number(value, fallback=0.0):
    try:
        numeric = float(value)
        if numeric != numeric or numeric in (float('inf'), float('-inf')):
            return fallback
        return numeric
    except Exception:
        return fallback


def pattern_flags(sample_text: str, avg_len: float, readability: float, lexical: float):
    findings = []
    if avg_len > 22:
        findings.append('Long average sentence length')
    if readability < 45:
        findings.append('Challenging readability score')
    if lexical < 0.4:
        findings.append('Low lexical variety')
    if len(sample_text.split()) < 80:
        findings.append('Short passage — detectors prefer 80+ words')
    return findings[:6]


def repeated_terms(sample_text: str):
    words = re.findall(r"[A-Za-z']+", sample_text.lower())
    frequency = {}
    for word in words:
        frequency[word] = frequency.get(word, 0) + 1
    repeats = [word for word, count in sorted(frequency.items(), key=lambda item: (-item[1], item[0])) if count >= 3]
    return repeats[:5]


def linguistic_markers(sample_text: str):
    lowered = sample_text.lower()
    formal_markers = ['moreover', 'in conclusion', 'furthermore', 'additionally', 'overall', 'in summary']
    cues = [phrase for phrase in formal_markers if phrase in lowered]
    repeats = repeated_terms(sample_text)
    if repeats:
        cues.append('Common repeated terms: ' + ', '.join(repeats))
    return cues[:6]


def main():
    raw = sys.stdin.read()
    sample = (raw or '').strip()
    if not sample:
        json.dump({'error': 'No content provided'}, sys.stdout)
        return

    start_time = time.time()
    try:
        prediction, probability = predict_text(sample)
    except Exception as exc:
        json.dump({'error': f'Prediction failure: {exc.__class__.__name__}: {exc}'}, sys.stdout)
        return

    duration = time.time() - start_time

    readability = safe_number(calculate_readability(sample), 0.0)
    lexical = safe_number(lexical_diversity(sample), 0.0)
    avg_sentence = safe_number(sentence_length(sample), 0.0)

    ai_probability = safe_number(float(probability) * 100.0, 0.0)
    confidence_score = safe_number(50.0 + abs(ai_probability - 50.0), 50.0)
    duration = safe_number(duration, 0.0)

    result = {
        'ai_probability': round(ai_probability, 2),
        'confidence_score': round(confidence_score, 2),
        'label': 'ai' if int(prediction) == 1 else 'human',
        'detected_models': ['Cothentify Ensemble v1'],
        'analysis_details': {
            'pattern_matches': pattern_flags(sample, avg_sentence, readability, lexical),
            'linguistic_markers': linguistic_markers(sample),
            'readability_score': round(readability, 2),
            'lexical_diversity': round(lexical * 100, 2),
            'avg_sentence_length': round(avg_sentence, 2),
        },
        'processing_time': duration,
    }

    json.dump(result, sys.stdout)


if __name__ == '__main__':
    main()
`;

export async function POST(request: NextRequest) {
    let payload: unknown;

    try {
        payload = await request.json();
    } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const content = typeof payload === 'object' && payload !== null && 'content' in payload ? String((payload as { content: unknown }).content ?? '') : '';
    const sample = content.trim();

    if (!sample) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    try {
        const analysis = await runPythonModel(sample, repoRoot);

        if ('error' in analysis) {
            return NextResponse.json(analysis, { status: 500 });
        }

        return NextResponse.json(analysis, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

type PythonAnalysis =
    | {
          ai_probability: number;
          confidence_score: number;
          label: string;
          detected_models: string[];
          analysis_details: Record<string, unknown> & {
              pattern_matches: string[];
              linguistic_markers: string[];
          };
          processing_time: number;
      }
    | { error: string };

function runPythonModel(sample: string, workingDir: string) {
    return new Promise<PythonAnalysis>((resolve, reject) => {
        const errors: Error[] = [];

        function attempt(index: number) {
            if (index >= PYTHON_CANDIDATES.length) {
                const message =
                    errors.length > 0 && errors[errors.length - 1]?.message.includes('ENOENT')
                        ? 'No Python interpreter found. Install python3 or set AI_DETECT_PYTHON to a valid interpreter path.'
                        : errors[errors.length - 1]?.message || 'Unable to start Python process.';
                reject(new Error(message));
                return;
            }

            const interpreter = PYTHON_CANDIDATES[index];
            const subprocess = spawn(interpreter, ['-c', pythonBridgeScript], {
                cwd: workingDir,
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            const timer = setTimeout(() => {
                subprocess.kill('SIGKILL');
                reject(new Error('Python model timed out'));
            }, PYTHON_TIMEOUT_MS);

            let stdout = '';
            let stderr = '';

            subprocess.stdout.on('data', (chunk) => {
                stdout += chunk.toString();
            });

            subprocess.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
            });

            subprocess.on('error', (error) => {
                clearTimeout(timer);
                errors.push(error);
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    attempt(index + 1);
                    return;
                }
                reject(error);
            });

            subprocess.on('close', (code) => {
                clearTimeout(timer);

                if (code !== 0 && !stdout) {
                    errors.push(new Error(stderr.trim() || `Python process exited with code ${code}`));
                    attempt(index + 1);
                    return;
                }

                try {
                    const parsed = JSON.parse(stdout || '{}') as PythonAnalysis;
                    resolve(parsed);
                } catch (error) {
                    reject(new Error(`Failed to parse Python response: ${(error as Error).message}. Output: ${stdout || stderr}`));
                }
            });

            subprocess.stdin.write(sample);
            subprocess.stdin.end();
        }

        attempt(0);
    });
}
