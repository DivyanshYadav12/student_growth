-- Student Growth Platform - PostgreSQL MVP schema
-- Target: PostgreSQL 15+
-- This is a modular-monolith schema. Code execution remains in isolated workers.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Common timestamp trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1. Identity, profiles and access control
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(320) NOT NULL,
    password_hash       TEXT,
    full_name           VARCHAR(160) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('pending_verification','active','suspended','deleted')),
    email_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));

CREATE TABLE user_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    phone               VARCHAR(30),
    avatar_asset_id     UUID,
    country_code        CHAR(2) DEFAULT 'IN',
    programming_level   VARCHAR(20) CHECK (programming_level IN ('beginner','intermediate','advanced')),
    career_goal         VARCHAR(80),
    timezone            VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
    id          SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(40) NOT NULL UNIQUE,
    description VARCHAR(200) NOT NULL
);

CREATE TABLE user_roles (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     SMALLINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE user_preferences (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    daily_goal_minutes  SMALLINT NOT NULL DEFAULT 45 CHECK (daily_goal_minutes BETWEEN 5 AND 600),
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    ui_preferences      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash  TEXT NOT NULL UNIQUE,
    user_agent          TEXT,
    ip_address          INET,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-use tokens for email verification and password reset.
-- Store only the hash; the raw token is sent to the user out of band.
CREATE TABLE auth_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    purpose         VARCHAR(30) NOT NULL CHECK (purpose IN ('email_verification','password_reset')),
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_auth_tokens_user_purpose ON auth_tokens(user_id, purpose) WHERE used_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. File metadata (actual bytes live in private object storage)
-- ---------------------------------------------------------------------------
CREATE TABLE file_assets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    storage_key         TEXT NOT NULL UNIQUE,
    original_filename   VARCHAR(255) NOT NULL,
    mime_type           VARCHAR(150) NOT NULL,
    byte_size           BIGINT NOT NULL CHECK (byte_size >= 0),
    checksum_sha256     CHAR(64),
    scan_status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (scan_status IN ('pending','clean','infected','failed')),
    visibility          VARCHAR(20) NOT NULL DEFAULT 'private'
                        CHECK (visibility IN ('private','published')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_avatar
    FOREIGN KEY (avatar_asset_id) REFERENCES file_assets(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 3. Academic curriculum catalog
-- The initial curriculum is generic/reference CSE content, not an official
-- representation of every university's syllabus.
-- ---------------------------------------------------------------------------
CREATE TABLE academic_programs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(60) NOT NULL UNIQUE,
    degree_name         VARCHAR(120) NOT NULL,
    branch_name         VARCHAR(160) NOT NULL,
    institution_name    VARCHAR(200),
    scope               VARCHAR(20) NOT NULL DEFAULT 'global'
                        CHECK (scope IN ('global','institution')),
    description         TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((scope = 'global' AND institution_name IS NULL) OR
           (scope = 'institution' AND institution_name IS NOT NULL))
);

CREATE TABLE curriculum_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES academic_programs(id) ON DELETE RESTRICT,
    version_name        VARCHAR(100) NOT NULL,
    effective_from_year SMALLINT,
    effective_to_year   SMALLINT,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','published','retired')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (program_id, version_name),
    CHECK (effective_to_year IS NULL OR effective_from_year IS NULL OR effective_to_year >= effective_from_year)
);

CREATE TABLE academic_semesters (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_version_id   UUID NOT NULL REFERENCES curriculum_versions(id) ON DELETE CASCADE,
    semester_number         SMALLINT NOT NULL CHECK (semester_number BETWEEN 1 AND 12),
    title                   VARCHAR(100),
    UNIQUE (curriculum_version_id, semester_number)
);

CREATE TABLE user_curriculum_enrollments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    curriculum_version_id   UUID NOT NULL REFERENCES curriculum_versions(id) ON DELETE RESTRICT,
    current_semester_id     UUID REFERENCES academic_semesters(id) ON DELETE SET NULL,
    enrollment_status       VARCHAR(20) NOT NULL DEFAULT 'active'
                            CHECK (enrollment_status IN ('active','completed','paused','withdrawn')),
    is_primary              BOOLEAN NOT NULL DEFAULT false,
    started_at              DATE,
    ended_at                DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, curriculum_version_id),
    CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);
CREATE UNIQUE INDEX uq_user_primary_curriculum
    ON user_curriculum_enrollments(user_id) WHERE is_primary = true AND enrollment_status = 'active';
CREATE INDEX ix_user_curriculum_status
    ON user_curriculum_enrollments(user_id, enrollment_status);

CREATE TABLE academic_subjects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_code  VARCHAR(60) NOT NULL UNIQUE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    subject_area    VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE semester_subjects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id         UUID NOT NULL REFERENCES academic_semesters(id) ON DELETE CASCADE,
    subject_id          UUID NOT NULL REFERENCES academic_subjects(id) ON DELETE RESTRICT,
    local_subject_code  VARCHAR(60),
    credits             NUMERIC(4,1) CHECK (credits IS NULL OR credits >= 0),
    subject_type        VARCHAR(20) NOT NULL DEFAULT 'core'
                        CHECK (subject_type IN ('core','elective','lab','project')),
    display_order       SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (semester_id, subject_id),
    UNIQUE (semester_id, local_subject_code)
);

CREATE TABLE syllabus_units (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_subject_id UUID NOT NULL REFERENCES semester_subjects(id) ON DELETE CASCADE,
    unit_number         SMALLINT NOT NULL CHECK (unit_number > 0),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    learning_outcomes   JSONB NOT NULL DEFAULT '[]'::jsonb,
    display_order       SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (semester_subject_id, unit_number)
);

CREATE TABLE academic_resources (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id             UUID REFERENCES syllabus_units(id) ON DELETE SET NULL,
    subject_offering_id UUID NOT NULL REFERENCES semester_subjects(id) ON DELETE CASCADE,
    resource_type       VARCHAR(30) NOT NULL
                        CHECK (resource_type IN ('notes','experiment','viva','question_bank','previous_paper','reference','assignment','external_link')),
    title               VARCHAR(240) NOT NULL,
    summary             TEXT,
    content_markdown    TEXT,
    external_url        TEXT,
    file_asset_id       UUID REFERENCES file_assets(id) ON DELETE SET NULL,
    source_title        VARCHAR(240),
    source_url          TEXT,
    author_name         VARCHAR(160),
    publication_date    DATE,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
                        CHECK (verification_status IN ('unverified','in_review','verified','rejected')),
    publication_status VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (publication_status IN ('draft','published','archived')),
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (resource_type <> 'external_link' OR external_url IS NOT NULL),
    CHECK (resource_type = 'external_link' OR external_url IS NULL)
);

CREATE TABLE resource_bookmarks (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES academic_resources(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, resource_id)
);

CREATE TABLE resource_ratings (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES academic_resources(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, resource_id)
);

-- ---------------------------------------------------------------------------
-- 4. Skills, lessons and extensible learning paths
-- ---------------------------------------------------------------------------
CREATE TABLE skills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(160) NOT NULL,
    description     TEXT,
    category        VARCHAR(80) NOT NULL,
    difficulty      VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','advanced')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skill_prerequisites (
    skill_id                UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    prerequisite_skill_id   UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (skill_id, prerequisite_skill_id),
    CHECK (skill_id <> prerequisite_skill_id)
);

CREATE TABLE lessons (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id            UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    slug                VARCHAR(180) NOT NULL UNIQUE,
    title               VARCHAR(220) NOT NULL,
    summary             TEXT,
    content_markdown    TEXT NOT NULL,
    estimated_minutes   SMALLINT CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
    difficulty          VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','advanced')),
    status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','published','archived')),
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE learning_paths (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(180) NOT NULL UNIQUE,
    title               VARCHAR(220) NOT NULL,
    description         TEXT,
    category            VARCHAR(80) NOT NULL,
    difficulty          VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','advanced','mixed')),
    estimated_hours     NUMERIC(6,1) CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
    owner_type          VARCHAR(20) NOT NULL DEFAULT 'platform'
                        CHECK (owner_type IN ('platform','user')),
    owner_user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    created_by_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    visibility          VARCHAR(20) NOT NULL DEFAULT 'public'
                        CHECK (visibility IN ('public','private')),
    status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','published','archived')),
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        (owner_type = 'platform' AND owner_user_id IS NULL) OR
        (owner_type = 'user' AND owner_user_id IS NOT NULL AND owner_user_id = created_by_user_id)
    ),
    CHECK (owner_type <> 'platform' OR visibility = 'public')
);

CREATE TABLE learning_path_nodes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id    UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    node_type           VARCHAR(20) NOT NULL CHECK (node_type IN ('skill','lesson')),
    skill_id            UUID REFERENCES skills(id) ON DELETE RESTRICT,
    lesson_id           UUID REFERENCES lessons(id) ON DELETE RESTRICT,
    title_override      VARCHAR(220),
    display_order       INTEGER NOT NULL CHECK (display_order >= 0),
    is_required         BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (learning_path_id, display_order),
    CHECK (
        (node_type = 'skill' AND skill_id IS NOT NULL AND lesson_id IS NULL) OR
        (node_type = 'lesson' AND lesson_id IS NOT NULL AND skill_id IS NULL)
    )
);

CREATE TABLE learning_path_node_prerequisites (
    node_id                 UUID NOT NULL REFERENCES learning_path_nodes(id) ON DELETE CASCADE,
    prerequisite_node_id    UUID NOT NULL REFERENCES learning_path_nodes(id) ON DELETE CASCADE,
    PRIMARY KEY (node_id, prerequisite_node_id),
    CHECK (node_id <> prerequisite_node_id)
);

CREATE TABLE path_enrollments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    learning_path_id    UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','completed','paused','withdrawn')),
    enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    last_activity_at    TIMESTAMPTZ,
    UNIQUE (user_id, learning_path_id)
);

CREATE TABLE lesson_progress (
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id           UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL DEFAULT 'not_started'
                        CHECK (status IN ('not_started','in_progress','completed','needs_revision')),
    progress_percent    NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    time_spent_seconds  BIGINT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
    first_started_at    TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    last_accessed_at    TIMESTAMPTZ,
    PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE skill_progress (
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id            UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    mastery_status      VARCHAR(20) NOT NULL DEFAULT 'not_started'
                        CHECK (mastery_status IN ('not_started','learning','practiced','mastered','needs_revision')),
    mastery_score       NUMERIC(5,2) CHECK (mastery_score IS NULL OR mastery_score BETWEEN 0 AND 100),
    evidence_count      INTEGER NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
    last_assessed_at    TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE skill_mastery_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id            UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    source_type         VARCHAR(30) NOT NULL
                        CHECK (source_type IN ('lesson','coding_submission','assessment','viva','manual_review')),
    source_id           UUID,
    previous_status     VARCHAR(20),
    new_status          VARCHAR(20) NOT NULL
                        CHECK (new_status IN ('not_started','learning','practiced','mastered','needs_revision')),
    score               NUMERIC(5,2) CHECK (score IS NULL OR score BETWEEN 0 AND 100),
    evidence            JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. Coding problems and asynchronous code submissions
-- ---------------------------------------------------------------------------
CREATE TABLE coding_problems (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id            UUID REFERENCES skills(id) ON DELETE SET NULL,
    slug                VARCHAR(180) NOT NULL UNIQUE,
    title               VARCHAR(220) NOT NULL,
    statement_markdown  TEXT NOT NULL,
    difficulty          VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
    supported_languages TEXT[] NOT NULL DEFAULT ARRAY['cpp'],
    constraints_text    TEXT,
    input_format        TEXT,
    output_format       TEXT,
    time_limit_ms       INTEGER NOT NULL DEFAULT 2000 CHECK (time_limit_ms BETWEEN 100 AND 30000),
    memory_limit_mb     INTEGER NOT NULL DEFAULT 256 CHECK (memory_limit_mb BETWEEN 16 AND 2048),
    starter_code        TEXT,
    editorial_markdown  TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coding_test_cases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id          UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
    input_data          TEXT NOT NULL,
    expected_output     TEXT NOT NULL,
    is_sample           BOOLEAN NOT NULL DEFAULT false,
    display_order       SMALLINT NOT NULL DEFAULT 0,
    points              NUMERIC(7,2) NOT NULL DEFAULT 1 CHECK (points >= 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE code_submissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id          UUID NOT NULL REFERENCES coding_problems(id) ON DELETE RESTRICT,
    language            VARCHAR(30) NOT NULL,
    source_code         TEXT NOT NULL,
    status              VARCHAR(24) NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued','running','accepted','wrong_answer','time_limit','memory_limit','runtime_error','compile_error','system_error')),
    score               NUMERIC(7,2),
    max_score            NUMERIC(7,2),
    execution_time_ms   INTEGER,
    memory_used_kb      BIGINT,
    result_summary      JSONB NOT NULL DEFAULT '{}'::jsonb,
    worker_job_id       VARCHAR(160),
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    evaluated_at        TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- 6. Assessment bank, immutable versions, attempts and answers
-- ---------------------------------------------------------------------------
CREATE TABLE assessments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(180) NOT NULL UNIQUE,
    title               VARCHAR(220) NOT NULL,
    description         TEXT,
    assessment_type     VARCHAR(30) NOT NULL
                        CHECK (assessment_type IN ('academic_mock','unit_test','practical','viva','dsa','technical_mock','placement_simulation')),
    subject_offering_id UUID REFERENCES semester_subjects(id) ON DELETE SET NULL,
    learning_path_id    UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
    difficulty          VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','advanced','mixed')),
    status              VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assessment_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id       UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    version_number      INTEGER NOT NULL CHECK (version_number > 0),
    duration_seconds    INTEGER NOT NULL CHECK (duration_seconds > 0),
    total_marks         NUMERIC(8,2) NOT NULL CHECK (total_marks > 0),
    pass_marks          NUMERIC(8,2) CHECK (pass_marks IS NULL OR (pass_marks >= 0 AND pass_marks <= total_marks)),
    negative_marking    NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (negative_marking >= 0),
    randomize_questions BOOLEAN NOT NULL DEFAULT false,
    max_attempts        SMALLINT CHECK (max_attempts IS NULL OR max_attempts > 0),
    instructions        TEXT,
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (assessment_id, version_number)
);

CREATE TABLE questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_code       VARCHAR(100) UNIQUE,
    created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    version_number      INTEGER NOT NULL CHECK (version_number > 0),
    question_type       VARCHAR(20) NOT NULL
                        CHECK (question_type IN ('mcq_single','mcq_multiple','short_text','long_text','code','sql')),
    prompt_markdown     TEXT NOT NULL,
    explanation         TEXT,
    expected_answer     TEXT,
    grading_rubric      JSONB NOT NULL DEFAULT '{}'::jsonb,
    coding_problem_id   UUID REFERENCES coding_problems(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (question_id, version_number),
    CHECK ((question_type = 'code' AND coding_problem_id IS NOT NULL) OR
           (question_type <> 'code' AND coding_problem_id IS NULL))
);

CREATE TABLE question_options (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id UUID NOT NULL REFERENCES question_versions(id) ON DELETE CASCADE,
    option_key          VARCHAR(20) NOT NULL,
    option_text         TEXT NOT NULL,
    is_correct          BOOLEAN NOT NULL DEFAULT false,
    display_order       SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (question_version_id, option_key),
    UNIQUE (question_version_id, display_order)
);

CREATE TABLE assessment_version_questions (
    assessment_version_id UUID NOT NULL REFERENCES assessment_versions(id) ON DELETE CASCADE,
    question_version_id   UUID NOT NULL REFERENCES question_versions(id) ON DELETE RESTRICT,
    display_order         SMALLINT NOT NULL,
    marks                 NUMERIC(7,2) NOT NULL CHECK (marks > 0),
    negative_marks        NUMERIC(7,2) NOT NULL DEFAULT 0 CHECK (negative_marks >= 0),
    PRIMARY KEY (assessment_version_id, question_version_id),
    UNIQUE (assessment_version_id, display_order)
);

CREATE TABLE assessment_attempts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_version_id   UUID NOT NULL REFERENCES assessment_versions(id) ON DELETE RESTRICT,
    attempt_number          SMALLINT NOT NULL CHECK (attempt_number > 0),
    status                  VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                            CHECK (status IN ('in_progress','submitted','expired','evaluating','evaluated','cancelled')),
    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at            TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ NOT NULL,
    score                   NUMERIC(8,2),
    max_score               NUMERIC(8,2),
    percentage              NUMERIC(5,2) CHECK (percentage IS NULL OR percentage BETWEEN 0 AND 100),
    result_summary          JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (user_id, assessment_version_id, attempt_number)
);

CREATE TABLE attempt_answers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id          UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_version_id UUID NOT NULL REFERENCES question_versions(id) ON DELETE RESTRICT,
    answer_data         JSONB NOT NULL DEFAULT '{}'::jsonb,
    awarded_marks       NUMERIC(7,2),
    is_correct          BOOLEAN,
    feedback            TEXT,
    saved_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    evaluated_at        TIMESTAMPTZ,
    UNIQUE (attempt_id, question_version_id)
);

CREATE TABLE viva_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_attempt_id UUID UNIQUE REFERENCES assessment_attempts(id) ON DELETE SET NULL,
    topic               VARCHAR(220) NOT NULL,
    difficulty          VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','advanced')),
    status              VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
    overall_score       NUMERIC(5,2) CHECK (overall_score IS NULL OR overall_score BETWEEN 0 AND 100),
    feedback            JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE TABLE viva_turns (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES viva_sessions(id) ON DELETE CASCADE,
    turn_number         INTEGER NOT NULL CHECK (turn_number > 0),
    speaker             VARCHAR(12) NOT NULL CHECK (speaker IN ('examiner','student')),
    message             TEXT NOT NULL,
    evaluation          JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, turn_number)
);

-- ---------------------------------------------------------------------------
-- 7. Career paths and project catalogue
-- ---------------------------------------------------------------------------
CREATE TABLE career_paths (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(160) NOT NULL UNIQUE,
    title               VARCHAR(180) NOT NULL,
    description         TEXT,
    target_role         VARCHAR(160) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE career_path_skills (
    career_path_id  UUID NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
    skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    importance      VARCHAR(20) NOT NULL DEFAULT 'required' CHECK (importance IN ('required','recommended','optional')),
    display_order   SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (career_path_id, skill_id)
);

CREATE TABLE projects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(180) NOT NULL UNIQUE,
    title               VARCHAR(220) NOT NULL,
    description         TEXT NOT NULL,
    difficulty          VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','advanced')),
    estimated_hours     NUMERIC(6,1) CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
    tech_stack          TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    repository_url      TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE career_path_projects (
    career_path_id  UUID NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    display_order   SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (career_path_id, project_id)
);

CREATE TABLE career_path_enrollments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    career_path_id      UUID NOT NULL REFERENCES career_paths(id) ON DELETE RESTRICT,
    status              VARCHAR(20) NOT NULL DEFAULT 'exploring'
                        CHECK (status IN ('exploring','active','paused','completed','withdrawn')),
    target_date         DATE,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, career_path_id)
);

CREATE TABLE user_project_progress (
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    status              VARCHAR(20) NOT NULL DEFAULT 'not_started'
                        CHECK (status IN ('not_started','planning','in_progress','completed','abandoned')),
    repository_url      TEXT,
    demo_url            TEXT,
    notes               TEXT,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, project_id)
);

-- ---------------------------------------------------------------------------
-- 8. Student contributions and review workflow
-- ---------------------------------------------------------------------------
CREATE TABLE contributions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    contribution_type   VARCHAR(30) NOT NULL
                        CHECK (contribution_type IN ('notes','experiment','viva_questions','explanation','coding_problem','project_tutorial','external_resource')),
    title               VARCHAR(240) NOT NULL,
    description         TEXT,
    content_markdown    TEXT,
    file_asset_id       UUID REFERENCES file_assets(id) ON DELETE SET NULL,
    subject_offering_id UUID REFERENCES semester_subjects(id) ON DELETE SET NULL,
    unit_id             UUID REFERENCES syllabus_units(id) ON DELETE SET NULL,
    status              VARCHAR(24) NOT NULL DEFAULT 'pending_review'
                        CHECK (status IN ('draft','pending_review','in_review','changes_requested','approved','rejected','withdrawn')),
    published_resource_id UUID REFERENCES academic_resources(id) ON DELETE SET NULL,
    submitted_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contribution_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_id     UUID NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
    version_number      INTEGER NOT NULL CHECK (version_number > 0),
    title               VARCHAR(240) NOT NULL,
    content_markdown    TEXT,
    file_asset_id       UUID REFERENCES file_assets(id) ON DELETE SET NULL,
    change_note         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (contribution_id, version_number)
);

CREATE TABLE contribution_reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_id     UUID NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
    reviewer_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decision            VARCHAR(24) NOT NULL CHECK (decision IN ('approved','changes_requested','rejected')),
    review_notes        TEXT,
    reviewed_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 9. AI conversations, usage and recommendations
-- ---------------------------------------------------------------------------
CREATE TABLE ai_conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_type   VARCHAR(24) NOT NULL CHECK (conversation_type IN ('tutor','viva','career_guidance')),
    title               VARCHAR(220),
    context_metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role                VARCHAR(16) NOT NULL CHECK (role IN ('system','user','assistant','tool')),
    content             TEXT NOT NULL,
    citations           JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
    prompt_version      VARCHAR(80),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_usage_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    conversation_id     UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
    feature             VARCHAR(30) NOT NULL,
    provider            VARCHAR(80),
    model_name          VARCHAR(120),
    input_tokens        INTEGER NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens       INTEGER NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    latency_ms          INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),
    outcome             VARCHAR(20) NOT NULL CHECK (outcome IN ('success','error','rate_limited','timeout')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_recommendations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(30) NOT NULL
                        CHECK (recommendation_type IN ('next_topic','revision','practice','career_activity','daily_goal')),
    title               VARCHAR(220) NOT NULL,
    explanation         TEXT,
    target_type         VARCHAR(40),
    target_id           UUID,
    priority            SMALLINT NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    evidence_snapshot   JSONB NOT NULL DEFAULT '{}'::jsonb,
    status              VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','accepted','dismissed','completed','expired')),
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 10. Gamification, activity and analytics
-- ---------------------------------------------------------------------------
CREATE TABLE xp_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points              INTEGER NOT NULL CHECK (points <> 0),
    reason_code         VARCHAR(60) NOT NULL,
    reference_type      VARCHAR(40),
    reference_id        UUID,
    idempotency_key     VARCHAR(180) NOT NULL,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, idempotency_key)
);

CREATE TABLE achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(80) NOT NULL UNIQUE,
    title           VARCHAR(160) NOT NULL,
    description     TEXT NOT NULL,
    icon_key        VARCHAR(80),
    criteria        JSONB NOT NULL DEFAULT '{}'::jsonb,
    xp_reward      INTEGER NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
    is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE user_achievements (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id  UUID NOT NULL REFERENCES achievements(id) ON DELETE RESTRICT,
    earned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE user_activity_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type      VARCHAR(80) NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       UUID,
    event_data      JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE progress_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date       DATE NOT NULL,
    learning_minutes    INTEGER NOT NULL DEFAULT 0 CHECK (learning_minutes >= 0),
    lessons_completed   INTEGER NOT NULL DEFAULT 0 CHECK (lessons_completed >= 0),
    problems_solved     INTEGER NOT NULL DEFAULT 0 CHECK (problems_solved >= 0),
    assessments_taken   INTEGER NOT NULL DEFAULT 0 CHECK (assessments_taken >= 0),
    xp_earned           INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
    metrics             JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (user_id, snapshot_date)
);

-- ---------------------------------------------------------------------------
-- 11. Moderation and administrative audit
-- ---------------------------------------------------------------------------
CREATE TABLE moderation_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_type         VARCHAR(30) NOT NULL CHECK (target_type IN ('resource','contribution','coding_problem','user')),
    target_id           UUID NOT NULL,
    reason_code         VARCHAR(60) NOT NULL,
    details             TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','resolved','dismissed')),
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ
);

CREATE TABLE admin_audit_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    action              VARCHAR(100) NOT NULL,
    entity_type         VARCHAR(60) NOT NULL,
    entity_id           UUID,
    before_data         JSONB,
    after_data          JSONB,
    ip_address          INET,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes for common access patterns
-- ---------------------------------------------------------------------------
CREATE INDEX ix_auth_sessions_user_expiry ON auth_sessions(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX ix_curriculum_versions_program ON curriculum_versions(program_id, status);
CREATE INDEX ix_semester_subjects_semester_order ON semester_subjects(semester_id, display_order);
CREATE INDEX ix_syllabus_units_subject_order ON syllabus_units(semester_subject_id, display_order);
CREATE INDEX ix_resources_subject_status ON academic_resources(subject_offering_id, publication_status, resource_type);
CREATE INDEX ix_resources_unit ON academic_resources(unit_id) WHERE unit_id IS NOT NULL;
CREATE INDEX ix_resources_created_by ON academic_resources(created_by_user_id);
CREATE INDEX ix_lessons_skill_status ON lessons(skill_id, status);
CREATE INDEX ix_learning_paths_discovery ON learning_paths(status, visibility, category) WHERE status = 'published';
CREATE INDEX ix_learning_paths_owner ON learning_paths(owner_user_id, status) WHERE owner_user_id IS NOT NULL;
CREATE INDEX ix_path_nodes_path_order ON learning_path_nodes(learning_path_id, display_order);
CREATE INDEX ix_path_enrollments_user_status ON path_enrollments(user_id, status, last_activity_at DESC);
CREATE INDEX ix_lesson_progress_user_status ON lesson_progress(user_id, status);
CREATE INDEX ix_skill_progress_user_mastery ON skill_progress(user_id, mastery_status);
CREATE INDEX ix_skill_events_user_time ON skill_mastery_events(user_id, occurred_at DESC);
CREATE INDEX ix_coding_problems_skill_difficulty ON coding_problems(skill_id, difficulty, status);
CREATE INDEX ix_code_submissions_user_time ON code_submissions(user_id, submitted_at DESC);
CREATE INDEX ix_code_submissions_status_time ON code_submissions(status, submitted_at) WHERE status IN ('queued','running');
CREATE INDEX ix_code_submissions_problem ON code_submissions(problem_id, submitted_at DESC);
CREATE INDEX ix_coding_test_cases_problem ON coding_test_cases(problem_id, is_sample);
CREATE INDEX ix_assessments_type_status ON assessments(assessment_type, status);
CREATE INDEX ix_assessment_attempts_user_started ON assessment_attempts(user_id, started_at DESC);
CREATE INDEX ix_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX ix_viva_sessions_user_started ON viva_sessions(user_id, started_at DESC);
CREATE INDEX ix_career_path_enrollments_user_status ON career_path_enrollments(user_id, status);
CREATE INDEX ix_user_project_progress_user_status ON user_project_progress(user_id, status);
CREATE INDEX ix_contributions_status_time ON contributions(status, submitted_at DESC);
CREATE INDEX ix_contributions_user ON contributions(contributor_user_id, created_at DESC);
CREATE INDEX ix_ai_conversations_user_time ON ai_conversations(user_id, updated_at DESC);
CREATE INDEX ix_ai_messages_conversation_time ON ai_messages(conversation_id, created_at);
CREATE INDEX ix_ai_usage_user_time ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX ix_ai_recommendations_user_status ON ai_recommendations(user_id, status, priority DESC);
CREATE INDEX ix_xp_transactions_user_time ON xp_transactions(user_id, created_at DESC);
CREATE INDEX ix_activity_events_user_time ON user_activity_events(user_id, occurred_at DESC);
CREATE INDEX ix_progress_snapshots_user_date ON progress_snapshots(user_id, snapshot_date DESC);
CREATE INDEX ix_moderation_reports_status_time ON moderation_reports(status, created_at DESC);
CREATE INDEX ix_admin_audit_actor_time ON admin_audit_logs(actor_user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_preferences_updated_at BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_resources_updated_at BEFORE UPDATE ON academic_resources
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON lessons
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_learning_paths_updated_at BEFORE UPDATE ON learning_paths
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_coding_problems_updated_at BEFORE UPDATE ON coding_problems
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_assessments_updated_at BEFORE UPDATE ON assessments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contributions_updated_at BEFORE UPDATE ON contributions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_resource_ratings_updated_at BEFORE UPDATE ON resource_ratings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_skill_progress_updated_at BEFORE UPDATE ON skill_progress
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_project_progress_updated_at BEFORE UPDATE ON user_project_progress
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed roles. The initial admin user should be provisioned securely out of band.
INSERT INTO roles (code, description) VALUES
    ('student', 'Standard student account'),
    ('content_reviewer', 'Reviews student-submitted content'),
    ('admin', 'Platform administrator')
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- Important application-level invariants (enforce in services and tests):
-- 1. Only admins may create/publish platform-owned learning paths.
-- 2. For user-owned paths, owner_user_id must equal created_by_user_id (DB CHECK above).
-- 3. Prerequisite graphs must be acyclic; validate with a recursive CTE in the service.
-- 4. A published assessment_version and its question-version membership are immutable.
-- 5. Attempt expiry and scoring are server-authoritative; clients cannot set score/status.
-- 6. Hidden coding test cases and answer keys must never be returned by student APIs.
-- 7. Code must run only in isolated execution workers, never inside the API process.
-- 8. AI output, recommendations and mastery changes must be validated and auditable.
