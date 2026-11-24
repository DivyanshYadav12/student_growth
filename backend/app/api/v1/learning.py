from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_optional_user, utcnow
from app.core.errors import bad_request, conflict, not_found
from app.database import get_db
from app.models.gamification import UserActivityEvent, XpTransaction
from app.models.identity import User
from app.models.learning import (
    LearningPath,
    LearningPathNode,
    LearningPathNodePrerequisite,
    Lesson,
    LessonProgress,
    PathEnrollment,
    Skill,
    SkillProgress,
)

router = APIRouter(tags=["learning"])


def _path_summary(p: LearningPath, node_count: int | None = None, enrolled: bool | None = None) -> dict:
    return {
        "id": str(p.id),
        "slug": p.slug,
        "title": p.title,
        "description": p.description,
        "category": p.category,
        "difficulty": p.difficulty,
        "estimated_hours": float(p.estimated_hours) if p.estimated_hours is not None else None,
        "owner_type": p.owner_type,
        "visibility": p.visibility,
        "status": p.status,
        "node_count": node_count,
        "enrolled": enrolled,
    }


@router.get("/learning-paths")
async def list_learning_paths(
    category: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LearningPath).where(
        LearningPath.status == "published",
        LearningPath.visibility == "public",
    )
    count_stmt = select(func.count(LearningPath.id)).where(
        LearningPath.status == "published",
        LearningPath.visibility == "public",
    )
    if category:
        stmt = stmt.where(LearningPath.category == category)
        count_stmt = count_stmt.where(LearningPath.category == category)
    if difficulty:
        stmt = stmt.where(LearningPath.difficulty == difficulty)
        count_stmt = count_stmt.where(LearningPath.difficulty == difficulty)

    total = (await db.execute(count_stmt)).scalar_one()
    paths = (
        await db.execute(
            stmt.order_by(LearningPath.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).scalars().all()

    enrolled_ids = set()
    if user is not None and paths:
        rows = await db.execute(
            select(PathEnrollment.learning_path_id).where(
                PathEnrollment.user_id == user.id,
                PathEnrollment.learning_path_id.in_([p.id for p in paths]),
                PathEnrollment.status == "active",
            )
        )
        enrolled_ids = set(rows.scalars().all())

    items = []
    for p in paths:
        node_count = (
            await db.execute(
                select(func.count(LearningPathNode.id)).where(LearningPathNode.learning_path_id == p.id)
            )
        ).scalar_one()
        items.append(_path_summary(p, node_count=node_count, enrolled=p.id in enrolled_ids))

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/learning-paths/{path_id}")
async def learning_path_detail(
    path_id: UUID,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    path = await db.get(LearningPath, path_id)
    if path is None or path.status != "published" or path.visibility != "public":
        raise not_found("Learning path not found.")

    nodes = (
        await db.execute(
            select(LearningPathNode)
            .where(LearningPathNode.learning_path_id == path.id)
            .order_by(LearningPathNode.display_order)
        )
    ).scalars().all()

    prereqs = (
        await db.execute(
            select(LearningPathNodePrerequisite).where(
                LearningPathNodePrerequisite.node_id.in_([n.id for n in nodes])
            )
        )
    ).scalars().all() if nodes else []
    prereq_map: dict[UUID, list[str]] = {}
    for pr in prereqs:
        prereq_map.setdefault(pr.node_id, []).append(str(pr.prerequisite_node_id))

    # Fetch skills and lessons for nodes in two queries.
    skill_ids = [n.skill_id for n in nodes if n.skill_id]
    lesson_ids = [n.lesson_id for n in nodes if n.lesson_id]
    skills = {}
    if skill_ids:
        for s in (await db.execute(select(Skill).where(Skill.id.in_(skill_ids)))).scalars().all():
            skills[s.id] = s
    lessons = {}
    if lesson_ids:
        for l in (await db.execute(select(Lesson).where(Lesson.id.in_(lesson_ids)))).scalars().all():
            lessons[l.id] = l

    # Per-user state
    enrollment = None
    lesson_status: dict[UUID, str] = {}
    skill_mastery: dict[UUID, str] = {}
    if user is not None:
        enrollment = (
            await db.execute(
                select(PathEnrollment).where(
                    PathEnrollment.user_id == user.id,
                    PathEnrollment.learning_path_id == path.id,
                )
            )
        ).scalar_one_or_none()
        if lesson_ids:
            rows = await db.execute(
                select(LessonProgress.lesson_id, LessonProgress.status).where(
                    LessonProgress.user_id == user.id,
                    LessonProgress.lesson_id.in_(lesson_ids),
                )
            )
            lesson_status = dict(rows.all())
        if skill_ids:
            rows = await db.execute(
                select(SkillProgress.skill_id, SkillProgress.mastery_status).where(
                    SkillProgress.user_id == user.id,
                    SkillProgress.skill_id.in_(skill_ids),
                )
            )
            skill_mastery = dict(rows.all())

    node_out = []
    for n in nodes:
        entry = {
            "id": str(n.id),
            "node_type": n.node_type,
            "display_order": n.display_order,
            "is_required": n.is_required,
            "title": n.title_override,
            "prerequisite_node_ids": prereq_map.get(n.id, []),
        }
        if n.node_type == "skill" and n.skill_id in skills:
            s = skills[n.skill_id]
            entry["skill"] = {
                "id": str(s.id),
                "code": s.code,
                "name": s.name,
                "description": s.description,
                "category": s.category,
                "difficulty": s.difficulty,
                "mastery_status": skill_mastery.get(s.id, "not_started"),
            }
        elif n.node_type == "lesson" and n.lesson_id in lessons:
            l = lessons[n.lesson_id]
            entry["lesson"] = {
                "id": str(l.id),
                "slug": l.slug,
                "title": l.title,
                "summary": l.summary,
                "estimated_minutes": l.estimated_minutes,
                "difficulty": l.difficulty,
                "status": lesson_status.get(l.id, "not_started"),
            }
        node_out.append(entry)

    return {
        **_path_summary(
            path,
            node_count=len(nodes),
            enrolled=enrollment is not None and enrollment.status == "active",
        ),
        "enrollment": (
            {
                "id": str(enrollment.id),
                "status": enrollment.status,
                "enrolled_at": enrollment.enrolled_at.isoformat(),
                "completed_at": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
            }
            if enrollment
            else None
        ),
        "nodes": node_out,
    }


class EnrollmentCreate(BaseModel):
    learning_path_id: UUID


@router.post("/enrollments", status_code=201)
async def enroll(
    payload: EnrollmentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    path = await db.get(LearningPath, payload.learning_path_id)
    if path is None or path.status != "published" or path.visibility != "public":
        raise not_found("Learning path not found.")

    existing = (
        await db.execute(
            select(PathEnrollment).where(
                PathEnrollment.user_id == user.id,
                PathEnrollment.learning_path_id == path.id,
            )
        )
    ).scalar_one_or_none()

    if existing is not None:
        if existing.status == "active":
            raise conflict("Already enrolled in this path.", code="ALREADY_ENROLLED")
        existing.status = "active"
        existing.enrolled_at = utcnow()
        existing.completed_at = None
        enrollment = existing
    else:
        enrollment = PathEnrollment(user_id=user.id, learning_path_id=path.id, status="active")
        db.add(enrollment)

    db.add(
        UserActivityEvent(
            user_id=user.id,
            event_type="learning_path_enrolled",
            entity_type="learning_path",
            entity_id=path.id,
        )
    )
    await db.commit()
    await db.refresh(enrollment)
    return {
        "id": str(enrollment.id),
        "learning_path_id": str(path.id),
        "status": enrollment.status,
        "enrolled_at": enrollment.enrolled_at.isoformat(),
    }


@router.get("/enrollments/me")
async def my_enrollments(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (
        await db.execute(
            select(PathEnrollment, LearningPath)
            .join(LearningPath, LearningPath.id == PathEnrollment.learning_path_id)
            .where(PathEnrollment.user_id == user.id)
            .order_by(PathEnrollment.enrolled_at.desc())
        )
    ).all()
    return [
        {
            "id": str(e.id),
            "status": e.status,
            "enrolled_at": e.enrolled_at.isoformat(),
            "completed_at": e.completed_at.isoformat() if e.completed_at else None,
            "last_activity_at": e.last_activity_at.isoformat() if e.last_activity_at else None,
            "learning_path": _path_summary(p),
        }
        for e, p in rows
    ]


@router.post("/enrollments/{path_id}/withdraw")
async def withdraw_enrollment(
    path_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    enrollment = (
        await db.execute(
            select(PathEnrollment).where(
                PathEnrollment.user_id == user.id,
                PathEnrollment.learning_path_id == path_id,
            )
        )
    ).scalar_one_or_none()
    if enrollment is None:
        raise not_found("Enrollment not found.")
    enrollment.status = "withdrawn"
    await db.commit()
    return {"id": str(enrollment.id), "status": enrollment.status}


# ---------------------------------------------------------------------------
# Skills & lessons
# ---------------------------------------------------------------------------

@router.get("/skills/{skill_id}")
async def skill_detail(
    skill_id: UUID,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    skill = await db.get(Skill, skill_id)
    if skill is None:
        raise not_found("Skill not found.")

    lessons = (
        await db.execute(
            select(Lesson)
            .where(Lesson.skill_id == skill.id, Lesson.status == "published")
            .order_by(Lesson.created_at)
        )
    ).scalars().all()

    my_progress = {}
    my_mastery = None
    if user is not None:
        rows = await db.execute(
            select(LessonProgress.lesson_id, LessonProgress.status, LessonProgress.progress_percent)
            .where(LessonProgress.user_id == user.id, LessonProgress.lesson_id.in_([l.id for l in lessons]))
        ) if lessons else None
        if rows:
            my_progress = {lid: {"status": st, "progress_percent": float(pc)} for lid, st, pc in rows.all()}
        sp = (
            await db.execute(
                select(SkillProgress).where(SkillProgress.user_id == user.id, SkillProgress.skill_id == skill.id)
            )
        ).scalar_one_or_none()
        if sp:
            my_mastery = sp.mastery_status

    return {
        "id": str(skill.id),
        "code": skill.code,
        "name": skill.name,
        "description": skill.description,
        "category": skill.category,
        "difficulty": skill.difficulty,
        "mastery_status": my_mastery or "not_started",
        "lessons": [
            {
                "id": str(l.id),
                "slug": l.slug,
                "title": l.title,
                "summary": l.summary,
                "estimated_minutes": l.estimated_minutes,
                "difficulty": l.difficulty,
                "status": (my_progress.get(l.id) or {}).get("status", "not_started"),
                "progress_percent": (my_progress.get(l.id) or {}).get("progress_percent", 0.0),
            }
            for l in lessons
        ],
    }


@router.get("/lessons/{lesson_id}")
async def lesson_detail(
    lesson_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None or lesson.status != "published":
        raise not_found("Lesson not found.")

    progress = (
        await db.execute(
            select(LessonProgress).where(
                LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson.id
            )
        )
    ).scalar_one_or_none()

    return {
        "id": str(lesson.id),
        "slug": lesson.slug,
        "title": lesson.title,
        "summary": lesson.summary,
        "content_markdown": lesson.content_markdown,
        "estimated_minutes": lesson.estimated_minutes,
        "difficulty": lesson.difficulty,
        "skill_id": str(lesson.skill_id),
        "progress": (
            {
                "status": progress.status,
                "progress_percent": float(progress.progress_percent),
                "time_spent_seconds": progress.time_spent_seconds,
                "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
            }
            if progress
            else {"status": "not_started", "progress_percent": 0.0, "time_spent_seconds": 0}
        ),
    }


class LessonProgressUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(in_progress|completed|needs_revision)$")
    progress_percent: float | None = Field(default=None, ge=0, le=100)
    time_spent_seconds: int | None = Field(default=None, ge=0)


@router.patch("/lessons/{lesson_id}/progress")
async def update_lesson_progress(
    lesson_id: UUID,
    payload: LessonProgressUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None or lesson.status != "published":
        raise not_found("Lesson not found.")

    progress = (
        await db.execute(
            select(LessonProgress).where(
                LessonProgress.user_id == user.id, LessonProgress.lesson_id == lesson.id
            )
        )
    ).scalar_one_or_none()

    now = utcnow()
    xp_awarded = 0
    if progress is None:
        progress = LessonProgress(user_id=user.id, lesson_id=lesson.id)
        db.add(progress)

    if payload.status is not None:
        progress.status = payload.status
        if payload.status == "completed" and progress.completed_at is None:
            progress.completed_at = now
            progress.progress_percent = 100
            # Idempotent XP award for first completion.
            idem = f"lesson_completed:{user.id}:{lesson.id}"
            existing_xp = await db.execute(
                select(XpTransaction.id).where(
                    XpTransaction.user_id == user.id, XpTransaction.idempotency_key == idem
                )
            )
            if existing_xp.scalar_one_or_none() is None:
                db.add(
                    XpTransaction(
                        user_id=user.id,
                        points=50,
                        reason_code="lesson_completed",
                        reference_type="lesson",
                        reference_id=lesson.id,
                        idempotency_key=idem,
                    )
                )
                xp_awarded = 50
    if payload.progress_percent is not None and payload.status != "completed":
        progress.progress_percent = payload.progress_percent
    if payload.time_spent_seconds is not None:
        progress.time_spent_seconds += payload.time_spent_seconds

    if progress.first_started_at is None:
        progress.first_started_at = now
    progress.last_accessed_at = now

    # Keep skill + enrollment activity fresh.
    skill_progress = (
        await db.execute(
            select(SkillProgress).where(
                SkillProgress.user_id == user.id, SkillProgress.skill_id == lesson.skill_id
            )
        )
    ).scalar_one_or_none()
    if skill_progress is None:
        skill_progress = SkillProgress(user_id=user.id, skill_id=lesson.skill_id, mastery_status="learning")
        db.add(skill_progress)
    elif skill_progress.mastery_status == "not_started":
        skill_progress.mastery_status = "learning"

    enroll_rows = await db.execute(
        select(PathEnrollment)
        .join(LearningPathNode, LearningPathNode.learning_path_id == PathEnrollment.learning_path_id)
        .where(
            PathEnrollment.user_id == user.id,
            PathEnrollment.status == "active",
            LearningPathNode.lesson_id == lesson.id,
        )
    )
    for enr in enroll_rows.scalars().all():
        enr.last_activity_at = now

    db.add(
        UserActivityEvent(
            user_id=user.id,
            event_type="lesson_completed" if payload.status == "completed" else "lesson_progress_updated",
            entity_type="lesson",
            entity_id=lesson.id,
        )
    )

    await db.commit()
    return {
        "lesson_id": str(lesson.id),
        "status": progress.status,
        "progress_percent": float(progress.progress_percent),
        "xp_awarded": xp_awarded,
    }


# ---------------------------------------------------------------------------
# Progress overview
# ---------------------------------------------------------------------------

@router.get("/progress/overview")
async def progress_overview(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    lessons_completed = (
        await db.execute(
            select(func.count(LessonProgress.lesson_id)).where(
                LessonProgress.user_id == user.id,
                LessonProgress.status == "completed",
            )
        )
    ).scalar_one()
    lessons_in_progress = (
        await db.execute(
            select(func.count(LessonProgress.lesson_id)).where(
                LessonProgress.user_id == user.id,
                LessonProgress.status == "in_progress",
            )
        )
    ).scalar_one()
    skills_mastered = (
        await db.execute(
            select(func.count(SkillProgress.skill_id)).where(
                SkillProgress.user_id == user.id,
                SkillProgress.mastery_status == "mastered",
            )
        )
    ).scalar_one()
    active_enrollments = (
        await db.execute(
            select(func.count(PathEnrollment.id)).where(
                PathEnrollment.user_id == user.id,
                PathEnrollment.status == "active",
            )
        )
    ).scalar_one()
    xp_total = (
        await db.execute(
            select(func.coalesce(func.sum(XpTransaction.points), 0)).where(XpTransaction.user_id == user.id)
        )
    ).scalar_one()

    return {
        "lessons_completed": lessons_completed,
        "lessons_in_progress": lessons_in_progress,
        "skills_mastered": skills_mastered,
        "active_enrollments": active_enrollments,
        "xp_total": int(xp_total),
    }


@router.get("/progress/skills")
async def progress_skills(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(SkillProgress, Skill)
            .join(Skill, Skill.id == SkillProgress.skill_id)
            .where(SkillProgress.user_id == user.id)
            .order_by(SkillProgress.updated_at.desc())
        )
    ).all()
    return [
        {
            "skill_id": str(sp.skill_id),
            "skill_name": s.name,
            "skill_code": s.code,
            "category": s.category,
            "mastery_status": sp.mastery_status,
            "mastery_score": float(sp.mastery_score) if sp.mastery_score is not None else None,
            "evidence_count": sp.evidence_count,
            "last_assessed_at": sp.last_assessed_at.isoformat() if sp.last_assessed_at else None,
        }
        for sp, s in rows
    ]
