import { Router } from "express";

const router = Router();
const DATASET_API = "https://datasets-server.huggingface.co/filter";
const MAX_PAGE_SIZE = 50;
const DEFAULT_FETCH_SIZE = 20;

type ExternalDifficulty = "Easy" | "Medium" | "Hard";

interface HuggingFaceRow {
  row_idx: number;
  row: {
    title?: string;
    description?: string;
    input_format?: string;
    output_format?: string;
    examples?: unknown[];
    rating?: number;
    tags?: string[];
    time_limit?: number;
    memory_limit?: number;
    interaction_format?: unknown;
    official_tests?: { input?: string; output?: string }[];
  };
}

function parseNonNegativeInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getDifficulty(rating?: number): ExternalDifficulty {
  if (!rating || rating <= 1200) return "Easy";
  if (rating <= 1800) return "Medium";
  return "Hard";
}

function buildUrl(offset: number, length: number, extraWhere?: string) {
  const url = new URL(DATASET_API);

  url.searchParams.set("dataset", "open-r1/codeforces");
  url.searchParams.set("config", "verifiable");
  url.searchParams.set("split", "train");

  const baseWhere = `"executable"=true AND "input_mode"='stdio' AND "official_tests_complete"=true`;
  url.searchParams.set("where", extraWhere ? `${baseWhere} AND ${extraWhere}` : baseWhere);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("length", String(length));

  return url;
}

function toExternalQuestion(item: HuggingFaceRow, fallbackRowId = item.row_idx, includeTests = false) {
  const q = item.row;
  const difficulty = getDifficulty(q.rating);
  const examples = Array.isArray(q.examples) ? q.examples : [];
  const officialTests = includeTests && Array.isArray(q.official_tests) ? q.official_tests : [];

  return {
    id: `CF_${fallbackRowId}`,
    slug: `CF_${fallbackRowId}`,
    hfRowId: item.row_idx,
    title: q.title || "Untitled Codeforces Problem",
    difficulty,
    description: q.description || "",
    constraints: [q.input_format, q.output_format].filter(Boolean),
    starter_code: {},
    topics: q.tags || [],
    tags: q.tags || [],
    test_cases: officialTests.map((testCase, index) => ({
      input: testCase.input || "",
      expected_output: testCase.output || "",
      is_hidden: index >= Math.min(2, officialTests.length),
    })),
    sample_test_cases: officialTests.slice(0, 2).map((testCase) => ({
      input: testCase.input || "",
      output: testCase.output || "",
    })),
    examples,
    hints: [],
    explanation: "",
    acceptance_rate: 0,
    rating: q.rating,
    time_limit: q.time_limit ? q.time_limit * 1000 : 2000,
    memory_limit: q.memory_limit || 256,
    source: "Codeforces",
  };
}

function filterQuestions(
  questions: ReturnType<typeof toExternalQuestion>[],
  search: string,
  difficulty: string,
  topic: string,
) {
  const normalizedSearch = search.toLowerCase();
  const normalizedTopic = topic.toLowerCase();

  return questions.filter((question) => {
    if (difficulty && difficulty !== "All" && question.difficulty !== difficulty) {
      return false;
    }

    if (topic && topic !== "All") {
      const hasTopic = question.topics.some((item) => item.toLowerCase() === normalizedTopic);
      if (!hasTopic) return false;
    }

    if (normalizedSearch) {
      const haystack = [
        question.title,
        question.description,
        question.slug,
        question.source,
        ...question.topics,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(normalizedSearch)) return false;
    }

    return true;
  });
}

async function fetchRows(offset: number, length: number, extraWhere?: string) {
  const response = await fetch(buildUrl(offset, length, extraWhere));

  if (!response.ok) {
    throw new Error(`Hugging Face returned ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.rows) ? (data.rows as HuggingFaceRow[]) : [];
}

router.get("/", async (req, res) => {
  try {
    const page = Math.max(parsePositiveInt(req.query.page, 1), 1);
    const limit = Math.min(parsePositiveInt(req.query.limit ?? req.query.pageSize, 20), MAX_PAGE_SIZE);
    const offset = parseNonNegativeInt(req.query.offset, (page - 1) * limit);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const difficulty = typeof req.query.difficulty === "string" ? req.query.difficulty.trim() : "";
    const topic = typeof req.query.topic === "string" ? req.query.topic.trim() : "";

    const rows = await fetchRows(offset, Math.max(limit, DEFAULT_FETCH_SIZE));
    const questions = filterQuestions(
      rows
        .filter((item) => !item.row.interaction_format)
        .map((item, index) => toExternalQuestion(item, offset + index)),
      search,
      difficulty,
      topic,
    ).slice(0, limit);

    res.setHeader("Cache-Control", "no-store");
    res.json({
      items: questions,
      questions,
      page,
      limit,
      pageSize: limit,
      total: offset + questions.length + (questions.length === limit ? limit : 0),
    });
  } catch (error) {
    console.error("External question error:", error);
    res.status(500).json({
      error: "Could not fetch external questions",
    });
  }
});

router.get("/:externalQuestionId", async (req, res) => {
  try {
    const match = req.params.externalQuestionId.match(/^CF_(\d+)$/i);
    if (!match) {
      return res.status(404).json({ error: "External question not found" });
    }

    const rowId = Number(match[1]);
    const rows = await fetchRows(rowId, 1);
    const row = rows[0];

    if (!row || row.row.interaction_format) {
      return res.status(404).json({ error: "External question not found" });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(toExternalQuestion(row, rowId, true));
  } catch (error) {
    console.error("External question detail error:", error);
    res.status(500).json({
      error: "Could not fetch external question",
    });
  }
});

export default router;