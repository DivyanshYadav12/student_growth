const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1';
const TOKEN_KEY = 'sg_access_token';
const REFRESH_KEY = 'sg_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
  window.localStorage.setItem(TOKEN_KEY, access);
  window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> | undefined) };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let code = 'ERROR';
    let message = res.statusText;
    try {
      const body = await res.json();
      code = body?.error?.code ?? body?.detail ?? code;
      message = body?.error?.message ?? (typeof body?.detail === 'string' ? body.detail : message);
    } catch { /* keep defaults */ }
    throw new ApiError(res.status, code, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, {}, auth),
  post: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }, auth),
  patch: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }, auth),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE' }, auth),
};

// ---- Auth ----
export interface AuthTokens { access_token: string; refresh_token: string; token_type: string }
export interface ApiUser { id: string; email: string; full_name: string; status: string; email_verified: boolean; roles: string[] }

export const authApi = {
  register: (email: string, password: string, full_name: string) =>
    api.post<{ message: string; dev_verification_token?: string }>('/auth/register', { email, password, full_name }, false),
  verifyEmail: (token: string) => api.post<AuthTokens>('/auth/verify-email', { token }, false),
  login: (email: string, password: string) => api.post<AuthTokens>('/auth/login', { email, password }, false),
  refresh: (refresh_token: string) => api.post<AuthTokens>('/auth/refresh', { refresh_token }, false),
  logout: (refresh_token: string) => api.post<{ message: string }>('/auth/logout', { refresh_token }, false),
  me: () => api.get<ApiUser>('/auth/me'),
};

// ---- Academics ----
export interface ApiProgram { id: string; code: string; degree_name: string; branch_name: string; scope: string; description: string | null }
export interface ApiSubjectOffering { id: string; subject_id: string; code: string | null; title: string; credits: number | null; subject_type: string; unit_count: number; resource_count: number }
export interface ApiSemester { id: string; semester_number: number; title: string | null; subjects: ApiSubjectOffering[] }
export interface ApiProgramStructure extends ApiProgram { curriculum_versions: { id: string; version_name: string; effective_from_year: number | null; semesters: ApiSemester[] }[] }
export interface ApiUnit { id: string; unit_number: number; title: string; description: string | null; learning_outcomes: string[]; resource_count: number }
export interface ApiSubjectDetail { id: string; code: string | null; title: string; description: string | null; subject_area: string | null; credits: number | null; subject_type: string; semester: { id: string | null; number: number | null; title: string | null }; units: ApiUnit[] }
export interface ApiResource { id: string; title: string; resource_type: string; summary: string | null; verification_status: string; publication_status: string; publication_date: string | null; author_name: string | null; source_title: string | null; external_url: string | null; unit_id: string | null; subject_offering_id: string; created_by_user_id?: string | null }

export const academicsApi = {
  programs: () => api.get<ApiProgram[]>('/academics/programs', false),
  structure: (programId: string) => api.get<ApiProgramStructure>(`/academics/programs/${programId}/structure`, false),
  subject: (offeringId: string) => api.get<ApiSubjectDetail>(`/academics/subjects/${offeringId}`, false),
  resources: (params: { subject_offering_id?: string; unit_id?: string; resource_type?: string; page?: number; page_size?: number } = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return api.get<{ items: ApiResource[]; total: number }>(`/academics/resources${q ? `?${q}` : ''}`, false);
  },
  resource: (id: string) => api.get<ApiResource & { content_markdown: string | null; source_url: string | null }>(`/academics/resources/${id}`, false),
  createResource: (body: {
    subject_offering_id: string; unit_id?: string | null; resource_type: string; title: string;
    summary?: string | null; content_markdown?: string | null; external_url?: string | null;
    source_title?: string | null; author_name?: string | null;
  }) => api.post<ApiResource>(`/academics/resources`, body),
  updateResource: (id: string, body: Partial<{
    unit_id: string | null; resource_type: string; title: string; summary: string | null;
    content_markdown: string | null; external_url: string | null; source_title: string | null; author_name: string | null;
  }>) => api.patch<ApiResource>(`/academics/resources/${id}`, body),
  publishResource: (id: string) => api.post<ApiResource>(`/academics/resources/${id}/publish`),
};

// ---- Learning ----
export interface ApiPathSummary { id: string; slug: string; title: string; description: string | null; category: string; difficulty: string | null; estimated_hours: number | null; owner_type: string; enrolled: boolean | null; node_count: number | null }
export interface ApiPathNodeSkill { id: string; code: string; name: string; description: string | null; category: string; difficulty: string | null; mastery_status: string }
export interface ApiPathNodeLesson { id: string; slug: string; title: string; summary: string | null; estimated_minutes: number | null; difficulty: string | null; status: string }
export interface ApiPathNode { id: string; node_type: 'skill' | 'lesson'; display_order: number; is_required: boolean; title: string | null; prerequisite_node_ids: string[]; skill?: ApiPathNodeSkill; lesson?: ApiPathNodeLesson }
export interface ApiPathDetail extends ApiPathSummary { enrollment: { id: string; status: string; enrolled_at: string } | null; nodes: ApiPathNode[] }
export interface ApiSkillLesson { id: string; slug: string; title: string; summary: string | null; estimated_minutes: number | null; difficulty: string | null; status: string; progress_percent: number }
export interface ApiSkillDetail { id: string; code: string; name: string; description: string | null; category: string; difficulty: string | null; mastery_status: string; lessons: ApiSkillLesson[] }
export interface ApiLessonDetail { id: string; slug: string; title: string; summary: string | null; content_markdown: string; estimated_minutes: number | null; difficulty: string | null; skill_id: string; progress: { status: string; progress_percent: number; time_spent_seconds: number } }

export const learningApi = {
  paths: () => api.get<{ items: ApiPathSummary[] }>('/learning-paths', false),
  path: (id: string) => api.get<ApiPathDetail>(`/learning-paths/${id}`, true),
  enroll: (learning_path_id: string) => api.post<{ id: string; status: string }>('/enrollments', { learning_path_id }),
  withdraw: (pathId: string) => api.post<{ id: string; status: string }>(`/enrollments/${pathId}/withdraw`),
  myEnrollments: () => api.get<{ id: string; status: string; learning_path: ApiPathSummary }[]>('/enrollments/me'),
  skill: (id: string) => api.get<ApiSkillDetail>(`/skills/${id}`, true),
  lesson: (id: string) => api.get<ApiLessonDetail>(`/lessons/${id}`),
  lessonProgress: (id: string, body: { status?: string; progress_percent?: number; time_spent_seconds?: number }) =>
    api.patch<{ lesson_id: string; status: string; progress_percent: number; xp_awarded: number }>(`/lessons/${id}/progress`, body),
  progressOverview: () => api.get<{ lessons_completed: number; lessons_in_progress: number; skills_mastered: number; active_enrollments: number; xp_total: number }>('/progress/overview'),
  progressSkills: () => api.get<{ skill_id: string; skill_name: string; skill_code: string; category: string; mastery_status: string; mastery_score: number | null; evidence_count: number }[]>('/progress/skills'),
};

// ---- Coding ----
export interface ApiProblemSummary { id: string; slug: string; title: string; difficulty: string; skill_id: string | null; excerpt?: string; sample_count?: number; time_limit_ms: number; memory_limit_mb: number; supported_languages: string[] }
export interface ApiProblemDetail extends ApiProblemSummary { statement_markdown: string; constraints_text: string | null; input_format: string | null; output_format: string | null; starter_code: string | null; editorial_markdown: string | null; sample_test_cases: { input: string; expected_output: string }[] }
export interface ApiSubmission { id: string; problem_id: string; problem_title?: string; language: string; status: string; score: number | null; max_score: number | null; execution_time_ms: number | null; result_summary: Record<string, unknown>; submitted_at: string; evaluated_at: string | null }

export const codingApi = {
  problems: () => api.get<{ items: ApiProblemSummary[]; total: number }>('/coding/problems', false),
  problem: (ref: string) => api.get<ApiProblemDetail>(`/coding/problems/${ref}`, true),
  run: (problem_id: string, source_code: string, stdin = '') => api.post<{ status: string; stdout: string; stderr: string; execution_time_ms: number }>('/coding/run', { problem_id, source_code, stdin }),
  runSamples: (problem_id: string, source_code: string) => api.post<{ verdict: string; passed_tests: number; total_tests: number; results: { test_number: number; passed: boolean; expected_output: string; actual_output: string; status: string }[] }>('/coding/run-samples', { problem_id, source_code }),
  submit: (problem_id: string, source_code: string, language = 'cpp') => api.post<{ id: string; status: string; problem_id: string }>('/coding/submissions', { problem_id, language, source_code }),
  submission: (id: string) => api.get<ApiSubmission>(`/coding/submissions/${id}`),
  mySubmissions: () => api.get<{ items: ApiSubmission[]; total: number }>('/coding/submissions/me'),
};

// ---- Career ----
export interface ApiCareerPath { id: string; slug: string; title: string; description: string | null; target_role: string }
export interface ApiCareerPathDetail extends ApiCareerPath { skills: { skill_id: string; name: string; code: string; category: string; difficulty: string | null; importance: string }[] }
export interface ApiProject { id: string; slug: string; title: string; description: string; difficulty: string | null; estimated_hours: number | null; tech_stack: string[]; repository_url: string | null; my_status: string }

export const careerApi = {
  paths: () => api.get<ApiCareerPath[]>('/career/paths', false),
  path: (id: string) => api.get<ApiCareerPathDetail>(`/career/paths/${id}`, false),
  projects: () => api.get<ApiProject[]>('/career/projects', false),
};
