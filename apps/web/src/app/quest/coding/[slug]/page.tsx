'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { CodingWorkspace } from '@/components/coding/coding-workspace';
import { apiProblemDetailToCodingProblem } from '@/features/coding/api-data';
import type { CodingProblem } from '@/features/coding/data';
import { codingApi, learningApi, type ApiProblemDetail, type ApiSkillDetail } from '@/lib/api';

export default function CodingChallengePage() {
  const { slug } = useParams<{ slug: string }>();
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setProblem(null);

    codingApi.problem(slug)
      .then(async (detail: ApiProblemDetail) => {
        let skill: ApiSkillDetail | null = null;
        if (detail.skill_id) {
          try { skill = await learningApi.skill(detail.skill_id); } catch { /* Skill context is optional. */ }
        }
        return apiProblemDetailToCodingProblem(detail, skill);
      })
      .then((mapped) => { if (!cancelled) { setProblem(mapped); setState('ready'); } })
      .catch((cause) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'Challenge not found.');
        setState('error');
      });
    return () => { cancelled = true; };
  }, [slug]);

  if (state === 'loading') {
    return <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Loading challenge…</div>;
  }

  if (state === 'error' || !problem) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-xl font-bold">Challenge unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error || 'This challenge could not be found.'}</p>
        <Link href="/quest/coding" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="size-4" />Back to Coding Arena</Link>
      </div>
    );
  }

  return <CodingWorkspace problem={problem} />;
}
