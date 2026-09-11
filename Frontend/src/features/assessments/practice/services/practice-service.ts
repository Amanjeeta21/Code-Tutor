import type { Question, Difficulty, PaginatedResponse, Status } from '../types';

export interface FetchQuestionsParams {
  search?: string;
  difficulty?: Difficulty | 'All';
  topic?: string;
  page?: number;
  perPage?: number;
}

interface BackendQuestion {
  id?: string;
  slug?: string;
  title?: string;
  difficulty?: Difficulty;
  topics?: string[];
  tags?: string[];
  acceptance_rate?: number;
  rating?: number;
  status?: Status;
  description?: string;
  constraints?: string[];
  inputFormat?: string;
  outputFormat?: string;
  starter_code?: Partial<Question['starterCode']>;
  sample_test_cases?: Question['sampleTestCases'];
  test_cases?: Question['testCases'];
  hints?: string[];
  explanation?: string;
  time_limit?: number;
  memory_limit?: number;
  source?: string;
}

const MAX_INTERNAL_QUESTIONS = 100;
const MAX_EXTERNAL_QUESTIONS = 20;
const EXTERNAL_FETCH_TIMEOUT_MS = 3500;
const EXTERNAL_CACHE_KEY = 'skill-lens:external-questions';

function buildQuestionParams(params: FetchQuestionsParams, pageSize: number) {
  const queryParams = new URLSearchParams();
  queryParams.set('page', '1');
  queryParams.set('pageSize', String(pageSize));
  queryParams.set('limit', String(pageSize));

  if (params.difficulty && params.difficulty !== 'All') {
    queryParams.set('difficulty', params.difficulty);
  }
  if (params.topic && params.topic !== 'All') queryParams.set('topic', params.topic);
  if (params.search) queryParams.set('search', params.search);

  return queryParams;
}

async function fetchProgressSummary() {
  let solvedIds: string[] = [];
  let attemptedIds: string[] = [];

  try {
    const progressRes = await fetch('/api/progress/summary');
    if (progressRes.ok) {
      const progressData = await progressRes.json();
      solvedIds = progressData.solvedQuestionIds || [];
      attemptedIds = progressData.attemptedQuestionIds || [];
    }
  } catch (err) {
    console.warn('Failed to fetch progress summary for question statuses', err);
  }

  return { solvedIds, attemptedIds };
}

function getStatus(id: string, solvedIds: string[], attemptedIds: string[]): Status {
  if (solvedIds.includes(id)) return 'Solved';
  if (attemptedIds.includes(id)) return 'Attempted';
  return 'Not Attempted';
}

function getAcceptanceRate(q: BackendQuestion) {
  if (typeof q.acceptance_rate === 'number') return q.acceptance_rate;
  if (!q.rating) return 0;

  const baseRate = q.rating <= 1200 ? 72 : q.rating <= 1800 ? 48 : 29;
  const variation = (((q.title?.length || 10) * 3.7) % 12) - 6;
  return Number(Math.max(8, Math.min(96, baseRate + variation)).toFixed(1));
}

function mapQuestion(q: BackendQuestion, solvedIds: string[], attemptedIds: string[]): Question {
  const id = q.id || q.slug || crypto.randomUUID();
  const topics = q.topics || q.tags || [];
  const constraints = q.constraints || [q.inputFormat, q.outputFormat].filter(Boolean) as string[];

  return {
    id,
    slug: q.slug || id,
    title: q.title || 'Untitled',
    difficulty: q.difficulty || 'Medium',
    topics,
    acceptanceRate: getAcceptanceRate(q),
    status: q.status || getStatus(id, solvedIds, attemptedIds),
    description: q.description || '',
    constraints,
    starterCode: {
      javascript: q.starter_code?.javascript || '',
      python: q.starter_code?.python || '',
      typescript: q.starter_code?.typescript || '',
      java: q.starter_code?.java || '',
      cpp: q.starter_code?.cpp || '',
    },
    sampleTestCases: q.sample_test_cases || [],
    testCases: q.test_cases || [],
    hints: q.hints || [],
    explanation: q.explanation || '',
    timeLimitMs: q.time_limit || 2000,
    memoryLimitMb: q.memory_limit || 256,
  };
}

function cacheExternalQuestions(questions: Question[]) {
  try {
    const existing = JSON.parse(window.sessionStorage.getItem(EXTERNAL_CACHE_KEY) || '{}') as Record<string, Question>;
    const next = { ...existing };
    questions.forEach((question) => {
      next[question.id] = question;
      if (question.slug) next[question.slug] = question;
    });
    window.sessionStorage.setItem(EXTERNAL_CACHE_KEY, JSON.stringify(next));
  } catch {
    // Cache is a convenience for opening external questions, not a hard dependency.
  }
}

async function fetchQuestionItems(endpoint: string, params: URLSearchParams, timeoutMs?: number) {
  const controller = timeoutMs ? new AbortController() : undefined;
  const timeoutId = timeoutMs
    ? window.setTimeout(() => controller?.abort(), timeoutMs)
    : undefined;

  try {
    const res = await fetch(`${endpoint}?${params.toString()}`, { signal: controller?.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch questions from ${endpoint}`);
    }

    const data = await res.json();
    return Array.isArray(data.items) ? data.items as BackendQuestion[] : data.questions || [];
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

export const fetchQuestions = async (
  params: FetchQuestionsParams,
): Promise<PaginatedResponse<Question>> => {
  const page = params.page || 1;
  const perPage = params.perPage || 10;
  const internalParams = buildQuestionParams(params, MAX_INTERNAL_QUESTIONS);
  const externalParams = buildQuestionParams(params, MAX_EXTERNAL_QUESTIONS);
  const { solvedIds, attemptedIds } = await fetchProgressSummary();

  const [internalItems, externalItems] = await Promise.all([
    fetchQuestionItems('/api/questions', internalParams),
    fetchQuestionItems('/api/external-questions', externalParams, EXTERNAL_FETCH_TIMEOUT_MS).catch((err) => {
      console.warn('Failed to fetch external questions', err);
      return [] as BackendQuestion[];
    }),
  ]);

  const mergedQuestions = [...internalItems, ...externalItems].map((question) =>
    mapQuestion(question, solvedIds, attemptedIds),
  );

  cacheExternalQuestions(mergedQuestions.filter((question) => question.id.startsWith('CF_')));

  const start = (page - 1) * perPage;
  const data = mergedQuestions.slice(start, start + perPage);
  const total = mergedQuestions.length;

  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
};

export const simulateAttempt = async (id: string): Promise<void> => {
  void id;
};