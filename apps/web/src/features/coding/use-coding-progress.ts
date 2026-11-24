'use client';

import { useEffect, useState } from 'react';
import { codingApi, getAccessToken } from '@/lib/api';
import type { SubmitResponse } from './api';

const STORAGE_KEY = 'student-growth:coding-progress:v1';

type SavedAttempt = {
  problemId: string;
  title: string;
  verdict: SubmitResponse['verdict'];
  passedTests: number;
  totalTests: number;
  executionTimeMs: number;
  submittedAt: string;
};

type StoredState = { solvedProblemIds: string[]; attempts: SavedAttempt[]; xpEarned: number };

const SERVER_VERDICTS = new Set(['accepted', 'wrong_answer', 'compile_error', 'runtime_error', 'time_limit_exceeded', 'output_limit_exceeded']);

function attemptKey(attempt: SavedAttempt) {
  return `${attempt.problemId}|${attempt.verdict}|${attempt.submittedAt.slice(0, 16)}`;
}

export function useCodingProgress() {
  const [state, setState] = useState<StoredState>({ solvedProblemIds: [], attempts: [], xpEarned: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredState>;
        setState({
          solvedProblemIds: Array.isArray(parsed.solvedProblemIds) ? parsed.solvedProblemIds.filter((id): id is string => typeof id === 'string') : [],
          attempts: Array.isArray(parsed.attempts) ? parsed.attempts.slice(0, 30) : [],
          xpEarned: typeof parsed.xpEarned === 'number' && Number.isFinite(parsed.xpEarned) ? parsed.xpEarned : 0,
        });
      }
    } catch {
      // Keep an empty local state if storage is unavailable or invalid.
    }
    setReady(true);
  }, []);

  // Hydrate solved state + attempt history from the backend when signed in.
  useEffect(() => {
    if (!ready || !getAccessToken()) return;
    let cancelled = false;
    (async () => {
      try {
        const [problems, submissions] = await Promise.all([
          codingApi.problems(),
          codingApi.mySubmissions(),
        ]);
        const slugById = new Map(problems.items.map((problem) => [problem.id, problem.slug]));
        const serverAttempts: SavedAttempt[] = submissions.items
          .map((sub) => {
            const problemId = slugById.get(sub.problem_id) ?? sub.problem_id;
            const verdict = SERVER_VERDICTS.has(sub.status) ? (sub.status as SubmitResponse['verdict']) : 'system_error';
            return {
              problemId,
              title: sub.problem_title ?? 'Challenge',
              verdict,
              passedTests: Number((sub.result_summary as Record<string, unknown> | undefined)?.passed_tests ?? 0),
              totalTests: Number((sub.result_summary as Record<string, unknown> | undefined)?.total_tests ?? 0),
              executionTimeMs: sub.execution_time_ms ?? 0,
              submittedAt: sub.submitted_at,
            };
          })
          .filter((attempt) => attempt.problemId);
        const serverSolved = Array.from(new Set(
          submissions.items
            .filter((sub) => sub.status === 'accepted')
            .map((sub) => slugById.get(sub.problem_id))
            .filter((slug): slug is string => Boolean(slug)),
        ));
        if (cancelled) return;
        setState((current) => {
          const seen = new Set(current.attempts.map(attemptKey));
          const mergedAttempts = [...current.attempts];
          for (const attempt of serverAttempts) {
            const key = attemptKey(attempt);
            if (!seen.has(key)) { seen.add(key); mergedAttempts.push(attempt); }
          }
          mergedAttempts.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
          return {
            solvedProblemIds: Array.from(new Set([...current.solvedProblemIds, ...serverSolved])),
            attempts: mergedAttempts.slice(0, 30),
            xpEarned: current.xpEarned,
          };
        });
      } catch {
        // Server sync is best-effort; local progress still works.
      }
    })();
    return () => { cancelled = true; };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Current-session state still works. */ }
  }, [ready, state]);

  function recordSubmission(problemId: string, title: string, result: SubmitResponse) {
    const attempt: SavedAttempt = {
      problemId, title, verdict: result.verdict, passedTests: result.passed_tests,
      totalTests: result.total_tests, executionTimeMs: result.execution_time_ms,
      submittedAt: new Date().toISOString(),
    };
    setState((current) => {
      const firstSolve = result.verdict === 'accepted' && !current.solvedProblemIds.includes(problemId);
      return {
        solvedProblemIds: firstSolve ? [...current.solvedProblemIds, problemId] : current.solvedProblemIds,
        attempts: [attempt, ...current.attempts].slice(0, 30),
        xpEarned: current.xpEarned + (firstSolve ? result.xp_awarded : 0),
      };
    });
  }

  return {
    solvedProblemIds: state.solvedProblemIds,
    attempts: state.attempts,
    solvedCount: state.solvedProblemIds.length,
    xpEarned: state.xpEarned,
    recordSubmission,
    ready,
  };
}
