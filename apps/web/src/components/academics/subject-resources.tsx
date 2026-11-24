'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, FileText, Globe, Link2, LoaderCircle, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { academicsApi, ApiError, type ApiResource } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const TYPE_META: Record<string, { label: string; icon: typeof FileText }> = {
  notes: { label: 'Notes', icon: StickyNote },
  experiment: { label: 'Experiment', icon: FileText },
  viva: { label: 'Viva', icon: FileText },
  question_bank: { label: 'Question bank', icon: FileText },
  previous_paper: { label: 'Previous paper', icon: FileText },
  reference: { label: 'Reference', icon: FileText },
  assignment: { label: 'Assignment', icon: FileText },
  external_link: { label: 'External link', icon: Link2 },
};

export function SubjectResources({ subjectOfferingId }: { subjectOfferingId: string }) {
  const { user } = useAuth();
  const [resources, setResources] = useState<ApiResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const canPublish = !!user && (user.roles ?? []).some((r) => r === 'admin' || r === 'content_reviewer');

  const load = useCallback(() => {
    setLoading(true);
    academicsApi.resources({ subject_offering_id: subjectOfferingId, page_size: 50 })
      .then((data) => setResources(data.items))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [subjectOfferingId]);

  useEffect(load, [load]);

  const publish = async (id: string) => {
    if (publishing) return;
    setPublishing(id);
    try {
      await academicsApi.publishResource(id);
      toast.success('Resource published.');
      load();
    } catch (cause) {
      toast.error(cause instanceof ApiError ? cause.message : 'Could not publish resource.');
    } finally {
      setPublishing(null);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-5">
          <div>
            <h2 className="font-semibold text-foreground">Resources</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Notes, links and references for this subject.</p>
          </div>
          {loading ? <p className="py-4 text-center text-xs text-muted-foreground">Loading resources…</p> : resources.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No resources yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {resources.map((r) => {
                const meta = TYPE_META[r.resource_type] ?? TYPE_META.notes;
                const Icon = meta.icon;
                return (
                  <li key={r.id} className="flex items-center gap-2">
                    <Link href={`/academics/resources/${r.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-3 py-2.5 text-left transition hover:bg-muted/50 -mx-2 rounded-lg px-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-400"><Icon size={15} /></div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                          <p className="text-[11px] text-muted-foreground">{meta.label}{r.author_name ? ` · ${r.author_name}` : ''}{r.publication_date ? ` · ${r.publication_date}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {r.publication_status === 'published' ? <Badge tone="success">Published</Badge> : <Badge tone="muted">Draft</Badge>}
                        {r.external_url && <ExternalLink className="size-3.5 text-muted-foreground" />}
                      </div>
                    </Link>
                    {canPublish && r.publication_status !== 'published' && (
                      <Button size="sm" variant="secondary" className="h-7 shrink-0 text-xs" onClick={() => void publish(r.id)} disabled={publishing === r.id}>
                        {publishing === r.id ? <LoaderCircle className="animate-spin" /> : <Globe className="size-3" />}Publish
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

    </>
  );
}
