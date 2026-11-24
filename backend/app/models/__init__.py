from app.models.academics import (
    AcademicProgram,
    AcademicResource,
    AcademicSemester,
    AcademicSubject,
    CurriculumVersion,
    ResourceBookmark,
    ResourceRating,
    SemesterSubject,
    SyllabusUnit,
    UserCurriculumEnrollment,
)
from app.models.ai import AiConversation, AiMessage, AiRecommendation, AiUsageLog
from app.models.assessments import (
    Assessment,
    AssessmentAttempt,
    AssessmentVersion,
    AssessmentVersionQuestion,
    AttemptAnswer,
    Question,
    QuestionOption,
    QuestionVersion,
    VivaSession,
    VivaTurn,
)
from app.models.base import Base
from app.models.career import (
    CareerPath,
    CareerPathEnrollment,
    CareerPathProject,
    CareerPathSkill,
    Project,
    UserProjectProgress,
)
from app.models.coding import CodeSubmission, CodingProblem, CodingTestCase
from app.models.contributions import Contribution, ContributionReview, ContributionVersion
from app.models.gamification import (
    Achievement,
    ProgressSnapshot,
    UserAchievement,
    UserActivityEvent,
    XpTransaction,
)
from app.models.identity import (
    AuthSession,
    AuthToken,
    FileAsset,
    Role,
    User,
    UserPreference,
    UserProfile,
    UserRole,
)
from app.models.learning import (
    LearningPath,
    LearningPathNode,
    LearningPathNodePrerequisite,
    Lesson,
    LessonProgress,
    PathEnrollment,
    Skill,
    SkillMasteryEvent,
    SkillPrerequisite,
    SkillProgress,
)
from app.models.moderation import AdminAuditLog, ModerationReport

__all__ = [name for name in dir() if not name.startswith("_")]
