# Student Growth API

FastAPI backend for the Student Growth Platform. Async SQLAlchemy 2.0 + PostgreSQL.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
copy .env.example .env   # then edit SG_JWT_SECRET
```

## Database

From the repo root:

```powershell
docker compose up -d db
docker exec -i student-growth-db psql -U sg -d student_growth -v ON_ERROR_STOP=1 < backend/schemas/schema.sql
```

## Run

```powershell
cd backend
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

## Auth flow (dev)

`POST /api/v1/auth/register` returns `dev_verification_token` in development.
Pass it to `POST /api/v1/auth/verify-email` to activate the account and receive
tokens. Email delivery is not wired yet — wire a provider before production.
