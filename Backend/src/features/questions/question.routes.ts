import { Router } from 'express';
import { Prisma, type Difficulty } from '@prisma/client';

import { prisma } from '../../database/prisma.js';

const router = Router();

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
}

function jsonStringArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value) ? value.map(String) : [];
}

function toQuestionItem(
  question: Prisma.QuestionGetPayload<{
    include: {
      topics: { include: { topic: true } };
      testCases: true;
    };
  }>,
) {
  const publicTestCases = question.testCases.filter((testCase) => !testCase.isHidden);

  return {
    id: question.id,
    slug: question.slug,
    title: question.title,
    difficulty: question.difficulty,
    description: question.description,
    constraints: parseStringArray(question.constraints),
    starter_code: question.starterCode,
    topics: question.topics.map((questionTopic) => questionTopic.topic.name),
    test_cases: question.testCases.map((testCase) => ({
      input: testCase.input,
      expected_output: testCase.expectedOutput,
      is_hidden: testCase.isHidden,
      explanation: testCase.explanation,
    })),
    sample_test_cases: publicTestCases.map((testCase) => ({
      input: testCase.input,
      output: testCase.expectedOutput,
      explanation: testCase.explanation,
    })),
    hints: jsonStringArray(question.hints),
    explanation: question.explanation,
    acceptance_rate: 0,
    time_limit: question.timeLimitMs,
    memory_limit: question.memoryLimitMb,
  };
}

router.get('/questions', async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 10), 100);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const topic = typeof req.query.topic === 'string' ? req.query.topic.trim() : '';
    const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty.trim() : '';

    const where: Prisma.QuestionWhereInput = {};

    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      where.difficulty = difficulty as Difficulty;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          topics: {
            some: {
              topic: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    if (topic && topic !== 'All') {
      where.topics = {
        some: {
          topic: {
            name: { equals: topic, mode: 'insensitive' },
          },
        },
      };
    }

    const [total, questions] = await prisma.$transaction([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        include: {
          topics: { include: { topic: true } },
          testCases: true,
        },
        orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.status(200).json({
      items: questions.map(toQuestionItem),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/questions/:problemSlug', async (req, res, next) => {
  try {
    const question = await prisma.question.findFirst({
      where: {
        OR: [{ slug: req.params.problemSlug }, { id: req.params.problemSlug }],
      },
      include: {
        topics: { include: { topic: true } },
        testCases: true,
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    return res.status(200).json(toQuestionItem(question));
  } catch (error) {
    next(error);
  }
});

export default router;
