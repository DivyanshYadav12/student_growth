'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  ArrowLeft, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleAlert, Clock3,
  Code2, Copy, FileCode2, FlaskConical, LoaderCircle, Play, RotateCcw, Send,
  ShieldCheck, Sparkles, Terminal, XCircle, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { runCustomInput, runSampleTests, submitSolution, type RunResponse, type SamplesResponse, type SubmitResponse } from '@/features/coding/api';
import type { CodingProblem } from '@/features/coding/data';
import { useCodingProgress } from '@/features/coding/use-coding-progress';
import { useSkillQuestProgress } from '@/features/skill-quest/use-progress';

type WorkspaceResult =
  | { kind: 'custom'; data: RunResponse }
  | { kind: 'samples'; data: SamplesResponse }
  | { kind: 'submission'; data: SubmitResponse };

type ResultTab = 'output' | 'tests' | 'submissions';

const verdictLabel: Record<SubmitResponse['verdict'], string> = {
  accepted: 'Accepted', wrong_answer: 'Wrong answer', compile_error: 'Compile error',
  runtime_error: 'Runtime error', time_limit_exceeded: 'Time limit exceeded', output_limit_exceeded: 'Output limit exceeded',
  system_error: 'Evaluation error',
};

function describeError(cause: unknown, fallback: string) {
  if (cause instanceof ApiError && cause.status === 401) {
    return 'Please sign in to run code — execution and submissions require an account.';
  }
  return cause instanceof Error ? cause.message : fallback;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function CodingWorkspace({ problem }: { problem: CodingProblem }) {
  const [code, setCode] = useState(problem.starterCode);
  const [customInput, setCustomInput] = useState(problem.examples[0]?.input ?? '');
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('output');
  const [result, setResult] = useState<WorkspaceResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'run' | 'samples' | 'submit' | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const { solvedProblemIds, attempts, recordSubmission, ready: progressReady } = useCodingProgress();
  const { markLessonComplete } = useSkillQuestProgress();
  const solved = solvedProblemIds.includes(problem.id);
  const lineCount = useMemo(() => code.split('\n').length, [code]);

  useEffect(() => {
    setDraftReady(false);
    try {
      const saved = window.localStorage.getItem(`student-growth:coding-draft:${problem.id}`);
      if (saved) setCode(saved);
      else setCode(problem.starterCode);
    } catch { setCode(problem.starterCode); }
    setCustomInput(problem.examples[0]?.input ?? '');
    setResult(null);
    setError('');
    setDraftReady(true);
  }, [problem.id, problem.starterCode]);

  useEffect(() => {
    if (!draftReady) return;
    try { window.localStorage.setItem(`student-growth:coding-draft:${problem.id}`, code); } catch { /* Keep the editor usable when storage is blocked. */ }
  }, [code, draftReady, problem.id]);

  const runCustom = async () => {
    if (busy !== null) return;
    setBusy('run'); setError(''); setResult(null); setActiveResultTab('output');
    try { setResult({ kind: 'custom', data: await runCustomInput(problem.id, code, customInput) }); }
    catch (cause) { setError(describeError(cause, 'Unable to run this code.')); }
    finally { setBusy(null); }
  };

  const runSamples = async () => {
    if (busy !== null) return;
    setBusy('samples'); setError(''); setResult(null); setActiveResultTab('tests');
    try { setResult({ kind: 'samples', data: await runSampleTests(problem.id, code) }); }
    catch (cause) { setError(describeError(cause, 'Unable to run sample tests.')); }
    finally { setBusy(null); }
  };

  const submit = async () => {
    if (busy !== null) return;
    setBusy('submit'); setError(''); setResult(null); setActiveResultTab('tests');
    try {
      const data = await submitSolution(problem.id, code);
      setResult({ kind: 'submission', data });
      recordSubmission(problem.id, problem.title, data);
      if (data.verdict === 'accepted') {
        if (problem.relatedLessonId) markLessonComplete(problem.relatedLessonId);
        if (solved) {
          toast.success('Challenge accepted', { description: 'This challenge was already solved, so no additional XP was added.' });
        } else {
          toast.success(`Challenge accepted · ${data.xp_awarded} XP awarded`, { description: `${problem.relatedLessonTitle} is now marked as practiced in Skill Quest.` });
        }
      } else {
        toast.error(verdictLabel[data.verdict], { description: `${data.passed_tests} of ${data.total_tests} test cases passed.` });
      }
    } catch (cause) { setError(describeError(cause, 'Unable to submit this solution.')); }
    finally { setBusy(null); }
  };

  const resetCode = () => { setCode(problem.starterCode); toast.message('Editor reset to starter code.'); };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); toast.success('Code copied.'); window.setTimeout(() => setCopied(false), 1500); }
    catch { toast.error('Clipboard access is unavailable in this browser.'); }
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = `${code.slice(0, start)}  ${code.slice(end)}`;
      setCode(updated);
      requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + 2; });
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      void runCustom();
    }
  };

  const problemAttempts = attempts.filter((attempt) => attempt.problemId === problem.id);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Link href="/quest" className="hover:text-primary">Skill Quest</Link><ChevronRight size={13}/><Link href="/quest/coding" className="hover:text-primary">Coding Arena</Link><ChevronRight size={13}/><span className="font-medium text-foreground">{problem.title}</span></div>

      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Medium' ? 'warning' : 'destructive'}>{problem.difficulty}</Badge><Badge variant="outline">C++17</Badge>{solved && <Badge variant="success"><CheckCircle2 className="mr-1 size-3"/>Solved</Badge>}</div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{problem.title}</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{problem.summary}</p></div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Zap className="size-3.5 text-amber-500"/>{problem.xp} XP</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5"/>2s program limit</span><span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5 text-emerald-400"/>Hidden tests protected</span><Button asChild variant="outline" size="sm"><Link href="/quest/coding"><ArrowLeft/>All challenges</Link></Button></div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(330px,0.82fr)_minmax(0,1.18fr)]">
        <Card className="overflow-hidden">
          <Tabs defaultValue="description">
            <div className="border-b px-4 pt-3"><TabsList className="h-9"><TabsTrigger value="description">Description</TabsTrigger><TabsTrigger value="examples">Examples</TabsTrigger><TabsTrigger value="submissions">Submissions ({problemAttempts.length})</TabsTrigger></TabsList></div>
            <TabsContent value="description" className="mt-0"><div className="max-h-[760px] space-y-6 overflow-y-auto p-5">
              <section className="space-y-2">{problem.statement.map((paragraph) => <p key={paragraph} className="text-sm leading-6 text-foreground/90">{paragraph}</p>)}</section>
              <section><h2 className="mb-2 text-sm font-semibold">Input format</h2><ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{problem.inputFormat.map((line) => <li key={line}>{line}</li>)}</ol></section>
              <section><h2 className="mb-2 text-sm font-semibold">Output format</h2><ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{problem.outputFormat.map((line) => <li key={line}>{line}</li>)}</ul></section>
              <section><h2 className="mb-2 text-sm font-semibold">Constraints</h2><ul className="space-y-1.5">{problem.constraints.map((line) => <li key={line} className="rounded-md bg-muted/60 px-3 py-2 font-mono text-xs text-muted-foreground">{line}</li>)}</ul></section>
              <section className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary"/>Complexity target</div><p className="text-sm leading-6 text-muted-foreground">{problem.expectedComplexity}</p></section>
              <section className="flex flex-wrap gap-2">{problem.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</section>
              {problem.relatedLessonId ? <div className="rounded-xl border p-3"><p className="text-xs font-semibold">Linked Skill Quest lesson</p><p className="mt-1 text-sm text-muted-foreground">{problem.relatedLessonTitle}</p><Link href={`/quest/lessons/${problem.relatedLessonId}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Review concept <ArrowUpRight size={13}/></Link></div> : <div className="rounded-xl border p-3"><p className="text-xs font-semibold">Linked skill</p><p className="mt-1 text-sm text-muted-foreground">{problem.relatedLessonTitle}</p><p className="mt-2 text-xs text-muted-foreground">Accepted submissions count as practice evidence for this skill.</p></div>}
            </div></TabsContent>
            <TabsContent value="examples" className="mt-0"><div className="max-h-[760px] space-y-4 overflow-y-auto p-5">{problem.examples.map((example, index) => <div key={example.input} className="space-y-2 rounded-xl border p-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Example {index + 1}</h3><Badge variant="outline">Public test</Badge></div><p className="text-xs font-medium text-muted-foreground">Input</p><pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100">{example.input.trimEnd()}</pre><p className="text-xs font-medium text-muted-foreground">Expected output</p><pre className="rounded-lg bg-muted p-3 text-xs leading-5">{example.output}</pre><p className="text-xs leading-5 text-muted-foreground">{example.explanation}</p></div>)}</div></TabsContent>
            <TabsContent value="submissions" className="mt-0"><div className="max-h-[760px] space-y-3 overflow-y-auto p-5">{problemAttempts.length ? problemAttempts.map((attempt, index) => <div key={`${attempt.submittedAt}-${index}`} className="flex items-start justify-between gap-3 rounded-xl border p-3"><div><p className="text-sm font-semibold">{verdictLabel[attempt.verdict]}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(attempt.submittedAt)}</p><p className="mt-1 text-xs text-muted-foreground">{attempt.passedTests}/{attempt.totalTests} tests · {attempt.executionTimeMs} ms</p></div><Badge variant={attempt.verdict === 'accepted' ? 'success' : 'warning'}>{attempt.verdict === 'accepted' ? 'Accepted' : 'Attempt'}</Badge></div>) : <div className="py-12 text-center"><FileCode2 className="mx-auto mb-3 size-8 text-muted-foreground"/><p className="text-sm font-semibold">No submissions yet</p><p className="mt-1 text-xs text-muted-foreground">Your attempts will appear here after you submit.</p></div>}</div></TabsContent>
          </Tabs>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden border-slate-800 bg-slate-950 text-slate-100 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-4 py-3"><div className="flex items-center gap-2"><div className="grid size-7 place-items-center rounded-md bg-indigo-500/100/15 text-indigo-300"><Code2 size={15}/></div><span className="text-sm font-semibold">Code editor</span><Badge variant="outline" className="border-slate-700 bg-slate-800 text-muted-foreground">C++17</Badge></div><div className="flex items-center gap-1"><Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:bg-slate-800 hover:text-white" onClick={copyCode}><Copy/>{copied ? 'Copied' : 'Copy'}</Button><Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:bg-slate-800 hover:text-white" onClick={resetCode}><RotateCcw/>Reset</Button></div></div>
            <div className="flex min-h-[420px] overflow-hidden sm:min-h-[510px]">
              <div ref={lineNumbersRef} aria-hidden="true" className="w-12 shrink-0 overflow-hidden bg-slate-950 py-4 text-right font-mono text-[12px] leading-[21px] text-muted-foreground"><div className="pr-3">{Array.from({ length: lineCount }, (_, index) => <div key={index}>{index + 1}</div>)}</div></div>
              <Textarea ref={editorRef} aria-label="C++ code editor" value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={handleEditorKeyDown} onScroll={(event) => { if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop; }} spellCheck={false} autoCapitalize="off" autoCorrect="off" className="min-h-[510px] resize-none rounded-none border-0 border-l border-slate-800 bg-slate-950 px-4 py-4 font-mono text-[12px] leading-[21px] text-slate-100 shadow-none selection:bg-indigo-500/100/40 focus-visible:ring-0 focus-visible:ring-offset-0" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-900 px-4 py-3"><p className="text-[11px] text-muted-foreground">Tab inserts 2 spaces · Ctrl + Enter runs custom input</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void runSamples()} disabled={busy !== null} className="border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700">{busy === 'samples' ? <LoaderCircle className="animate-spin"/> : <FlaskConical/>}Run samples</Button><Button size="sm" onClick={() => void submit()} disabled={busy !== null || !progressReady}>{busy === 'submit' ? <LoaderCircle className="animate-spin"/> : <Send/>}Submit solution</Button></div></div>
          </Card>

          <Card>
            <CardHeader className="pb-3"><div className="flex items-center justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><Terminal className="size-4 text-primary"/>Test & results</CardTitle><Badge variant="outline">C++17 runner</Badge></div></CardHeader>
            <CardContent>
              <Tabs value={activeResultTab} onValueChange={(value) => setActiveResultTab(value as ResultTab)}>
                <TabsList className="h-9"><TabsTrigger value="output">Custom input</TabsTrigger><TabsTrigger value="tests">Test results</TabsTrigger><TabsTrigger value="submissions">History</TabsTrigger></TabsList>
                <TabsContent value="output" className="space-y-3">
                  <div><div className="mb-2 flex items-center justify-between"><label htmlFor="custom-input" className="text-xs font-semibold">Standard input (stdin)</label><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCustomInput(problem.examples[0]?.input ?? '')}>Load example</Button></div><Textarea id="custom-input" value={customInput} onChange={(event) => setCustomInput(event.target.value)} className="min-h-24 font-mono text-xs leading-5" placeholder="Enter test input..."/></div>
                  <Button onClick={() => void runCustom()} disabled={busy !== null} size="sm">{busy === 'run' ? <LoaderCircle className="animate-spin"/> : <Play/>}Run custom input</Button>
                  {result?.kind === 'custom' && <div className="space-y-2 rounded-lg border p-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold">Execution output</p><Badge variant={result.data.status === 'success' ? 'success' : 'destructive'}>{result.data.status.replaceAll('_', ' ')}</Badge></div><pre className="min-h-14 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">{result.data.stdout || '(no stdout)'}</pre>{result.data.stderr && <pre className="overflow-x-auto rounded-md bg-rose-950/10 p-3 text-xs leading-5 text-rose-300">{result.data.stderr}</pre>}<p className="text-[11px] text-muted-foreground">Exit code: {result.data.exit_code ?? '—'} · {result.data.execution_time_ms} ms</p></div>}
                </TabsContent>
                <TabsContent value="tests" className="space-y-3">
                  {result?.kind === 'samples' && <><div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-semibold">{result.data.verdict.replaceAll('_', ' ')}</p><p className="text-xs text-muted-foreground">Visible sample tests</p></div><p className="text-lg font-bold tabular-nums">{result.data.passed_tests}/{result.data.total_tests}</p></div>{result.data.results.map((test) => <div key={test.test_number} className="rounded-lg border p-3"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold">Sample test {test.test_number}</p>{test.passed ? <Badge variant="success"><Check className="mr-1 size-3"/>Passed</Badge> : <Badge variant="destructive"><XCircle className="mr-1 size-3"/>Failed</Badge>}</div><div className="grid gap-2 sm:grid-cols-2"><div><p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Expected</p><pre className="rounded bg-muted p-2 text-xs">{test.expected_output}</pre></div><div><p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Your output</p><pre className="rounded bg-muted p-2 text-xs">{test.actual_output || '(empty)'}</pre></div></div></div>)}</>}
                  {result?.kind === 'submission' && <div className="space-y-3"><Alert variant={result.data.verdict === 'accepted' ? 'success' : 'default'}><div className="flex items-start gap-2"><div className="mt-0.5">{result.data.verdict === 'accepted' ? <CheckCircle2 className="size-5"/> : <CircleAlert className="size-5"/>}</div><div><AlertTitle>{verdictLabel[result.data.verdict]}</AlertTitle><AlertDescription>{result.data.verdict === 'accepted' ? `All ${result.data.total_tests} tests passed. You earned ${result.data.xp_awarded} XP.` : `${result.data.passed_tests} of ${result.data.total_tests} tests passed. Review your solution and try again.`}</AlertDescription></div></div></Alert><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat label="Passed" value={`${result.data.passed_tests}/${result.data.total_tests}`}/><Stat label="Public" value={`${result.data.public_passed}/${result.data.public_total}`}/><Stat label="Hidden" value={`${result.data.hidden_passed}/${result.data.hidden_total}`}/><Stat label="Runtime" value={`${result.data.execution_time_ms} ms`}/></div><p className="text-xs text-muted-foreground">Hidden test inputs and expected outputs are not returned to the browser.</p></div>}
                  {!result || result.kind === 'custom' ? <div className="py-8 text-center"><FlaskConical className="mx-auto mb-2 size-7 text-muted-foreground"/><p className="text-sm font-medium">No test results yet</p><p className="mt-1 text-xs text-muted-foreground">Run sample tests or submit your solution.</p></div> : null}
                </TabsContent>
                <TabsContent value="submissions" className="space-y-2">{problemAttempts.length ? problemAttempts.map((attempt, index) => <div key={`${attempt.submittedAt}-${index}`} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-xs font-semibold">{verdictLabel[attempt.verdict]}</p><p className="mt-1 text-[11px] text-muted-foreground">{formatDate(attempt.submittedAt)}</p></div><div className="text-right"><p className="text-xs font-semibold tabular-nums">{attempt.passedTests}/{attempt.totalTests}</p><p className="text-[11px] text-muted-foreground">{attempt.executionTimeMs} ms</p></div></div>) : <p className="py-8 text-center text-xs text-muted-foreground">No submissions for this challenge yet.</p>}</TabsContent>
              </Tabs>
              {error && <Alert variant="destructive" className="mt-3"><CircleAlert className="size-4"/><AlertTitle>Execution service unavailable</AlertTitle><AlertDescription>{error}<p className="mt-2">Start the local Docker execution service using the setup instructions in the project README.</p></AlertDescription></Alert>}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400"/>Every compile and execution request runs in a separate, network-disabled Docker container with CPU, memory, process, filesystem and time limits. This local runner is a development sandbox, not a substitute for a hardened multi-tenant production execution service.</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/70 p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold tabular-nums">{value}</p></div>;
}
