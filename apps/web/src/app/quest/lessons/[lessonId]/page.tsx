'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Clock3, LoaderCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Markdown } from '@/components/markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiError, learningApi, type ApiLessonDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSkillQuestProgress } from '@/features/skill-quest/use-progress';

export default function SkillQuestLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const { isLessonComplete, markLessonComplete, ready } = useSkillQuestProgress();
  const [lesson, setLesson] = useState<ApiLessonDetail | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'unauthorized' | 'ready'>('loading');
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!user) { setState('unauthorized'); return; }
    let cancelled = false;
    setState('loading');
    learningApi.lesson(lessonId)
      .then((data) => { if (!cancelled) { setLesson(data); setState('ready'); } })
      .catch((cause) => {
        if (cancelled) return;
        if (cause instanceof ApiError && cause.status === 401) setState('unauthorized');
        else { setError(cause instanceof Error ? cause.message : 'Failed to load lesson.'); setState('error'); }
      });
    return () => { cancelled = true; };
  }, [lessonId, user]);

  const completed = lesson ? (lesson.progress.status === 'completed' || isLessonComplete(lesson.id)) : false;

  const complete = async () => {
    if (!lesson || completing) return;
    setCompleting(true);
    try {
      const result = await learningApi.lessonProgress(lesson.id, { status: 'completed', progress_percent: 100 });
      markLessonComplete(lesson.id);
      setLesson((current) => current ? { ...current, progress: { ...current.progress, status: 'completed', progress_percent: 100 } } : current);
      toast.success(result.xp_awarded > 0 ? `Lesson completed · ${result.xp_awarded} XP awarded` : 'Lesson marked as complete');
    } catch (cause) {
      toast.error(cause instanceof ApiError ? cause.message : 'Could not save progress. Check your connection and try again.');
    } finally {
      setCompleting(false);
    }
  };

  if (state === 'unauthorized') {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card><CardContent className="space-y-4 p-10">
          <BookOpen className="mx-auto size-10 text-indigo-500" />
          <h1 className="text-xl font-bold">Sign in to open this lesson</h1>
          <p className="text-sm text-muted-foreground">Lessons are part of your guided path — log in to read content and save your progress.</p>
          <Button asChild><Link href="/login">Go to login</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  if (state === 'loading' || !ready) {
    return <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Loading lesson…</div>;
  }

  if (state === 'error' || !lesson) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Card><CardContent className="space-y-4 p-10">
          <h1 className="text-xl font-bold">Lesson unavailable</h1>
          <p className="text-sm text-muted-foreground">{error || 'This lesson could not be found or is not published yet.'}</p>
          <Button asChild variant="outline"><Link href="/quest"><ArrowLeft className="mr-1 size-4" />Back to Skill Quest</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/quest" className="inline-flex items-center gap-1 hover:text-primary"><ArrowLeft size={13} />Skill Quest</Link>
        <ChevronRight size={12} />
        <span className="font-medium text-foreground">{lesson.title}</span>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {lesson.difficulty && <Badge variant="secondary">{lesson.difficulty}</Badge>}
            {lesson.estimated_minutes != null && <Badge variant="outline"><Clock3 className="mr-1 size-3" />{lesson.estimated_minutes} min</Badge>}
            {completed && <Badge variant="success"><CheckCircle2 className="mr-1 size-3" />Completed</Badge>}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>
            {lesson.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{lesson.summary}</p>}
          </div>

          <Markdown content={lesson.content_markdown} className="border-t pt-6" />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-amber-500" />Completing this lesson awards XP and counts toward your path progress.</p>
            <Button onClick={() => void complete()} disabled={completing || completed}>
              {completing ? <LoaderCircle className="animate-spin" /> : completed ? <CheckCircle2 /> : null}
              {completed ? 'Completed' : 'Mark as complete'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
