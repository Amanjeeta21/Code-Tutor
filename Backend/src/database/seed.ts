import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { prisma } from './prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testCaseSchema = z.object({
  input: z.any().transform((value) =>
    typeof value === 'object' ? JSON.stringify(value) : String(value),
  ),
  expected_output: z.any().transform((value) =>
    typeof value === 'object' ? JSON.stringify(value) : String(value),
  ),
  is_hidden: z.boolean().default(false),
  explanation: z.string().optional().default(''),
});

const questionSeedSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  description: z.string().min(1),
  constraints: z.union([z.string(), z.array(z.string())]).transform((value) =>
    Array.isArray(value) ? JSON.stringify(value) : value,
  ),
  starter_code: z.record(z.string(), z.string()).default({}),
  topics: z.array(z.string()).default([]),
  sample_test_cases: z.array(z.object({
    input: z.any().transform((value) =>
      typeof value === 'object' ? JSON.stringify(value) : String(value),
    ),
    output: z.any().transform((value) =>
      typeof value === 'object' ? JSON.stringify(value) : String(value),
    ),
    explanation: z.string().optional().default(''),
  })).optional(),
  test_cases: z.array(testCaseSchema).default([]),
  hints: z.array(z.string()).default([]),
  explanation: z.string().optional().default(''),
  time_limit: z.number().optional().default(2000),
  memory_limit: z.number().optional().default(256),
});

async function main() {
  const seedDir = path.resolve(__dirname, './seed');
  const files = fs.readdirSync(seedDir).filter((file) => file.endsWith('.json'));
  const seenSlugs = new Set<string>();

  for (const file of files) {
    const questions = JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf8'));
    if (!Array.isArray(questions)) {
      throw new Error(`${file} must contain an array of questions`);
    }

    for (const rawQuestion of questions) {
      const question = questionSeedSchema.parse(rawQuestion);
      if (seenSlugs.has(question.slug)) continue;
      seenSlugs.add(question.slug);

      const dbQuestion = await prisma.question.upsert({
        where: { slug: question.slug },
        update: {
          title: question.title,
          difficulty: question.difficulty,
          description: question.description,
          constraints: question.constraints,
          starterCode: question.starter_code,
          hints: question.hints,
          explanation: question.explanation,
          timeLimitMs: question.time_limit,
          memoryLimitMb: question.memory_limit,
        },
        create: {
          slug: question.slug,
          title: question.title,
          difficulty: question.difficulty,
          description: question.description,
          constraints: question.constraints,
          starterCode: question.starter_code,
          hints: question.hints,
          explanation: question.explanation,
          timeLimitMs: question.time_limit,
          memoryLimitMb: question.memory_limit,
        },
      });

      await prisma.questionTopic.deleteMany({ where: { questionId: dbQuestion.id } });
      for (const topicName of question.topics) {
        const topic = await prisma.topic.upsert({
          where: { name: topicName },
          update: {},
          create: { name: topicName },
        });
        await prisma.questionTopic.create({
          data: { questionId: dbQuestion.id, topicId: topic.id },
        });
      }

      const seedCases =
        question.test_cases.length > 0
          ? question.test_cases
          : (question.sample_test_cases ?? []).map((testCase) => ({
              input: testCase.input,
              expected_output: testCase.output,
              is_hidden: false,
              explanation: testCase.explanation,
            }));

      await prisma.testCase.deleteMany({ where: { questionId: dbQuestion.id } });
      for (const testCase of seedCases) {
        await prisma.testCase.create({
          data: {
            questionId: dbQuestion.id,
            input: testCase.input,
            expectedOutput: testCase.expected_output,
            isHidden: testCase.is_hidden,
            explanation: testCase.explanation ?? '',
          },
        });
      }
    }
  }

  console.log(`Seeded ${seenSlugs.size} questions into local Postgres.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
