# Phase 1.1 — Academics Module

## Routes

- `/academics` — subject catalogue.
- `/academics/subjects/[subjectId]` — subject workspace.

## Catalogue behavior

- Search by subject name, course code, or category.
- Filter by semester.
- Filter by learning status.
- Navigate to the selected subject workspace.
- Show workspace summary metrics and a suggested next step.

## Subject workspace behavior

- Overview tab: subject summary, progress, next step, syllabus preview, and study checklist.
- Syllabus tab: expandable units, topics, unit-level progress, and associated resources.
- Study resources tab: search and filter Notes, Videos, Quizzes, References, Practicals, and Viva resources.
- Practicals & viva tab: practical and oral-exam preparation resources.
- Resource bookmarks are interactive and held in component state for this prototype.
- Resource preview explains which production services will later provide the full content.

## Data model

The current data is typed in `src/features/academics/data.ts` using `Subject`, `SubjectUnit`, and `SubjectResource`. It is sample data only. The generic CSE curriculum is not claimed to be the official curriculum of any university.

## Backend integration still required

- Load curriculum and subject resources from FastAPI.
- Persist subject/unit progress and bookmarks.
- Replace sample content with reviewed, attributable academic material.
- Connect resource open actions to file/video/quiz/practical services.
- Add admin content authoring and curriculum versioning.

## Validation

All TypeScript and TSX files passed a TypeScript transpilation syntax check. The standalone typed academics data module passed strict TypeScript checking. A full Next.js build was not run because dependency installation timed out in the current environment.
