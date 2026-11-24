from datetime import date, datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.identity import created_at_col, uuid_pk


class XpTransaction(Base):
    __tablename__ = "xp_transactions"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    reason_code: Mapped[str] = mapped_column(String(60), nullable=False)
    reference_type: Mapped[str | None] = mapped_column(String(40))
    reference_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    idempotency_key: Mapped[str] = mapped_column(String(180), nullable=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, server_default="{}", nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("points <> 0", name="ck_xp_points_nonzero"),
        UniqueConstraint("user_id", "idempotency_key"),
        Index("ix_xp_transactions_user_time", "user_id", func.desc(created_at)),
    )


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[UUID] = uuid_pk()
    code: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon_key: Mapped[str | None] = mapped_column(String(80))
    criteria: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    is_active: Mapped[bool] = mapped_column(server_default="true", nullable=False)

    __table_args__ = (
        CheckConstraint("xp_reward >= 0", name="ck_achievements_xp"),
    )


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    achievement_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("achievements.id", ondelete="RESTRICT"), primary_key=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserActivityEvent(Base):
    __tablename__ = "user_activity_events"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50))
    entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    event_data: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_activity_events_user_time", "user_id", func.desc(occurred_at)),
    )


class ProgressSnapshot(Base):
    __tablename__ = "progress_snapshots"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)
    learning_minutes: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    lessons_completed: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    problems_solved: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    assessments_taken: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    xp_earned: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    metrics: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "snapshot_date"),
        CheckConstraint("learning_minutes >= 0", name="ck_snapshots_learning_minutes"),
        CheckConstraint("lessons_completed >= 0", name="ck_snapshots_lessons"),
        CheckConstraint("problems_solved >= 0", name="ck_snapshots_problems"),
        CheckConstraint("assessments_taken >= 0", name="ck_snapshots_assessments"),
        CheckConstraint("xp_earned >= 0", name="ck_snapshots_xp"),
        Index("ix_progress_snapshots_user_date", "user_id", func.desc(snapshot_date)),
    )
