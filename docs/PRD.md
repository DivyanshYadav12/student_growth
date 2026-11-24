# Product Requirements Document (PRD)

# Student Growth Platform

**Working product name:** Student Growth Platform (brand name not finalized)  
**Working tagline:** Learn. Practice. Challenge. Grow.  
**Document type:** Product Requirements Document  
**Version:** 1.0  
**Status:** Product baseline for implementation  
**Last updated:** 20 November 2026  
**Initial audience:** B.Tech Computer Science and Engineering students  
**Initial curriculum model:** Generic CSE reference curriculum; not an official syllabus for every university

---

## 1. Executive Summary

Student Growth is a web-first, responsive student-development platform that connects university academics, technical skill development, practical assessments, career preparation, and guided self-improvement in one experience.

The platform is intended to help students answer five recurring questions:

1. What should I study next?
2. Where can I find reliable learning material for my academic subjects?
3. Which technical skills should I develop for my goals?
4. How well am I performing, and what should I revise?
5. How prepared am I for academic examinations, practical evaluations, and technical interviews?

The product brings these activities together through ten connected areas:

- Dashboard
- Academics
- Skill Quest
- Exam Arena
- AI Tutor
- Viva Simulator
- Career Navigator
- Contributions
- My Growth
- Admin Panel

The platform should feel like one connected student-development product rather than a collection of unrelated tools. Academic learning, technical mastery, assessment outcomes, and career preparation should share relevant context and progress data.

The initial release is designed around a generic B.Tech CSE learning model. University-specific syllabus mapping may be added later. Any generic curriculum shown by the platform must be clearly labelled as reference content and must not be represented as the official syllabus of every institution.

---

## 2. Product Vision

Build an integrated learning and career-development environment that helps students move from uncertainty to structured, measurable progress.

### 2.1 Product Promise

Student Growth should help a student:

- Understand what to learn and why it matters.
- Find structured academic and technical learning resources.
- Learn concepts before being pushed into assessments.
- Practise through coding challenges, quizzes, practical tasks, and viva simulations.
- Identify weaknesses and receive useful revision recommendations.
- Connect technical skills to career pathways and practical projects.
- Track progress based on evidence of learning rather than simple page completion.
- Contribute useful learning resources to the wider student community.

### 2.2 Product Principles

1. **Guidance over information overload:** Give students a clear next step instead of presenting an unstructured catalogue.
2. **Understanding over completion:** Opening a lesson is not the same as mastering a concept.
3. **Flexible progression:** Recommend prerequisite learning without unnecessarily hard-locking students.
4. **Confidence over competition:** Use progress and achievements to encourage growth, not to shame students through rankings.
5. **Trustworthy content:** Identify source, author, verification status, and publication or review date for learning resources where available.
6. **AI as an assistant, not an authority:** AI-generated explanations and evaluations must be presented with appropriate limitations and grounded in platform content where possible.
7. **One connected learning journey:** Academics, Skill Quest, Exam Arena, Career Navigator, and My Growth should exchange relevant context.
8. **Privacy and safety by design:** Protect student data, isolate untrusted code execution, and minimize personal information sent to AI providers.

---

## 3. Goals and Success Measures

### 3.1 Product Goals

- Give students one place to manage academic and technical learning.
- Make learning paths actionable through lessons, exercises, coding problems, and assessments.
- Improve students' ability to identify and revise weak topics.
- Help students understand the skills and projects associated with their career interests.
- Encourage useful student contributions while maintaining content quality.
- Build a foundation that can expand to additional branches, institutions, programming languages, and career paths.

### 3.2 Proposed Success Metrics

The following are proposed product metrics. Baselines and targets should be established through pilot usage rather than assumed in advance.

| Area | Metric | What it measures |
|---|---|---|
| Activation | Onboarding completion rate | Percentage of registered students who complete the essential profile setup |
| Engagement | Weekly active learners | Students who perform at least one meaningful learning action in a week |
| Learning | Lesson-to-practice conversion | Percentage of started lessons followed by a practice activity |
| Mastery | Assessment-supported mastery rate | Skills marked mastered after qualifying evidence such as a quiz or coding assessment |
| Retention | Week-4 learner retention | Students who remain active four weeks after activation |
| Academics | Subject resource engagement | Use of notes, practicals, quizzes, and other subject resources |
| Coding | Challenge completion rate | Percentage of started coding challenges accepted |
| Assessment | Assessment completion rate | Percentage of started assessments submitted successfully |
| AI | Helpful-response feedback | Student feedback on AI tutor and viva feedback quality |
| Contributions | Approval rate and review time | Quality and moderation efficiency for student-submitted content |

### 3.3 Non-Goals for the Initial Release

The initial release is not intended to be:

- A full university ERP or student information system.
- A replacement for official university learning-management systems.
- A live-class or video-conferencing platform.
- A social network or discussion-forum product.
- A job portal or automated job-application agent.
- A system that guarantees examination results, placements, or interview success.
- A platform that automatically publishes AI-generated official syllabi or answer keys without human review.
- A native mobile application; the initial product is a responsive web application.

---

## 4. Target Users and Personas

### 4.1 Primary Persona: B.Tech CSE Student

**Needs**
- Find subject-wise notes, experiments, and viva preparation material.
- Understand which topics are important in a semester.
- Learn programming and data structures in a structured sequence.
- Practise coding with meaningful feedback.
- Prepare for academic exams and technical assessments.
- Track skills and career readiness.

**Pain points**
- Learning material is scattered across websites, drives, and messaging groups.
- Students are often unsure what to study next.
- Academic learning and placement preparation are treated as separate activities.
- Completing tutorials does not necessarily demonstrate understanding.
- Progress and weak areas are difficult to track consistently.

### 4.2 Secondary Persona: Student Contributor

A student who wants to submit notes, practical write-ups, explanations, viva questions, coding problems, or project tutorials and receive appropriate credit after review.

### 4.3 Secondary Persona: Content Administrator / Reviewer

A trusted platform user who manages reference curriculum, publishes learning paths, reviews student contributions, maintains assessments, and moderates reported content.

### 4.4 Future Persona: Institutional Coordinator

A future role for mapping generic content to a specific institution's curriculum and optionally reviewing cohort-level learning analytics. Institutional management is outside the initial MVP.

---

## 5. Product Scope and Prioritization

### 5.1 MVP (P0)

The MVP should include:

- Registration, login, profile, and onboarding.
- Generic B.Tech CSE academic structure.
- Subject, unit, and resource browsing.
- Notes, experiments/practicals, and viva resources.
- Administrator-created learning paths.
- Flexible prerequisite recommendations.
- Lessons, guided practice, and mastery tracking.
- C++ coding challenges with isolated execution.
- Exam Arena for academic and technical assessments.
- Basic career paths and skill mapping.
- Student resource submissions with review workflow.
- AI Tutor, basic recommendations, and text-based Viva Simulator.
- Dashboard and My Growth analytics.
- Admin content and assessment management.
- XP and achievements with idempotent reward handling.

### 5.2 P1 (After MVP Validation)

- Additional programming languages.
- More academic branches and curriculum variants.
- Voice-based viva simulation.
- More adaptive question selection.
- Richer skill-tree visualization.
- Contributor reputation and contribution analytics.
- More advanced career roadmaps and project evaluation.
- Resume guidance and job-skill mapping.
- Improved predictive and cohort analytics.
- Advanced content verification and plagiarism workflows.

### 5.3 P2 (Future Expansion)

- University-specific curriculum integrations.
- Native mobile applications.
- Live classes, group learning, and discussion communities.
- Institutional dashboards and integrations.
- Automated job matching and application assistance.
- Advanced leaderboards and team challenges.
- Additional institutional and enterprise capabilities.

---

## 6. Information Architecture and Navigation

### 6.1 Primary Navigation

1. Dashboard
2. Academics
   - My Semester
   - Subjects
   - Syllabus
   - Notes
   - Experiments / Practicals
   - Viva Preparation
3. Skill Quest
   - Explore Paths
   - My Learning Paths
   - Lessons
   - Coding Arena
   - Skill Tree
4. Exam Arena
   - Academic Exams
   - Technical Assessments
   - Viva Simulator
   - My Results
5. AI Tutor
6. Career Navigator
7. Contributions
8. My Growth
9. Profile / Settings

Administrators receive a separate Admin Panel navigation area according to their role and permissions.

### 6.2 Primary Student Journey

1. Register and verify email.
2. Complete onboarding profile.
3. Select degree/branch and current semester.
4. Indicate programming experience and career interests.
5. Optionally complete a diagnostic assessment.
6. Arrive at the Dashboard.
7. Open an academic subject or a recommended Skill Quest path.
8. Study a lesson or resource.
9. Practise with a quiz, practical activity, or coding challenge.
10. Complete an academic or technical assessment.
11. Review performance and recommendations.
12. Continue learning or revise weak topics.

---

## 7. Functional Requirements

## 7.1 Identity, Authentication, and Onboarding

### Requirements

- Users can register with email and password.
- Users must verify their email before accessing protected student features, according to the configured account policy.
- Users can log in, log out, refresh their session, and reset their password.
- A user can maintain a profile containing display name, degree, branch, semester, programming experience, and career interests.
- Profile and learning preferences can be updated later.
- Role-based access must distinguish students, reviewers, and administrators.
- The onboarding flow should allow partial completion where the missing information is not essential to account creation.

### Onboarding Flow

`Register → Verify Email → Profile → Degree/Branch → Semester → Programming Experience → Career Interests → Optional Diagnostic → Dashboard`

### Acceptance Criteria

- A registered user cannot access protected student routes without a valid authenticated session.
- Passwords are stored using a secure password-hashing algorithm and are never stored in plaintext.
- Students cannot access administrator-only endpoints by changing frontend routes or request parameters.
- A student can update profile information without losing existing progress.

## 7.2 Dashboard

### Purpose

Provide a concise overview of the student's learning activity and the most useful next actions.

### Required Content

- Learning progress overview.
- Daily or weekly learning goals.
- Continue Learning section.
- Recommended next lessons or challenges.
- Recent activity.
- Upcoming or recommended assessments.
- Skill and subject progress indicators.
- XP, streak, and achievements where enabled.

### Behavior

- Recommendations should use real student context when available: semester, interests, learning history, assessment outcomes, and prerequisite gaps.
- Empty states should guide new users toward a first subject, path, or diagnostic assessment.
- Dashboard cards should deep-link into the corresponding feature.
- Progress summaries must not imply mastery when only a page has been opened.

## 7.3 Academics

### Purpose

Organize academic learning resources in a structure that can later support multiple universities and curriculum versions.

### Content Hierarchy

`Degree → Branch → Curriculum Version → Semester → Subject → Unit → Resource`

### Initial Generic CSE Subject Examples

- Programming for Problem Solving
- Engineering Mathematics
- Object-Oriented Programming
- Data Structures
- Database Management Systems
- Operating Systems
- Computer Networks
- Software Engineering

This list is a generic reference set and is not an official syllabus for every institution.

### Resource Types

- Notes
- Explanations
- Experiments / practicals
- Viva questions
- Quizzes
- Previous examination papers, only where distribution is authorized
- Reference links
- Assignments and practice tasks

### Resource Metadata

Where applicable, resources should record:

- Title and description
- Resource type
- Subject and unit association
- Author or contributor
- Source / reference URL
- Publication or submission date
- Verification status
- Version or revision information
- Visibility and moderation status

### Student Capabilities

- Browse subjects and syllabus units.
- Open and read available resources.
- Search and filter resources.
- Bookmark resources.
- Report incorrect, outdated, or inappropriate resources.
- View subject and unit progress.

### Acceptance Criteria

- Each resource must belong to a valid subject or unit according to its resource type.
- Unreviewed student submissions must not appear as verified resources.
- Bookmarks and progress must be associated with the authenticated user.
- Content must display verification status where applicable.

## 7.4 Skill Quest — Learning Paths and Mastery

### Purpose

Provide structured technical learning paths that guide students from foundational concepts to applied practice and demonstrated mastery.

### Learning Hierarchy

`Learning Path → Skill Category / Module → Topic → Lesson → Guided Practice → Independent Challenge → Assessment → Mastery / Revision`

### Initial Learning Content

- C++ fundamentals
- DSA fundamentals
- Arrays and strings
- Searching and sorting
- Hashing
- Two pointers and sliding window
- Linked lists and stacks

Additional paths may include SQL/database foundations and full-stack project building.

### Path Ownership and Authoring

- In the initial release, learning paths are created and published by platform administrators.
- The schema must support user-created paths later without requiring a structural redesign.
- A shared `learning_paths` model should distinguish platform-owned paths from user-owned paths.
- Suggested ownership attributes include `owner_type`, `owner_user_id`, `created_by_user_id`, `visibility`, and `status`.
- For MVP platform paths, ownership is platform-level and student authoring is not enabled.

### Flexible Prerequisite Rules

Prerequisites guide the learner but should not automatically block access.

A student may proceed when:

- The prerequisite is marked mastered; or
- A diagnostic or qualifying assessment demonstrates readiness; or
- The path configuration permits entry without the prerequisite.

The interface should explain recommended prerequisites and potential learning gaps.

### Mastery States

- Not started
- Learning
- Practiced
- Mastered
- Needs revision

Mastery should be based on evidence such as lesson activity, practice completion, coding challenge outcomes, or assessment performance. A simple lesson-open event must not be sufficient to mark a skill mastered.

### Acceptance Criteria

- Students can browse and enroll in published paths.
- Students can view modules, topics, lessons, prerequisites, and progress.
- A student can enter a topic even when a recommended prerequisite is incomplete, subject to path policy.
- Mastery state changes are attributable to an event or assessment result.
- Published paths can be versioned so future changes do not silently rewrite a student's historical completion record.

## 7.5 Coding Arena — Coding Challenge Integration

### Purpose

Connect Skill Quest lessons to practical programming challenges and provide meaningful feedback on submitted code.

### Initial Language

- C++17

Additional languages are planned for later releases.

### Coding Challenge Requirements

Each challenge should support:

- Title and problem statement
- Difficulty
- Topic and skill mapping
- Input and output specification
- Constraints
- Sample input and output
- Explanation or editorial, subject to release policy
- Starter code where appropriate
- Public test cases
- Hidden test cases
- Execution time and memory limits
- Associated lesson or learning-path node

### Coding Workspace Requirements

- C++ editor with editable source code.
- Line numbers and basic editing support.
- Language indication.
- Reset starter code.
- Copy code.
- Save draft locally or to the authenticated account.
- Run using custom input.
- Run public sample tests.
- Submit for full evaluation.
- Show compilation errors, runtime errors, wrong answers, timeouts, and accepted status.
- Display submission history.

A richer editor with syntax highlighting, IntelliSense, resizable panels, and advanced keyboard controls may be delivered incrementally.

### Test Case Rules

- Public test input and expected output may be shown to students.
- Hidden test input and expected output must remain server-side.
- API responses must not include hidden inputs, expected outputs, or private test-case metadata.
- A submission response may report aggregate hidden-test results, such as passed count, without disclosing the test data.

### Execution Architecture and Security

Untrusted student code must never execute inside the Next.js process or ordinary FastAPI API process.

Execution must occur in a separate isolated runner, initially using disposable Docker containers with:

- Non-root execution user
- Network disabled
- CPU quota
- Memory quota
- Process / PID limits
- Execution timeout
- Restricted filesystem access
- Read-only source mount where possible
- Container cleanup after execution
- Request and user rate limits
- Output-size limits
- Compiler and runtime restrictions

The execution service should expose a narrow API to the application backend. The public web client must not receive Docker control access.

Production deployment requires additional hardening, monitoring, queue limits, container-image maintenance, and security testing. The initial local Docker runner is not automatically considered a production-grade multi-tenant sandbox.

### Submission Lifecycle

`Created → Queued → Compiling → Running → Evaluated → Completed`

Terminal outcomes may include:

- Accepted
- Wrong Answer
- Compilation Error
- Runtime Error
- Time Limit Exceeded
- Memory Limit Exceeded
- Internal Error

### Skill Quest Integration

- Accepted challenges may update the associated lesson or skill evidence.
- First-time successful completion may award XP.
- XP transactions must be idempotent so repeated submissions do not duplicate rewards.
- The platform must distinguish challenge acceptance from broad skill mastery; mastery may require more than one piece of evidence.

### Acceptance Criteria

- Students can edit and submit C++17 solutions.
- Custom input execution returns bounded output and an execution result.
- Public samples are visible and reproducible.
- Hidden tests are evaluated without exposing their inputs or expected outputs.
- The API enforces execution quotas and rejects malformed or oversized requests.
- Student code executes outside the application API process.
- An accepted challenge updates the linked progress record at most once for a defined reward event.

## 7.6 Exam Arena

### Purpose

Provide a unified assessment environment for academic and technical preparation.

### Assessment Types

- Academic mock exam (MCQ and descriptive)
- Unit test
- Practical assessment
- Coding assessment
- SQL or database task
- Viva assessment
- DSA assessment
- Technical mock test
- Placement simulation

### Assessment Configuration

An assessment may define:

- Title and description
- Category
- Subject, unit, skill, or career mapping
- Difficulty
- Duration
- Total marks
- Passing score
- Question selection policy
- Negative marking
- Randomization settings
- Attempt limits
- Availability window
- Version

### Attempt Lifecycle

`Not Started → In Progress → (Optional Paused) → Submitted / Expired → Evaluating → Results Available → Revision Recommended`

### Exam Runner Requirements

- Display instructions and assessment rules before starting.
- Display remaining time.
- Autosave answers.
- Allow navigation between questions according to assessment policy.
- Support final submission confirmation.
- Enforce the timer on the server, not only in the browser.
- Handle connection interruptions without silently losing saved answers.

### Results

- Total score and percentage
- Accuracy
- Time used
- Correct and incorrect responses
- Topic-wise performance
- Explanations where available
- Recommended revision topics
- Option to retake, subject to attempt policy

### Confidence Indicators

The platform may provide estimates for:

- Academic readiness
- Practical readiness
- Conceptual confidence
- Coding confidence
- Viva readiness
- Interview readiness

These are progress indicators and must not be represented as guaranteed outcomes or official institutional evaluations.

### Acceptance Criteria

- Assessment attempts are associated with an immutable assessment version.
- The server controls attempt timing and submission state.
- Autosaved answers are recoverable after a page refresh or supported reconnection.
- A submitted attempt cannot be modified unless the assessment policy explicitly allows it.
- Results are available only after evaluation completes.

## 7.7 AI Tutor

### Purpose

Provide context-aware explanations and learning assistance.

### Capabilities

- Explain concepts at a beginner-friendly level.
- Provide examples and analogies.
- Explain code and common errors.
- Offer hints before revealing complete solutions.
- Generate additional practice questions where appropriate.
- Use relevant platform academic content and learning-path material as context.
- Link or cite platform sources when retrieval is used.

### Guardrails

- Clearly indicate AI-generated content.
- Do not present generated answers as verified official content.
- Do not publish AI-generated resources or answer keys automatically.
- Avoid exposing another student's data.
- Apply usage limits and logging policies.
- Minimize personal information included in prompts.
- Allow conversation history controls according to the privacy policy.

## 7.8 Recommendation Engine

### Inputs

- Semester and academic profile
- Career interests
- Skill progress and mastery evidence
- Prerequisite gaps
- Lesson and challenge history
- Assessment results
- Student learning preferences and available study time, when provided

### Outputs

- Suggested next topic
- Revision recommendation
- Practice challenge
- Relevant assessment
- Career-related learning activity
- Suggested daily or weekly plan

### Requirements

- Explain why a recommendation is being made.
- Distinguish rules-based recommendations from AI-generated suggestions where appropriate.
- Avoid recommending the same activity repeatedly without reason.
- Allow a student to dismiss or defer a recommendation.
- Do not treat a recommendation as a compulsory prerequisite unless the path configuration explicitly defines a required condition.

## 7.9 Viva Simulator

### Purpose

Allow students to practise answering oral-examination and interview-style conceptual questions.

### MVP Flow

1. Student selects subject or skill and difficulty.
2. Simulator asks a question.
3. Student submits a text answer.
4. Simulator may ask a follow-up question.
5. Session ends with feedback and suggested revision.

### Evaluation Rubric

- Correctness
- Completeness
- Conceptual understanding
- Clarity
- Application or reasoning

### Guardrails

- Scores are estimates, not equivalent to an official examiner's decision.
- Feedback should explain its reasoning and identify uncertainty where appropriate.
- Session content and AI usage must follow privacy and retention rules.

Voice-based interaction is a later enhancement.

## 7.10 Career Navigator

### Purpose

Connect career goals to skills, learning paths, and practical project work.

### Initial Career Content

- Software Engineering
- Project building
- Internship preparation

### Capabilities

- Browse career paths.
- See the skills associated with each path.
- Map a skill to a Skill Quest path or resource.
- View suggested projects.
- Track project and skill progress.

### Requirements

Career guidance must be presented as guidance, not a guarantee of employment or compensation. Job-market-specific content must include an appropriate last-reviewed date when introduced.

## 7.11 Student Contributions

### Accepted Contribution Types

- Notes
- Experiments / practical write-ups
- Viva questions
- Concept explanations
- Coding problems
- Project tutorials
- Learning-resource links

### Review Workflow

`Submitted → Pending Review → Under Review → Approved / Revision Requested / Rejected → Published (when approved)`

### Requirements

- Students can submit content with subject, unit, type, title, description, and supporting files or links as allowed.
- Students can see the review status of their own submissions.
- Reviewers can approve, reject, or request changes.
- Revisions must retain a history.
- Published contributions must identify the contributor according to platform policy.
- Users can report content that is incorrect, copied, unsafe, or inappropriate.
- Plagiarism and copyright checks should be included in the moderation process.
- The platform must not knowingly distribute unauthorized examination papers or copyrighted material.

## 7.12 My Growth and Gamification

### My Growth

- Skill mastery overview
- Subject progress
- Learning activity timeline
- Assessment trends
- Coding challenge history
- Achievements
- XP history
- Revision recommendations

### XP and Achievements

- XP is awarded for defined meaningful actions.
- XP transactions must be idempotent.
- Duplicate requests must not create duplicate rewards.
- Achievement criteria must be explicit and testable.
- Gamification should encourage sustained learning rather than reward low-value activity such as repeatedly opening a page.

## 7.13 Admin Panel

### Capabilities

- Manage degrees, branches, curriculum versions, semesters, subjects, and units.
- Create and publish learning paths.
- Manage skills, lessons, and prerequisites.
- Manage academic resources and verification status.
- Create coding problems and test cases.
- Manage assessments, question banks, and versions.
- Review student contributions.
- Moderate reports.
- Manage achievements and reward rules.
- View audit logs and basic platform metrics.

### Permissions

Admin functionality must be role- and permission-controlled on the backend. Hiding an admin link in the frontend is not sufficient authorization.

---

## 8. Content and Learning Quality Requirements

- Academic content should have a subject and unit mapping.
- Content with a known external source should include the source and review metadata.
- Generic curriculum content must be labelled as reference content.
- Published learning paths should have a version or revision strategy.
- Assessment question changes must not unexpectedly alter an active or historical attempt.
- Student contributions require human or approved review before being presented as verified content.
- AI-generated content must not silently become official content.
- Incorrect or outdated content must be reportable and removable through a documented moderation process.

---

## 9. Technical Architecture (Proposed)

### 9.1 Architecture Style

Use a **modular monolith** for the core application initially, with a separate isolated code-execution service.

Do not introduce Kubernetes, Kafka, or a broad microservices architecture for the MVP unless measurable scale or operational requirements justify them.

### 9.2 High-Level Architecture

```text
Student / Admin Browser
        |
        v
Next.js Web Application
        |
        v
FastAPI Application API
        |
        +-------------------- PostgreSQL
        |                         |
        |                         +-- Core relational data
        |                         +-- pgvector (when needed)
        |
        +-------------------- Redis
        |                         |
        |                         +-- Cache / rate limits / jobs
        |
        +-------------------- Object Storage
        |                         |
        |                         +-- Uploads / approved resources
        |
        +-------------------- AI Orchestrator
        |                         |
        |                         +-- Retrieval / LLM provider
        |
        +-------------------- Execution Queue / Service
                                  |
                                  v
                          Isolated Docker Workers
```

### 9.3 Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui as the standard generic component system
- Radix UI primitives for the selected shadcn component base
- Lucide icons
- React Hook Form and Zod for form validation
- TanStack Query for server-state management where appropriate
- Recharts for analytics visualizations
- Vitest and React Testing Library for unit/component tests
- Playwright for end-to-end workflows

**Component ownership rule:** Generic UI primitives belong in `components/ui`. Product-specific shared components belong in `components/shared` or a relevant feature. Feature business logic and screens should remain grouped by domain.

### 9.4 Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic migrations
- Pydantic request and response schemas
- Modular domain services and repositories

### 9.5 Data and Infrastructure

- PostgreSQL as the primary database
- pgvector for semantic retrieval when required
- Redis for caching, rate limiting, and background coordination
- S3-compatible object storage for uploads and approved resources
- Docker-based isolated execution workers
- GitHub Actions for CI
- Managed cloud deployment for production

### 9.6 Suggested Backend Modules

- Identity and authentication
- Profiles
- Academics and curriculum
- Content and resources
- Learning paths and progress
- Coding challenges and submissions
- Assessments and results
- AI and recommendations
- Viva sessions
- Career paths and projects
- Contributions and moderation
- Gamification
- Analytics
- Administration and audit

---

## 10. Data Model Overview

The database should use normalized relational structures and UUID primary keys for core entities. Exact data types, constraints, indexes, and migration details belong in the separate database design specification.

### 10.1 Identity

- `users`
- `profiles`
- `roles`
- `user_roles`
- Authentication session / refresh-token records as required

### 10.2 Academics

- `degrees`
- `branches`
- `curriculum_versions`
- `semesters`
- `subjects`
- `syllabus_units`
- `resources`
- `resource_versions`
- `bookmarks`

### 10.3 Learning

- `skills`
- `learning_paths`
- `path_nodes`
- `prerequisites`
- `lessons`
- `enrollments`
- `user_skills`
- `lesson_progress`
- `activity_logs`

### 10.4 Coding

- `coding_problems`
- `test_cases`
- `submissions`
- `submission_results` or equivalent evaluation records

Hidden test data must be protected from ordinary student-facing query paths.

### 10.5 Assessments

- `assessments`
- `assessment_versions`
- `questions`
- `question_options`
- `assessment_attempts`
- `attempt_answers`
- `assessment_results`

### 10.6 Career

- `career_paths`
- `career_skills`
- `projects`
- `user_projects` or project progress records

### 10.7 Contributions

- `contributions`
- `contribution_reviews`
- `contribution_versions`
- `content_reports`

### 10.8 AI and Analytics

- `ai_conversations`
- `ai_messages`
- `ai_usage_logs`
- `recommendations`
- `progress_snapshots`

### 10.9 Gamification and Administration

- `xp_transactions`
- `achievements`
- `user_achievements`
- `admin_audit_logs`

### 10.10 Data Integrity Rules

- Email must be unique under the chosen normalization policy.
- Foreign keys must protect relationships between users, content, learning progress, and assessments.
- Subject codes must be unique within the relevant curriculum context.
- Prerequisite relationships must prevent invalid cycles.
- XP reward references must be idempotent.
- Published assessment versions must remain reproducible for historical attempts.
- User deletion and content deletion must follow explicit retention and audit policies.
- Curriculum versions must preserve the ability to represent changes across academic years.

---

## 11. API Requirements

The backend API base path is `/api/v1`.

### 11.1 Authentication and Profile

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /profiles/me`
- `PATCH /profiles/me`
- `PATCH /profiles/preferences`

### 11.2 Academics

- `GET /degrees`
- `GET /branches`
- `GET /semesters`
- `GET /subjects`
- `GET /subjects/{id}`
- `GET /subjects/{id}/resources`
- `GET /resources/{id}`
- `POST /resources/{id}/bookmark`
- `DELETE /resources/{id}/bookmark`

### 11.3 Skill Quest and Progress

- `GET /learning-paths`
- `GET /learning-paths/{id}`
- `POST /enrollments`
- `GET /enrollments/me`
- `GET /skills/{id}`
- `GET /progress/overview`
- `GET /progress/skills`
- `GET /progress/activity`

### 11.4 Coding Arena

- `GET /coding/problems`
- `GET /coding/problems/{id}`
- `POST /coding/submissions`
- `GET /coding/submissions/{id}`
- `GET /coding/submissions/me`

Submission endpoints must enforce payload, language, rate, and execution limits. Hidden test data must never be returned.

### 11.5 Exam Arena

- `GET /assessments`
- `GET /assessments/{id}`
- `POST /assessments/{id}/attempts`
- `GET /attempts/{id}`
- `PUT /attempts/{id}/answers/{question_id}`
- `POST /attempts/{id}/submit`
- `GET /attempts/{id}/results`

### 11.6 AI and Viva

- `POST /ai/tutor`
- `GET /ai/conversations`
- `GET /ai/conversations/{id}`
- `GET /ai/recommendations`
- `POST /viva/sessions`
- `POST /viva/sessions/{id}/answers`
- `GET /viva/sessions/{id}/report`

### 11.7 Career and Contributions

- `GET /career-paths`
- `GET /career-paths/{id}`
- `GET /projects`
- `POST /contributions`
- `GET /contributions/me`
- `GET /contributions/{id}`
- `PATCH /contributions/{id}`
- `POST /contributions/{id}/reports`

### 11.8 Gamification and Administration

- `GET /gamification/profile`
- `GET /gamification/achievements`
- Admin endpoints for content, paths, assessments, reviews, and reports under `/admin/*`.

### API Standards

- REST-style resource naming.
- JSON request and response bodies.
- Authentication and authorization on protected routes.
- Secure access-token and refresh-token handling.
- Role-based access control.
- Input validation and consistent error responses.
- Pagination and filtering for collection endpoints.
- Rate limits for login, AI, uploads, and code execution.
- API versioning.
- OpenAPI documentation generated from FastAPI schemas.

Example error structure:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found.",
    "details": {}
  }
}
```

---

## 12. Security, Privacy, and Compliance Requirements

### 12.1 Authentication and Authorization

- Hash passwords using a suitable modern password-hashing algorithm.
- Protect refresh tokens and session identifiers.
- Enforce role and ownership checks on the backend.
- Apply least-privilege access to admin and reviewer features.
- Log sensitive administrative actions.

### 12.2 Application Security

- Validate and normalize all user inputs.
- Use parameterized database operations through the ORM or approved query layer.
- Apply CSRF protections where applicable to the chosen authentication model.
- Use secure transport in production.
- Apply upload type, size, and content validation.
- Scan uploaded files for malware using an appropriate service or process.
- Apply rate limits and abuse controls.

### 12.3 Coding Sandbox Security

- Never execute student code inside the API process.
- Run each submission in a restricted, disposable environment.
- Disable network access.
- Restrict CPU, memory, process count, execution time, filesystem, and output size.
- Keep hidden tests and expected outputs private.
- Record execution metadata without unnecessarily retaining submitted source longer than the product policy requires.
- Perform security testing before exposing execution infrastructure to public traffic.

### 12.4 AI Privacy and Safety

- Minimize personal data sent to external AI services.
- Do not place credentials, private profile data, or unrelated student records into prompts.
- Apply provider timeouts, token limits, and usage limits.
- Validate structured AI output against schemas.
- Version prompts and evaluation rubrics.
- Keep AI-generated content distinguishable from verified platform content.

### 12.5 User Data Controls

The platform should define clear retention, export, correction, and deletion rules for user profiles, conversations, submissions, and activity records. Legal and jurisdiction-specific privacy review is required before production launch.

---

## 13. Non-Functional Requirements

The following are proposed targets for planning and testing. They should be validated against the deployment environment and pilot usage.

| Category | Proposed requirement |
|---|---|
| Responsiveness | Support mobile, tablet, laptop, and desktop layouts |
| Accessibility | Target WCAG 2.2 AA for core user workflows |
| API performance | Target p95 under 500 ms for ordinary non-AI, non-execution API requests under expected MVP load |
| Reliability | Durable saving of assessment answers and submission records |
| Security | Role checks, input validation, rate limits, secure secrets, and sandbox restrictions |
| Scalability | Start as a modular monolith; separate execution workers can scale independently |
| Observability | Centralized logs, application error tracking, execution metrics, and audit events |
| Backups | Automated database backups and tested recovery procedure |
| AI resilience | Provider timeouts, rate limits, retry policy, and graceful fallback messaging |
| Browser support | Current stable desktop and mobile versions of major browsers |
| Maintainability | TypeScript frontend, Python backend, automated tests, documented APIs and migrations |

### 13.1 Accessibility Expectations

- Keyboard operability for navigation, dialogs, menus, tabs, and forms.
- Visible focus states.
- Semantic heading order and landmarks.
- Accessible labels and descriptions for form controls.
- Sufficient color contrast.
- Error messages associated with their controls.
- Status must not be communicated through color alone.
- Reduced-motion preferences should be respected.

---

## 14. UX and Visual Design Requirements

### 14.1 Product Experience

- Modern, minimal, professional EdTech/SaaS interface.
- Light theme as the initial default; dark theme can be added when validated.
- Indigo/violet primary color family.
- Neutral slate surfaces and borders.
- Emerald for successful or mastered states.
- Orange/amber for in-progress or attention states.
- Blue for informational or recommended states.
- Consistent typography and spacing.
- Subtle borders and restrained shadows.
- Responsive desktop sidebar and mobile navigation.

### 14.2 Frontend Standards

- Use shadcn/ui for generic interface primitives.
- Use Radix UI primitives for the selected component base.
- Keep customized component source in the repository.
- Build product-specific components by composing the shared primitives.
- Avoid repeated one-off implementations of buttons, dialogs, menus, form controls, and feedback states.
- Use server components by default where appropriate and client components only for interactive behavior.
- Provide loading, empty, error, disabled, and success states for important workflows.

### 14.3 Main Screen Requirements

| Screen | Required elements |
|---|---|
| Dashboard | Progress summary, daily plan, recommendations, continue learning, activity |
| Academics catalogue | Semester selector, subject cards, progress, search/filter |
| Subject detail | Overview, syllabus, resources, practicals, viva, progress |
| Skill Quest catalogue | Search, filters, path cards, enrollment and progress |
| Learning path detail | Modules, lessons, prerequisites, mastery and challenge links |
| Lesson workspace | Objectives, explanations, examples, practice and completion evidence |
| Coding Arena | Challenge catalogue, filters, solved status and progress |
| Coding workspace | Problem statement, editor, custom input, samples, result, submissions |
| Exam Arena | Assessment discovery, instructions, attempt state, timer and questions |
| Results | Score, topic analysis, explanations and recommended revision |
| AI Tutor | Conversation, context, citations/references and safe usage feedback |
| Viva Simulator | Session setup, question/answer flow, follow-ups and report |
| Career Navigator | Career path, required skills, linked learning and projects |
| Contributions | Submission form, status, feedback and revision history |
| My Growth | Mastery, subject progress, XP, achievements and activity |
| Admin Panel | Content, path, assessment, review, moderation, and audit tools |

---

## 15. Analytics and Event Tracking

The platform should track meaningful events needed for product analytics and learning progress. Event tracking must follow the privacy policy and must not collect unnecessary personal information.

### Suggested Events

- `user_registered`
- `onboarding_completed`
- `subject_opened`
- `resource_viewed`
- `resource_bookmarked`
- `learning_path_enrolled`
- `lesson_started`
- `lesson_completed`
- `practice_started`
- `coding_submission_created`
- `coding_submission_evaluated`
- `assessment_started`
- `assessment_submitted`
- `assessment_result_viewed`
- `viva_session_completed`
- `ai_tutor_message_sent`
- `recommendation_opened`
- `contribution_submitted`
- `contribution_reviewed`
- `achievement_unlocked`

Events should include a stable event ID, actor ID where appropriate, timestamp, event type, and relevant entity references. Do not use event logs as a substitute for authoritative transactional records.

---

## 16. Dependencies and External Services

Potential dependencies include:

- Email delivery provider for verification and password reset.
- Object storage for resource uploads.
- AI model provider(s) behind a provider abstraction.
- Docker runtime or hardened execution infrastructure.
- Monitoring and error-tracking service.
- Optional malware-scanning service for uploads.

External provider selection, pricing, data-processing terms, and service limits must be reviewed before production use. The product should avoid making core domain logic dependent on one AI provider.

---

## 17. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scope becomes too broad | Delayed MVP and inconsistent quality | Prioritize P0; defer social, institutional, and advanced AI features |
| Low-quality academic content | Loss of student trust | Metadata, review workflow, source labels, and reporting |
| Incorrect AI answers | Students learn inaccurate information | Ground responses, show limitations, gather feedback, and human-review official content |
| Unsafe code execution | Host compromise or data exposure | Separate hardened execution workers, quotas, no network, and security testing |
| Hidden test leakage | Assessment integrity is damaged | Keep test data on server side and return aggregate results only |
| Gamification abuse | Rewards do not reflect learning | Evidence-based XP and idempotent transactions |
| Curriculum differs by university | Misleading academic guidance | Label generic reference syllabus and support curriculum versions |
| Excessive architecture complexity | Higher operational cost | Modular monolith; avoid unnecessary distributed infrastructure |
| Student data exposure | Privacy and trust impact | Least privilege, data minimization, audit, and retention controls |
| Frontend/backend drift | Broken screens and inconsistent types | OpenAPI schemas, typed clients, contract tests, and CI |

---

## 18. Delivery Roadmap

The roadmap below assumes a small, focused team. A solo developer should expect a longer schedule. Dates are not commitments; milestones should be adjusted based on validation and available capacity.

| Period | Focus | Deliverables |
|---|---|---|
| Weeks 1–2 | Foundation | Repository, design system, database, authentication, onboarding, roles |
| Weeks 3–4 | Academics | Curriculum, subjects, units, resources, practical and viva content |
| Weeks 5–6 | Skill Quest and coding foundation | Paths, prerequisites, lessons, progress, C++ challenge service and isolated runner |
| Weeks 7–8 | Exam Arena | Question bank, exam engine, academic and coding assessments, results |
| Weeks 9–10 | AI and Career | AI Tutor, recommendations, text Viva Simulator, career paths |
| Weeks 11–12 | Growth and Contributions | XP, achievements, growth dashboard, contribution review |
| Weeks 13–14 | Stabilization and pilot | Security, performance, accessibility, content review, pilot testing |

### 18.1 Implementation Milestones Already Started

The following implementation work has been developed as a prototype baseline during project planning:

- Dashboard and responsive application shell.
- Academics catalogue and subject-detail workflow with sample content.
- Skill Quest path catalogue, learning paths, lesson pages, and browser-local progress.
- shadcn/ui migration and design-system showcase.
- Coding Arena frontend prototype and a separate FastAPI/Docker execution-service implementation package.

These prototypes do not imply that every feature is production-ready. Backend persistence, full build validation, live sandbox verification, security review, and end-to-end tests remain necessary before production release.

---

## 19. MVP Definition of Done

The MVP is ready for a controlled pilot when all critical items below are satisfied:

### Identity and Access

- [ ] Registration, email verification, login, logout, and password reset work.
- [ ] Onboarding and profile updates work.
- [ ] Role-based access is enforced by the backend.

### Academics

- [ ] Generic CSE curriculum is labelled as reference content.
- [ ] Students can browse subjects, units, and resources.
- [ ] Resource details and verification status are visible.
- [ ] Bookmarks and reporting work.

### Skill Quest

- [ ] Administrators can create and publish learning paths.
- [ ] Students can enroll and follow modules and lessons.
- [ ] Recommended prerequisites are explained and are not unnecessarily hard-locked.
- [ ] Progress and mastery require meaningful evidence.

### Coding Arena

- [ ] Students can edit and submit supported C++ solutions.
- [ ] Public and custom input runs work within configured limits.
- [ ] Hidden tests remain private.
- [ ] Code runs in a separate isolated execution environment.
- [ ] Execution quotas, timeout, memory, process, and output limits are enforced.
- [ ] Submission history and feedback are available.
- [ ] XP and progress updates are idempotent.

### Exam Arena

- [ ] Academic and technical assessments can be configured.
- [ ] Attempts and answers are saved reliably.
- [ ] Server-side timing and submission policies are enforced.
- [ ] Results and revision recommendations are available.

### AI and Viva

- [ ] AI Tutor can answer within configured usage limits.
- [ ] Platform references are provided when retrieval is used.
- [ ] Text Viva Simulator produces a structured feedback report.
- [ ] AI limitations and data handling are communicated.

### Career and Contributions

- [ ] Students can explore career paths and linked skills.
- [ ] Students can submit resources.
- [ ] Reviewers can approve, reject, or request revisions.
- [ ] Unreviewed contributions are not presented as verified content.

### Growth and Platform Quality

- [ ] Dashboard and My Growth use authoritative progress data.
- [ ] XP transactions cannot be duplicated by retries.
- [ ] Core flows work on desktop and mobile.
- [ ] Core workflows pass automated tests.
- [ ] Accessibility checks cover the main workflows.
- [ ] Backup, monitoring, and error reporting are configured.
- [ ] Security review is completed for authentication, uploads, AI, and code execution.

---

## 20. Open Decisions

These items should be resolved before the corresponding production implementation:

1. Final product brand name and visual identity.
2. Initial deployment and hosting provider.
3. Email delivery provider.
4. AI model providers and data-processing terms.
5. Production object-storage provider.
6. Exact authentication strategy and session/token policy.
7. Production-grade code-execution isolation approach.
8. Academic content licensing and source-verification policy.
9. Data retention and deletion policy.
10. Whether a specific pilot institution will be selected for curriculum validation.
11. Exact XP values and achievement thresholds.
12. Final performance and availability service-level objectives.

---

## 21. Assumptions

- The initial target users are B.Tech CSE students.
- The initial curriculum is a generic reference curriculum.
- The initial product is a responsive web application.
- Administrator-created learning paths are used in the first release.
- The data model must support user-created learning paths in a later release.
- C++17 is the first supported coding language.
- Student contributions are resources and learning materials, not discussion forums.
- Exam Arena supports both academic and technical assessments.
- AI Tutor, recommendations, and text Viva Simulator are part of the intended product scope.
- A modular monolith is preferred for the MVP, with isolated code-execution workers.

---

## 22. Glossary

| Term | Meaning |
|---|---|
| Academic resource | Notes, practicals, viva material, quizzes, or other subject-related content |
| Skill | A measurable technical or conceptual capability |
| Learning path | A structured sequence of modules, lessons, and practice activities |
| Prerequisite | A recommended or required prior skill or topic |
| Mastery | A progress state supported by meaningful learning or assessment evidence |
| Coding challenge | A programming problem evaluated against public and hidden test cases |
| Public test | A test case visible to the student |
| Hidden test | A server-side test case whose input and expected output are not disclosed |
| Assessment attempt | A student's specific attempt at a versioned assessment |
| Contribution | Student-submitted educational content awaiting review or already published |
| XP | Experience points awarded for configured meaningful learning actions |
| Reference curriculum | Generic curriculum content that is not claimed as the official syllabus of every university |

---

## 23. Document Ownership and Change Control

This PRD is the product baseline for the Student Growth Platform. Product-scope changes should be recorded with:

- Date of change
- Requirement or section affected
- Reason for change
- Impact on MVP scope, architecture, timeline, and data model
- Decision owner or reviewer

Technical implementation details may be further specified in separate documents:

- `database-design.md`
- `frontend-ui-ux-architecture.md`
- `visual-screen-design.md`
- `frontend-implementation-architecture.md`
- `api-specification.md`
- `phase2-coding-arena.md`
- `deployment-and-security.md`

The PRD defines what the product must achieve. The engineering specifications define how the requirements are implemented.

---

**End of PRD**
