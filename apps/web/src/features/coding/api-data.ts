import type { ApiProblemDetail, ApiProblemSummary, ApiSkillDetail } from '@/lib/api';
import type { CodingProblem } from './data';

export type CodingChallengeCard = {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  tags: string[];
  summary: string;
  xp: number;
  exampleCount: number;
};

const DIFFICULTY_MAP: Record<string, CodingChallengeCard['difficulty']> = {
  easy: 'Easy', medium: 'Medium', hard: 'Hard',
};

function titleCaseDifficulty(value: string): CodingChallengeCard['difficulty'] {
  return DIFFICULTY_MAP[value.toLowerCase()] ?? 'Medium';
}

export function apiProblemSummaryToCard(problem: ApiProblemSummary & { excerpt?: string; sample_count?: number }): CodingChallengeCard {
  return {
    id: problem.slug,
    title: problem.title,
    difficulty: titleCaseDifficulty(problem.difficulty),
    topic: 'Practice',
    tags: problem.supported_languages.includes('cpp') ? ['C++17'] : problem.supported_languages,
    summary: problem.excerpt ?? '',
    xp: 100,
    exampleCount: problem.sample_count ?? 0,
  };
}

function paragraphs(markdown: string): string[] {
  return markdown
    .split(/\n\s*\n/)
    .map((block) => block.replace(/^#+\s*/gm, '').trim())
    .filter(Boolean);
}

function lines(text: string | null): string[] {
  return (text ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
}

export function apiProblemDetailToCodingProblem(detail: ApiProblemDetail, skill?: ApiSkillDetail | null): CodingProblem {
  const relatedLesson = skill?.lessons?.[0];
  return {
    id: detail.slug,
    title: detail.title,
    difficulty: titleCaseDifficulty(detail.difficulty),
    topic: skill?.category ?? 'Practice',
    tags: [skill?.name, 'C++17'].filter((tag): tag is string => Boolean(tag)),
    summary: paragraphs(detail.statement_markdown)[0] ?? '',
    statement: paragraphs(detail.statement_markdown),
    constraints: lines(detail.constraints_text),
    inputFormat: lines(detail.input_format),
    outputFormat: lines(detail.output_format),
    examples: detail.sample_test_cases.map((testCase, index) => ({
      input: testCase.input,
      output: testCase.expected_output,
      explanation: `Sample test case ${index + 1}.`,
    })),
    starterCode: detail.starter_code ?? '',
    expectedComplexity: 'Aim for the optimal time and space complexity for the given constraints.',
    xp: 100,
    relatedLessonId: relatedLesson?.id ?? '',
    relatedLessonTitle: relatedLesson?.title ?? skill?.name ?? 'Related skill',
  };
}
