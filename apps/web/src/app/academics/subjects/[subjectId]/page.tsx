'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SubjectDetail } from '@/components/academics/subject-detail';
import { useSubjectDetail } from '@/lib/api-data';
import { academicsApi, type ApiResource } from '@/lib/api';
import type { Subject, SubjectUnit, SubjectResource, ResourceType } from '@/features/academics/data';

const TYPE_MAP: Record<string, ResourceType> = {
  notes: 'Notes', experiment: 'Practical', viva: 'Viva', question_bank: 'Quiz',
  previous_paper: 'Reference', reference: 'Reference', assignment: 'Practical', external_link: 'Reference',
};

const ACCENTS = ['indigo', 'emerald', 'amber', 'sky', 'violet', 'rose'] as const;

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { subject: api, loading, error } = useSubjectDetail(subjectId);
  const [resources, setResources] = useState<ApiResource[]>([]);

  useEffect(() => {
    if (!subjectId) return;
    academicsApi.resources({ subject_offering_id: subjectId, page_size: 100 })
      .then((d) => setResources(d.items))
      .catch(() => {});
  }, [subjectId]);

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading subject…</div>;
  if (error || !api) return <div className="p-10 text-center text-sm text-rose-400">{error ?? 'Subject not found.'}</div>;

  const byUnit = new Map<string, SubjectResource[]>();
  for (const r of resources) {
    if (!r.unit_id) continue;
    const list = byUnit.get(r.unit_id) ?? [];
    list.push({ id: r.id, title: r.title, type: TYPE_MAP[r.resource_type] ?? 'Notes', description: r.summary ?? '' });
    byUnit.set(r.unit_id, list);
  }

  const units: SubjectUnit[] = api.units.map((u) => ({
    id: u.id, number: u.unit_number, title: u.title, description: u.description ?? '',
    progress: 0, status: 'locked' as const, estimatedTime: '', topics: u.learning_outcomes,
    resources: byUnit.get(u.id) ?? [],
  }));
  const subject: Subject = {
    id: api.id, code: api.code ?? '', name: api.title, semester: api.semester.number ?? 0,
    credits: api.credits ?? 0, category: api.subject_type, description: api.description ?? '',
    progress: 0, completedUnits: 0, totalUnits: units.length, nextUnit: units[0]?.title ?? '',
    accent: ACCENTS[units.length % ACCENTS.length], units,
  };
  return <SubjectDetail subject={subject} />;
}
