'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAllLessons, getSeedCompletedLessonIds, skillQuestPaths } from './data';
import { getAccessToken } from '@/lib/api';
import { learningApi } from '@/lib/api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function syncEnrollment(pathId: string, enrolled: boolean) {
  if (!getAccessToken() || !UUID_RE.test(pathId)) return;
  (enrolled ? learningApi.enroll(pathId) : learningApi.withdraw(pathId)).catch(() => {});
}

function syncLessonComplete(lessonId: string) {
  if (!getAccessToken() || !UUID_RE.test(lessonId)) return;
  learningApi.lessonProgress(lessonId, { status: 'completed' }).catch(() => {});
}

const STORAGE_KEY = 'student-growth:skill-quest:v1';

type StoredProgress = {
  completedLessonIds: string[];
  enrolledPathIds: string[];
};

export function useSkillQuestProgress() {
  const seedCompleted = useMemo(() => getSeedCompletedLessonIds(), []);
  const seedEnrolled = useMemo(() => skillQuestPaths.filter((path) => path.enrolled).map((path) => path.id), []);
  const knownLessonIds = useMemo(() => new Set(getAllLessons().map((lesson) => lesson.id)), []);
  const knownPathIds = useMemo(() => new Set(skillQuestPaths.map((path) => path.id)), []);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(seedCompleted);
  const [enrolledPathIds, setEnrolledPathIds] = useState<string[]>(seedEnrolled);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<StoredProgress>;
        if (Array.isArray(saved.completedLessonIds)) {
          setCompletedLessonIds([...new Set([...seedCompleted, ...saved.completedLessonIds.filter((id: unknown): id is string => typeof id === 'string' && knownLessonIds.has(id))])]);
        }
        if (Array.isArray(saved.enrolledPathIds)) {
          setEnrolledPathIds([...new Set(saved.enrolledPathIds.filter((id: unknown): id is string => typeof id === 'string' && knownPathIds.has(id)))]);
        }
      }
    } catch {
      // Keep the seeded prototype progress if browser storage is unavailable or invalid.
    }
    setReady(true);
  }, [seedCompleted, knownLessonIds, knownPathIds]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedLessonIds, enrolledPathIds } satisfies StoredProgress));
    } catch {
      // Progress remains available in component state for the current visit.
    }
  }, [completedLessonIds, enrolledPathIds, ready]);

  const isLessonComplete = (lessonId: string) => completedLessonIds.includes(lessonId);
  const markLessonComplete = (lessonId: string) => {
    setCompletedLessonIds((current: string[]) => {
      if (current.includes(lessonId)) return current;
      syncLessonComplete(lessonId);
      return [...current, lessonId];
    });
  };
  const toggleEnrollment = (pathId: string) => setEnrolledPathIds((current: string[]) => {
    const enrolled = !current.includes(pathId);
    syncEnrollment(pathId, enrolled);
    return enrolled ? [...current, pathId] : current.filter((id: string) => id !== pathId);
  });

  const getPathProgress = (pathId: string) => {
    const path = skillQuestPaths.find((item) => item.id === pathId);
    if (!path) return { completed: 0, total: 0, percentage: 0 };
    const lessonIds = path.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const completed = lessonIds.filter((id) => completedLessonIds.includes(id)).length;
    return { completed, total: lessonIds.length, percentage: lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0 };
  };

  return { completedLessonIds, enrolledPathIds, isLessonComplete, markLessonComplete, toggleEnrollment, getPathProgress, ready };
}
