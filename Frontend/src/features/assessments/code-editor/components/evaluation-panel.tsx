/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Brain, Zap, Sparkles } from 'lucide-react';

interface TraceNode {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'done' | 'skipped' | 'error';
  duration: number | null;
}

const INITIAL_NODES: TraceNode[] = [
  { id: 'executeCode', name: 'Execute Code', status: 'pending', duration: null },
  { id: 'runTests', name: 'Run Test Cases', status: 'pending', duration: null },
  { id: 'detectBugs', name: 'Detect Bugs', status: 'pending', duration: null },
  { id: 'analyzeComplexity', name: 'Analyze Complexity', status: 'pending', duration: null },
  { id: 'reviewCode', name: 'Review Code Quality', status: 'pending', duration: null },
  { id: 'computeScore', name: 'Compute Evaluation Score', status: 'pending', duration: null },
  { id: 'classifyVerdict', name: 'Classify Verdict', status: 'pending', duration: null },
  { id: 'generateFeedback', name: 'Generate Feedback', status: 'pending', duration: null },
  { id: 'saveEvalResult', name: 'Save Evaluation Result', status: 'pending', duration: null },
];

interface EvaluationPanelProps {
  problemId: string;
  submittedCode: string;
  testCases: Array<{ input: string; expected_output: string }>;
  userId: string;
  language: string;
  onClose: () => void;
  isEvaluating: boolean;
  setIsEvaluating: (val: boolean) => void;
  onEvaluationComplete?: (data: any) => void;
  supervisorTimeline?: any[];
  supervisorDecision?: any;
  isSupervisorRunning?: boolean;
  onConsultCoach?: () => void;
}

export function EvaluationPanel({
  problemId,
  submittedCode,
  testCases,
  userId,
  language,
  onClose,
  isEvaluating,
  setIsEvaluating,
  onEvaluationComplete,
  supervisorTimeline = [],
  supervisorDecision = null,
  isSupervisorRunning = false,
  onConsultCoach,
}: EvaluationPanelProps) {
  const [nodes, setNodes] = useState<TraceNode[]>(INITIAL_NODES);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Collapsible section states
  const [collapseTests, setCollapseTests] = useState(false);
  const [collapseComplexity, setCollapseComplexity] = useState(false);
  const [collapseQuality, setCollapseQuality] = useState(false);
  const [collapseFeedback, setCollapseFeedback] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Capture the code and language exactly as they were at the moment the user clicked Submit
  const codeOnMount = useRef(submittedCode).current;
  const languageOnMount = useRef(language).current;

  // Trigger evaluation
  useEffect(() => {
    let active = true;

    // Reset nodes state
    setNodes(INITIAL_NODES.map((n, i) => (i === 0 ? { ...n, status: 'running' } : n)));
    setResult(null);
    setError(null);
    setIsEvaluating(true);

    // Setup WebSockets to listen on 8001
    const ws = new WebSocket('ws://localhost:8001');
    wsRef.current = ws;
    let evalStarted = false;

    const triggerEvalOnce = () => {
      if (evalStarted) return;
      evalStarted = true;
      void triggerEval();
    };

    ws.onopen = () => {
      if (!active) return;
      triggerEvalOnce();
    };

    ws.onmessage = (event) => {
      if (!active) return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'node_complete') {
          setNodes((prev) => {
            const nextNodes = prev.map((n) => {
              if (n.id === data.node) {
                return {
                  ...n,
                  status: data.status,
                  duration: data.duration_ms,
                };
              }
              return n;
            });

            // Set the next pending node as 'running'

            const firstPendingIndex = nextNodes.findIndex(
              (n) => n.status === 'pending' || n.status === 'running',
            );

            if (firstPendingIndex !== -1) {
              return nextNodes.map((n, idx) => {
                if (idx === firstPendingIndex) {
                  return { ...n, status: 'running' as const };
                }
                return n;
              });
            }

            return nextNodes;
          });
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };

    ws.onerror = (err) => {
      if (!active) return;
      console.warn('WS connection error, will rely on REST API fallback for final state', err);
      triggerEvalOnce();
    };

    const safetyTimeout = setTimeout(() => {
      if (!active) return;
      triggerEvalOnce();
    }, 500);

    // Call REST API
    async function triggerEval() {
      try {
        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            problemId,
            submittedCode: codeOnMount,
            testCases: testCases.map((tc) => ({
              input: tc.input,
              expectedOutput: tc.expected_output,
            })),
            trigger: 'submit',
            language: languageOnMount,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Evaluation failed');
        }

        const data = await response.json();
        if (!active) return;

        setResult(data);
        if (onEvaluationComplete) {
          onEvaluationComplete(data);
        }

        // Fill all remaining trace nodes as completed
        setNodes((prev) =>
          prev.map((n) => {
            if (n.status === 'pending' || n.status === 'running') {
              return { ...n, status: 'done', duration: n.duration || 10 };
            }
            return n;
          }),
        );
      } catch (err: any) {
        if (!active) return;
        setError(err.message || 'An error occurred during evaluation');
        setNodes((prev) =>
          prev.map((n) => (n.status === 'running' ? { ...n, status: 'error' } : n)),
        );
      } finally {
        if (active) {
          setIsEvaluating(false);
          if (wsRef.current) {
            const wsToClose = wsRef.current;
            wsToClose.onopen = null;
            wsToClose.onmessage = null;
            wsToClose.onerror = null;
            if (wsToClose.readyState === WebSocket.OPEN) {
              wsToClose.close();
            } else if (wsToClose.readyState === WebSocket.CONNECTING) {
              wsToClose.onopen = () => wsToClose.close();
            }
          }
        }
      }
    }

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      if (wsRef.current) {
        const wsToClose = wsRef.current;
        wsToClose.onopen = null;
        wsToClose.onmessage = null;
        wsToClose.onerror = null;
        if (wsToClose.readyState === WebSocket.OPEN) {
          wsToClose.close();
        } else if (wsToClose.readyState === WebSocket.CONNECTING) {
          wsToClose.onopen = () => wsToClose.close();
        }
      }
    };
  }, [problemId, userId, codeOnMount, languageOnMount]);

  // Animated circular score offset computation
  const score = result?.evalScore || 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const [strokeOffset, setStrokeOffset] = useState(circumference);

  useEffect(() => {
    if (!isEvaluating && result) {
      const timer = setTimeout(() => {
        const progress = score / 100;
        setStrokeOffset(circumference * (1 - progress));
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setStrokeOffset(circumference);
    }
  }, [isEvaluating, result, score, circumference]);

  // Color helper based on verdict
  const getVerdictTheme = () => {
    if (isEvaluating)
      return { text: 'text-[#5c6f1d]', border: 'border-[#a5bd3c]/30', bg: 'bg-[#e8f2ad]/20' };
    const verdict = result?.verdict;
    if (verdict === 'Pass') {
      return {
        text: 'text-[#5f7800]',
        border: 'border-[#8aa500]/20',
        bg: 'bg-emerald-950/20',
        stroke: '#10B981',
      };
    }
    if (verdict === 'Partial Pass') {
      return {
        text: 'text-[#5c6f1d]',
        border: 'border-[#a5bd3c]/20',
        bg: 'bg-[#e8f2ad]/20',
        stroke: '#F59E0B',
      };
    }
    return {
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      bg: 'bg-rose-950/20',
      stroke: '#F43F5E',
    };
  };

  const theme = getVerdictTheme();

  return (
    <div className="flex h-full flex-col border-l border-[#d8d0bb] bg-[#fffaf0] font-sans text-[#10170d] antialiased">
      {/* Sidebar Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#d8d0bb] px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#5c6f1d]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#514b3d]">
            Agentic Evaluation
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isEvaluating && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#bdd45a] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#a5bd3c]"></span>
              </span>
              <span className="font-mono text-[10px] text-[#5c6f1d]">Evaluating...</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="rounded p-1 text-[#8a836f] transition hover:bg-[#fffaf0] hover:text-[#10170d]"
          >
            <span className="font-mono text-xs font-bold">✖</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {/* Error State */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 text-xs text-rose-300">
            <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="font-bold">Evaluation Interrupted</p>
              <p className="mt-1 font-mono leading-relaxed text-[#514b3d]">{error}</p>
            </div>
          </div>
        )}

        {/* 1. Verdict Card */}
        {(!isEvaluating || result) && !error && result && (
          <div
            className={`rounded-xl border ${theme.border} ${theme.bg} flex items-center justify-between p-4`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a836f]">
                Evaluation Verdict
              </span>
              <h2 className={`text-xl font-black ${theme.text} mt-0.5 tracking-tight`}>
                {result.verdict}
              </h2>
              <p className="mt-1.5 font-mono text-[11px] text-[#514b3d]">
                {result.testResults?.passed}/{result.testResults?.total} testsPassed
                {result.complexity?.timeComplexity && ` · ${result.complexity.timeComplexity}`}
              </p>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-[#d8d0bb]"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={theme.stroke || '#6C63FF'}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-sm font-black tracking-tight">{score}</span>
                <span className="text-[8px] font-bold uppercase text-[#8a836f]">Score</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Agent Trace Graph */}
        <div className="rounded-xl border border-[#d8d0bb] bg-[#fffaf0] p-4">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#8a836f]">
            Execution Trace pipeline
          </h3>
          <div className="space-y-2.5">
            {nodes.map((node) => {
              const isRunning = node.status === 'running';
              const isDone = node.status === 'done';
              const isSkipped = node.status === 'skipped';
              const isErr = node.status === 'error';

              let statusColor = 'text-[#514b3d]';
              let statusText = 'Pending';
              let dotClass = 'bg-[#c8bea5]';

              if (isRunning) {
                statusColor = 'text-[#5c6f1d] font-bold';
                statusText = 'Executing...';
                dotClass = 'bg-[#a5bd3c] animate-pulse ring-4 ring-[#e8f2ad]/35';
              } else if (isDone) {
                statusColor = 'text-[#5f7800]';
                statusText = node.duration !== null ? `${node.duration}ms` : 'Complete';
                dotClass = 'bg-[#8aa500]';
              } else if (isSkipped) {
                statusColor = 'text-[#8a836f] line-through';
                statusText = 'Skipped';
                dotClass = 'bg-[#ded7c8] border border-[#c8bea5]';
              } else if (isErr) {
                statusColor = 'text-rose-400 font-bold';
                statusText = 'Error';
                dotClass = 'bg-rose-500';
              }

              return (
                <div key={node.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${dotClass} shrink-0`} />
                    <span className={isSkipped ? 'text-[#8a836f] line-through' : 'text-[#26351d]'}>
                      {node.name}
                    </span>
                  </div>
                  <span className={`font-mono text-[10px] ${statusColor}`}>{statusText}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Test Cases (Collapsible) */}
        {(!isEvaluating || result) && result && (
          <div className="overflow-hidden rounded-xl border border-[#d8d0bb] bg-[#fffaf0]">
            <button
              onClick={() => setCollapseTests(!collapseTests)}
              className="flex w-full items-center justify-between border-b border-[#d8d0bb]/60 bg-[#ece5d5]/30 px-4 py-3 transition hover:bg-[#ece5d5]/50"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#5f7800]" />
                <span className="text-xs font-bold text-[#26351d]">Test Cases</span>
                <span className="rounded bg-[#ded7c8] px-2 py-0.5 font-mono text-[10px] text-[#514b3d]">
                  {result.testResults?.passed}/{result.testResults?.total} Passed
                </span>
              </div>
              {collapseTests ? (
                <ChevronDown className="h-4 w-4 text-[#8a836f]" />
              ) : (
                <ChevronUp className="h-4 w-4 text-[#8a836f]" />
              )}
            </button>

            {!collapseTests && result.bugReport?.bugs && (
              <div className="space-y-3 divide-y divide-[#30363D]/40 p-4">
                {result.testResults?.results?.map((tr: any) => (
                  <div key={tr.testCase} className="space-y-1.5 pt-3 first:pt-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#514b3d]">Test Case #{tr.testCase + 1}</span>
                      {tr.passed ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#5f7800]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-1 rounded-lg border border-[#d8d0bb]/40 bg-[#fffaf0] p-2.5 font-mono text-[10px] text-[#514b3d]">
                      <div>
                        <span className="text-[#514b3d]">Input:</span> {tr.input}
                      </div>
                      <div>
                        <span className="text-[#514b3d]">Expected:</span> {tr.expected}
                      </div>
                      <div className={!tr.passed ? 'text-rose-400' : ''}>
                        <span className="text-[#514b3d]">Actual:</span> {tr.actual || 'null'}
                      </div>
                      {tr.error && (
                        <div className="mt-1 font-sans text-rose-500">
                          <span className="font-bold">Error:</span> {tr.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Complexity Section (Collapsible) */}
        {(!isEvaluating || result) && result && (
          <div className="overflow-hidden rounded-xl border border-[#d8d0bb] bg-[#fffaf0]">
            <button
              onClick={() => setCollapseComplexity(!collapseComplexity)}
              className="flex w-full items-center justify-between border-b border-[#d8d0bb]/60 bg-[#ece5d5]/30 px-4 py-3 transition hover:bg-[#ece5d5]/50"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#5c6f1d]" />
                <span className="text-xs font-bold text-[#26351d]">Complexity Analysis</span>
              </div>
              {collapseComplexity ? (
                <ChevronDown className="h-4 w-4 text-[#8a836f]" />
              ) : (
                <ChevronUp className="h-4 w-4 text-[#8a836f]" />
              )}
            </button>

            {!collapseComplexity && result.complexity && (
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#d8d0bb]/50 bg-[#ece5d5]/45 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase text-[#8a836f]">
                      Time Complexity
                    </span>
                    <p className="mt-1 font-mono text-lg font-black text-[#5c6f1d]">
                      {result.complexity.timeComplexity}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#d8d0bb]/50 bg-[#ece5d5]/45 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase text-[#8a836f]">
                      Space Complexity
                    </span>
                    <p className="mt-1 font-mono text-lg font-black text-[#5c6f1d]">
                      {result.complexity.spaceComplexity}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between rounded-lg border border-[#d8d0bb]/40 bg-[#fffaf0] p-2.5">
                  <span className="text-[11px] text-[#514b3d]">Optimal Solution Status</span>
                  {result.complexity.isOptimal ? (
                    <span className="rounded-full border border-[#8aa500]/20 bg-[#8aa500]/10 px-2 py-0.5 text-[10px] font-bold text-[#5f7800]">
                      ✓ Optimal
                    </span>
                  ) : (
                    <span className="rounded-full border border-[#a5bd3c]/20 bg-[#a5bd3c]/10 px-2 py-0.5 text-[10px] font-bold text-[#5c6f1d]">
                      ⚠️ Sub-optimal
                    </span>
                  )}
                </div>

                {result.complexity.suggestion && (
                  <div className="rounded-lg border border-[#a5bd3c]/20 bg-[#e8f2ad]/10 p-3 text-[11px] leading-relaxed text-[#405400]">
                    {result.complexity.suggestion}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. Code Quality (Collapsible) */}
        {(!isEvaluating || result) && result && (
          <div className="overflow-hidden rounded-xl border border-[#d8d0bb] bg-[#fffaf0]">
            <button
              onClick={() => setCollapseQuality(!collapseQuality)}
              className="flex w-full items-center justify-between border-b border-[#d8d0bb]/60 bg-[#ece5d5]/30 px-4 py-3 transition hover:bg-[#ece5d5]/50"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#5c6f1d]" />
                <span className="text-xs font-bold text-[#26351d]">Code Quality</span>
                <span className="rounded bg-[#ded7c8] px-2 py-0.5 font-mono text-[10px] text-[#514b3d]">
                  {result.qualityGrade}
                </span>
              </div>
              {collapseQuality ? (
                <ChevronDown className="h-4 w-4 text-[#8a836f]" />
              ) : (
                <ChevronUp className="h-4 w-4 text-[#8a836f]" />
              )}
            </button>

            {!collapseQuality && (
              <div className="space-y-3 p-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#514b3d]">
                    <span>Quality Score</span>
                    <span className="font-mono font-bold">{result.qualityScore}/100</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#ded7c8]">
                    <div
                      className="h-full bg-gradient-to-r from-[#a5bd3c] to-[#8aa500] transition-all duration-1000 ease-out"
                      style={{ width: `${result.qualityScore}%` }}
                    />
                  </div>
                </div>

                {result.bugReport?.bugs && (
                  <ul className="mt-2 list-inside list-disc space-y-2 text-xs text-[#26351d]">
                    {result.bugReport.bugs
                      .filter((b: any) => b.type === 'static_warning')
                      .map((b: any, idx: number) => (
                        <li key={idx} className="leading-relaxed">
                          <span className="font-bold text-[#5c6f1d]">{b.message}</span>: {b.hint}
                        </li>
                      ))}
                    {result.bugReport.bugs.filter((b: any) => b.type === 'static_warning')
                      .length === 0 && (
                      <li className="list-none py-2 text-center italic text-[#8a836f]">
                        No code quality issues identified.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. Feedback (Collapsible) */}
        {(!isEvaluating || result) && result && result.feedback && (
          <div className="overflow-hidden rounded-xl border border-[#d8d0bb] bg-[#fffaf0]">
            <button
              onClick={() => setCollapseFeedback(!collapseFeedback)}
              className="flex w-full items-center justify-between border-b border-[#d8d0bb]/60 bg-[#ece5d5]/30 px-4 py-3 transition hover:bg-[#ece5d5]/50"
            >
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-[#5c6f1d]" />
                <span className="text-xs font-bold text-[#26351d]">Coach Feedback</span>
              </div>
              {collapseFeedback ? (
                <ChevronDown className="h-4 w-4 text-[#8a836f]" />
              ) : (
                <ChevronUp className="h-4 w-4 text-[#8a836f]" />
              )}
            </button>

            {!collapseFeedback && (
              <div className="space-y-2.5 p-4">
                {result.feedback.map((item: string, idx: number) => {
                  return (
                    <div
                      key={idx}
                      className="flex gap-2.5 rounded-lg border border-[#d8d0bb]/50 bg-[#fffaf0] p-3 text-xs leading-relaxed text-[#26351d]"
                    >
                      <div className="mt-0.5 shrink-0 select-none text-base">
                        {item.startsWith('✅')
                          ? '✅'
                          : item.startsWith('⚠️')
                            ? '⚠️'
                            : item.startsWith('⚡')
                              ? '⚡'
                              : item.startsWith('✍️')
                                ? '✍️'
                                : '💡'}
                      </div>
                      <div>{item.replace(/^(✅|⚠️|⚡|✍️|💡)\s*/, '')}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Option E: AI Coach Timeline */}
        {(!isEvaluating || result) && result && (isSupervisorRunning || (supervisorTimeline && supervisorTimeline.length > 0)) && (
          <div className="overflow-hidden rounded-xl border border-[#d8d0bb] bg-[#ece5d5]/60 p-4 shadow-inner">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#d8d0bb]">
              <Brain className="h-3.5 w-3.5 text-[#5c6f1d] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#26351d]">AI Coach Timeline</span>
            </div>
            
            {isSupervisorRunning && supervisorTimeline.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-[#5c6f1d]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#a5bd3c] border-t-transparent" />
                <span>Consulting AI Coach Workflow...</span>
              </div>
            ) : (
              <div className="space-y-3 mt-1.5">
                {supervisorTimeline.map((step: any, idx: number) => {
                  const stepText = typeof step === 'string' ? step : step.message || JSON.stringify(step);
                  return (
                    <div key={idx} className="flex gap-2.5 text-[11px] leading-relaxed text-[#514b3d]">
                      <div className="flex flex-col items-center">
                        <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#a5bd3c]/10 text-[9px] font-bold text-[#5c6f1d] border border-[#a5bd3c]/20">
                          {idx + 1}
                        </div>
                        {idx < supervisorTimeline.length - 1 && (
                          <div className="w-[1px] flex-1 bg-[#ded7c8]/80 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="font-medium text-[#26351d]">{stepText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Option A: Dynamic Action Button */}
        {(!isEvaluating || result) && result && (
          <div className="pt-2">
            {supervisorDecision ? (
              supervisorDecision.targetAgent === 'problem-recommendation-agent' ? (
                <button
                  onClick={onConsultCoach}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a5bd3c] to-[#8aa500] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#10170d] shadow-lg shadow-[#10200d]/20 transition hover:from-[#bdd45a] hover:to-[#8aa500]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-spin" />
                  👉 Solve Next: {supervisorDecision?.payload?.title || 'Next Problem'}
                </button>
              ) : supervisorDecision.targetAgent === 'mentor-agent' ? (
                <button
                  onClick={onConsultCoach}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a5bd3c] to-orange-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#10170d] shadow-lg shadow-[#10200d]/20 transition hover:from-[#bdd45a] hover:to-orange-450"
                >
                  <Brain className="h-3.5 w-3.5 text-[#10170d] animate-bounce" />
                  💬 Get Hint from Mentor
                </button>
              ) : (
                <button
                  onClick={onConsultCoach}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a5bd3c] to-[#8aa500] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#10170d] shadow-lg hover:from-[#bdd45a] hover:to-[#8aa500]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  ✨ Consult Coach
                </button>
              )
            ) : (
              <button
                onClick={onConsultCoach}
                disabled={isSupervisorRunning}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a5bd3c] to-[#8aa500] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#10170d] shadow-lg shadow-[#10200d]/20 transition hover:from-[#bdd45a] hover:to-[#8aa500] disabled:opacity-50"
              >
                {isSupervisorRunning ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Consulting Coach...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    ✨ Consult Coach
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Skeletons Shimmers during loading */}
        {isEvaluating && !result && (
          <div className="space-y-4">
            {/* Shimmer 1 */}
            <div className="flex h-16 animate-pulse items-center justify-between rounded-xl border border-[#d8d0bb] bg-[#fffaf0] p-4">
              <div className="h-3 w-1/3 rounded bg-[#ded7c8]" />
              <div className="h-10 w-10 rounded-full bg-[#ded7c8]" />
            </div>
            {/* Shimmer 2 */}
            <div className="h-32 animate-pulse space-y-2.5 rounded-xl border border-[#d8d0bb] bg-[#fffaf0] p-4">
              <div className="h-3.5 w-1/2 rounded bg-[#ded7c8]" />
              <div className="h-2 w-full rounded bg-[#ded7c8]" />
              <div className="h-2 w-full rounded bg-[#ded7c8]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default EvaluationPanel;

