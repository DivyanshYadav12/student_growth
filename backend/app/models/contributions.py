from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.identity import created_at_col, updated_at_col, uuid_pk


class Contribution(Base):
    __tablename__ = "contributions"

    id: Mapped[UUID] = uuid_pk()
    contributor_user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    contribution_type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    content_markdown: Mapped[str | None] = mapped_column(Text)
    file_asset_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("file_assets.id", ondelete="SET NULL"))
    subject_offering_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("semester_subjects.id", ondelete="SET NULL"))
    unit_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("syllabus_units.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(24), server_default="pending_review", nullable=False)
    published_resource_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("academic_resources.id", ondelete="SET NULL"))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = created_at_col()
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("contribution_type IN ('notes','experiment','viva_questions','explanation','coding_problem','project_tutorial','external_resource')", name="ck_contributions_type"),
        CheckConstraint("status IN ('draft','pending_review','in_review','changes_requested','approved','rejected','withdrawn')", name="ck_contributions_status"),
        Index("ix_contributions_status_time", "status", func.desc(submitted_at)),
        Index("ix_contributions_user", "contributor_user_id", func.desc(created_at)),
    )


class ContributionVersion(Base):
    __tablename__ = "contribution_versions"

    id: Mapped[UUID] = uuid_pk()
    contribution_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("contributions.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    content_markdown: Mapped[str | None] = mapped_column(Text)
    file_asset_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("file_assets.id", ondelete="SET NULL"))
    change_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        UniqueConstraint("contribution_id", "version_number"),
        CheckConstraint("version_number > 0", name="ck_contribution_versions_number"),
    )


class ContributionReview(Base):
    __tablename__ = "contribution_reviews"

    id: Mapped[UUID] = uuid_pk()
    contribution_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("contributions.id", ondelete="CASCADE"), nullable=False)
    reviewer_user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    decision: Mapped[str] = mapped_column(String(24), nullable=False)
    review_notes: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("decision IN ('approved','changes_requested','rejected')", name="ck_reviews_decision"),
    )
