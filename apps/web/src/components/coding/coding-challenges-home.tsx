'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Code2, Filter, Search, Sparkles, Target, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CodingChallengeCard } from '@/features/coding/api-data';
import { useCodingProgress } from '@/features/coding/use-coding-progress';

const difficultyTone: Record<CodingChallengeCard['difficulty'], 'success' | 'warning' | 'destructive'> = {
  Easy: 'success', Medium: 'warning', Hard: 'destructive',
};

export function CodingChallengesHome({ problems, loading = false, error = '' }: { problems: CodingChallengeCard[]; loading?: boolean; error?: string }) {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [topic, setTopic] = useState('all');
  const { solvedProblemIds, xpEarned } = useCodingProgress();
  const topics = useMemo(() => ['all', ...Array.from(new Set(problems.map((problem) => problem.topic)))], [problems]);
  const filtered = problems.filter((problem) => {
    const text = `${problem.title} ${problem.summary} ${problem.tags.join(' ')} ${problem.topic}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (difficulty === 'all' || problem.difficulty === difficulty) && (topic === 'all' || problem.topic === topic);
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2"><Badge variant="info">Skill Quest practice</Badge><Badge variant="outline">C++17</Badge></div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Coding Arena</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Turn concepts into working solutions. Practice with visible examples, test your own input, and submit against hidden cases.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm"><Target className="size-4 text-primary"/><span className="font-semibold">{solvedProblemIds.length}/{problems.length}</span><span className="text-muted-foreground">solved</span></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Code2 size={19}/></div><div><p className="text-xs text-muted-foreground">Available challenges</p><p className="text-xl font-bold">{problems.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="grid size-10 place-items-center rounded-xl bg-emerald-500/100/10 text-emerald-400"><CheckCircle2 size={19}/></div><div><p className="text-xs text-muted-foreground">Challenges solved</p><p className="text-xl font-bold">{solvedProblemIds.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="grid size-10 place-items-center rounded-xl bg-amber-500/100/10 text-amber-400"><Sparkles size={19}/></div><div><p className="text-xs text-muted-foreground">Coding XP earned</p><p className="text-xl font-bold">{xpEarned.toLocaleString()}</p></div></CardContent></Card>
      </div>

      <Card className="border-primary/15 bg-gradient-to-r from-primary/[0.07] via-card to-card">
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Terminal size={21}/></div><div><p className="font-semibold">Continue from your C++ & DSA path</p><p className="mt-1 text-sm text-muted-foreground">Recommended next: Two Sum patterns · Arrays & Hashing</p><div className="mt-3 flex items-center gap-2"><Progress value={problems.length ? solvedProblemIds.length / problems.length * 100 : 0} className="h-1.5 w-36"/><span className="text-xs text-muted-foreground">{problems.length ? Math.round(solvedProblemIds.length / problems.length * 100) : 0}% arena progress</span></div></div></div>
          <Button asChild><Link href={problems[0] ? `/quest/coding/${problems[0].id}` : '/quest/coding'}>Start a challenge <ArrowRight/></Link></Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><h2 className="text-lg font-semibold">Challenge library</h2><p className="text-sm text-muted-foreground">A focused starter set linked to your learning lessons.</p></div>
        <div className="relative w-full md:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search challenges..." className="pl-9"/></div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={difficulty} onValueChange={setDifficulty}><TabsList><TabsTrigger value="all">All levels</TabsTrigger><TabsTrigger value="Easy">Easy</TabsTrigger><TabsTrigger value="Medium">Medium</TabsTrigger><TabsTrigger value="Hard">Hard</TabsTrigger></TabsList></Tabs>
        <div className="flex flex-wrap items-center gap-1.5"><Filter size={14} className="ml-1 text-muted-foreground"/>{topics.map((item) => <Button key={item} size="sm" variant={topic === item ? 'secondary' : 'ghost'} onClick={() => setTopic(item)} className="h-8">{item === 'all' ? 'All topics' : item}</Button>)}</div>
      </div>

      {loading ? <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Loading challenges…</CardContent></Card> : null}
      {!loading && error ? <Card><CardContent className="p-10 text-center text-sm text-rose-400">{error}</CardContent></Card> : null}
      {!loading && !error && filtered.length ? <div className="grid gap-3 lg:grid-cols-2">{filtered.map((problem, index) => {
        const solved = solvedProblemIds.includes(problem.id);
        return <Card key={problem.id} className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-primary"><Code2 size={19}/></div><div className="min-w-0"><CardTitle className="text-base">{index + 1}. {problem.title}</CardTitle><CardDescription className="mt-1 line-clamp-2">{problem.summary}</CardDescription></div></div>{solved && <Badge variant="success"><CheckCircle2 className="mr-1 size-3"/>Solved</Badge>}</div></CardHeader>
          <CardContent className="space-y-4"><div className="flex flex-wrap items-center gap-2"><Badge variant={difficultyTone[problem.difficulty]}>{problem.difficulty}</Badge><Badge variant="outline">{problem.topic}</Badge>{problem.tags.filter((tag) => tag !== problem.topic).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div><div className="flex items-center justify-between border-t pt-3"><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Sparkles size={13} className="text-amber-500"/>{problem.xp} XP</span><span>{problem.exampleCount} public examples</span></div><Button asChild size="sm" variant={solved ? 'outline' : 'default'}><Link href={`/quest/coding/${problem.id}`}>{solved ? 'Practice again' : 'Solve challenge'} <ArrowRight/></Link></Button></div></CardContent>
        </Card>;
      })}</div> : !loading && !error ? <Card><CardContent className="p-10 text-center"><Search className="mx-auto mb-3 size-8 text-muted-foreground"/><p className="font-semibold">No challenges found</p><p className="mt-1 text-sm text-muted-foreground">Try another search term or clear the filters.</p><Button className="mt-4" variant="outline" onClick={() => { setQuery(''); setDifficulty('all'); setTopic('all'); }}>Clear filters</Button></CardContent></Card> : null}

      <div className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary"/>Submissions run in a separate Docker sandbox. The browser never executes submitted C++ code. Hidden test inputs and expected outputs stay on the execution service.</div>
    </div>
  );
}
