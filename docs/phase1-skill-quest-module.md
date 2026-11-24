# Student Growth — Skill Quest Module (Phase 1.2)

## Routes

- `/quest` — searchable learning-path catalogue, enrolled-path filter, path summaries, learning metrics, and a continue-learning recommendation.
- `/quest/paths/[pathId]` — path overview, progress, skills, expandable modules, lesson statuses, and recommended-prerequisite guidance.
- `/quest/lessons/[lessonId]` — lesson objectives, key takeaways, a worked example, practice prompt, knowledge check, mastery action, and previous/next lesson navigation.

## Sample path content

| Path | Modules | Lessons | Level |
|---|---:|---:|---|
| C++ & DSA Foundations | 5 | 20 | Beginner |
| SQL & Database Foundations | 3 | 7 | Beginner |
| Full-Stack Project Builder | 2 | 4 | Intermediate |

The learning-path catalogue is administrator-curated sample content in this release. The data model keeps each path as a normal path definition and does not couple ownership to the UI, so later user-created paths can be introduced through an owner field and permission checks without a separate student-path schema.

## Interactions

- Search paths by name, category, summary, and included skills.
- Filter all paths, enrolled paths, or paths not yet enrolled.
- Expand and collapse individual roadmap modules.
- Navigate from module lessons into a lesson workspace.
- Review lesson objectives, examples, and concept takeaways.
- Answer a multiple-choice knowledge check and see feedback.
- Mark a lesson as mastered; path progress recalculates from completed lessons.
- Enroll in or remove a path from the learner's path list.
- Recommended prerequisites are shown as guidance only. They never hard-lock a lesson.

## Prototype persistence

Completion and enrollment are saved in browser `localStorage` under `student-growth:skill-quest:v1`. This is local prototype persistence only. It is not synced between devices or users and must be replaced by authenticated backend progress APIs before production.

## Deliberate MVP boundaries

- Paths are currently defined as administrator-curated TypeScript seed data.
- The Coding Arena execution service is not connected. Practice activities provide prompts and examples but do not execute submitted code.
- The sample knowledge checks are local UI interactions, not formal graded assessments.
- XP values are illustrative and do not yet create authoritative gamification transactions.
- Content and progress must be reviewed and moved to the backend before production use.

## Main implementation files

- `src/features/skill-quest/data.ts`
- `src/features/skill-quest/use-progress.ts`
- `src/components/skill-quest/skill-quest-home.tsx`
- `src/components/skill-quest/path-detail.tsx`
- `src/components/skill-quest/lesson-detail.tsx`
- `src/app/quest/page.tsx`
- `src/app/quest/paths/[pathId]/page.tsx`
- `src/app/quest/lessons/[lessonId]/page.tsx`
