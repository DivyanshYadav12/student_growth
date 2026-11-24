'use client';

import { useEffect, useState } from 'react';
import { academicsApi, learningApi, type ApiPathDetail, type ApiProgramStructure, type ApiSkillDetail, type ApiSubjectDetail } from './api';
import type { SkillQuestLesson, SkillQuestModule, SkillQuestPath } from '@/features/skill-quest/data';
import type { Subject } from '@/features/academics/data';

const ACCENTS = ['indigo', 'emerald', 'amber'] as const;
const SUBJECT_ACCENTS = ['indigo', 'emerald', 'amber', 'sky', 'violet', 'rose'] as const;
const ICONS = ['code', 'database', 'layers'] as const;
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

function adaptLesson(l: { id: string; slug: string; title: string; summary: string | null; estimated_minutes: number | null; difficulty: string | null; status: string }, skillName: string): SkillQuestLesson {
  const status = l.status === 'completed' ? 'mastered' : l.status === 'in_progress' ? 'in-progress' : 'available';
  return {
    id: l.id, title: l.title, summary: l.summary ?? '', duration: l.estimated_minutes ?? 20, xp: 60,
    type: 'lesson', status: status as SkillQuestLesson['status'],
    recommendedPrerequisites: [], tags: [skillName], objectives: [], keyTakeaways: [],
    exampleTitle: '', exampleCode: '', practicePrompt: l.summary ?? '',
  };
}

export function useSkillQuestPaths() {
  const [paths, setPaths] = useState<SkillQuestPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items } = await learningApi.paths();
        const details = await Promise.all(items.map((p) => learningApi.path(p.id).catch(() => null)));
        if (cancelled) return;
        const adapted: SkillQuestPath[] = [];
        for (const detail of details) {
          if (!detail) continue;
          const skillNodes = detail.nodes.filter((n) => n.node_type === 'skill' && n.skill);
          const modules: SkillQuestModule[] = [];
          for (const node of skillNodes) {
            const skill = await learningApi.skill(node.skill!.id).catch(() => null);
            if (cancelled) return;
            const lessons = (skill?.lessons ?? []).map((l) => adaptLesson(l, skill?.name ?? node.skill!.name));
            modules.push({
              id: node.id, title: node.skill!.name, description: node.skill!.description ?? '',
              estimatedMinutes: lessons.reduce((s, l) => s + l.duration, 0), lessons,
            });
          }
          const lessonNodes = detail.nodes.filter((n) => n.node_type === 'lesson' && n.lesson);
          if (lessonNodes.length) {
            modules.push({
              id: `${detail.id}-direct`, title: 'Direct lessons', description: '', estimatedMinutes: 0,
              lessons: lessonNodes.map((n) => adaptLesson({ ...n.lesson!, status: n.lesson!.status }, 'Path')),
            });
          }
          adapted.push({
            id: detail.id, title: detail.title, category: detail.category, summary: detail.description ?? '',
            level: (LEVELS.includes(detail.difficulty as never) ? detail.difficulty : 'beginner') as SkillQuestPath['level'],
            duration: detail.estimated_hours ? `~${Math.round(detail.estimated_hours)}h` : 'Self-paced',
            estimatedHours: detail.estimated_hours ?? 0, totalXp: 0, accent: ACCENTS[adapted.length % ACCENTS.length],
            icon: ICONS[adapted.length % ICONS.length], enrolled: detail.enrolled ?? false, featured: adapted.length === 0,
            skills: skillNodes.map((n) => n.skill!.name), modules,
          });
        }
        setPaths(adapted);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load paths');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { paths, loading, error };
}

export function useSkillQuestPath(pathId: string) {
  const [path, setPath] = useState<SkillQuestPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const detail: ApiPathDetail = await learningApi.path(pathId);
        const skillNodes = detail.nodes.filter((n) => n.node_type === 'skill' && n.skill);
        const modules: SkillQuestModule[] = [];
        for (const node of skillNodes) {
          const skill: ApiSkillDetail | null = await learningApi.skill(node.skill!.id).catch(() => null);
          const lessons = (skill?.lessons ?? []).map((l) => ({
            ...adaptLesson(l, skill?.name ?? node.skill!.name),
            status: (l.status === 'completed' ? 'mastered' : l.status === 'in_progress' ? 'in-progress' : 'available') as SkillQuestLesson['status'],
          }));
          modules.push({ id: node.id, title: node.skill!.name, description: node.skill!.description ?? '', estimatedMinutes: lessons.reduce((s, l) => s + l.duration, 0), lessons });
        }
        const lessonNodes = detail.nodes.filter((n) => n.node_type === 'lesson' && n.lesson);
        if (lessonNodes.length) {
          modules.push({
            id: `${detail.id}-direct`, title: 'Path lessons', description: '', estimatedMinutes: 0,
            lessons: lessonNodes.map((n) => ({ ...adaptLesson({ ...n.lesson!, status: n.lesson!.status }, 'Path'), status: (n.lesson!.status === 'completed' ? 'mastered' : 'available') as SkillQuestLesson['status'] })),
          });
        }
        if (!cancelled) {
          setPath({
            id: detail.id, title: detail.title, category: detail.category, summary: detail.description ?? '',
            level: (LEVELS.includes(detail.difficulty as never) ? detail.difficulty : 'beginner') as SkillQuestPath['level'],
            duration: detail.estimated_hours ? `~${Math.round(detail.estimated_hours)}h` : 'Self-paced',
            estimatedHours: detail.estimated_hours ?? 0, totalXp: 0, accent: 'indigo', icon: 'code',
            enrolled: detail.enrolled ?? false, featured: false,
            skills: skillNodes.map((n) => n.skill!.name), modules,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load path');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pathId]);

  return { path, loading, error };
}

export function useAcademicsSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const programs = await academicsApi.programs();
        if (!programs.length) return;
        const structure: ApiProgramStructure = await academicsApi.structure(programs[0].id);
        if (cancelled) return;
        const flat: Subject[] = [];
        for (const version of structure.curriculum_versions) {
          for (const sem of version.semesters) {
            for (const off of sem.subjects) {
              flat.push({
                id: off.id, code: off.code ?? '', name: off.title, semester: sem.semester_number,
                credits: off.credits ?? 0, category: off.subject_type, description: '',
                progress: 0, completedUnits: 0, totalUnits: off.unit_count, nextUnit: '',
                accent: SUBJECT_ACCENTS[flat.length % SUBJECT_ACCENTS.length], units: [],
              });
            }
          }
        }
        setSubjects(flat);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load subjects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { subjects, loading, error };
}

export function useSubjectDetail(offeringId: string) {
  const [subject, setSubject] = useState<ApiSubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    academicsApi.subject(offeringId)
      .then((s) => { if (!cancelled) setSubject(s); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load subject'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [offeringId]);

  return { subject, loading, error };
}
