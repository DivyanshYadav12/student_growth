'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, LoaderCircle } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { academicsApi, type ApiResource } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  notes: 'Notes', experiment: 'Experiment', viva: 'Viva', question_bank: 'Question bank',
  previous_paper: 'Previous paper', reference: 'Reference', assignment: 'Assignment', external_link: 'External link',
};

export default function ResourcePage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const [resource, setResource] = useState<(ApiResource & { content_markdown: string | null; source_url: string | null }) | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    academicsApi.resource(resourceId)
      .then((data) => { if (!cancelled) { setResource(data); setState('ready'); } })
      .catch(() => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, [resourceId]);

  const backHref = resource ? `/academics/subjects/${resource.subject_offering_id}` : '/academics';
  const backLabel = resource ? 'Back to subject' : 'Back to Academics';

  if (state === 'loading') return <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Loading resource…</div>;
  if (state === 'error' || !resource) return <div className="mx-auto max-w-2xl py-16 text-center"><h1 className="text-xl font-bold">Resource unavailable</h1><p className="mt-2 text-sm text-muted-foreground">It may have been removed or is not published.</p><Button asChild variant="outline" className="mt-4"><Link href="/academics">Back to Academics</Link></Button></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={backHref} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />{backLabel}</Link>
      <Card>
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{TYPE_LABELS[resource.resource_type] ?? resource.resource_type}</Badge>
            <Badge tone={resource.publication_status === 'published' ? 'success' : 'muted'}>{resource.publication_status === 'published' ? 'Published' : 'Draft'}</Badge>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{resource.title}</h1>
            {resource.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{resource.summary}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{[resource.author_name, resource.publication_date, resource.source_title].filter(Boolean).join(' · ')}</p>
          </div>
          {resource.external_url ? (
            <div className="rounded-xl border border-border bg-muted/40 p-6 text-center">
              <p className="mb-3 text-sm text-muted-foreground">This resource links to an external page.</p>
              <Button asChild><a href={resource.external_url} target="_blank" rel="noreferrer">Open link <ExternalLink className="size-4" /></a></Button>
            </div>
          ) : resource.content_markdown ? (
            <Markdown content={resource.content_markdown} className="border-t border-border pt-6" />
          ) : (
            <p className="border-t border-border pt-6 text-sm text-muted-foreground">No content available for this resource.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
