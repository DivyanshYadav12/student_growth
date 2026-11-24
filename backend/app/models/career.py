from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Numeric, SmallInteger, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.identity import created_at_col, updated_at_col, uuid_pk


class CareerPath(Base):
    __tablename__ = "career_paths"

    id: Mapped[UUID] = uuid_pk()
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    target_role: Mapped[str] = mapped_column(String(160), nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="draft", nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("status IN ('draft','published','archived')", name="ck_career_paths_status"),
    )


class CareerPathSkill(Base):
    __tablename__ = "career_path_skills"

    career_path_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("career_paths.id", ondelete="CASCADE"), primary_key=True)
    skill_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("skills.id", ondelete="RESTRICT"), primary_key=True)
    importance: Mapped[str] = mapped_column(String(20), server_default="required", nullable=False)
    display_order: Mapped[int] = mapped_column(SmallInteger, server_default="0", nullable=False)

    __table_args__ = (
        CheckConstraint("importance IN ('required','recommended','optional')", name="ck_career_path_skills_importance"),
    )


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[UUID] = uuid_pk()
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str | None] = mapped_column(String(20))
    estimated_hours: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    tech_stack: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default="{}", nullable=False)
    repository_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), server_default="draft", nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("difficulty IN ('beginner','intermediate','advanced')", name="ck_projects_difficulty"),
        CheckConstraint("estimated_hours IS NULL OR estimated_hours >= 0", name="ck_projects_hours"),
        CheckConstraint("status IN ('draft','published','archived')", name="ck_projects_status"),
    )


class CareerPathProject(Base):
    __tablename__ = "career_path_projects"

    career_path_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("career_paths.id", ondelete="CASCADE"), primary_key=True)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="RESTRICT"), primary_key=True)
    display_order: Mapped[int] = mapped_column(SmallInteger, server_default="0", nullable=False)


class CareerPathEnrollment(Base):
    __tablename__ = "career_path_enrollments"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    career_path_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("career_paths.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="exploring", nullable=False)
    target_date: Mapped[date | None] = mapped_column(Date)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        UniqueConstraint("user_id", "career_path_id"),
        CheckConstraint("status IN ('exploring','active','paused','completed','withdrawn')", name="ck_career_enrollments_status"),
        Index("ix_career_path_enrollments_user_status", "user_id", "status"),
    )


class UserProjectProgress(Base):
    __tablename__ = "user_project_progress"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    project_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="RESTRICT"), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), server_default="not_started", nullable=False)
    repository_url: Mapped[str | None] = mapped_column(Text)
    demo_url: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("status IN ('not_started','planning','in_progress','completed','abandoned')", name="ck_project_progress_status"),
        Index("ix_user_project_progress_user_status", "user_id", "status"),
    )
