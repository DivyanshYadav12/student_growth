from uuid import UUID

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.deps import get_current_user, get_optional_user
from app.core.errors import bad_request, not_found
from app.database import SessionLocal, get_db
from app.models.coding import CodeSubmission, CodingProblem, CodingTestCase
from app.models.gamification import UserActivityEvent, XpTransaction
from app.models.identity import User
from app.models.learning import SkillMasteryEvent, SkillProgress

router = APIRouter(prefix="/coding", tags=["coding"])
settings = get_settings()


async def _get_published_problem(db: AsyncSession, ref: str) -> CodingProblem:
    """Accept either a UUID or a slug."""
    try:
        pid = UUID(ref)
        problem = await db.get(CodingProblem, pid)
    except ValueError:
        problem = (
            await db.execute(select(CodingProblem).where(CodingProblem.slug == ref))
        ).scalar_one_or_none()
    if problem is None or problem.status != "published":
        raise not_found("Coding problem not found.")
    return problem


@router.get("/problems")
async def list_problems(
    difficulty: str | None = Query(default=None),
    skill_id: UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CodingProblem).where(CodingProblem.status == "published")
    count_stmt = select(func.count(CodingProblem.id)).where(CodingProblem.status == "published")
    if difficulty:
        stmt = stmt.where(CodingProblem.difficulty == difficulty)
        count_stmt = count_stmt.where(CodingProblem.difficulty == difficulty)
    if skill_id:
        stmt = stmt.where(CodingProblem.skill_id == skill_id)
        count_stmt = count_stmt.where(CodingProblem.skill_id == skill_id)

    total = (await db.execute(count_stmt)).scalar_one()
    problems = (
        await db.execute(
            stmt.order_by(CodingProblem.created_at)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()

    problem_ids = [p.id for p in problems]
    sample_counts = dict(
        (await db.execute(
            select(CodingTestCase.problem_id, func.count(CodingTestCase.id))
            .where(
                CodingTestCase.problem_id.in_(problem_ids),
                CodingTestCase.is_sample.is_(True),
            )
            .group_by(CodingTestCase.problem_id)
        )).all()
    ) if problem_ids else {}

    return {
        "items": [
            {
                "id": str(p.id),
                "slug": p.slug,
                "title": p.title,
                "difficulty": p.difficulty,
                "skill_id": str(p.skill_id) if p.skill_id else None,
                "excerpt": (p.statement_markdown.split("\n\n")[0] or "")[:240],
                "sample_count": sample_counts.get(p.id, 0),
                "time_limit_ms": p.time_limit_ms,
                "memory_limit_mb": p.memory_limit_mb,
                "supported_languages": p.supported_languages,
            }
            for p in problems
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/problems/{problem_ref}")
async def problem_detail(
    problem_ref: str,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    problem = await _get_published_problem(db, problem_ref)

    # Only sample (public) test cases are ever exposed to students.
    samples = (
        await db.execute(
            select(CodingTestCase)
            .where(CodingTestCase.problem_id == problem.id, CodingTestCase.is_sample.is_(True))
            .order_by(CodingTestCase.display_order)
        )
    ).scalars().all()

    # Show editorial only after an accepted submission (release policy).
    has_accept = False
    if user is not None:
        has_accept = (
            await db.execute(
                select(func.count(CodeSubmission.id)).where(
                    CodeSubmission.user_id == user.id,
                    CodeSubmission.problem_id == problem.id,
                    CodeSubmission.status == "accepted",
                )
            )
        ).scalar_one() > 0

    return {
        "id": str(problem.id),
        "slug": problem.slug,
        "title": problem.title,
        "difficulty": problem.difficulty,
        "statement_markdown": problem.statement_markdown,
        "constraints_text": problem.constraints_text,
        "input_format": problem.input_format,
        "output_format": problem.output_format,
        "time_limit_ms": problem.time_limit_ms,
        "memory_limit_mb": problem.memory_limit_mb,
        "supported_languages": problem.supported_languages,
        "starter_code": problem.starter_code,
        "editorial_markdown": problem.editorial_markdown if has_accept else None,
        "sample_test_cases": [
            {"input": tc.input_data, "expected_output": tc.expected_output}
            for tc in samples
        ],
    }


# ---------------------------------------------------------------------------
# Execution bridge -> isolated worker service
# ---------------------------------------------------------------------------

EXEC_TIMEOUT = httpx.Timeout(90.0, connect=5.0)


class RunRequest(BaseModel):
    problem_id: str = Field(min_length=1, max_length=80)
    source_code: str = Field(min_length=1, max_length=50_000)
    stdin: str = Field(default="", max_length=12_000)


class CodeRequest(BaseModel):
    problem_id: str = Field(min_length=1, max_length=80)
    source_code: str = Field(min_length=1, max_length=50_000)


async def _worker_post(path: str, payload: dict) -> dict:
    try:
        async with httpx.AsyncClient(base_url=settings.execution_service_url, timeout=EXEC_TIMEOUT) as client:
            resp = await client.post(path, json=payload)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail="Code execution service is unavailable. Start the execution-worker on port 8001.",
        ) from exc
    if resp.status_code != 200:
        detail = resp.json().get("detail", "Execution failed.") if resp.headers.get("content-type", "").startswith("application/json") else "Execution failed."
        raise HTTPException(status_code=resp.status_code, detail=detail)
    return resp.json()


@router.post("/run")
async def run_custom(
    payload: RunRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_published_problem(db, payload.problem_id)
    return await _worker_post("/api/v1/coding/run", payload.model_dump())


@router.post("/run-samples")
async def run_samples(payload: CodeRequest, user: User = Depends(get_current_user)):
    return await _worker_post("/api/v1/coding/run-samples", payload.model_dump())


# ---------------------------------------------------------------------------
# Submissions (persisted, evaluated asynchronously via background task)
# ---------------------------------------------------------------------------

class SubmissionCreate(BaseModel):
    problem_id: str = Field(min_length=1, max_length=80)
    language: str = Field(default="cpp", pattern="^cpp$")
    source_code: str = Field(min_length=1, max_length=50_000)


_VERDICT_MAP = {
    "accepted": "accepted",
    "wrong_answer": "wrong_answer",
    "compile_error": "compile_error",
    "runtime_error": "runtime_error",
    "time_limit_exceeded": "time_limit",
    "output_limit_exceeded": "runtime_error",
}


async def _evaluate_submission(submission_id: UUID) -> None:
    """Runs after the POST response; updates the submission row with the verdict."""
    async with SessionLocal() as db:
        submission = await db.get(CodeSubmission, submission_id)
        if submission is None:
            return
        problem = await db.get(CodingProblem, submission.problem_id)
        if problem is None:
            return
        try:
            result = await _worker_post(
                "/api/v1/coding/submit",
                {"problem_id": problem.slug, "source_code": submission.source_code},
            )
        except HTTPException:
            submission.status = "system_error"
            submission.result_summary = {"error": "execution_service_unavailable"}
            await db.commit()
            return

        verdict = _VERDICT_MAP.get(result.get("verdict"), "system_error")
        total = result.get("total_tests", 0)
        passed = result.get("passed_tests", 0)
        max_score = (
            await db.execute(
                select(func.coalesce(func.sum(CodingTestCase.points), 0)).where(
                    CodingTestCase.problem_id == problem.id
                )
            )
        ).scalar_one()

        submission.status = verdict
        submission.max_score = max_score
        submission.score = round(float(max_score) * passed / total, 2) if total else None
        submission.execution_time_ms = result.get("execution_time_ms")
        submission.result_summary = {
            "verdict": result.get("verdict"),
            "passed_tests": passed,
            "total_tests": total,
            "public_passed": result.get("public_passed"),
            "public_total": result.get("public_total"),
            "hidden_passed": result.get("hidden_passed"),
            "hidden_total": result.get("hidden_total"),
        }
        submission.evaluated_at = func.now()

        if verdict == "accepted":
            # XP once per user+problem (first accepted solve), idempotent.
            idem = f"coding_accepted:{submission.user_id}:{problem.id}"
            existing = await db.execute(
                select(XpTransaction.id).where(
                    XpTransaction.user_id == submission.user_id,
                    XpTransaction.idempotency_key == idem,
                )
            )
            if existing.scalar_one_or_none() is None:
                db.add(
                    XpTransaction(
                        user_id=submission.user_id,
                        points=100,
                        reason_code="coding_accepted",
                        reference_type="coding_problem",
                        reference_id=problem.id,
                        idempotency_key=idem,
                    )
                )
            # Evidence for skill mastery: accepted submission -> 'practiced'.
            if problem.skill_id is not None:
                sp = (
                    await db.execute(
                        select(SkillProgress).where(
                            SkillProgress.user_id == submission.user_id,
                            SkillProgress.skill_id == problem.skill_id,
                        )
                    )
                ).scalar_one_or_none()
                if sp is None:
                    sp = SkillProgress(
                        user_id=submission.user_id,
                        skill_id=problem.skill_id,
                        mastery_status="practiced",
                        evidence_count=1,
                    )
                    db.add(sp)
                else:
                    sp.evidence_count += 1
                    if sp.mastery_status in ("not_started", "learning"):
                        sp.mastery_status = "practiced"
                db.add(
                    SkillMasteryEvent(
                        user_id=submission.user_id,
                        skill_id=problem.skill_id,
                        source_type="coding_submission",
                        source_id=submission.id,
                        new_status="practiced",
                        evidence={"verdict": verdict, "score": float(submission.score or 0)},
                    )
                )
        db.add(
            UserActivityEvent(
                user_id=submission.user_id,
                event_type="coding_submission_evaluated",
                entity_type="code_submission",
                entity_id=submission.id,
                event_data={"problem_id": str(problem.id), "verdict": verdict},
            )
        )
        await db.commit()


@router.post("/submissions", status_code=status.HTTP_202_ACCEPTED)
async def create_submission(
    payload: SubmissionCreate,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    problem = await _get_published_problem(db, payload.problem_id)
    if "cpp" not in (problem.supported_languages or []):
        raise bad_request("Language not supported for this problem.", code="UNSUPPORTED_LANGUAGE")

    submission = CodeSubmission(
        user_id=user.id,
        problem_id=problem.id,
        language=payload.language,
        source_code=payload.source_code,
        status="queued",
        max_score=None,
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    background.add_task(_evaluate_submission, submission.id)
    return {"id": str(submission.id), "status": submission.status, "problem_id": str(problem.id)}


@router.get("/submissions/{submission_id}")
async def submission_detail(
    submission_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = await db.get(CodeSubmission, submission_id)
    if sub is None or sub.user_id != user.id:
        raise not_found("Submission not found.")
    return {
        "id": str(sub.id),
        "problem_id": str(sub.problem_id),
        "language": sub.language,
        "status": sub.status,
        "score": float(sub.score) if sub.score is not None else None,
        "max_score": float(sub.max_score) if sub.max_score is not None else None,
        "execution_time_ms": sub.execution_time_ms,
        "result_summary": sub.result_summary,
        "submitted_at": sub.submitted_at.isoformat(),
        "evaluated_at": sub.evaluated_at.isoformat() if sub.evaluated_at else None,
    }


@router.get("/submissions/me")
async def my_submissions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total = (
        await db.execute(
            select(func.count(CodeSubmission.id)).where(CodeSubmission.user_id == user.id)
        )
    ).scalar_one()
    subs = (
        await db.execute(
            select(CodeSubmission, CodingProblem.title)
            .join(CodingProblem, CodingProblem.id == CodeSubmission.problem_id)
            .where(CodeSubmission.user_id == user.id)
            .order_by(CodeSubmission.submitted_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()
    return {
        "items": [
            {
                "id": str(s.id),
                "problem_id": str(s.problem_id),
                "problem_title": title,
                "language": s.language,
                "status": s.status,
                "score": float(s.score) if s.score is not None else None,
                "max_score": float(s.max_score) if s.max_score is not None else None,
                "execution_time_ms": s.execution_time_ms,
                "submitted_at": s.submitted_at.isoformat(),
                "evaluated_at": s.evaluated_at.isoformat() if s.evaluated_at else None,
            }
            for s, title in subs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
