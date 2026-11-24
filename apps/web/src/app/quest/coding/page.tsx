'use client';

import { useEffect, useState } from 'react';
import { CodingChallengesHome } from '@/components/coding/coding-challenges-home';
import { apiProblemSummaryToCard, type CodingChallengeCard } from '@/features/coding/api-data';
import { codingApi } from '@/lib/api';

export default function CodingArenaPage() {
  const [problems, setProblems] = useState<CodingChallengeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    codingApi.problems()
      .then((data) => { if (!cancelled) setProblems(data.items.map(apiProblemSummaryToCard)); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Failed to load challenges.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return <CodingChallengesHome problems={problems} loading={loading} error={error} />;
}
