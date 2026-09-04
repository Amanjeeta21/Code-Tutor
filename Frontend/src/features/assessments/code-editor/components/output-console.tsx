
import {
  TerminalSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Cpu,
  Sparkles,
  Lightbulb,
  Bug,
  FileCode2,
} from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { SectionCard } from '@/components/common/section-card';
import { StatusBadge } from '@/components/common/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { ExecutionResult, Problem, Submission } from '../types/editor-types';

interface OutputConsoleProps {
  activeTab?: 'testcase' | 'result' | 'submissions';
  setActiveTab?: (tab: 'testcase' | 'result' | 'submissions') => void;
  runResult: ExecutionResult | null;
  isRunning: boolean;
  isSubmitting?: boolean;
  examples?: Problem['examples'];
  submitResult?: Submission | null;
  submissionHistory?: Submission[];
  problem?: Problem;
  
}

export function OutputConsole({
  runResult,
  activeTab = 'testcase',
  setActiveTab,
  examples = [],
  isRunning,
}: OutputConsoleProps) {
  const passed = runResult?.passedCount ?? 0;
  const total = runResult?.totalCount ?? 0;
  const allPassed = runResult?.status === 'Success' && passed === total && total > 0;
  const hasError = runResult?.status === 'Compile Error' || runResult?.status === 'Runtime Error';


  return (
    <SectionCard
      className="flex h-full flex-col overflow-hidden rounded-xl border border-[#d8d0bb] bg-[#f4f0e6]/60 backdrop-blur-xl"
      contentClassName="flex min-h-0 flex-1 flex-col p-0"
    >
      <Tabs
        value={activeTab === 'submissions' ? 'result' : activeTab}
        onValueChange={(value) => setActiveTab?.(value as 'testcase' | 'result')}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex h-10 items-center justify-between border-b border-[#d8d0bb] bg-[#fffaf0]/40 px-4">
          <TabsList className="gap-1 bg-transparent p-0">
            <TabsTrigger
              value="testcase"
              className="rounded-md px-3 py-1 text-xs transition-all duration-200 hover:text-[#26351d] data-[state=active]:bg-[#e8f2ad] data-[state=active]:text-[#10170d]"
            >
              Testcases
            </TabsTrigger>
            <TabsTrigger
              value="result"
              className="rounded-md px-3 py-1 text-xs transition-all duration-200 hover:text-[#26351d] data-[state=active]:bg-[#e8f2ad] data-[state=active]:text-[#10170d]"
            >
              Output
              {runResult && !isRunning && (
                <span
                  className={`ml-2 h-1.5 w-1.5 animate-pulse rounded-full ${allPassed ? 'bg-[#a5bd3c]' : 'bg-rose-400'}`}
                />
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {isRunning && (
              <StatusBadge>
                <span className="h-1 w-1 animate-ping rounded-full bg-[#bdd45a]" />
                Running
              </StatusBadge>
            )}
            {!isRunning && runResult && (
              <StatusBadge tone={allPassed ? 'success' : hasError ? 'danger' : 'warning'}>
                {allPassed
                  ? `${passed}/${total} Passed`
                  : runResult.status === 'Success'
                    ? `${passed}/${total} Passed`
                    : runResult.status}
              </StatusBadge>
            )}
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
          {isRunning && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-[#514b3d]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#a5bd3c] border-t-transparent" />
              <p className="animate-pulse font-mono text-xs tracking-wider text-[#5c6f1d]/80">
                Executing tests in sandbox...
              </p>
            </div>
          )}

          {!isRunning && (
            <TabsContent value="testcase" className="mt-0 space-y-4">
              {examples.map((example, index) => (
                <SectionCard
                  key={example.id}
                  className="border-[#d8d0bb] bg-[#ece5d5]/10 transition-colors duration-200 hover:border-[#c8bea5]"
                  contentClassName="p-3"
                >
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#514b3d]">
                    Case {index + 1}
                  </span>
                  <div className="mt-2 space-y-1.5 font-mono text-xs">
                    <div className="flex items-start">
                      <span className="w-16 shrink-0 text-[#8a836f]">Input:</span>
                      <span className="select-all text-[#10170d]">{example.input}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-16 shrink-0 text-[#8a836f]">Expected:</span>
                      <span className="select-all text-[#5f7800]/90">{example.output}</span>
                    </div>
                  </div>
                </SectionCard>
              ))}
            </TabsContent>
          )}

          {!isRunning && (
            <TabsContent value="result" className="mt-0 space-y-4">
              {!runResult && (
                <EmptyState
                  icon={TerminalSquare}
                  title="No output yet"
                  description="Run or Submit your solution to see the verification logs."
                  className="h-full"
                />
              )}

              {runResult && (
                <div className="space-y-4 font-mono text-xs">
                  {/* Verdict Banner */}
                  {allPassed ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-lg border border-[#8aa500]/20 bg-[#8aa500]/5 p-4 duration-300">
                      <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-[#8aa500]/10 blur-xl" />
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 animate-bounce text-[#5f7800]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-[#5f7800]">
                              Accepted
                            </h3>
                            <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#5c6f1d]" />
                          </div>
                          <p className="mt-1 text-[11px] text-[#26351d]">
                            Your solution successfully passed all tests.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : runResult.status === 'Wrong Answer' ||
                    (runResult.status === 'Success' && total > 0 && passed < total) ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 duration-300">
                      <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-rose-500/10 blur-xl" />
                      <div className="flex items-start gap-3">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wide text-rose-400">
                            Wrong Answer
                          </h3>
                          <p className="mt-1 text-[11px] text-[#26351d]">
                            {passed} / {total} test cases passed. Some cases produced incorrect
                            values.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : hasError ? (
                    <Alert
                      variant="destructive"
                      className="animate-in fade-in slide-in-from-bottom-2 border-rose-500/20 bg-rose-500/5 p-4 duration-300"
                    >
                      {runResult.errorCategory === 'syntax' ? (
                        <FileCode2 className="h-5 w-5 text-rose-400" />
                      ) : (
                        <Bug className="h-5 w-5 text-rose-400" />
                      )}
                      
                      <div className="ml-3">
                        <AlertTitle className="text-sm font-bold tracking-wide text-rose-400 flex items-center gap-2">
                          <span className="uppercase">{runResult.status}</span>
                          {runResult.errorType && (
                            <Badge variant="outline" className="ml-1 border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-300">
                              {runResult.errorType}
                            </Badge>
                          )}
                        </AlertTitle>
                        
                        <AlertDescription className="mt-1.5 text-xs text-[#26351d]">
                          {runResult.errorMessage || 'The sandbox encountered an execution error while running your program.'}
                        </AlertDescription>

                        {runResult.errorSuggestion && (
                          <div className="mt-3 flex items-start gap-2 rounded-md bg-rose-950/40 p-2.5 border border-rose-500/10">
                            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5c6f1d]" />
                            <p className="text-[11px] text-rose-200/90 leading-relaxed">
                              {runResult.errorSuggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    </Alert>
                  ) : runResult.status === 'Time Limit Exceeded' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-lg border border-[#a5bd3c]/20 bg-[#a5bd3c]/5 p-4 duration-300">
                      <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-[#a5bd3c]/10 blur-xl" />
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#5c6f1d]" />
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wide text-[#5c6f1d]">
                            Time Limit Exceeded
                          </h3>
                          <p className="mt-1 text-[11px] text-[#26351d]">
                            Your program did not finish within the allowed execution limit.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Metrics Badges Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {runResult.runtime !== undefined && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 border border-[#d8d0bb] bg-[#ece5d5] px-2.5 py-1 text-[10px] text-[#26351d]"
                      >
                        <Clock className="h-3 w-3 text-[#5c6f1d]" />
                        Runtime: {runResult.runtime} ms
                      </Badge>
                    )}
                    {runResult.memory !== undefined && runResult.memory > 0 && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 border border-[#d8d0bb] bg-[#ece5d5] px-2.5 py-1 text-[10px] text-[#26351d]"
                      >
                        <Cpu className="h-3 w-3 text-[#5c6f1d]" />
                        Memory: {runResult.memory} MB
                      </Badge>
                    )}
                    {total > 0 && (
                      <Badge
                        variant="secondary"
                        className={`flex items-center gap-1.5 border bg-[#ece5d5] px-2.5 py-1 text-[10px] ${allPassed ? 'border-[#8aa500]/30 text-[#5f7800]' : 'border-rose-500/30 text-rose-400'}`}
                      >
                        {passed} / {total} Testcases Passed
                      </Badge>
                    )}
                  </div>

                  {/* Errors Block */}
                  {hasError && runResult.stderr && (
                    <SectionCard className="border-rose-500/10 bg-rose-950/10">
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-[#d8d0bb] bg-[#fffaf0]/80 p-3 font-mono text-[11px] leading-relaxed text-rose-300/90">
                        {runResult.stderr}
                      </pre>
                    </SectionCard>
                  )}

                  {/* Passed Visual Progress Indicators */}
                  {(runResult.status === 'Success' || runResult.status === 'Wrong Answer') &&
                    total > 0 && (
                      <div className="space-y-2">
                        <div className="flex gap-1.5">
                          {Array.from({ length: total }, (_, index) => (
                            <div
                              key={index}
                              title={`Test case ${index + 1}: ${index < passed ? 'Passed' : 'Failed'}`}
                              className={`h-2 flex-1 rounded-full transition-all duration-300 ${index < passed ? 'bg-[#8aa500]/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-rose-500/80 shadow-[0_0_8px_rgba(239,68,68,0.3)]'}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Failed Test Case Breakdown */}
                  {runResult.failedCases && runResult.failedCases.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#514b3d]">
                          Failed Case Details
                        </h4>
                        <span className="text-[10px] font-semibold text-rose-400/80">
                          {runResult.failedCases.length} failing
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {runResult.failedCases.map((failedCase, idx) => (
                          <div
                            key={failedCase.testCaseId || idx}
                            className="space-y-2.5 rounded-lg border border-rose-500/15 bg-rose-950/5 p-3 transition-colors hover:bg-rose-950/10"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-rose-400">
                                Test Case {Number(failedCase.testCaseId) + 1}
                              </span>
                              <Badge
                                variant="destructive"
                                className="border border-rose-500/20 bg-rose-950/40 px-2 py-0.5 text-[9px] font-bold text-rose-400"
                              >
                                Failed
                              </Badge>
                            </div>

                            {failedCase.input && (
                              <div className="space-y-2 font-mono text-[11px]">
                                <div className="rounded border border-[#d8d0bb] bg-[#fffaf0]/40 p-2">
                                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[#8a836f]">
                                    Input
                                  </span>
                                  <code className="break-all text-[#10170d]">
                                    {failedCase.input}
                                  </code>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="rounded border border-[#d8d0bb] bg-[#fffaf0]/40 p-2">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[#8a836f]">
                                      Expected Output
                                    </span>
                                    <code className="break-all font-semibold text-[#5f7800]">
                                      {failedCase.expectedOutput}
                                    </code>
                                  </div>
                                  <div className="rounded border border-[#d8d0bb] bg-[#fffaf0]/40 p-2">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[#8a836f]">
                                      Actual Output
                                    </span>
                                    <code className="break-all font-semibold text-rose-400">
                                      {failedCase.actualOutput || 'No output'}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            )}

                            {failedCase.errorMessage && (
                              <div className="rounded border border-rose-500/10 bg-[#fffaf0]/50 p-2 font-mono text-[11px] text-rose-300/90">
                                <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[#8a836f]">
                                  Execution Failure Details
                                </span>
                                {failedCase.errorMessage}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Standard Console Output */}
                  {runResult.stdout && !runResult.stdout.startsWith('Passed') && (
                    <SectionCard
                      className="mt-2 border-[#d8d0bb] bg-[#ece5d5]/5"
                      contentClassName="p-3"
                    >
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#514b3d]">
                        Stdout logs
                      </span>
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-[#d8d0bb] bg-[#fffaf0]/80 p-3 font-mono text-[11px] leading-relaxed text-[#26351d]">
                        {runResult.stdout}
                      </pre>
                    </SectionCard>
                  )}
                </div>
              )}
            </TabsContent>
          )}
        </div>
      </Tabs>
    </SectionCard>
  );
}

