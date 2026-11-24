'use client';

import Link from 'next/link';
import { useMemo, useState, type ChangeEvent } from 'react';
import { ArrowRight, BookOpenCheck, BriefcaseBusiness, ChevronRight, Clock3, Code2, Compass, Database, Flame, Layers3, Search, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useSkillQuestPaths } from '@/lib/api-data';
import { useSkillQuestProgress } from '@/features/skill-quest/use-progress';

const pathStyles = {
  indigo: { icon: 'bg-indigo-500/10 text-indigo-400', bar: 'bg-indigo-500/100', wash: 'from-indigo-500/10 via-card to-violet-500/10', label: 'text-indigo-300' },
  emerald: { icon: 'bg-emerald-500/10 text-emerald-400', bar: 'bg-emerald-500/100', wash: 'from-emerald-500/10 via-card to-teal-50', label: 'text-emerald-300' },
  amber: { icon: 'bg-amber-500/10 text-amber-400', bar: 'bg-amber-500/100', wash: 'from-amber-500/10 via-card to-orange-50', label: 'text-amber-300' },
} as const;

const pathIcons = { code: Code2, database: Database, layers: Layers3 } as const;
type PathFilter = 'all' | 'enrolled' | 'available';

export function SkillQuestHome() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PathFilter>('all');
  const { enrolledPathIds, getPathProgress, completedLessonIds } = useSkillQuestProgress();
  const { paths: skillQuestPaths, loading, error } = useSkillQuestPaths();

  const filteredPaths = useMemo(() => skillQuestPaths.filter((path) => {
    const matchesQuery = `${path.title} ${path.category} ${path.summary} ${path.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    const enrolled = enrolledPathIds.includes(path.id);
    const matchesFilter = filter === 'all' || (filter === 'enrolled' ? enrolled : !enrolled);
    return matchesQuery && matchesFilter;
  }), [enrolledPathIds, filter, query, skillQuestPaths]);

  const activePaths = skillQuestPaths.filter((path) => enrolledPathIds.includes(path.id));
  const totalLessons = skillQuestPaths.reduce((total, path) => total + path.modules.reduce((sum, module) => sum + module.lessons.length, 0), 0);
  const nextPath = activePaths.find((path) => getPathProgress(path.id).percentage < 100) ?? activePaths[0] ?? skillQuestPaths[0];
  const nextProgress = nextPath ? getPathProgress(nextPath.id) : { completed: 0, total: 0, percentage: 0 };
  const nextLesson = nextPath ? nextPath.modules.flatMap((module) => module.lessons).find((lesson) => !completedLessonIds.includes(lesson.id)) : undefined;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-400"><Compass size={16}/> Skill Quest workspace</div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">Build skills that move you forward</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Follow structured learning paths, practice with purpose, and track what you can confidently do.</p>
        </div>
        <Badge tone="info" className="w-fit"><Sparkles size={12} className="mr-1"/> Flexible, self-paced learning</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Compass} title="Active learning paths" value={String(activePaths.length)} note="Paths you have started" tone="indigo"/>
        <Metric icon={BookOpenCheck} title="Lessons mastered" value={String(completedLessonIds.length)} note={`Across ${totalLessons} sample lessons`} tone="emerald"/>
        <Metric icon={Flame} title="Current learning streak" value="7 days" note="Keep a steady rhythm" tone="amber"/>
        <Metric icon={Trophy} title="Quest XP" value="1,240 XP" note="Earn XP through practice" tone="violet"/>
      </div>

      {loading ? <Card className="p-10 text-center text-sm text-muted-foreground">Loading learning paths…</Card> : error ? <Card className="p-10 text-center text-sm text-rose-400">{error}</Card> : null}
      {!loading && !error && nextPath && <Card className="overflow-hidden border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-card to-violet-500/10">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.5fr_0.7fr] lg:items-center">
          <div>
            <Badge tone="info"><Sparkles size={12} className="mr-1"/> Pick up where you left off</Badge>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{nextPath.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{nextLesson ? `Your next suggested activity is “${nextLesson.title}”. ${nextLesson.summary}` : 'You have completed the lessons in this path. Explore a new skill area or revisit a topic.'}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={`/quest/paths/${nextPath.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Continue path <ArrowRight size={15}/></Link>
              <span className="text-xs text-muted-foreground">{nextProgress.completed} of {nextProgress.total} lessons mastered · {nextProgress.percentage}%</span>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-500/30 bg-card/85 p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">Path progress</span><span className="text-sm font-bold text-indigo-300">{nextProgress.percentage}%</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-indigo-500/100 transition-all" style={{ width: `${nextProgress.percentage}%` }}/></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div><p className="text-lg font-bold text-foreground">{nextPath.modules.length}</p><p className="text-[11px] text-muted-foreground">Learning modules</p></div>
              <div><p className="text-lg font-bold text-foreground">{nextPath.duration}</p><p className="text-[11px] text-muted-foreground">Suggested pace</p></div>
            </div>
          </div>
        </div>
      </Card>}

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h2 className="font-semibold text-foreground">Explore learning paths</h2><p className="mt-1 text-sm text-muted-foreground">Choose a guided route or browse skills you want to develop.</p></div>
          <span className="text-xs text-muted-foreground">{filteredPaths.length} paths shown</span>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Search paths, topics, or skills" className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/30"/></label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter learning paths">
            {([{ id: 'all', label: 'All paths' }, { id: 'enrolled', label: 'My paths' }, { id: 'available', label: 'Explore' }] as const).map((option) => <button key={option.id} onClick={() => setFilter(option.id)} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${filter === option.id ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`} aria-pressed={filter === option.id}>{option.label}</button>)}
          </div>
        </div>

        {filteredPaths.length ? <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{filteredPaths.map((path) => {
          const styles = pathStyles[path.accent];
          const Icon = pathIcons[path.icon];
          const progress = getPathProgress(path.id);
          const enrolled = enrolledPathIds.includes(path.id);
          const lessons = path.modules.reduce((total, module) => total + module.lessons.length, 0);
          return <Card key={path.id} className="group flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-md">
            <div className={`h-1.5 bg-gradient-to-r ${styles.bar} to-transparent`}/>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-3"><div className={`grid size-11 place-items-center rounded-xl ${styles.icon}`}><Icon size={21}/></div><Badge tone={enrolled ? 'success' : 'muted'}>{enrolled ? 'Enrolled' : path.level}</Badge></div>
              <div className="mt-4 flex-1"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{path.category} · {path.level}</p><h3 className="mt-1 text-base font-semibold text-foreground">{path.title}</h3><p className="mt-2 min-h-[60px] text-sm leading-5 text-muted-foreground">{path.summary}</p></div>
              <div className="mt-4 flex flex-wrap gap-1.5">{path.skills.slice(0, 4).map((skill) => <span key={skill} className="rounded-lg bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{skill}</span>)}</div>
              <div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">{enrolled ? 'Your progress' : 'Path contents'}</span><span className="font-semibold text-foreground">{enrolled ? `${progress.percentage}%` : `${lessons} lessons`}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${styles.bar} transition-all`} style={{ width: `${enrolled ? progress.percentage : 0}%` }}/></div></div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 size={13}/>{path.duration}</span><span className="inline-flex items-center gap-1"><Zap size={13}/>{path.totalXp.toLocaleString()} XP</span><Link href={`/quest/paths/${path.id}`} className="inline-flex items-center gap-1 font-semibold text-indigo-400 transition group-hover:text-indigo-300">{enrolled ? 'Continue' : 'View path'} <ChevronRight size={15}/></Link></div>
            </div>
          </Card>;
        })}</div> : <Card className="p-10 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><Search size={21}/></div><h3 className="mt-3 font-semibold">No learning paths found</h3><p className="mt-1 text-sm text-muted-foreground">Try another keyword or switch the path filter.</p><Button variant="outline" className="mt-4" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</Button></Card>}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-dashed bg-muted/70"><CardContent className="flex items-start gap-3 pt-5"><Target size={19} className="mt-0.5 shrink-0 text-indigo-400"/><div><p className="text-sm font-semibold text-foreground">Mastery is more than opening a lesson</p><p className="mt-1 text-xs leading-5 text-muted-foreground">A topic becomes mastered when you understand the idea and can apply it in a practice task or checkpoint. Revisit topics whenever you need a refresher.</p></div></CardContent></Card>
        <Card className="border-dashed bg-muted/70"><CardContent className="flex items-start gap-3 pt-5"><BriefcaseBusiness size={19} className="mt-0.5 shrink-0 text-emerald-400"/><div><p className="text-sm font-semibold text-foreground">Connect learning to your goals</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Paths are designed to build practical skills that can later connect to projects, assessments, and career preparation.</p></div></CardContent></Card>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, title, value, note, tone }: { icon: typeof Compass; title: string; value: string; note: string; tone: 'indigo' | 'emerald' | 'amber' | 'violet' }) {
  const tones = { indigo: 'bg-indigo-500/10 text-indigo-400', emerald: 'bg-emerald-500/10 text-emerald-400', amber: 'bg-amber-500/10 text-amber-400', violet: 'bg-violet-500/10 text-violet-400' };
  return <Card className="p-5"><div className="flex items-start justify-between"><div className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19}/></div></div><p className="mt-4 text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></Card>;
}
