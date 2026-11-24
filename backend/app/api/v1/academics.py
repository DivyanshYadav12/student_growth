from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_optional_user, user_role_codes
from app.core.errors import bad_request, forbidden, not_found
from app.database import get_db
from app.models.academics import (
    AcademicProgram,
    AcademicResource,
    AcademicSemester,
    AcademicSubject,
    CurriculumVersion,
    SemesterSubject,
    SyllabusUnit,
)
from app.models.identity import User

router = APIRouter(prefix="/academics", tags=["academics"])


async def _is_admin(db_user: User | None) -> bool:
    return db_user is not None and "admin" in user_role_codes(db_user)


@router.get("/programs")
async def list_programs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AcademicProgram)
        .where(AcademicProgram.is_active.is_(True))
        .order_by(AcademicProgram.degree_name, AcademicProgram.branch_name)
    )
    programs = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "code": p.code,
            "degree_name": p.degree_name,
            "branch_name": p.branch_name,
            "scope": p.scope,
            "institution_name": p.institution_name,
            "description": p.description,
        }
        for p in programs
    ]


@router.get("/programs/{program_id}/structure")
async def program_structure(program_id: UUID, db: AsyncSession = Depends(get_db)):
    """Nested curriculum overview: semesters -> subject offerings -> unit counts."""
    program = await db.get(AcademicProgram, program_id)
    if program is None or not program.is_active:
        raise not_found("Academic program not found.")

    versions = (
        await db.execute(
            select(CurriculumVersion)
            .where(CurriculumVersion.program_id == program.id, CurriculumVersion.status == "published")
            .order_by(CurriculumVersion.created_at.desc())
        )
    ).scalars().all()

    out_versions = []
    for version in versions:
        semesters = (
            await db.execute(
                select(AcademicSemester)
                .where(AcademicSemester.curriculum_version_id == version.id)
                .order_by(AcademicSemester.semester_number)
            )
        ).scalars().all()

        sem_out = []
        for sem in semesters:
            offerings = (
                await db.execute(
                    select(SemesterSubject)
                    .where(SemesterSubject.semester_id == sem.id)
                    .order_by(SemesterSubject.display_order)
                )
            ).scalars().all()

            subject_out = []
            for off in offerings:
                subject = await db.get(AcademicSubject, off.subject_id)
                unit_count = (
                    await db.execute(
                        select(func.count(SyllabusUnit.id)).where(SyllabusUnit.semester_subject_id == off.id)
                    )
                ).scalar_one()
                resource_count = (
                    await db.execute(
                        select(func.count(AcademicResource.id)).where(
                            AcademicResource.subject_offering_id == off.id,
                            AcademicResource.publication_status == "published",
                        )
                    )
                ).scalar_one()
                subject_out.append(
                    {
                        "id": str(off.id),
                        "subject_id": str(off.subject_id),
                        "code": off.local_subject_code,
                        "title": subject.title if subject else "Unknown",
                        "credits": float(off.credits) if off.credits is not None else None,
                        "subject_type": off.subject_type,
                        "unit_count": unit_count,
                        "resource_count": resource_count,
                    }
                )

            sem_out.append(
                {
                    "id": str(sem.id),
                    "semester_number": sem.semester_number,
                    "title": sem.title,
                    "subjects": subject_out,
                }
            )

        out_versions.append(
            {
                "id": str(version.id),
                "version_name": version.version_name,
                "effective_from_year": version.effective_from_year,
                "semesters": sem_out,
            }
        )

    return {
        "id": str(program.id),
        "code": program.code,
        "degree_name": program.degree_name,
        "branch_name": program.branch_name,
        "scope": program.scope,
        "description": program.description,
        "curriculum_versions": out_versions,
    }


@router.get("/subjects/{subject_offering_id}")
async def subject_detail(subject_offering_id: UUID, db: AsyncSession = Depends(get_db)):
    offering = await db.get(SemesterSubject, subject_offering_id)
    if offering is None:
        raise not_found("Subject offering not found.")

    subject = await db.get(AcademicSubject, offering.subject_id)
    if subject is None:
        raise not_found("Subject not found.")

    semester = await db.get(AcademicSemester, offering.semester_id)

    units = (
        await db.execute(
            select(SyllabusUnit)
            .where(SyllabusUnit.semester_subject_id == offering.id)
            .order_by(SyllabusUnit.display_order, SyllabusUnit.unit_number)
        )
    ).scalars().all()

    resource_counts = dict(
        (
            await db.execute(
                select(AcademicResource.unit_id, func.count(AcademicResource.id))
                .where(
                    AcademicResource.subject_offering_id == offering.id,
                    AcademicResource.publication_status == "published",
                    AcademicResource.unit_id.is_not(None),
                )
                .group_by(AcademicResource.unit_id)
            )
        ).all()
    )

    return {
        "id": str(offering.id),
        "code": offering.local_subject_code,
        "title": subject.title,
        "description": subject.description,
        "subject_area": subject.subject_area,
        "credits": float(offering.credits) if offering.credits is not None else None,
        "subject_type": offering.subject_type,
        "semester": {
            "id": str(semester.id) if semester else None,
            "number": semester.semester_number if semester else None,
            "title": semester.title if semester else None,
        },
        "units": [
            {
                "id": str(u.id),
                "unit_number": u.unit_number,
                "title": u.title,
                "description": u.description,
                "learning_outcomes": u.learning_outcomes,
                "resource_count": resource_counts.get(u.id, 0),
            }
            for u in units
        ],
    }


@router.get("/resources")
async def list_resources(
    subject_offering_id: UUID | None = Query(default=None),
    unit_id: UUID | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    is_admin = await _is_admin(user)

    stmt = select(AcademicResource)
    count_stmt = select(func.count(AcademicResource.id))

    if not is_admin:
        if user is not None:
            stmt = stmt.where(or_(AcademicResource.publication_status == "published", AcademicResource.created_by_user_id == user.id))
            count_stmt = count_stmt.where(or_(AcademicResource.publication_status == "published", AcademicResource.created_by_user_id == user.id))
        else:
            stmt = stmt.where(AcademicResource.publication_status == "published")
            count_stmt = count_stmt.where(AcademicResource.publication_status == "published")
    if subject_offering_id is not None:
        stmt = stmt.where(AcademicResource.subject_offering_id == subject_offering_id)
        count_stmt = count_stmt.where(AcademicResource.subject_offering_id == subject_offering_id)
    if unit_id is not None:
        stmt = stmt.where(AcademicResource.unit_id == unit_id)
        count_stmt = count_stmt.where(AcademicResource.unit_id == unit_id)
    if resource_type is not None:
        stmt = stmt.where(AcademicResource.resource_type == resource_type)
        count_stmt = count_stmt.where(AcademicResource.resource_type == resource_type)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(
        stmt.order_by(AcademicResource.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    resources = result.scalars().all()

    return {
        "items": [
            {
                "id": str(r.id),
                "title": r.title,
                "resource_type": r.resource_type,
                "summary": r.summary,
                "verification_status": r.verification_status,
                "publication_status": r.publication_status,
                "publication_date": r.publication_date.isoformat() if r.publication_date else None,
                "author_name": r.author_name,
                "source_title": r.source_title,
                "external_url": r.external_url,
                "unit_id": str(r.unit_id) if r.unit_id else None,
                "subject_offering_id": str(r.subject_offering_id),
            }
            for r in resources
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/resources/{resource_id}")
async def resource_detail(
    resource_id: UUID,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    resource = await db.execute(select(AcademicResource).where(AcademicResource.id == resource_id))
    r = resource.scalar_one_or_none()
    if r is None:
        raise not_found("Resource not found.")

    is_admin = await _is_admin(user)
    if r.publication_status != "published" and not is_admin:
        raise not_found("Resource not found.")

    return {
        "id": str(r.id),
        "title": r.title,
        "resource_type": r.resource_type,
        "summary": r.summary,
        "content_markdown": r.content_markdown,
        "external_url": r.external_url,
        "source_title": r.source_title,
        "source_url": r.source_url,
        "author_name": r.author_name,
        "publication_date": r.publication_date.isoformat() if r.publication_date else None,
        "verification_status": r.verification_status,
        "publication_status": r.publication_status,
        "unit_id": str(r.unit_id) if r.unit_id else None,
        "subject_offering_id": str(r.subject_offering_id),
        "published_at": r.published_at.isoformat() if r.published_at else None,
    }


# ---------------------------------------------------------------------------
# Resource authoring (draft -> publish)
# ---------------------------------------------------------------------------

RESOURCE_TYPES = {"notes", "experiment", "viva", "question_bank", "previous_paper", "reference", "assignment", "external_link"}


class ResourceCreate(BaseModel):
    subject_offering_id: UUID
    unit_id: UUID | None = None
    resource_type: str = Field(min_length=1, max_length=30)
    title: str = Field(min_length=3, max_length=240)
    summary: str | None = Field(default=None, max_length=2000)
    content_markdown: str | None = Field(default=None, max_length=100_000)
    external_url: str | None = Field(default=None, max_length=2000)
    source_title: str | None = Field(default=None, max_length=240)
    author_name: str | None = Field(default=None, max_length=160)


class ResourceUpdate(BaseModel):
    unit_id: UUID | None = None
    resource_type: str | None = Field(default=None, min_length=1, max_length=30)
    title: str | None = Field(default=None, min_length=3, max_length=240)
    summary: str | None = Field(default=None, max_length=2000)
    content_markdown: str | None = Field(default=None, max_length=100_000)
    external_url: str | None = Field(default=None, max_length=2000)
    source_title: str | None = Field(default=None, max_length=240)
    author_name: str | None = Field(default=None, max_length=160)


def _resource_out(r: AcademicResource) -> dict:
    return {
        "id": str(r.id),
        "title": r.title,
        "resource_type": r.resource_type,
        "summary": r.summary,
        "verification_status": r.verification_status,
        "publication_status": r.publication_status,
        "publication_date": r.publication_date.isoformat() if r.publication_date else None,
        "author_name": r.author_name,
        "source_title": r.source_title,
        "external_url": r.external_url,
        "unit_id": str(r.unit_id) if r.unit_id else None,
        "subject_offering_id": str(r.subject_offering_id),
        "created_by_user_id": str(r.created_by_user_id) if r.created_by_user_id else None,
        "published_at": r.published_at.isoformat() if r.published_at else None,
    }


def _validate_resource_type(payload_type: str, external_url: str | None):
    if payload_type not in RESOURCE_TYPES:
        raise bad_request(f"resource_type must be one of: {', '.join(sorted(RESOURCE_TYPES))}.", code="INVALID_RESOURCE_TYPE")
    if payload_type == "external_link" and not external_url:
        raise bad_request("external_link resources require external_url.", code="MISSING_URL")
    if payload_type != "external_link" and external_url:
        raise bad_request("external_url is only allowed for external_link resources.", code="UNEXPECTED_URL")


async def _can_moderate(db: AsyncSession, user: User, resource: AcademicResource) -> bool:
    return await _is_admin(user) or resource.created_by_user_id == user.id


@router.post("/resources", status_code=status.HTTP_201_CREATED)
async def create_resource(
    payload: ResourceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    offering = await db.get(SemesterSubject, payload.subject_offering_id)
    if offering is None:
        raise not_found("Subject offering not found.")
    if payload.unit_id is not None:
        unit = await db.get(SyllabusUnit, payload.unit_id)
        if unit is None or unit.semester_subject_id != payload.subject_offering_id:
            raise bad_request("unit_id must belong to the same subject offering.", code="INVALID_UNIT")
    _validate_resource_type(payload.resource_type, payload.external_url)

    resource = AcademicResource(
        subject_offering_id=payload.subject_offering_id,
        unit_id=payload.unit_id,
        resource_type=payload.resource_type,
        title=payload.title.strip(),
        summary=payload.summary,
        content_markdown=payload.content_markdown,
        external_url=payload.external_url,
        source_title=payload.source_title,
        author_name=payload.author_name or user.full_name,
        verification_status="unverified",
        publication_status="draft",
        created_by_user_id=user.id,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return _resource_out(resource)


@router.patch("/resources/{resource_id}")
async def update_resource(
    resource_id: UUID,
    payload: ResourceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resource = await db.get(AcademicResource, resource_id)
    if resource is None:
        raise not_found("Resource not found.")
    if not await _can_moderate(db, user, resource):
        raise forbidden("You can only edit resources you created.")

    data = payload.model_dump(exclude_unset=True)
    new_type = data.get("resource_type", resource.resource_type)
    new_url = data.get("external_url", resource.external_url)
    _validate_resource_type(new_type, new_url)
    if "unit_id" in data and data["unit_id"] is not None:
        unit = await db.get(SyllabusUnit, data["unit_id"])
        if unit is None or unit.semester_subject_id != resource.subject_offering_id:
            raise bad_request("unit_id must belong to the same subject offering.", code="INVALID_UNIT")

    for field, value in data.items():
        setattr(resource, field, value.strip() if isinstance(value, str) else value)
    await db.commit()
    await db.refresh(resource)
    return _resource_out(resource)


@router.post("/resources/{resource_id}/publish")
async def publish_resource(
    resource_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resource = await db.get(AcademicResource, resource_id)
    if resource is None:
        raise not_found("Resource not found.")
    roles = set(user_role_codes(user))
    if not ({"admin", "content_reviewer"} & roles):
        raise forbidden("Only admins and content reviewers can publish resources.")

    resource.publication_status = "published"
    resource.published_at = datetime.now(timezone.utc)
    resource.publication_date = date.today()
    await db.commit()
    await db.refresh(resource)
    return _resource_out(resource)
