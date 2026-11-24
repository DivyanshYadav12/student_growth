from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.identity import created_at_col, updated_at_col, uuid_pk


class AiConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    conversation_type: Mapped[str] = mapped_column(String(24), nullable=False)
    title: Mapped[str | None] = mapped_column(String(220))
    context_metadata: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    created_at: Mapped[datetime] = created_at_col()
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("conversation_type IN ('tutor','viva','career_guidance')", name="ck_ai_conversations_type"),
        Index("ix_ai_conversations_user_time", "user_id", func.desc(updated_at)),
    )


class AiMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[UUID] = uuid_pk()
    conversation_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[list] = mapped_column(JSONB, server_default="[]", nullable=False)
    model_metadata: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    prompt_version: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("role IN ('system','user','assistant','tool')", name="ck_ai_messages_role"),
        Index("ix_ai_messages_conversation_time", "conversation_id", "created_at"),
    )


class AiUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    conversation_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="SET NULL"))
    feature: Mapped[str] = mapped_column(String(30), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(80))
    model_name: Mapped[str | None] = mapped_column(String(120))
    input_tokens: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("input_tokens >= 0", name="ck_ai_usage_input_tokens"),
        CheckConstraint("output_tokens >= 0", name="ck_ai_usage_output_tokens"),
        CheckConstraint("latency_ms IS NULL OR latency_ms >= 0", name="ck_ai_usage_latency"),
        CheckConstraint("outcome IN ('success','error','rate_limited','timeout')", name="ck_ai_usage_outcome"),
        Index("ix_ai_usage_user_time", "user_id", func.desc(created_at)),
    )


class AiRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recommendation_type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text)
    target_type: Mapped[str | None] = mapped_column(String(40))
    target_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    priority: Mapped[int] = mapped_column(SmallInteger, server_default="3", nullable=False)
    evidence_snapshot: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="active", nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("recommendation_type IN ('next_topic','revision','practice','career_activity','daily_goal')", name="ck_recommendations_type"),
        CheckConstraint("priority BETWEEN 1 AND 5", name="ck_recommendations_priority"),
        CheckConstraint("status IN ('active','accepted','dismissed','completed','expired')", name="ck_recommendations_status"),
        Index("ix_ai_recommendations_user_status", "user_id", "status", func.desc(priority)),
    )
