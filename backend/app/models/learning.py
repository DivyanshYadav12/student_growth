from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, SmallInteger, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.identity import created_at_col, updated_at_col, uuid_pk


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[UUID] = uuid_pk()
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    difficulty: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("difficulty IN ('beginner','intermediate','advanced')", name="ck_skills_difficulty"),
    )


class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"

    skill_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    prerequisite_skill_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("skills.id", ondelete="RESTRICT"), primary_key=True)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("skill_id <> prerequisite_skill_id", name="ck_skill_prereq_no_self"),
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[UUID] = uuid_pk()
    skill_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_minutes: Mapped[int | None] = mapped_column(SmallInteger)
    difficulty: Mapped[str | None] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), server_default="draft", nullable=False)
    created_by_user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = created_at_col()
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("estimated_minutes IS NULL OR estimated_minutes > 0", name="ck_lessons_minutes"),
        CheckConstraint("difficulty IN ('beginner','intermediate','advanced')", name="ck_lessons_difficulty"),
        CheckConstraint("status IN ('draft','published','archived')", name="ck_lessons_status"),
        Index("ix_lessons_skill_status", "skill_id", "status"),
    )


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[UUID] = uuid_pk()
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    difficulty: Mapped[str | None] = mapped_column(String(20))
    estimated_hours: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    owner_type: Mapped[str] = mapped_column(String(20), server_default="platform", nullable=False)
    owner_user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    created_by_user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    visibility: Mapped[str] = mapped_column(String(20), server_default="public", nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="draft", nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = created_at_col()
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("difficulty IN ('beginner','intermediate','advanced','mixed')", name="ck_paths_difficulty"),
        CheckConstraint("estimated_hours IS NULL OR estimated_hours >= 0", name="ck_paths_hours"),
        CheckConstraint("owner_type IN ('platform','user')", name="ck_paths_owner_type"),
        CheckConstraint("visibility IN ('public','private')", name="ck_paths_visibility"),
        CheckConstraint("status IN ('draft','published','archived')", name="ck_paths_status"),
        CheckConstraint("(owner_type = 'platform' AND owner_user_id IS NULL) OR (owner_type = 'user' AND owner_user_id IS NOT NULL AND owner_user_id = created_by_user_id)", name="ck_paths_owner_consistency"),
        CheckConstraint("owner_type <> 'platform' OR visibility = 'public'", name="ck_paths_platform_public"),
        Index("ix_learning_paths_discovery", "status", "visibility", "category", postgresql_where="status = 'published'"),
        Index("ix_learning_paths_owner", "owner_user_id", "status", postgresql_where="owner_user_id IS NOT NULL"),
    )


class LearningPathNode(Base):
    __tablename__ = "learning_path_nodes"

    id: Mapped[UUID] = uuid_pk()
    learning_path_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False)
    node_type: Mapped[str] = mapped_column(String(20), nullable=False)
    skill_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("skills.id", ondelete="RESTRICT"))
    lesson_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="RESTRICT"))
    title_override: Mapped[str | None] = mapped_column(String(220))
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        UniqueConstraint("learning_path_id", "display_order"),
        CheckConstraint("display_order >= 0", name="ck_path_nodes_order"),
        CheckConstraint("(node_type = 'skill' AND skill_id IS NOT NULL AND lesson_id IS NULL) OR (node_type = 'lesson' AND lesson_id IS NOT NULL AND skill_id IS NULL)", name="ck_path_nodes_type_target"),
        Index("ix_path_nodes_path_order", "learning_path_id", "display_order"),
    )


class LearningPathNodePrerequisite(Base):
    __tablename__ = "learning_path_node_prerequisites"

    node_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("learning_path_nodes.id", ondelete="CASCADE"), primary_key=True)
    prerequisite_node_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("learning_path_nodes.id", ondelete="CASCADE"), primary_key=True)

    __table_args__ = (
        CheckConstraint("node_id <> prerequisite_node_id", name="ck_node_prereq_no_self"),
    )


class PathEnrollment(Base):
    __tablename__ = "path_enrollments"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    learning_path_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="active", nullable=False)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("user_id", "learning_path_id"),
        CheckConstraint("status IN ('active','completed','paused','withdrawn')", name="ck_path_enrollments_status"),
        Index("ix_path_enrollments_user_status", "user_id", "status", "last_activity_at"),
    )


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    lesson_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), server_default="not_started", nullable=False)
    progress_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), server_default="0", nullable=False)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    first_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_accessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint("status IN ('not_started','in_progress','completed','needs_revision')", name="ck_lesson_progress_status"),
        CheckConstraint("progress_percent BETWEEN 0 AND 100", name="ck_lesson_progress_percent"),
        CheckConstraint("time_spent_seconds >= 0", name="ck_lesson_progress_time"),
        Index("ix_lesson_progress_user_status", "user_id", "status"),
    )


class SkillProgress(Base):
    __tablename__ = "skill_progress"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    skill_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    mastery_status: Mapped[str] = mapped_column(String(20), server_default="not_started", nullable=False)
    mastery_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    evidence_count: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    last_assessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("mastery_status IN ('not_started','learning','practiced','mastered','needs_revision')", name="ck_skill_progress_status"),
        CheckConstraint("mastery_score IS NULL OR mastery_score BETWEEN 0 AND 100", name="ck_skill_progress_score"),
        CheckConstraint("evidence_count >= 0", name="ck_skill_progress_evidence"),
        Index("ix_skill_progress_user_mastery", "user_id", "mastery_status"),
    )


class SkillMasteryEvent(Base):
    __tablename__ = "skill_mastery_events"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    source_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    previous_status: Mapped[str | None] = mapped_column(String(20))
    new_status: Mapped[str] = mapped_column(String(20), nullable=False)
    score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    evidence: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("source_type IN ('lesson','coding_submission','assessment','viva','manual_review')", name="ck_mastery_events_source"),
        CheckConstraint("new_status IN ('not_started','learning','practiced','mastered','needs_revision')", name="ck_mastery_events_status"),
        CheckConstraint("score IS NULL OR score BETWEEN 0 AND 100", name="ck_mastery_events_score"),
        Index("ix_skill_events_user_time", "user_id", func.desc(occurred_at)),
    )
