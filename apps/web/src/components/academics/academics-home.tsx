'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, BookOpenCheck, CheckCircle2, ChevronRight, Clock3, GraduationCap, Search, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAcademicsSubjects } from '@/lib/api-data';

const accentStyles = {
  indigo: { icon: 'bg-indigo-500/10 text-indigo-400', bar: 'bg-indigo-500/100' },
  emerald: { icon: 'bg-emerald-500/10 text-emerald-400', bar: 'bg-emerald-500/100' },
  amber: { icon: 'bg-amber-500/10 text-amber-400', bar: 'bg-amber-500/100' },
  sky: { icon: 'bg-sky-500/10 text-sky-400', bar: 'bg-sky-500/100' },
  violet: { icon: 'bg-violet-500/10 text-violet-400', bar: 'bg-violet-500/100' },
  rose: { icon: 'bg-rose-500/10 text-rose-400', bar: 'bg-rose-500/100' },
} as const;

export function AcademicsHome() {
  const [query, setQuery] = useState('');
  const [semester, setSemester] = useState('all');
  const [status, setStatus] = useState('all');
  const { subjects, loading, error } = useAcademicsSubjects();

  const filteredSubjects = useMemo(() => subjects.filter((subject) => {
    const matchesQuery = `${subject.name} ${subject.code} ${subject.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesSemester = semester === 'all' || subject.semester === Number(semester);
    const matchesStatus = status === 'all' || (status === 'in-progress' ? subject.progress > 0 && subject.progress < 100 : status === 'not-started' ? subject.progress === 0 : subject.progress === 100);
    return matchesQuery && matchesSemester && matchesStatus;
  }), [query, semester, status, subjects]);

  const inProgress = subjects.filter((subject) => subject.progress > 0 && subject.progress < 100);
  const completedUnits = subjects.reduce((total, subject) => total + subject.completedUnits, 0);
  const suggested = inProgress[0] ?? subjects[0];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-400"><GraduationCap size={16} /> Academic workspace</div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">Your subjects</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Keep your university learning organized. Explore subject units, revise concepts, and prepare for practicals and viva.</p>
        </div>
        <Badge tone="info" className="w-fit">Generic B.Tech CSE sample curriculum</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Subjects in workspace</span><div className="grid size-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400"><BookOpen size={18}/></div></div><p className="mt-3 text-2xl font-bold">{subjects.length}</p><p className="mt-1 text-xs text-muted-foreground">Across semesters 3–5</p></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">In progress</span><div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400"><Clock3 size={18}/></div></div><p className="mt-3 text-2xl font-bold">{inProgress.length}</p><p className="mt-1 text-xs text-muted-foreground">Subjects with active learning</p></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Units completed</span><div className="grid size-9 place-items-center rounded-xl bg-violet-500/10 text-violet-400"><BookOpenCheck size={18}/></div></div><p className="mt-3 text-2xl font-bold">{completedUnits}</p><p className="mt-1 text-xs text-muted-foreground">Across your subject list</p></Card>
      </div>

      {!loading && !error && suggested && <Card className="overflow-hidden border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-card to-sky-500/10">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="max-w-xl"><Badge tone="info">Suggested next step</Badge><h2 className="mt-3 text-lg font-semibold text-foreground">Continue {suggested.name}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{suggested.description || 'Review the syllabus units and practice the concepts covered so far.'}</p><div className="mt-4 flex flex-wrap items-center gap-3"><Link href={`/academics/subjects/${suggested.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Continue subject <ArrowRight size={15}/></Link><span className="text-xs text-muted-foreground">{suggested.progress}% complete · {suggested.completedUnits}/{suggested.totalUnits} units</span></div></div>
          <div className="hidden size-28 shrink-0 items-center justify-center rounded-3xl bg-card/80 text-indigo-400 shadow-sm sm:flex"><BookOpenCheck size={48} strokeWidth={1.4}/></div>
        </div>
      </Card>}
      {loading && <Card className="p-10 text-center text-sm text-muted-foreground">Loading subjects…</Card>}
      {!loading && error && <Card className="p-10 text-center text-sm text-rose-400">{error}</Card>}

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="font-semibold text-foreground">All subjects</h2><p className="mt-1 text-sm text-muted-foreground">Browse your curriculum and continue where you left off.</p></div><span className="text-xs text-muted-foreground">{filteredSubjects.length} subjects shown</span></div>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row">
          <label className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subjects or course codes" className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/30" /></label>
          <div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground"><SlidersHorizontal size={14}/><span>Semester</span><select value={semester} onChange={(event) => setSemester(event.target.value)} className="bg-transparent py-2 text-sm font-medium text-foreground outline-none"><option value="all">All</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label><select aria-label="Filter by progress" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground outline-none focus:border-indigo-400"><option value="all">All progress</option><option value="in-progress">In progress</option><option value="not-started">Not started</option><option value="completed">Completed</option></select></div>
        </div>
        {filteredSubjects.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredSubjects.map((subject) => {
          const styles = accentStyles[subject.accent];
          return <Card key={subject.id} className="group flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-md">
            <div className="flex items-start justify-between gap-3"><div className={`grid size-11 place-items-center rounded-xl ${styles.icon}`}><BookOpen size={20}/></div><Badge tone={subject.progress === 100 ? 'success' : subject.progress === 0 ? 'muted' : 'info'}>{subject.progress === 100 ? 'Completed' : subject.progress === 0 ? 'Not started' : 'In progress'}</Badge></div>
            <div className="mt-4 flex-1"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{subject.code} · Semester {subject.semester}</p><h3 className="mt-1 text-base font-semibold leading-6 text-foreground">{subject.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{subject.description}</p></div>
            <div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">Subject progress</span><span className="font-semibold text-foreground">{subject.progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${subject.progress}%` }}/></div><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{subject.completedUnits}/{subject.totalUnits} units completed</span><span>{subject.credits} credits</span></div></div>
            <Link href={`/academics/subjects/${subject.id}`} className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold text-indigo-400 transition group-hover:text-indigo-300"><span>{subject.progress ? 'Continue learning' : 'Explore subject'}</span><ChevronRight size={17}/></Link>
          </Card>;
        })}</div> : <Card className="p-10 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><Search size={21}/></div><h3 className="mt-3 font-semibold">No subjects found</h3><p className="mt-1 text-sm text-muted-foreground">Try a different search or clear your filters.</p><Button variant="outline" className="mt-4" onClick={() => { setQuery(''); setSemester('all'); setStatus('all'); }}>Clear filters</Button></Card>}
      </section>

      <Card className="border-dashed bg-muted/70"><CardContent className="flex items-start gap-3 pt-5"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400"/><div><p className="text-sm font-semibold text-foreground">Curriculum note</p><p className="mt-1 text-xs leading-5 text-muted-foreground">This is a generic B.Tech CSE sample curriculum for the product prototype. Subject codes, semester placement, credits, and syllabus units should be reviewed against your university before being treated as official.</p></div></CardContent></Card>
    </div>
  );
}
