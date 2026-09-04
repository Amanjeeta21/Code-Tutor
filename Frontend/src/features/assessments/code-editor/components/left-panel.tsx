import { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  Clock,
  HardDrive,
  History,
  Lightbulb,
  Lock,
  Tags,
  Trophy,
  Unlock,
} from 'lucide-react';

import { SectionCard } from '@/components/common/section-card';
import { StatusBadge } from '@/components/common/status-badge';
import { ResultsPanel } from './results-panel';
import { cn } from '@/lib/utils';
import type { Problem, Submission } from '../types/editor-types';

interface LeftPanelProps {
  problem: Problem;
  submissionHistory: Submission[];
  latestSubmission: Submission | null;
  loadSubmittedCode?: (code: string) => void;
  onRun?: () => void;
  onReset?: () => void;
  totalSubmissions?: number;
  acceptanceRate?: number;
}

type LeftTab = 'description' | 'hints' | 'submissions';

function estimateComplexity(code?: string) {
  const source = code || '';
  const loopCount = (source.match(/\b(for|while)\b/g) || []).length;
  const hasSort = /\.(sort)\s*\(|\bsort\s*\(/.test(source);
  const hasHash = /\b(Map|Set|dict|unordered_map|HashMap|set\()/i.test(source);
  const hasRecursion = /function\s+(\w+)[\s\S]*\1\s*\(|def\s+(\w+)[\s\S]*\2\s*\(/.test(source);

  if (hasSort) return { time: 'O(n log n)', space: hasHash ? 'O(n)' : 'O(1) to O(n)' };
  if (loopCount >= 2) return { time: 'O(n^2)', space: hasHash ? 'O(n)' : 'O(1)' };
  if (hasRecursion) return { time: 'Depends on recursion branching', space: 'O(recursion depth)' };
  if (loopCount === 1) return { time: 'O(n)', space: hasHash ? 'O(n)' : 'O(1)' };
  return { time: 'O(1) or input dependent', space: 'O(1)' };
}

function mentorFeedbackFor(submission: Submission) {
  if (submission.status === 'Accepted') {
    return 'Accepted. Nice work. Review the invariant and edge cases so the pattern sticks.';
  }
  if (submission.status === 'Compile Error') {
    return 'Start with the first compiler error. Check syntax, declarations, braces, indentation, and the required function signature.';
  }
  if (submission.status === 'Runtime Error') {
    return 'Dry run the smallest sample and inspect index bounds, null values, type assumptions, and division by zero.';
  }
  if (submission.status === 'Time Limit Exceeded') {
    return 'Look for repeated work inside loops. Consider storing intermediate results or reducing the search space.';
  }
  return 'Compare expected and actual output on one failing case. Find the first state value that diverges.';
}

function buildProgressiveHints(
  problem: Problem,
): { label: string; description: string; content: string }[] {
  const hints = problem.hints.filter(Boolean);
  return [
    {
      label: 'Level 1 · Concept',
      description: 'High-level conceptual nudge',
      content:
        hints[0] ||
        'Restate what the output represents, then identify the core state you need to track.',
    },
    {
      label: 'Level 2 · Clue',
      description: 'Logical observation to guide your approach',
      content:
        hints[1] ||
        'Ask whether a single scan, sorting, two pointers, a stack, or a hash map best fits the input shape.',
    },
    {
      label: 'Level 3 · Direction',
      description: 'Algorithmic path without code',
      content:
        hints[2] ||
        'Consider the invariant your loop must maintain, and what information to carry across iterations.',
    },
    {
      label: 'Level 4 · Pseudocode',
      description: 'Structured approach in plain English',
      content:
        hints[3] ||
        'Initialise a result variable. Iterate over the input. Update your state based on each element. Return the result.',
    },
    {
      label: 'Level 5 · Edge Cases',
      description: 'Common pitfalls and boundary conditions',
      content:
        hints[4] ||
        'Check: empty input, single element, duplicates, negative values, already-sorted input, and maximum-constraint data.',
    },
  ];
}

export function LeftPanel({
  problem,
  submissionHistory,
  latestSubmission,
  loadSubmittedCode,
  totalSubmissions = 0,
  acceptanceRate,
}: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftTab>('description');
  const [unlockedHints, setUnlockedHints] = useState(1);
  const submissions = useMemo(
    () =>
      latestSubmission
        ? [latestSubmission, ...submissionHistory.filter((s) => s.id !== latestSubmission.id)]
        : submissionHistory,
    [latestSubmission, submissionHistory],
  );
  const progressiveHints = useMemo(() => buildProgressiveHints(problem), [problem]);

  return (
    <div className="flex h-full flex-col overflow-hidden border border-[#d8d0bb] bg-[#fffaf0]/20 backdrop-blur-xl">
      <div className="flex h-11 shrink-0 border-b border-[#d8d0bb]/70 bg-[#fffaf0]/40">
        {(['description', 'hints', 'submissions'] as LeftTab[]).map((tab) => {
          const isSubmissions = tab === 'submissions';
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 text-xs font-bold capitalize transition',
                activeTab === tab
                  ? 'border-[#a5bd3c] text-[#5c6f1d]'
                  : 'border-transparent text-[#8a836f] hover:text-[#10170d]',
              )}
            >
              <span>{tab}</span>
              {isSubmissions && totalSubmissions > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none transition-colors duration-150',
                    activeTab === tab
                      ? 'bg-[#a5bd3c]/20 text-[#5c6f1d]'
                      : 'bg-[#ded7c8]/60 text-[#8a836f]',
                  )}
                >
                  {totalSubmissions}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
        {activeTab === 'description' && (
          <DescriptionTab problem={problem} acceptanceRate={acceptanceRate} />
        )}
        {activeTab === 'hints' && (
          <div className="space-y-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-[#8a836f]">
                {unlockedHints < progressiveHints.length
                  ? `${unlockedHints} of ${progressiveHints.length} hints revealed`
                  : 'All hints revealed'}
              </p>
              <span className="flex gap-1">
                {progressiveHints.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i < unlockedHints ? 'bg-[#bdd45a]' : 'bg-[#c8bea5]'
                    }`}
                  />
                ))}
              </span>
            </div>

            {progressiveHints.map((hint, index) => {
              const isUnlocked = index < unlockedHints;
              return (
                <div
                  key={index}
                  className={`rounded-lg border p-3 transition-all ${
                    isUnlocked
                      ? 'border-[#a5bd3c]/20 bg-[#ece5d5]/30'
                      : 'border-[#d8d0bb]/40 bg-[#ece5d5]/10 opacity-60'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#5c6f1d]">
                      {isUnlocked ? (
                        <Unlock className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3 text-[#514b3d]" />
                      )}
                      <span className={isUnlocked ? 'text-[#5c6f1d]' : 'text-[#514b3d]'}>
                        {hint.label}
                      </span>
                    </p>
                    {isUnlocked && (
                      <span className="rounded border border-[#c8bea5]/60 bg-[#ded7c8]/60 px-1.5 py-0.5 font-mono text-[9px] text-[#8a836f]">
                        {hint.description}
                      </span>
                    )}
                  </div>

                  {isUnlocked ? (
                    <p className="text-sm leading-6 text-[#26351d]">{hint.content}</p>
                  ) : (
                    <p className="text-xs text-[#514b3d]">
                      🔒 Complete reading the previous hint first.
                    </p>
                  )}
                </div>
              );
            })}

            {unlockedHints < progressiveHints.length && (
              <button
                onClick={() => setUnlockedHints((n) => Math.min(n + 1, progressiveHints.length))}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-[#a5bd3c]/30 bg-[#a5bd3c]/5 py-2 text-xs font-bold text-[#5c6f1d] transition hover:border-[#a5bd3c]/50 hover:bg-[#a5bd3c]/10"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Reveal Next Hint
                <ChevronDown className="h-3 w-3" />
              </button>
            )}

            {unlockedHints === progressiveHints.length && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-[#8aa500]/20 bg-[#8aa500]/5 py-2 text-xs font-semibold text-[#5f7800]">
                <Trophy className="h-3.5 w-3.5" />
                All hints revealed — trust your understanding!
              </div>
            )}
          </div>
        )}
        {activeTab === 'submissions' && (
          <SubmissionsTab
            submissions={submissions}
            loadSubmittedCode={loadSubmittedCode}
            submissionHistory={submissionHistory}
            totalSubmissions={totalSubmissions}
          />
        )}
      </div>
    </div>
  );
}

function DescriptionTab({
  problem,
  acceptanceRate,
}: {
  problem: Problem;
  acceptanceRate?: number;
}) {
  const displayAcceptance =
    typeof acceptanceRate === 'number' ? acceptanceRate : problem.acceptance;
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#5c6f1d]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8a836f]">
            Problem
          </span>
          <StatusBadge
            tone={
              problem.difficulty === 'Easy'
                ? 'success'
                : problem.difficulty === 'Medium'
                  ? 'warning'
                  : 'danger'
            }
          >
            {problem.difficulty}
          </StatusBadge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#10170d]">{problem.title}</h1>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#514b3d]">
          <span>Acceptance {displayAcceptance.toFixed(1)}%</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {problem.timeLimitMs || 0} ms
          </span>
          <span className="inline-flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {problem.memoryLimitMb || 0} MB
          </span>
        </div>
      </div>

      <SectionCard title="Statement">
        <p className="whitespace-pre-line text-sm leading-relaxed text-[#26351d]">
          {problem.description}
        </p>
      </SectionCard>

      <SectionCard title="Input Format">
        <p className="text-xs leading-relaxed text-[#26351d]">
          Inputs follow the function signature and sample test case structure for this problem.
        </p>
      </SectionCard>

      <SectionCard title="Output Format">
        <p className="text-xs leading-relaxed text-[#26351d]">
          Return or print the value that matches each expected output.
        </p>
      </SectionCard>

      <SectionCard title="Examples">
        <div className="space-y-3">
          {problem.examples.map((example) => (
            <div
              key={example.id}
              className="rounded-lg border border-[#d8d0bb] bg-[#ece5d5]/30 p-3"
            >
              <p className="font-mono text-[10px] font-bold uppercase text-[#8a836f]">
                Example {example.id}
              </p>
              <div className="mt-2 space-y-2 font-mono text-xs text-[#26351d]">
                <pre className="whitespace-pre-wrap rounded bg-[#fffaf0]/60 p-2">
                  <span className="text-[#5c6f1d]">Input:</span> {example.input}
                </pre>
                <pre className="whitespace-pre-wrap rounded bg-[#fffaf0]/60 p-2">
                  <span className="text-[#405400]">Output:</span> {example.output}
                </pre>
              </div>
              {example.explanation && (
                <p className="mt-2 border-t border-[#d8d0bb] pt-2 text-xs text-[#514b3d]">
                  {example.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Constraints">
        <ul className="list-inside list-disc space-y-2 text-xs text-[#26351d]">
          {problem.constraints.map((constraint) => (
            <li key={constraint}>{constraint}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Tags">
        <div className="flex flex-wrap gap-2">
          {problem.topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center gap-1 rounded border border-[#c8bea5] bg-[#ece5d5] px-2 py-1 text-xs text-[#26351d]"
            >
              <Tags className="h-3 w-3" />
              {topic}
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Starter Code">
        <pre className="max-h-64 overflow-auto rounded-lg bg-[#fffaf0]/80 p-3 font-mono text-xs leading-5 text-[#26351d]">
          {problem.templates.javascript ||
            problem.templates.python ||
            'Starter code is not available for this problem.'}
        </pre>
      </SectionCard>
    </div>
  );
}

function SubmissionItem({
  submission,
  loadSubmittedCode,
  submissionHistory,
}: {
  submission: Submission;
  loadSubmittedCode?: (code: string) => void;
  submissionHistory: Submission[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const complexity = estimateComplexity(submission.code);

  return (
    <div className="rounded-lg border border-[#d8d0bb] bg-[#ece5d5]/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={cn(
              'text-sm font-bold',
              submission.status === 'Accepted'
                ? 'text-[#5f7800]'
                : submission.status === 'Wrong Answer'
                  ? 'text-[#5c6f1d]'
                  : 'text-[#7b2116]',
            )}
          >
            {submission.status}
          </p>
          <p className="mt-1 text-[10px] text-[#8a836f]">
            {new Date(submission.submittedAt).toLocaleString()} - {submission.language}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded border border-[#c8bea5] px-2 py-1 text-[10px] font-bold text-[#26351d] hover:border-[#8a836f]"
          >
            {isExpanded ? 'Collapse' : 'Details'}
          </button>
          {loadSubmittedCode && (
            <button
              onClick={() => loadSubmittedCode(submission.code)}
              className="rounded border border-[#c8bea5] px-2 py-1 text-[10px] font-bold text-[#26351d] hover:border-[#a5bd3c] hover:text-[#5c6f1d]"
            >
              Load
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <pre className="max-h-40 overflow-auto rounded bg-[#fffaf0]/70 p-3 font-mono text-[11px] text-[#514b3d]">
            {submission.code}
          </pre>
          <div className="mt-3 grid gap-2 text-xs text-[#514b3d] sm:grid-cols-2">
            <span>
              Tests: {submission.passedCount ?? 0}/{submission.totalCount ?? '?'}
            </span>
            <span>Runtime: {submission.runtime ?? 0}ms</span>
            <span>Memory: {submission.memory ?? 0}MB</span>
            <span>Time: {complexity.time}</span>
            <span>Space: {complexity.space}</span>
          </div>
          {(submission.stderr || submission.stdout) && (
            <pre className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap rounded bg-[#fffaf0]/70 p-2 font-mono text-[11px] text-[#26351d]">
              {submission.stderr || submission.stdout}
            </pre>
          )}
          <p className="rounded border border-[#a5bd3c]/20 bg-[#a5bd3c]/5 p-2 text-xs leading-5 text-[#26351d]">
            {mentorFeedbackFor(submission)}
          </p>
          <div className="border-t border-[#d8d0bb] pt-3">
            <ResultsPanel
              type="submit"
              result={submission}
              isLoading={false}
              examples={[]}
              benchmark={{ runtimeMs: 2000, memoryMb: 256 }}
              submissionHistory={submissionHistory}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionsTab({
  submissions,
  loadSubmittedCode,
  submissionHistory,
  totalSubmissions,
}: {
  submissions: Submission[];
  loadSubmittedCode?: (code: string) => void;
  submissionHistory: Submission[];
  totalSubmissions?: number;
}) {
  if (submissions.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[#8a836f]">
        <History className="mb-3 h-8 w-8 opacity-50" />
        Submit code to see verdicts, performance, errors, complexity, and mentor feedback here.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {typeof totalSubmissions === 'number' && totalSubmissions > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-[#d8d0bb]/80 bg-[#ece5d5]/10 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#8a836f]" />
            <span className="text-xs font-bold text-[#514b3d]">Total Attempts</span>
          </div>
          <span className="font-mono text-sm font-black text-[#10170d]">{totalSubmissions}</span>
        </div>
      )}

      <div className="space-y-3">
        {submissions.map((submission) => (
          <SubmissionItem
            key={submission.id}
            submission={submission}
            loadSubmittedCode={loadSubmittedCode}
            submissionHistory={submissionHistory}
          />
        ))}
      </div>
    </div>
  );
}


