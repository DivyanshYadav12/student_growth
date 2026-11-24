# Skill Quest Phase 2 — Coding Challenge Integration

## Student-facing routes

- `/quest/coding` — searchable challenge library with difficulty/topic filters, solved state, XP, and attempt summary.
- `/quest/coding/[problemId]` — problem statement, examples, C++17 editor, custom stdin, sample runner, hidden-test submission, result summary, and attempt history.

The four initial challenges are Two Sum, Maximum Sum Subarray of Size K, Contains Duplicate, and First Occurrence in a Sorted Array. Each links to its related Skill Quest lesson. An accepted submission marks the related lesson as complete in the existing browser-local Skill Quest progress store.

## Frontend behavior

- C++ source drafts are stored per problem in `localStorage`.
- Submission history, solved challenge IDs, and first-solve XP are stored in browser-local state.
- `Run custom input` calls `POST /api/v1/coding/run`.
- `Run samples` calls `POST /api/v1/coding/run-samples`.
- `Submit solution` calls `POST /api/v1/coding/submit`.
- The UI receives public expected outputs for sample tests. For a full submission, it receives only aggregate public/hidden pass counts; hidden inputs and expected outputs stay on the execution service.
- No code is run in a Next.js route, browser worker, or API process.

## Local C++ execution service

The FastAPI service is a local development execution adapter. It invokes a disposable Docker container for each test. The runner uses C++17 and applies:

- `--network none`
- 256 MiB memory and 0.5 CPU limits
- 64 process limit
- read-only root filesystem and read-only source mount
- non-root UID 65534
- dropped Linux capabilities and `no-new-privileges`
- 64 MiB tmpfs at `/tmp`
- CPU/file descriptor/file-size ulimits and a two-second program timeout
- output file-size cap; only bounded output is returned

This is a local prototype sandbox, not a claim of production-grade isolation. Do not expose the local FastAPI service to the public internet. A production service should add authentication, per-user rate limits and quotas, a durable queue, audit/abuse monitoring, per-submission containers or stronger isolation (for example, gVisor/Firecracker), resource accounting, and managed infrastructure.

## Windows PowerShell setup

Requirements: Node.js 20.9+, Python 3.11+, Docker Desktop running with Linux containers enabled, and a C++ runner image built locally.

From the repository root, build the runtime image:

```powershell
docker build -t student-growth-cpp-runner:latest -f execution-worker/Dockerfile execution-worker
```

Create and activate the Python environment, then install the API dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r execution-worker/requirements.txt
```

Start the execution service in a dedicated PowerShell terminal:

```powershell
Set-Location execution-worker/service
python -m uvicorn app:app --host 127.0.0.1 --port 8001
```

Confirm the service is ready:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

In a second terminal, start the Next.js app:

```powershell
npm install
npm run dev
```

The frontend defaults to `http://127.0.0.1:8001`. To override it, create `.env.local` in the Next.js project root:

```text
NEXT_PUBLIC_CODING_API_URL=http://127.0.0.1:8001
```

## API contract

### `POST /api/v1/coding/run`

Request: `{ "problem_id": "two-sum", "source_code": "...", "stdin": "..." }`

Response includes status, stdout, stderr, exit code, and execution duration.

### `POST /api/v1/coding/run-samples`

Request: `{ "problem_id": "two-sum", "source_code": "..." }`

Response includes sample verdict, aggregate pass count, and public test outputs.

### `POST /api/v1/coding/submit`

Request: `{ "problem_id": "two-sum", "source_code": "..." }`

Response includes submission ID, verdict, aggregate total/public/hidden pass counts, execution duration, XP award, and linked lesson ID. It does not include hidden input or expected output.

## Current limitations

- C++17 is the only enabled language.
- Progress and source drafts are local to the browser; database synchronization is not implemented yet.
- Sample and hidden tests are starter content and require content review before use in a graded or public environment.
- Each testcase recompiles the source in a fresh container, favoring isolation over execution speed. The development API allows at most two concurrent execution jobs.
- No authentication or per-account quotas are implemented in the local runner. Keep it bound to `127.0.0.1`.
