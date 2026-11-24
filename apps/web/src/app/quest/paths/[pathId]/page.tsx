'use client';

import { useParams } from 'next/navigation';
import { SkillQuestPathDetail } from '@/components/skill-quest/path-detail';
import { useSkillQuestPath } from '@/lib/api-data';

export default function SkillQuestPathPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const { path, loading, error } = useSkillQuestPath(pathId);

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading path…</div>;
  if (error || !path) return <div className="p-10 text-center text-sm text-rose-400">{error ?? 'Path not found.'}</div>;
  return <SkillQuestPathDetail path={path} />;
}
