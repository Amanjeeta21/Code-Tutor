import { BookOpen, Lightbulb } from 'lucide-react';

import { SectionCard } from '@/components/common/section-card';
import { StatusBadge } from '@/components/common/status-badge';
import type { Problem } from '../types/editor-types';

interface ProblemPanelProps {
  problem: Problem;
}

export function ProblemPanel({ problem }: ProblemPanelProps) {
  return (
    <div className="custom-scrollbar h-full space-y-5 overflow-y-auto border border-[#d8d0bb] bg-[#fffaf0]/20 p-5 backdrop-blur-xl">
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
        <p className="mt-2 text-xs text-[#8a836f]">
          Acceptance {problem.acceptance.toFixed(1)}% | {problem.timeLimitMs || 0} ms |{' '}
          {problem.memoryLimitMb || 0} MB
        </p>
      </div>

      <p className="whitespace-pre-line text-sm leading-relaxed text-[#26351d]">
        {problem.description}
      </p>

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
              <div className="mt-2 space-y-1 font-mono text-xs text-[#26351d]">
                <p>
                  <span className="text-[#5c6f1d]">Input:</span> {example.input}
                </p>
                <p>
                  <span className="text-[#405400]">Output:</span> {example.output}
                </p>
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

      {problem.hints.length > 0 && (
        <SectionCard title="Hints">
          <div className="space-y-2">
            {problem.hints.map((hint) => (
              <p key={hint} className="flex gap-2 text-xs text-[#26351d]">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5c6f1d]" />
                {hint}
              </p>
            ))}
          </div>
        </SectionCard>
      )}

      {problem.explanation && (
        <SectionCard title="Explanation">
          <p className="whitespace-pre-line text-xs leading-relaxed text-[#26351d]">
            {problem.explanation}
          </p>
        </SectionCard>
      )}
    </div>
  );
}


