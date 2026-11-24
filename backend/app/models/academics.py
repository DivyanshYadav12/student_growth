from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, Numeric, SmallInteger, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.identity import created_at_col, updated_at_col, uuid_pk


class AcademicProgram(Base):
    __tablename__ = "academic_programs"

    id: Mapped[UUID] = uuid_pk()
    code: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    degree_name: Mapped[str] = mapped_column(String(120), nullable=False)
    branch_name: Mapped[str] = mapped_column(String(160), nullable=False)
    institution_name: Mapped[str | None] = mapped_column(String(200))
    scope: Mapped[str] = mapped_column(String(20), server_default="global", nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("scope IN ('global','institution')", name="ck_programs_scope"),
        CheckConstraint("(scope = 'global' AND institution_name IS NULL) OR (scope = 'institution' AND institution_name IS NOT NULL)", name="ck_programs_scope_institution"),
    )


class CurriculumVersion(Base):
    __tablename__ = "curriculum_versions"

    id: Mapped[UUID] = uuid_pk()
    program_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("academic_programs.id", ondelete="RESTRICT"), nullable=False)
    version_name: Mapped[str] = mapped_column(String(100), nullable=False)
    effective_from_year: Mapped[int | None] = mapped_column(SmallInteger)
    effective_to_year: Mapped[int | None] = mapped_column(SmallInteger)
    status: Mapped[str] = mapped_column(String(20), server_default="draft", nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        UniqueConstraint("program_id", "version_name"),
        CheckConstraint("status IN ('draft','published','retired')", name="ck_curriculum_status"),
        CheckConstraint("effective_to_year IS NULL OR effective_from_year IS NULL OR effective_to_year >= effective_from_year", name="ck_curriculum_years"),
    )


class AcademicSemester(Base):
    __tablename__ = "academic_semesters"

    id: Mapped[UUID] = uuid_pk()
    curriculum_version_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("curriculum_versions.id", ondelete="CASCADE"), nullable=False)
    semester_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    title: Mapped[str | None] = mapped_column(String(100))

    __table_args__ = (
        UniqueConstraint("curriculum_version_id", "semester_number"),
        CheckConstraint("semester_number BETWEEN 1 AND 12", name="ck_semesters_number"),
    )


class UserCurriculumEnrollment(Base):
    __tablename__ = "user_curriculum_enrollments"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    curriculum_version_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("curriculum_versions.id", ondelete="RESTRICT"), nullable=False)
    current_semester_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("academic_semesters.id", ondelete="SET NULL"))
    enrollment_status: Mapped[str] = mapped_column(String(20), server_default="active", nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    started_at: Mapped[date | None] = mapped_column(Date)
    ended_at: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        UniqueConstraint("user_id", "curriculum_version_id"),
        CheckConstraint("enrollment_status IN ('active','completed','paused','withdrawn')", name="ck_enrollment_status"),
        CheckConstraint("ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at", name="ck_enrollment_dates"),
        Index("uq_user_primary_curriculum", "user_id", unique=True, postgresql_where="is_primary = true AND enrollment_status = 'active'"),
        Index("ix_user_curriculum_status", "user_id", "enrollment_status"),
    )


class AcademicSubject(Base):
    __tablename__ = "academic_subjects"

    id: Mapped[UUID] = uuid_pk()
    canonical_code: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    subject_area: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = created_at_col()


class SemesterSubject(Base):
    __tablename__ = "semester_subjects"

    id: Mapped[UUID] = uuid_pk()
    semester_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("academic_semesters.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("academic_subjects.id", ondelete="RESTRICT"), nullable=False)
    local_subject_code: Mapped[str | None] = mapped_column(String(60))
    credits: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))
    subject_type: Mapped[str] = mapped_column(String(20), server_default="core", nullable=False)
    display_order: Mapped[int] = mapped_column(SmallInteger, server_default="0", nullable=False)

    __table_args__ = (
        UniqueConstraint("semester_id", "subject_id"),
        UniqueConstraint("semester_id", "local_subject_code"),
        CheckConstraint("credits IS NULL OR credits >= 0", name="ck_semester_subjects_credits"),
        CheckConstraint("subject_type IN ('core','elective','lab','project')", name="ck_semester_subjects_type"),
    )


class SyllabusUnit(Base):
    __tablename__ = "syllabus_units"

    id: Mapped[UUID] = uuid_pk()
    semester_subject_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("semester_subjects.id", ondelete="CASCADE"), nullable=False)
    unit_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    learning_outcomes: Mapped[list] = mapped_column(JSONB, server_default="[]", nullable=False)
    display_order: Mapped[int] = mapped_column(SmallInteger, server_default="0", nullable=False)

    __table_args__ = (
        UniqueConstraint("semester_subject_id", "unit_number"),
        CheckConstraint("unit_number > 0", name="ck_units_number"),
    )


class AcademicResource(Base):
    __tablename__ = "academic_resources"

    id: Mapped[UUID] = uuid_pk()
    unit_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("syllabus_units.id", ondelete="SET NULL"))
    subject_offering_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("semester_subjects.id", ondelete="CASCADE"), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    content_markdown: Mapped[str | None] = mapped_column(Text)
    external_url: Mapped[str | None] = mapped_column(Text)
    file_asset_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("file_assets.id", ondelete="SET NULL"))
    source_title: Mapped[str | None] = mapped_column(String(240))
    source_url: Mapped[str | None] = mapped_column(Text)
    author_name: Mapped[str | None] = mapped_column(String(160))
    publication_date: Mapped[date | None] = mapped_column(Date)
    verification_status: Mapped[str] = mapped_column(String(20), server_default="unverified", nullable=False)
    publication_status: Mapped[str] = mapped_column(String(20), server_default="draft", nullable=False)
    created_by_user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = created_at_col()
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("resource_type IN ('notes','experiment','viva','question_bank','previous_paper','reference','assignment','external_link')", name="ck_resources_type"),
        CheckConstraint("verification_status IN ('unverified','in_review','verified','rejected')", name="ck_resources_verification"),
        CheckConstraint("publication_status IN ('draft','published','archived')", name="ck_resources_publication"),
        CheckConstraint("resource_type <> 'external_link' OR external_url IS NOT NULL", name="ck_resources_external_url_required"),
        CheckConstraint("resource_type = 'external_link' OR external_url IS NULL", name="ck_resources_external_url_only_for_links"),
        Index("ix_resources_subject_status", "subject_offering_id", "publication_status", "resource_type"),
        Index("ix_resources_unit", "unit_id", postgresql_where="unit_id IS NOT NULL"),
        Index("ix_resources_created_by", "created_by_user_id"),
    )


class ResourceBookmark(Base):
    __tablename__ = "resource_bookmarks"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    resource_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("academic_resources.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = created_at_col()


class ResourceRating(Base):
    __tablename__ = "resource_ratings"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    resource_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("academic_resources.id", ondelete="CASCADE"), primary_key=True)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    review: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = created_at_col()
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_ratings_rating"),
    )
