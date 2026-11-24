import { api } from '@/lib/api';

export type RunResponse = {
  status: 'success' | 'compile_error' | 'runtime_error' | 'time_limit_exceeded' | 'output_limit_exceeded';
  stdout: string;
  stderr: string;
  exit_code: number | null;
  execution_time_ms: number;
};

export type PublicTestResult = {
  test_number: number;
  passed: boolean;
  expected_output: string;
  actual_output: string;
  execution_time_ms: number;
  status: string;
};

export type SamplesResponse = {
  verdict: 'sample_passed' | 'sample_failed' | 'compile_error' | 'runtime_error' | 'time_limit_exceeded' | 'output_limit_exceeded';
  passed_tests: number;
  total_tests: number;
  results: PublicTestResult[];
  execution_time_ms?: number;
};

export type SubmitResponse = {
  submission_id: string;
  verdict: 'accepted' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'time_limit_exceeded' | 'output_limit_exceeded' | 'system_error';
  passed_tests: number;
  total_tests: number;
  public_passed: number;
  public_total: number;
  hidden_passed: number;
  hidden_total: number;
  execution_time_ms: number;
  xp_awarded: number;
  progress_lesson_id: string;
};

type SubmissionStatus = {
  id: string;
  status: string;
  score: number | null;
  execution_time_ms: number | null;
  result_summary: Record<string, unknown> | null;
  evaluated_at: string | null;
};

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 90_000;
const VERDICTS = new Set(['accepted', 'wrong_answer', 'compile_error', 'runtime_error', 'time_limit_exceeded', 'output_limit_exceeded']);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function runCustomInput(problemId: string, sourceCode: string, stdin: string) {
  return api.post<RunResponse>('/coding/run', { problem_id: problemId, source_code: sourceCode, stdin });
}

export function runSampleTests(problemId: string, sourceCode: string) {
  return api.post<SamplesResponse>('/coding/run-samples', { problem_id: problemId, source_code: sourceCode });
}

export async function submitSolution(problemId: string, sourceCode: string): Promise<SubmitResponse> {
  const created = await api.post<{ id: string; status: string }>('/coding/submissions', {
    problem_id: problemId,
    language: 'cpp',
    source_code: sourceCode,
  });

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let submission: SubmissionStatus | null = null;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    submission = await api.get<SubmissionStatus>(`/coding/submissions/${created.id}`);
    if (submission.evaluated_at || (submission.status !== 'queued' && submission.status !== 'pending' && submission.status !== 'running')) break;
  }
  if (!submission) throw new Error('Timed out waiting for the evaluation result.');

  const summary = (submission.result_summary ?? {}) as Record<string, number | string | undefined>;
  const rawVerdict = typeof summary.verdict === 'string' ? summary.verdict : submission.status;
  const verdict = (VERDICTS.has(rawVerdict) ? rawVerdict : 'system_error') as SubmitResponse['verdict'];
  const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

  return {
    submission_id: submission.id,
    verdict,
    passed_tests: num(summary.passed_tests),
    total_tests: num(summary.total_tests),
    public_passed: num(summary.public_passed),
    public_total: num(summary.public_total),
    hidden_passed: num(summary.hidden_passed),
    hidden_total: num(summary.hidden_total),
    execution_time_ms: submission.execution_time_ms ?? num(summary.execution_time_ms),
    xp_awarded: verdict === 'accepted' ? 100 : 0,
    progress_lesson_id: '',
  };
}
