# Student Growth — Frontend Phase 1


An early frontend implementation for the student learning and growth platform.

## Included
- Next.js App Router + TypeScript
- Tailwind CSS 4 configuration
- Responsive app shell with desktop sidebar and mobile navigation
- Dashboard with realistic static sample data
- Small reusable UI primitives: Button, Card, Badge
- Placeholder routing via not-found page

## Requirements
- Node.js 20.9+
- npm

## Run
```bash
npm install
npm run dev
```
Then visit http://localhost:3000


## Build
```bash
npm run build
```

## Notes
- Data is mocked and not connected to a backend.
- Dashboard interaction controls are visual prototypes; navigation to unfinished features currently leads to the not-found page.
- UI primitives are shadcn-inspired but are not generated/managed by the shadcn CLI yet. The next pass should install shadcn components and refine interaction states.


## Academics module (added in Phase 1.1)

- `/academics` — searchable subject catalogue with semester and progress filters.
- `/academics/subjects/dbms` — detailed DBMS subject workspace with overview, syllabus, study resources, practicals, and viva tabs.
- All sample subject cards have detail routes. DBMS uses a richer sample syllabus; other subjects use illustrative starter units.
- Search, filters, unit accordions, resource previews, and resource bookmarks are local prototype interactions.

The curriculum is illustrative and must be checked against the relevant university before use as official academic content.

## Skill Quest module (added in Phase 1.2)

- `/quest` — searchable learning-path catalogue with All paths, My paths, and Explore filters.
- `/quest/paths/cpp-dsa-foundations` — C++ and DSA roadmap with modules, topic statuses, and suggested prerequisites.
- `/quest/lessons/arrays-sliding-window` — sample interactive lesson with objectives, key takeaways, worked example, practice prompt, knowledge check, and mastery action.
- Also includes sample SQL & Database Foundations and Full-Stack Project Builder paths (31 sample lessons across all three paths).
- Lesson completion and path enrollment are stored in this browser using localStorage. This is prototype persistence only; authenticated backend storage is still required.
- Recommended prerequisites never hard-lock lessons.
- Coding exercises are prompts only; isolated code execution is not integrated yet.

See `docs/phase1-skill-quest-module.md` for routes, interactions, scope, and implementation files.

