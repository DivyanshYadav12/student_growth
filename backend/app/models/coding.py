from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.identity import created_at_col, updated_at_col, uuid_pk


class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id: Mapped[UUID] = uuid_pk()
    skill_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("skills.id", ondelete="SET NULL"))
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    statement_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    supported_languages: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default="{cpp}", nullable=False)
    constraints_text: Mapped[str | None] = mapped_column(Text)
    input_format: Mapped[str | None] = mapped_column(Text)
    output_format: Mapped[str | None] = mapped_column(Text)
    time_limit_ms: Mapped[int] = mapped_column(Integer, server_default="2000", nullable=False)
    memory_limit_mb: Mapped[int] = mapped_column(Integer, server_default="256", nullable=False)
    starter_code: Mapped[str | None] = mapped_column(Text)
    editorial_markdown: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), server_default="draft", nullable=False)
    created_by_user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = created_at_col()
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("difficulty IN ('easy','medium','hard')", name="ck_problems_difficulty"),
        CheckConstraint("time_limit_ms BETWEEN 100 AND 30000", name="ck_problems_time_limit"),
        CheckConstraint("memory_limit_mb BETWEEN 16 AND 2048", name="ck_problems_memory_limit"),
        CheckConstraint("status IN ('draft','published','archived')", name="ck_problems_status"),
        Index("ix_coding_problems_skill_difficulty", "skill_id", "difficulty", "status"),
    )


class CodingTestCase(Base):
    __tablename__ = "coding_test_cases"

    id: Mapped[UUID] = uuid_pk()
    problem_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("coding_problems.id", ondelete="CASCADE"), nullable=False)
    input_data: Mapped[str] = mapped_column(Text, nullable=False)
    expected_output: Mapped[str] = mapped_column(Text, nullable=False)
    is_sample: Mapped[bool] = mapped_column(nullable=False, server_default="false")
    display_order: Mapped[int] = mapped_column(SmallInteger, server_default="0", nullable=False)
    points: Mapped[float] = mapped_column(Numeric(7, 2), server_default="1", nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        CheckConstraint("points >= 0", name="ck_test_cases_points"),
        Index("ix_coding_test_cases_problem", "problem_id", "is_sample"),
    )


class CodeSubmission(Base):
    __tablename__ = "code_submissions"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    problem_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("coding_problems.id", ondelete="RESTRICT"), nullable=False)
    language: Mapped[str] = mapped_column(String(30), nullable=False)
    source_code: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(24), server_default="queued", nullable=False)
    score: Mapped[float | None] = mapped_column(Numeric(7, 2))
    max_score: Mapped[float | None] = mapped_column(Numeric(7, 2))
    execution_time_ms: Mapped[int | None] = mapped_column(Integer)
    memory_used_kb: Mapped[int | None] = mapped_column(Integer)
    result_summary: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    worker_job_id: Mapped[str | None] = mapped_column(String(160))
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    evaluated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint("status IN ('queued','running','accepted','wrong_answer','time_limit','memory_limit','runtime_error','compile_error','system_error')", name="ck_submissions_status"),
        Index("ix_code_submissions_user_time", "user_id", func.desc(submitted_at)),
        Index("ix_code_submissions_problem", "problem_id", func.desc(submitted_at)),
        Index("ix_code_submissions_status_time", "status", "submitted_at", postgresql_where="status IN ('queued','running')"),
    )
