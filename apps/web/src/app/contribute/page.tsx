'use client';

import { useEffect, useState } from 'react';
import { HeartHandshake, LoaderCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { academicsApi, ApiError, type ApiProgramStructure, type ApiUnit } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const TYPES = [
  ['notes', 'Notes'], ['experiment', 'Experiment'], ['viva', 'Viva'], ['question_bank', 'Question bank'],
  ['previous_paper', 'Previous paper'], ['reference', 'Reference'], ['assignment', 'Assignment'], ['external_link', 'External link'],
] as const;

type Offering = { id: string; title: string; semester: number; units: ApiUnit[] };

export default function ContributePage() {
  const { user } = useAuth();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState<ApiUnit[]>([]);
  const [form, setForm] = useState({ subject_offering_id: '', unit_id: '', resource_type: 'notes', title: '', summary: '', content_markdown: '', external_url: '' });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const programs = await academicsApi.programs();
        const structures = await Promise.all(programs.map((p) => academicsApi.structure(p.id).catch(() => null)));
        const list: Offering[] = [];
        for (const s of structures) {
          if (!s) continue;
          for (const cv of (s as ApiProgramStructure).curriculum_versions) {
            for (const sem of cv.semesters) {
              for (const sub of sem.subjects) {
                list.push({ id: sub.id, title: `${sem.semester_number ? `Sem ${sem.semester_number} · ` : ''}${sub.title}`, semester: sem.semester_number, units: [] });
              }
            }
          }
        }
        // Fetch units lazily per subject is heavy; units are optional — offer subject-level only.
        if (!cancelled) setOfferings(list);
      } catch { /* meta load failed */ }
      if (!cancelled) setLoadingMeta(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const selected = offerings.find((o) => o.id === form.subject_offering_id);

  useEffect(() => {
    setUnits([]);
    setForm((f) => ({ ...f, unit_id: '' }));
    if (!form.subject_offering_id) return;
    academicsApi.subject(form.subject_offering_id)
      .then((d) => setUnits(d.units))
      .catch(() => {});
  }, [form.subject_offering_id]);

  const submit = async () => {
    if (saving || !user) return;
    if (form.title.trim().length < 3 || !form.subject_offering_id) { toast.error('Pick a subject and enter a title (min 3 chars).'); return; }
    if (form.resource_type === 'external_link' && !form.external_url.trim()) { toast.error('External link resources need a URL.'); return; }
    setSaving(true);
    try {
      await academicsApi.createResource({
        subject_offering_id: form.subject_offering_id,
        unit_id: form.unit_id || null,
        resource_type: form.resource_type,
        title: form.title.trim(),
        summary: form.summary || null,
        content_markdown: form.resource_type === 'external_link' ? null : (form.content_markdown || null),
        external_url: form.resource_type === 'external_link' ? form.external_url.trim() : null,
      });
      toast.success('Resource saved as draft. Publish it from the subject page.');
      setForm({ subject_offering_id: '', unit_id: '', resource_type: 'notes', title: '', summary: '', content_markdown: '', external_url: '' });
    } catch (cause) {
      toast.error(cause instanceof ApiError ? cause.message : 'Could not save resource.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <div className="mb-2 flex items-center gap-2"><Badge tone="info">Community</Badge></div>
        <h1 className="text-2xl font-bold tracking-tight">Contribute</h1>
        <p className="mt-1 text-sm text-muted-foreground">Share notes, experiments, viva questions and references with other students. Contributions start as drafts — publish them when ready.</p>
      </div>

      {!user ? (
        <Card><CardContent className="p-8 text-center"><HeartHandshake className="mx-auto mb-3 size-8 text-indigo-400" /><p className="font-semibold">Sign in to contribute</p><p className="mt-1 text-sm text-muted-foreground">Use the Log in / Sign up buttons in the sidebar.</p></CardContent></Card>
      ) : (
        <Card><CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Add a resource</h2>
          {loadingMeta ? <p className="text-sm text-muted-foreground">Loading subjects…</p> : (
            <div className="space-y-3">
              <select value={form.subject_offering_id} onChange={set('subject_offering_id')} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm">
                <option value="">Select subject…</option>
                {offerings.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
              {units.length > 0 && (
                <select value={form.unit_id} onChange={set('unit_id')} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm">
                  <option value="">Whole subject (no specific unit)</option>
                  {units.map((u) => <option key={u.id} value={u.id}>Unit {u.unit_number}: {u.title}</option>)}
                </select>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={form.resource_type} onChange={set('resource_type')} className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
                  {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <Input placeholder="Title (min 3 chars)" value={form.title} onChange={set('title')} />
              </div>
              <Input placeholder="Short summary (optional)" value={form.summary} onChange={set('summary')} />
              {form.resource_type === 'external_link'
                ? <Input placeholder="https://…" value={form.external_url} onChange={set('external_url')} />
                : <Textarea placeholder="Content in markdown…" value={form.content_markdown} onChange={set('content_markdown')} className="min-h-40 font-mono text-xs" />}
              <Button onClick={() => void submit()} disabled={saving || !form.subject_offering_id || form.title.trim().length < 3}>
                {saving ? <LoaderCircle className="animate-spin" /> : <Send className="size-4" />}Save as draft
              </Button>
              <p className="text-xs text-muted-foreground">Saved as a draft — open the subject page to review and publish it.</p>
            </div>
          )}
        </CardContent></Card>
      )}
    </div>
  );
}
