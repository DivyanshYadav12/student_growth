'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, CircleHelp, Clock3, Code2, Copy, Lightbulb, ListChecks, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { SkillQuestLesson } from '@/features/skill-quest/data';
import { useSkillQuestProgress } from '@/features/skill-quest/use-progress';

type LessonContext = {
  lesson: SkillQuestLesson;
  path: { id: string; title: string; modules: { title: string; lessons: SkillQuestLesson[] }[] };
  module: { id: string; title: string };
};

const checks: Record<string, { question: string; options: string[]; answer: number; explanation: string }> = {
  'arrays-sliding-window': { question: 'In a fixed-size sliding window, how do you move the window forward by one position?', options: ['Recalculate the whole window from scratch', 'Add the incoming value and remove the outgoing value', 'Sort the array after every move', 'Reset the sum to zero'], answer: 1, explanation: 'The window changes by only two elements: include the new rightmost value and remove the value that left. This keeps each update constant time.' },
  'dsa-big-o': { question: 'A loop starts at 1 and doubles its counter until it reaches n. What is its time complexity?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 1, explanation: 'The counter doubles on each iteration, so the number of iterations grows logarithmically with n.' },
  'hash-set-basics': { question: 'Which data structure is a natural fit for tracking whether a value has appeared before?', options: ['unordered_set', 'stack', 'queue', 'priority_queue'], answer: 0, explanation: 'An unordered_set stores unique keys and supports average constant-time membership checks.' },
  'binary-search': { question: 'What condition makes ordinary binary search appropriate?', options: ['The array contains only positive values', 'The array is sorted or the decision condition is monotonic', 'The array has an even number of elements', 'Every element is unique'], answer: 1, explanation: 'Binary search repeatedly discards half the search space. This is valid when ordering or a monotonic condition guarantees which half can contain the answer.' },
  'sql-joins': { question: 'Which join retains every row from the left table, even when there is no matching row on the right?', options: ['INNER JOIN', 'CROSS JOIN', 'LEFT JOIN', 'SELF JOIN'], answer: 2, explanation: 'A LEFT JOIN preserves every row from the left input and fills right-side columns with NULL when no match exists.' },
};

export function SkillQuestLessonDetail({ context }: { context: LessonContext }) {
  const { lesson, path, module } = context;
  const { isLessonComplete, markLessonComplete } = useSkillQuestProgress();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const complete = isLessonComplete(lesson.id);
  const questions = useMemo(() => checks[lesson.id] ?? {
    question: 'Which approach best supports reliable problem solving?',
    options: ['Start coding immediately without examples', 'Check the input, output, constraints, and edge cases first', 'Optimize before confirming correctness', 'Ignore the constraints for the first attempt'],
    answer: 1,
    explanation: 'Understanding the contract and testing edge cases gives you a reliable baseline before implementation and optimization.',
  }, [lesson.id]);
  const allLessons = path.modules.flatMap((item) => item.lessons);
  const currentIndex = allLessons.findIndex((item) => item.id === lesson.id);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : undefined;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : undefined;
  const typeLabel = lesson.type === 'practice' ? 'Guided practice' : lesson.type === 'assessment' ? 'Checkpoint' : 'Concept lesson';

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(lesson.exampleCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Link href="/quest" className="hover:text-indigo-400">Skill Quest</Link><ChevronRight size={13}/><Link href={`/quest/paths/${path.id}`} className="hover:text-indigo-400">{path.title}</Link><ChevronRight size={13}/><span className="font-medium text-muted-foreground">{module.title}</span></div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><div className="mb-2 flex flex-wrap items-center gap-2"><Badge tone="info">{typeLabel}</Badge>{complete && <Badge tone="success"><CheckCircle2 size={12} className="mr-1"/> Mastered</Badge>}</div><h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[30px]">{lesson.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{lesson.summary}</p><div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock3 size={14}/>{lesson.duration} minutes</span><span className="inline-flex items-center gap-1.5"><Zap size={14}/>{lesson.xp} XP</span><span className="inline-flex items-center gap-1.5"><BookOpen size={14}/>{module.title}</span></div></div>
        <Link href={`/quest/paths/${path.id}`} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted"><ArrowLeft size={15}/> Back to path</Link>
      </div>

      {lesson.recommendedPrerequisites.length > 0 && <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10/70 p-4"><Lightbulb size={18} className="mt-0.5 shrink-0 text-amber-400"/><div><p className="text-sm font-semibold text-amber-900">Recommended background</p><p className="mt-1 text-xs leading-5 text-amber-800">This lesson builds on: {lesson.recommendedPrerequisites.join(', ')}. These are suggestions, not access restrictions. You can continue or revisit them at any time.</p></div></div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(250px,0.7fr)]">
        <div className="space-y-5">
          <Card><CardHeader><div><div className="mb-1 flex items-center gap-2 text-indigo-400"><BookOpen size={16}/><span className="text-xs font-semibold uppercase tracking-wide">Learning objectives</span></div><h2 className="font-semibold text-foreground">By the end of this lesson, you should be able to</h2></div></CardHeader><CardContent><ul className="mt-4 space-y-3">{lesson.objectives.map((objective) => <li key={objective} className="flex gap-2.5 text-sm leading-6 text-muted-foreground"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500"/>{objective}</li>)}</ul></CardContent></Card>

          <Card><CardHeader><div><div className="mb-1 flex items-center gap-2 text-indigo-400"><Sparkles size={16}/><span className="text-xs font-semibold uppercase tracking-wide">Core concepts</span></div><h2 className="font-semibold text-foreground">What to remember</h2></div></CardHeader><CardContent><ul className="mt-4 space-y-3">{lesson.keyTakeaways.map((takeaway, index) => <li key={takeaway} className="flex gap-3 rounded-xl bg-muted p-3"><span className="grid size-6 shrink-0 place-items-center rounded-lg bg-card text-xs font-bold text-indigo-400 shadow-sm">{index + 1}</span><p className="text-sm leading-6 text-muted-foreground">{takeaway}</p></li>)}</ul></CardContent></Card>

          <Card className="overflow-hidden"><CardHeader><div><div className="mb-1 flex items-center gap-2 text-indigo-400"><Code2 size={16}/><span className="text-xs font-semibold uppercase tracking-wide">Worked example</span></div><h2 className="font-semibold text-foreground">{lesson.exampleTitle}</h2></div><button onClick={copyExample} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"><Copy size={13}/>{copied ? 'Copied' : 'Copy code'}</button></CardHeader><CardContent><pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-[12px] leading-6 text-slate-100"><code>{lesson.exampleCode}</code></pre><p className="mt-3 text-xs leading-5 text-muted-foreground">Study the structure first, then try to reproduce the idea without looking at the example.</p></CardContent></Card>

          <Card><CardHeader><div><div className="mb-1 flex items-center gap-2 text-emerald-400"><Target size={16}/><span className="text-xs font-semibold uppercase tracking-wide">Apply your learning</span></div><h2 className="font-semibold text-foreground">Practice task</h2></div><Badge tone="success">{lesson.xp} XP</Badge></CardHeader><CardContent><p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10/60 p-4 text-sm leading-6 text-foreground">{lesson.practicePrompt}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Try the exercise in your own editor. Code execution will connect to the platform&apos;s isolated Coding Arena in a later integration.</p><Button variant={complete ? 'secondary' : 'outline'} onClick={() => markLessonComplete(lesson.id)}><CheckCircle2 size={15}/>{complete ? 'Mastered' : 'Mark as mastered'}</Button></div></CardContent></Card>

          <Card><CardHeader><div><div className="mb-1 flex items-center gap-2 text-violet-400"><CircleHelp size={16}/><span className="text-xs font-semibold uppercase tracking-wide">Knowledge check</span></div><h2 className="font-semibold text-foreground">Test your understanding</h2></div><Badge tone="muted">1 question</Badge></CardHeader><CardContent><p className="mt-4 text-sm font-medium leading-6 text-foreground">{questions.question}</p><div className="mt-3 space-y-2">{questions.options.map((option, index) => <button key={option} onClick={() => { setSelectedAnswer(index); setChecked(false); }} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${selectedAnswer === index ? 'border-indigo-300 bg-indigo-500/10 text-indigo-800' : 'border-border text-muted-foreground hover:bg-muted'}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${selectedAnswer === index ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-300 text-muted-foreground'}`}>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div><div className="mt-4 flex flex-wrap items-center gap-3"><Button disabled={selectedAnswer === null} onClick={() => setChecked(true)}>Check answer</Button>{checked && <span className={`text-xs font-semibold ${selectedAnswer === questions.answer ? 'text-emerald-400' : 'text-rose-400'}`}>{selectedAnswer === questions.answer ? 'Correct — nicely done!' : 'Not quite. Review the explanation below.'}</span>}</div>{checked && <div className="mt-3 rounded-xl bg-muted p-3"><p className="text-xs font-semibold text-foreground">Explanation</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{questions.explanation}</p></div>}</CardContent></Card>
        </div>

        <aside className="space-y-4">
          <Card><CardHeader><div><h2 className="font-semibold text-foreground">Lesson checklist</h2><p className="mt-1 text-xs text-muted-foreground">A simple way to know when you are ready</p></div><ListChecks size={18} className="text-indigo-500"/></CardHeader><CardContent><div className="mt-4 space-y-3"><ChecklistItem title="Understand the concept" text="Read the key takeaways and example."/><ChecklistItem title="Try the practice task" text="Solve it without copying the example."/><ChecklistItem title="Explain your approach" text="Describe why your solution works."/></div><div className="mt-4 border-t border-border pt-4"><Button className="w-full" variant={complete ? 'secondary' : 'primary'} onClick={() => markLessonComplete(lesson.id)}>{complete ? <><CheckCircle2 size={15}/> Mastered</> : <><Trophy size={15}/> Mark lesson mastered</>}</Button><p className="mt-2 text-center text-[11px] leading-5 text-muted-foreground">This prototype saves completion in this browser only.</p></div></CardContent></Card>
          <Card><CardHeader><div><h2 className="font-semibold text-foreground">In this lesson</h2><p className="mt-1 text-xs text-muted-foreground">Topics and skills</p></div></CardHeader><CardContent><div className="mt-3 flex flex-wrap gap-2">{lesson.tags.map((tag) => <span key={tag} className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">{tag}</span>)}</div></CardContent></Card>
          <Card><CardHeader><div><h2 className="font-semibold text-foreground">Move through the path</h2><p className="mt-1 text-xs text-muted-foreground">Stay connected to the next topic</p></div></CardHeader><CardContent><div className="mt-3 space-y-2">{previousLesson ? <Link href={`/quest/lessons/${previousLesson.id}`} className="flex items-center gap-2 rounded-xl border border-border p-3 text-xs font-medium text-muted-foreground hover:bg-muted"><ArrowLeft size={14}/> Previous: {previousLesson.title}</Link> : <p className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">This is the first lesson in the path.</p>}{nextLesson ? <Link href={`/quest/lessons/${nextLesson.id}`} className="flex items-center justify-between gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10/60 p-3 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/10"><span>Next: {nextLesson.title}</span><ArrowRight size={14}/></Link> : <p className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">You have reached the end of this path.</p>}</div></CardContent></Card>
        </aside>
      </div>
    </div>
  );
}

function ChecklistItem({ title, text }: { title: string; text: string }) {
  return <div className="flex gap-2.5"><div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-400"><CheckCircle2 size={14}/></div><div><p className="text-xs font-semibold text-foreground">{title}</p><p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{text}</p></div></div>;
}
