'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Check, CheckCircle2, ChevronDown, ChevronRight, Clock3, Code2, Database, Layers3, Lightbulb, ListChecks, Play, Sparkles, Target, Trophy, Unlock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { SkillQuestLesson, SkillQuestPath } from '@/features/skill-quest/data';
import { useSkillQuestProgress } from '@/features/skill-quest/use-progress';

const pathIcons = { code: Code2, database: Database, layers: Layers3 } as const;
const accent = {
  indigo: { soft: 'bg-indigo-500/10 text-indigo-400', bar: 'bg-indigo-500/100', border: 'border-indigo-500/30', text: 'text-indigo-300' },
  emerald: { soft: 'bg-emerald-500/10 text-emerald-400', bar: 'bg-emerald-500/100', border: 'border-emerald-500/30', text: 'text-emerald-300' },
  amber: { soft: 'bg-amber-500/10 text-amber-400', bar: 'bg-amber-500/100', border: 'border-amber-500/30', text: 'text-amber-300' },
} as const;

export function SkillQuestPathDetail({ path }: { path: SkillQuestPath }) {
  const router = useRouter();
  const [expandedModules, setExpandedModules] = useState<string[]>([path.modules[0]?.id].filter((id): id is string => Boolean(id)));
  const { isLessonComplete, markLessonComplete, toggleEnrollment, enrolledPathIds, getPathProgress } = useSkillQuestProgress();
  const styles = accent[path.accent];
  const Icon = pathIcons[path.icon];
  const progress = getPathProgress(path.id);
  const enrolled = enrolledPathIds.includes(path.id);
  const allLessons = useMemo(() => path.modules.flatMap((module) => module.lessons), [path]);
  const nextLesson = allLessons.find((lesson) => !isLessonComplete(lesson.id));

  const toggleModule = (moduleId: string) => setExpandedModules((current) => current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId]);

  return (
    <div className="space-y-7">
      <Link href="/quest" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-indigo-400"><ArrowLeft size={16}/> Back to Skill Quest</Link>

      <Card className={`overflow-hidden ${styles.border}`}>
        <div className="grid gap-6 bg-gradient-to-r from-white via-card to-slate-50 p-5 sm:p-7 lg:grid-cols-[1.5fr_0.75fr] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2"><Badge tone="info">{path.category}</Badge><Badge tone="muted">{path.level}</Badge>{enrolled && <Badge tone="success">Enrolled</Badge>}</div>
            <div className="flex items-start gap-3"><div className={`mt-1 grid size-12 shrink-0 place-items-center rounded-2xl ${styles.soft}`}><Icon size={24}/></div><div><h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">{path.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{path.summary}</p></div></div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock3 size={14}/>{path.duration}</span><span className="inline-flex items-center gap-1.5"><BookOpen size={14}/>{allLessons.length} lessons</span><span className="inline-flex items-center gap-1.5"><Zap size={14}/>{path.totalXp.toLocaleString()} XP available</span></div>
            <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => { if (!enrolled) { toggleEnrollment(path.id); return; } if (nextLesson) router.push(`/quest/lessons/${nextLesson.id}`); }}><Play size={15} fill="currentColor"/> {enrolled ? (nextLesson ? 'Continue learning' : 'Review path') : 'Start this path'}</Button><Button variant="outline" onClick={() => toggleEnrollment(path.id)}>{enrolled ? 'Remove from my paths' : 'Add to my paths'}</Button></div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">Your path progress</span><span className={`text-xl font-bold ${styles.text}`}>{progress.percentage}%</span></div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${styles.bar} transition-all`} style={{ width: `${progress.percentage}%` }}/></div>
            <div className="mt-4 grid grid-cols-2 gap-4"><div><p className="text-2xl font-bold text-foreground">{progress.completed}<span className="text-sm font-medium text-muted-foreground">/{progress.total}</span></p><p className="mt-0.5 text-xs text-muted-foreground">Lessons mastered</p></div><div><p className="text-2xl font-bold text-foreground">{path.modules.length}</p><p className="mt-0.5 text-xs text-muted-foreground">Learning modules</p></div></div>
            <div className="mt-4 rounded-xl bg-muted p-3"><p className="text-xs font-semibold text-foreground">{nextLesson ? `Next up: ${nextLesson.title}` : 'Path completed!'}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{nextLesson ? `${nextLesson.duration} min · ${nextLesson.xp} XP` : 'You have marked every lesson in this path as mastered.'}</p></div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.7fr)]">
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3"><div><h2 className="font-semibold text-foreground">Your learning roadmap</h2><p className="mt-1 text-sm text-muted-foreground">Move through the modules at a pace that works for you.</p></div><Badge tone="muted">{path.modules.length} modules</Badge></div>
          <div className="space-y-3">{path.modules.map((module, moduleIndex) => {
            const completed = module.lessons.filter((lesson) => isLessonComplete(lesson.id)).length;
            const percentage = Math.round((completed / module.lessons.length) * 100);
            const isExpanded = expandedModules.includes(module.id);
            const moduleStatus = percentage === 100 ? 'Completed' : completed > 0 ? 'In progress' : moduleIndex === 0 ? 'Ready to start' : 'Up next';
            return <Card key={module.id} className="overflow-hidden">
              <button onClick={() => toggleModule(module.id)} aria-expanded={isExpanded} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-muted/80 sm:p-5">
                <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${percentage === 100 ? 'bg-emerald-500/10 text-emerald-400' : moduleStatus === 'In progress' ? styles.soft : 'bg-muted text-muted-foreground'}`}>{percentage === 100 ? <Check size={19}/> : <span className="text-sm font-bold">{String(moduleIndex + 1).padStart(2, '0')}</span>}</div>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-foreground">{module.title}</h3><Badge tone={percentage === 100 ? 'success' : moduleStatus === 'In progress' ? 'info' : 'muted'}>{moduleStatus}</Badge></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{module.description}</p><div className="mt-3 flex items-center gap-3"><div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted sm:max-w-[220px]"><div className={`h-full rounded-full ${percentage === 100 ? 'bg-emerald-500/100' : styles.bar}`} style={{ width: `${percentage}%` }}/></div><span className="shrink-0 text-[11px] text-muted-foreground">{completed}/{module.lessons.length} mastered</span><span className="hidden text-[11px] text-muted-foreground sm:inline">· {module.estimatedMinutes} min</span></div></div>
                <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition ${isExpanded ? 'rotate-180' : ''}`}/>
              </button>
              {isExpanded && <div className="border-t border-border px-3 pb-3 pt-1 sm:px-5">{module.lessons.map((lesson, lessonIndex) => <LessonRow key={lesson.id} lesson={lesson} index={lessonIndex + 1} complete={isLessonComplete(lesson.id)} accentClass={styles.text}/>)}</div>}
            </Card>;
          })}</div>
        </section>

        <aside className="space-y-4">
          <Card><CardHeader><div><h2 className="font-semibold text-foreground">Skills you&apos;ll build</h2><p className="mt-1 text-xs text-muted-foreground">Capabilities connected to this path</p></div><Target size={18} className="text-indigo-500"/></CardHeader><CardContent><div className="mt-4 flex flex-wrap gap-2">{path.skills.map((skill) => <span key={skill} className="rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">{skill}</span>)}</div></CardContent></Card>
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10/80 via-card to-white"><CardHeader><div><Badge tone="warning"><Lightbulb size={12} className="mr-1"/> Learning guidance</Badge><h2 className="mt-3 font-semibold text-foreground">Prerequisites are recommendations</h2></div></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Some lessons suggest earlier topics that may make them easier. You can still open any lesson. Use the guidance to decide whether to review a foundation first.</p><div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-card/80 p-3"><Unlock size={16} className="mt-0.5 shrink-0 text-amber-400"/><p className="text-xs leading-5 text-muted-foreground">No rigid lesson locks. Your path is a guide, not a gate.</p></div></CardContent></Card>
          <Card><CardHeader><div><h2 className="font-semibold text-foreground">How mastery works</h2><p className="mt-1 text-xs text-muted-foreground">Progress should reflect understanding</p></div><Trophy size={18} className="text-amber-500"/></CardHeader><CardContent><div className="mt-4 space-y-3"><GuideRow icon={BookOpen} title="Learn" text="Understand the concept and examples."/><GuideRow icon={Code2} title="Practice" text="Apply it in a problem or exercise."/><GuideRow icon={CheckCircle2} title="Master" text="Mark it mastered after you can explain and apply it."/></div></CardContent></Card>
        </aside>
      </div>
    </div>
  );
}

function LessonRow({ lesson, index, complete, accentClass }: { lesson: SkillQuestLesson; index: number; complete: boolean; accentClass: string }) {
  const typeLabel = lesson.type === 'practice' ? 'Practice' : lesson.type === 'assessment' ? 'Checkpoint' : 'Lesson';
  const Icon = complete ? CheckCircle2 : lesson.type === 'practice' ? Code2 : lesson.type === 'assessment' ? ListChecks : BookOpen;
  return <div className="flex gap-3 border-b border-border py-4 last:border-b-0">
    <div className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${complete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}><Icon size={16}/></div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-foreground">{index}. {lesson.title}</p>{complete ? <Badge tone="success">Mastered</Badge> : lesson.status === 'in-progress' ? <Badge tone="info">In progress</Badge> : <Badge tone="muted">{typeLabel}</Badge>}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{lesson.summary}</p><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 size={12}/>{lesson.duration} min</span><span className="inline-flex items-center gap-1"><Zap size={12}/>{lesson.xp} XP</span></div>{lesson.recommendedPrerequisites.length > 0 && <div className="mt-2 rounded-lg bg-amber-500/10/80 px-2.5 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">Recommended first</p><p className="mt-0.5 text-[11px] leading-5 text-amber-800">{lesson.recommendedPrerequisites.join(' · ')}</p></div>}</div>
    <Link href={`/quest/lessons/${lesson.id}`} className={`mt-1 inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold transition hover:border-indigo-500/30 hover:bg-indigo-500/10 ${complete ? 'text-emerald-300' : accentClass}`} aria-label={`${complete ? 'Review' : 'Open'} ${lesson.title}`}>{complete ? 'Review' : lesson.type === 'practice' ? 'Practice' : 'Open'} <ChevronRight size={14}/></Link>
  </div>;
}

function GuideRow({ icon: Icon, title, text }: { icon: typeof BookOpen; title: string; text: string }) {
  return <div className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon size={15}/></div><div><p className="text-xs font-semibold text-foreground">{title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{text}</p></div></div>;
}
