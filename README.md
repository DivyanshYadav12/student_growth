# Student Growth Platform — Frontend Foundation

A responsive student development platform prototype built with Next.js App Router, TypeScript, Tailwind CSS v4, and shadcn/ui (Radix primitives).

## Modules included

- Dashboard
- Academics catalogue and subject workspaces
- Skill Quest learning paths and lessons
- Coding Arena with C++17 challenges and a separate Docker execution service
- Design System component showcase

## Frontend setup (Windows PowerShell)

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful commands after installing dependencies:

```powershell
npm run lint
npm run typecheck
npm run test:runner
npm run build
```

Useful routes:

- `/` — Dashboard
- `/academics` — Academic subjects
- `/quest` — Skill Quest paths
- `/quest/coding` — Coding Arena challenge library
- `/quest/coding/two-sum` — C++ coding workspace
- `/design-system` — shadcn/ui component showcase

## Coding Arena setup

The code editor never executes user code in the browser or Next.js process. Start the separate FastAPI service and build its Docker runtime image before using Run/Submit.

See [Skill Quest Phase 2 — Coding Arena](docs/phase2-coding-arena.md) for complete Windows instructions and the API contract.

Quick start from the repository root:

```powershell
docker build -t student-growth-cpp-runner:latest -f execution-worker/Dockerfile execution-worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r execution-worker/requirements.txt
Set-Location execution-worker/service
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

In another terminal, run `npm run dev` from the repository root.

## Important prototype notes

- Browser-local progress and drafts are not yet synchronized with PostgreSQL.
- The local coding execution service is for development only. Do not expose it publicly. Production needs authenticated quotas, durable scheduling, monitoring, hardened isolation and abuse controls.
- Hidden tests remain on the FastAPI service and only aggregate results are returned to the frontend.
