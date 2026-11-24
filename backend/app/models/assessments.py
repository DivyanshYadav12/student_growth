from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, SmallInteger, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.identity import created_at_col, updated_at_col, uuid_pk


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[UUID] = uuid_pk()
    slug: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    assessment_type: Mapped[str] = mapped_column(String(30), nullable=False)
    subject_offering_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("semester_subjects.id", ondelete="SET NULL"))
    learning_path_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("learning_paths.id", ondelete="SET NULL"))
    difficulty: Mapped[str | None] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), server_default="draft", nullable=False)
    created_by_user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = created_at_col()
    updated_at: Mapped[datetime] = updated_at_col()

    __table_args__ = (
        CheckConstraint("assessment_type IN ('academic_mock','unit_test','practical','viva','dsa','technical_mock','placement_simulation')", name="ck_assessments_type"),
        CheckConstraint("difficulty IN ('beginner','intermediate','advanced','mixed')", name="ck_assessments_difficulty"),
        CheckConstraint("status IN ('draft','published','archived')", name="ck_assessments_status"),
        Index("ix_assessments_type_status", "assessment_type", "status"),
    )


class AssessmentVersion(Base):
    __tablename__ = "assessment_versions"

    id: Mapped[UUID] = uuid_pk()
    assessment_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    total_marks: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    pass_marks: Mapped[float | None] = mapped_column(Numeric(8, 2))
    negative_marking: Mapped[float] = mapped_column(Numeric(6, 2), server_default="0", nullable=False)
    randomize_questions: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    max_attempts: Mapped[int | None] = mapped_column(SmallInteger)
    instructions: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        UniqueConstraint("assessment_id", "version_number"),
        CheckConstraint("version_number > 0", name="ck_assessment_versions_number"),
        CheckConstraint("duration_seconds > 0", name="ck_assessment_versions_duration"),
        CheckConstraint("total_marks > 0", name="ck_assessment_versions_total_marks"),
        CheckConstraint("pass_marks IS NULL OR (pass_marks >= 0 AND pass_marks <= total_marks)", name="ck_assessment_versions_pass_marks"),
        CheckConstraint("negative_marking >= 0", name="ck_assessment_versions_negative"),
        CheckConstraint("max_attempts IS NULL OR max_attempts > 0", name="ck_assessment_versions_max_attempts"),
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[UUID] = uuid_pk()
    question_code: Mapped[str | None] = mapped_column(String(100), unique=True)
    created_by_user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = created_at_col()


class QuestionVersion(Base):
    __tablename__ = "question_versions"

    id: Mapped[UUID] = uuid_pk()
    question_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    question_type: Mapped[str] = mapped_column(String(20), nullable=False)
    prompt_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text)
    expected_answer: Mapped[str | None] = mapped_column(Text)
    grading_rubric: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    coding_problem_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("coding_problems.id", ondelete="RESTRICT"))
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        UniqueConstraint("question_id", "version_number"),
        CheckConstraint("version_number > 0", name="ck_question_versions_number"),
        CheckConstraint("question_type IN ('mcq_single','mcq_multiple','short_text','long_text','code','sql')", name="ck_question_versions_type"),
        CheckConstraint("(question_type = 'code' AND coding_problem_id IS NOT NULL) OR (question_type <> 'code' AND coding_problem_id IS NULL)", name="ck_question_versions_code_problem"),
    )


class QuestionOption(Base):
    __tablename__ = "question_options"

    id: Mapped[UUID] = uuid_pk()
    question_version_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("question_versions.id", ondelete="CASCADE"), nullable=False)
    option_key: Mapped[str] = mapped_column(String(20), nullable=False)
    option_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    display_order: Mapped[int] = mapped_column(SmallInteger, server_default="0", nullable=False)

    __table_args__ = (
        UniqueConstraint("question_version_id", "option_key"),
        UniqueConstraint("question_version_id", "display_order"),
    )


class AssessmentVersionQuestion(Base):
    __tablename__ = "assessment_version_questions"

    assessment_version_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("assessment_versions.id", ondelete="CASCADE"), primary_key=True)
    question_version_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("question_versions.id", ondelete="RESTRICT"), primary_key=True)
    display_order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    marks: Mapped[float] = mapped_column(Numeric(7, 2), nullable=False)
    negative_marks: Mapped[float] = mapped_column(Numeric(7, 2), server_default="0", nullable=False)

    __table_args__ = (
        UniqueConstraint("assessment_version_id", "display_order"),
        CheckConstraint("marks > 0", name="ck_version_questions_marks"),
        CheckConstraint("negative_marks >= 0", name="ck_version_questions_negative"),
    )


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_version_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("assessment_versions.id", ondelete="RESTRICT"), nullable=False)
    attempt_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="in_progress", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    score: Mapped[float | None] = mapped_column(Numeric(8, 2))
    max_score: Mapped[float | None] = mapped_column(Numeric(8, 2))
    percentage: Mapped[float | None] = mapped_column(Numeric(5, 2))
    result_summary: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "assessment_version_id", "attempt_number"),
        CheckConstraint("attempt_number > 0", name="ck_attempts_number"),
        CheckConstraint("status IN ('in_progress','submitted','expired','evaluating','evaluated','cancelled')", name="ck_attempts_status"),
        CheckConstraint("percentage IS NULL OR percentage BETWEEN 0 AND 100", name="ck_attempts_percentage"),
        Index("ix_assessment_attempts_user_started", "user_id", func.desc(started_at)),
    )


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id: Mapped[UUID] = uuid_pk()
    attempt_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False)
    question_version_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("question_versions.id", ondelete="RESTRICT"), nullable=False)
    answer_data: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    awarded_marks: Mapped[float | None] = mapped_column(Numeric(7, 2))
    is_correct: Mapped[bool | None] = mapped_column(Boolean)
    feedback: Mapped[str | None] = mapped_column(Text)
    saved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    evaluated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        UniqueConstraint("attempt_id", "question_version_id"),
        Index("ix_attempt_answers_attempt", "attempt_id"),
    )


class VivaSession(Base):
    __tablename__ = "viva_sessions"

    id: Mapped[UUID] = uuid_pk()
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_attempt_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="SET NULL"), unique=True)
    topic: Mapped[str] = mapped_column(String(220), nullable=False)
    difficulty: Mapped[str | None] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), server_default="active", nullable=False)
    overall_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    feedback: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint("difficulty IN ('beginner','intermediate','advanced')", name="ck_viva_difficulty"),
        CheckConstraint("status IN ('active','completed','abandoned')", name="ck_viva_status"),
        CheckConstraint("overall_score IS NULL OR overall_score BETWEEN 0 AND 100", name="ck_viva_score"),
        Index("ix_viva_sessions_user_started", "user_id", func.desc(started_at)),
    )


class VivaTurn(Base):
    __tablename__ = "viva_turns"

    id: Mapped[UUID] = uuid_pk()
    session_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("viva_sessions.id", ondelete="CASCADE"), nullable=False)
    turn_number: Mapped[int] = mapped_column(Integer, nullable=False)
    speaker: Mapped[str] = mapped_column(String(12), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    evaluation: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    __table_args__ = (
        UniqueConstraint("session_id", "turn_number"),
        CheckConstraint("turn_number > 0", name="ck_viva_turns_number"),
        CheckConstraint("speaker IN ('examiner','student')", name="ck_viva_turns_speaker"),
    )
