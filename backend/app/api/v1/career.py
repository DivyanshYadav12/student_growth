from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.database import get_db
from app.models.career import CareerPath, CareerPathSkill, Project, UserProjectProgress
from app.models.identity import User
from app.models.learning import Skill
from app.core.deps import get_optional_user

router = APIRouter(prefix="/career", tags=["career"])


@router.get("/paths")
async def list_career_paths(db: AsyncSession = Depends(get_db)):
    paths = (
        await db.execute(
            select(CareerPath).where(CareerPath.status == "published").order_by(CareerPath.title)
        )
    ).scalars().all()
    return [
        {
            "id": str(p.id),
            "slug": p.slug,
            "title": p.title,
            "description": p.description,
            "target_role": p.target_role,
            "status": p.status,
        }
        for p in paths
    ]


@router.get("/paths/{path_id}")
async def career_path_detail(
    path_id: UUID,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    path = await db.get(CareerPath, path_id)
    if path is None or path.status != "published":
        raise not_found("Career path not found.")

    links = (
        await db.execute(
            select(CareerPathSkill, Skill)
            .join(Skill, Skill.id == CareerPathSkill.skill_id)
            .where(CareerPathSkill.career_path_id == path.id)
            .order_by(CareerPathSkill.display_order)
        )
    ).all()

    return {
        "id": str(path.id),
        "slug": path.slug,
        "title": path.title,
        "description": path.description,
        "target_role": path.target_role,
        "skills": [
            {
                "skill_id": str(link.skill_id),
                "name": s.name,
                "code": s.code,
                "category": s.category,
                "difficulty": s.difficulty,
                "importance": link.importance,
            }
            for link, s in links
        ],
    }


@router.get("/projects")
async def list_projects(
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    projects = (
        await db.execute(
            select(Project).where(Project.status == "published").order_by(Project.difficulty, Project.title)
        )
    ).scalars().all()

    my_progress = {}
    if user is not None and projects:
        rows = await db.execute(
            select(UserProjectProgress).where(
                UserProjectProgress.user_id == user.id,
                UserProjectProgress.project_id.in_([p.id for p in projects]),
            )
        )
        my_progress = {r.project_id: r.status for r in rows.scalars().all()}

    return [
        {
            "id": str(p.id),
            "slug": p.slug,
            "title": p.title,
            "description": p.description,
            "difficulty": p.difficulty,
            "estimated_hours": float(p.estimated_hours) if p.estimated_hours is not None else None,
            "tech_stack": p.tech_stack,
            "repository_url": p.repository_url,
            "my_status": my_progress.get(p.id, "not_started"),
        }
        for p in projects
    ]
