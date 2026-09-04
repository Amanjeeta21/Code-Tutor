import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  BrainCircuit,
  AlertTriangle,
  Loader2,
  GripHorizontal,
  GripVertical,
  Send,
  Trophy,
  Sparkles,
} from 'lucide-react';

import { ActionButtons } from '../components/action-buttons';
import { CodeEditor } from '../components/code-editor';
import { LanguageSelector } from '../components/language-selector';
import { LeftPanel } from '../components/left-panel';
import { MentorPanel } from '../components/mentor-panel';
import { OutputConsole } from '../components/output-console';
import { useCodeEditor } from '../hooks/use-code-editor';
import { useMentor } from '../hooks/use-mentor';
import type { Problem, ExecutionResult } from '../types/editor-types';
import { useAuth } from '@/features/authentication';
import { EvaluationPanel } from '../components/evaluation-panel';
import { AdviceModal } from '../components/advice-modal';
import { LoadingScreen } from '@/components/common/loading-screen';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BackendProblem {
  id: string;
  slug?: string;
  title?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  topics?: string[];
  acceptance_rate?: number;
  description?: string;
  constraints?: string[];
  test_cases?: {
    input: string;
    expected_output: string;
    is_hidden: boolean;
    explanation?: string;
  }[];
  hints?: string[];
  explanation?: string;
  starter_code?: {
    javascript?: string;
    python?: string;
    typescript?: string;
    java?: string;
    cpp?: string;
  };
  time_limit?: number;
  memory_limit?: number;
}

function mapBackendToEditorProblem(q: BackendProblem): Problem {
  const sampleCases = (q.test_cases || [])
    .filter((tc) => !tc.is_hidden)
    .map((tc, index: number) => ({
      id: index + 1,
      input: tc.input,
      output: tc.expected_output,
      explanation: tc.explanation || '',
    }));

  return {
    id: q.id,
    slug: q.slug || '',
    title: q.title || 'Untitled',
    difficulty: q.difficulty || 'Medium',
    topics: q.topics || [],
    acceptance: q.acceptance_rate ?? 0.0,
    description: q.description || '',
    constraints: q.constraints || [],
    examples: sampleCases,
    hints: q.hints || [],
    explanation: q.explanation || '',
    testCases: (q.test_cases || []).map((tc) => ({
      input: tc.input,
      expected_output: tc.expected_output,
      is_hidden: tc.is_hidden,
    })),
    templates: {
      javascript: q.starter_code?.javascript || '',
      python: q.starter_code?.python || '',
      typescript: q.starter_code?.typescript || '',
      java: q.starter_code?.java || '',
      cpp: q.starter_code?.cpp || '',
    },
    timeLimitMs: q.time_limit || 2000,
    memoryLimitMb: q.memory_limit || 256,
  };
}

export function EditorPage() {
  const { problemSlug } = useParams({ strict: false }) as { problemSlug?: string };
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!problemSlug) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    async function loadProblem() {
      try {
        const res = await fetch(`/api/questions/${problemSlug}`);
        if (!res.ok) {
          throw new Error('Problem not found');
        }
        const data = await res.json();
        if (!active) return;
        setProblem(mapBackendToEditorProblem(data));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load problem');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProblem();
    return () => {
      active = false;
    };
  }, [problemSlug]);

  if (loading) {
    return <LoadingScreen message="Initializing Workspace..." />;
  }

  if (error || !problem) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#f4f0e6] p-4 text-[#10170d]">
        <Card className="relative w-full max-w-md overflow-hidden border-[#d8d0bb] bg-[#fffaf0]/60 backdrop-blur-xl">
          <div className="absolute left-0 top-0 h-[2px] w-full bg-rose-500" />
          <CardHeader className="pt-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 animate-pulse items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10">
              <AlertTriangle className="h-6 w-6 text-rose-400" />
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-[#10170d]">
              Failed to load workspace
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs text-[#8a836f]">
              {error || 'The requested problem could not be found or fetched.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button
              asChild
              className="h-auto rounded-lg border border-[#d8d0bb] bg-[#ece5d5] px-5 py-2.5 text-xs font-bold text-[#26351d] transition-all hover:bg-[#ded7c8] hover:text-[#10170d]"
            >
              <Link to="/practice">
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Back to Practice
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <EditorWorkspace key={problem.id} problem={problem} />;
}

function EditorWorkspace({ problem }: { problem: Problem }) {
  const navigate = useNavigate();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(
    () => Number(window.sessionStorage.getItem('skill-lens:editor:left-width')) || 38,
  );
  const [bottomHeight, setBottomHeight] = useState(
    () => Number(window.sessionStorage.getItem('skill-lens:editor:bottom-height')) || 260,
  );
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { user } = useAuth();
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showRecommendationPopup, setShowRecommendationPopup] = useState(false);
  const [hasDismissedRecommendation, setHasDismissedRecommendation] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'description' | 'editor' | 'mentor'>('description');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const lastTriggeredResultRef = useRef<ExecutionResult | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);

  const {
    isCodeLoading,
    selectedLanguage,
    currentCode,
    isRunning,
    isSubmitting,
    runResult,
    submitResult,
    submissionHistory,
    stats,
    activeConsoleTab,
    handleLanguageChange,
    handleCodeChange,
    runCode,
    submitCode,
    refreshSubmissions,
    resetCode,
    setActiveConsoleTab,
    isLoadingRecommendations,
    recommendations,
    recommendationExplanation,
    mistakeAnalysis,
    recommendationError,
    showRecommendationUI,
    setShowRecommendationUI,
    lineIssues,
    setLineIssues,
    supervisorDecision,
    supervisorTimeline,
    isSupervisorRunning,
    runSupervisor,
  } = useCodeEditor(problem.id, problem.templates);

  const mentor = useMentor({
    problemId: problem.id,
    problemTitle: problem.title,
    currentCode,
    language: selectedLanguage,
    executionResult: runResult,
  });

  const handleConsultCoach = async () => {
    if (supervisorDecision) {
      setIsAdviceModalOpen(true);
      return;
    }
    
    const isPassed = submitResult?.status === 'Accepted';
    const eventType = isPassed ? 'request_problem' : 'submission_failed';
    
    const data = await runSupervisor(eventType, {
      failedAttempts: submissionHistory.filter(s => s.status !== 'Accepted').length,
      lastVerdict: submitResult?.status || runResult?.status,
      problemId: problem.id,
    });
    
    if (data && data.decision) {
      setIsAdviceModalOpen(true);
    }
  };

  const handleChooseAction = (actionKey: 'solve_next' | 'open_mentor' | 'view_mastery') => {
    setIsAdviceModalOpen(false);
    if (actionKey === 'solve_next') {
      if (supervisorDecision?.payload?.slug) {
        navigate({
          to: '/editor/$problemSlug',
          params: { problemSlug: supervisorDecision.payload.slug },
        });
      }
    } else if (actionKey === 'open_mentor') {
      setShowEvaluation(false);
      if (!mentor.isOpen) {
        mentor.toggleOpen();
      }
      mentor.requestHint(getMentorTrigger());
    } else if (actionKey === 'view_mastery') {
      navigate({ to: '/profile' });
    }
  };

  const { isLoading: isMentorLoading, isOpen: isMentorOpen, toggleOpen: toggleMentorOpen } = mentor;

  useEffect(() => {
    if (showEvaluation || isMentorOpen) {
      setActiveWorkspaceTab('mentor');
    }
  }, [showEvaluation, isMentorOpen]);

  const handleWorkspaceTabChange = (tab: 'description' | 'editor' | 'mentor') => {
    setActiveWorkspaceTab(tab);
    if (tab === 'mentor' && !isMentorOpen && !showEvaluation) {
      toggleMentorOpen();
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to run code
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isRunning && !isSubmitting) {
          void runCode();
        }
      }
      // Ctrl+Shift+Enter or Cmd+Shift+Enter to submit code
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning && !isSubmitting) {
          void submitCode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRunning, isSubmitting, runCode, submitCode]);
  // Auto-open mentor on failure
  useEffect(() => {
    if (!runResult || isRunning || isSubmitting) return;

    const isFailure =
      runResult.status === 'Runtime Error' ||
      runResult.status === 'Compile Error' ||
      runResult.status === 'Wrong Answer';

    // Prevent repeated triggering on the same execution result
    if (runResult === lastTriggeredResultRef.current) return;

    if (isFailure) {
      lastTriggeredResultRef.current = runResult;
      const autoOpen = localStorage.getItem('skill-lens-autoOpenMentor') !== 'false';
      if (autoOpen && !isMentorLoading && !isMentorOpen) {
        // Auto-open mentor with a slight delay so UI settles first
        const t = setTimeout(() => toggleMentorOpen(), 1200);
        return () => clearTimeout(t);
      }
    }
  }, [runResult, isRunning, isSubmitting, isMentorLoading, isMentorOpen, toggleMentorOpen]);

  // Celebration on Accepted & trigger Recommendation Popup
  useEffect(() => {
    if (submitResult?.status === 'Accepted') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 4000);

      let timer: number | undefined;
      if (!hasDismissedRecommendation) {
        timer = window.setTimeout(() => {
          setShowRecommendationPopup(true);
        }, 3500);
      }
      
      return () => {
        clearTimeout(t);
        if (timer) clearTimeout(timer);
      };
    }
  }, [submitResult?.id, submitResult?.status, hasDismissedRecommendation]);

  // Reset popup states on problem change
  useEffect(() => {
    Promise.resolve().then(() => {
      setHasDismissedRecommendation(false);
      setShowRecommendationPopup(false);
    });
  }, [problem.id]);

  // Show recommendation popup after celebration (3 seconds)
  useEffect(() => {
    if (submitResult?.status === 'Accepted' && !hasDismissedRecommendation) {
      const timer = setTimeout(() => {
        setShowRecommendationPopup(true);
      }, 3500); 
      return () => clearTimeout(timer);
    }
  }, [submitResult?.status, hasDismissedRecommendation]);
  
  // Reset dismissed state on new submission
  useEffect(() => {
    if (isSubmitting) {
       // eslint-disable-next-line react-hooks/set-state-in-effect
       setHasDismissedRecommendation(false);
       // eslint-disable-next-line react-hooks/set-state-in-effect
       setShowRecommendationPopup(false);
       // eslint-disable-next-line react-hooks/set-state-in-effect
       setShowRecommendationUI(false);
    }
  }, [isSubmitting, setShowRecommendationUI]);


  // Map runResult status to mentor trigger event
  const getMentorTrigger = (): Parameters<typeof mentor.requestHint>[0] => {
    if (!runResult) return 'hint_request';
    if (runResult.status === 'Compile Error') return 'compile_error';
    if (runResult.status === 'Runtime Error') return 'runtime_error';
    if (runResult.status === 'Wrong Answer') return 'test_fail';
    return 'hint_request';
  };

  const handleRequestHint = () => {
    mentor.requestHint(getMentorTrigger());
  };

  useEffect(() => {
    window.sessionStorage.setItem('skill-lens:editor:left-width', String(leftWidth));
  }, [leftWidth]);

  useEffect(() => {
    window.sessionStorage.setItem('skill-lens:editor:bottom-height', String(bottomHeight));
  }, [bottomHeight]);

  useEffect(() => {
    if (submitResult?.status !== 'Accepted') return;

    const key = 'skill-lens:practice:solved-problems';
    let solvedIds: string[];
    try {
      solvedIds = JSON.parse(window.localStorage.getItem(key) || '[]') as string[];
    } catch {
      solvedIds = [];
    }

    const next = solvedIds.includes(problem.id) ? solvedIds : [...solvedIds, problem.id];
    window.localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent('skill-lens:practice-progress-updated', {
        detail: { problemId: problem.id, solvedQuestionIds: next },
      }),
    );
    window.dispatchEvent(
      new CustomEvent('skill-lens:dashboard-refresh-requested', {
        detail: { problemId: problem.id },
      }),
    );
    window.dispatchEvent(
      new CustomEvent('skill-lens:leaderboard-refresh-requested', {
        detail: { problemId: problem.id },
      }),
    );
  }, [problem.id, submitResult?.id, submitResult?.status]);

  const startHorizontalResize = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const move = (moveEvent: MouseEvent) => {
      const next = ((moveEvent.clientX - bounds.left) / bounds.width) * 100;
      setLeftCollapsed(false);
      setLeftWidth(Math.min(58, Math.max(26, next)));
    };
    const stop = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', stop);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);
  };

  const startVerticalResize = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const bounds = centerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const move = (moveEvent: MouseEvent) => {
      const next = bounds.bottom - moveEvent.clientY;
      setBottomCollapsed(false);
      setBottomHeight(Math.min(430, Math.max(180, next)));
    };
    const stop = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', stop);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f4f0e6] text-[#10170d] antialiased">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(148,163,184,0.06),_transparent_40%),radial-gradient(circle_at_70%_70%,_rgba(147,197,253,0.06),_transparent_40%)]" />

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-in zoom-in-50 fade-in flex flex-col items-center gap-4 rounded-3xl border border-[#8aa500]/30 bg-[#fffaf0]/90 px-12 py-8 shadow-2xl shadow-[#10200d]/40 backdrop-blur-xl duration-500">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a5bd3c] to-[#5f7800] shadow-lg shadow-[#10200d]/50">
              <Trophy className="h-8 w-8 text-[#10170d]" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-black tracking-tight text-[#5f7800]">Accepted! 🎉</p>
              <p className="mt-1 text-sm text-[#514b3d]">
                All test cases passed. Outstanding work!
              </p>
            </div>
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-[#a5bd3c]"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Popup overlay — appears after celebration ends */}
      {showRecommendationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fffaf0]/60 backdrop-blur-sm">
          <div className="animate-in zoom-in-95 fade-in w-full max-w-md rounded-2xl border border-[#a5bd3c]/20 bg-[#fffaf0] p-6 shadow-2xl shadow-[#10200d]/20 duration-300">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 text-[#26351d]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#bdd45a] to-[#8aa500] shadow-lg shadow-[#10200d]/40">
                  <BrainCircuit className="h-5 w-5 text-[#10170d]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a836f]">
                    AI Recommendation
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#5c6f1d] animate-pulse">
                    🎯 Next Problem
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setHasDismissedRecommendation(true);
                  setShowRecommendationPopup(false);
                }}
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#c8bea5] text-[#8a836f] transition hover:border-[#b8ad93] hover:text-[#26351d]"
              >
                ✕
              </button>
            </div>

            <div className="mt-6">
              {!showRecommendationUI ? (
                <div className="text-center space-y-5">
                  <p className="text-sm text-[#26351d]">
                    Your code was accepted! Would you like an AI recommendation for your next problem based on your performance?
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setShowRecommendationUI(true)}
                      className="inline-flex items-center gap-2 rounded border border-[#8aa500]/30 bg-[#8aa500]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#5f7800] transition hover:bg-[#8aa500]/20"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Suggest next problem
                    </button>
                    <button
                      onClick={() => {
                        setHasDismissedRecommendation(true);
                        setShowRecommendationPopup(false);
                      }}
                      className="inline-flex items-center gap-2 rounded border border-[#c8bea5] bg-[#ded7c8]/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#514b3d] transition hover:bg-[#c8bea5]/60 hover:text-[#26351d]"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {isLoadingRecommendations ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-6 text-[#5c6f1d]">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-xs font-semibold animate-pulse">Analyzing and generating recommendation...</span>
                    </div>
                  ) : recommendationError ? (
                    <div className="py-4 text-center text-sm text-rose-400">
                      {recommendationError}
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="space-y-4 text-[#26351d]">
                      {mistakeAnalysis && mistakeAnalysis.primaryMistake !== "None" && (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                              Detected Learning Gap: {mistakeAnalysis.primaryMistake}
                            </p>
                          </div>
                          {mistakeAnalysis.evidence?.length > 0 && (
                            <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#514b3d]">
                              Reason: {mistakeAnalysis.evidence[0]}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-lg font-bold text-[#10170d] mb-2">
                          {recommendations[0]?.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                              recommendations[0]?.difficulty === 'Easy'
                                ? 'bg-green-500/10 text-green-400'
                                : recommendations[0]?.difficulty === 'Medium'
                                  ? 'bg-[#a5bd3c]/10 text-[#5c6f1d]'
                                  : 'bg-rose-500/10 text-rose-400',
                            )}
                          >
                            {recommendations[0]?.difficulty || 'Medium'}
                          </span>
                          {(recommendations[0]?.topics || []).slice(0, 3).map((topic: string) => (
                            <span
                              key={topic}
                              className="inline-flex rounded-full bg-[#ded7c8] px-2.5 py-0.5 text-[10px] font-semibold text-[#26351d]"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a836f] mb-1">
                          Explanation:
                        </p>
                        <p className="text-sm leading-relaxed text-[#514b3d]">
                          {recommendationExplanation}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center gap-3">
                        <button
                          onClick={() => {
                            setShowRecommendationPopup(false);
                            navigate({ to: '/editor/$problemSlug', params: { problemSlug: recommendations[0]?.slug } });
                          }}
                          className="flex-1 rounded-lg bg-gradient-to-r from-[#a5bd3c] to-[#8aa500] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#10170d] shadow-lg shadow-[#10200d]/30 transition hover:from-[#bdd45a] hover:to-[#8aa500]"
                        >
                          Solve Next Problem →
                        </button>
                        <button
                          onClick={() => {
                            setHasDismissedRecommendation(true);
                            setShowRecommendationPopup(false);
                          }}
                          className="rounded-lg border border-[#c8bea5] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#514b3d] transition hover:border-[#b8ad93] hover:text-[#26351d]"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm text-[#514b3d]">
                      No recommendations available at this time.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="relative z-30 flex h-auto min-h-[44px] py-1.5 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#d8d0bb]/80 bg-[#fffaf0]/20 px-3 backdrop-blur-xl sm:h-12 sm:py-0 sm:px-4">
        <div className="flex items-center gap-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate({ to: '/practice' })}
                  className="duration-250 inline-flex items-center gap-2 rounded-lg border border-[#d8d0bb] bg-[#ece5d5]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#514b3d] transition-all hover:border-[#c8bea5] hover:text-[#10170d]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Practice List</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="border-[#d8d0bb] bg-[#fffaf0] text-[10px] text-[#514b3d]">
                Back to Practice Selection
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="hidden items-center gap-2 md:flex">
            <BrainCircuit className="h-3.5 w-3.5 text-[#5c6f1d]" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#8a836f]">
              CODE TUTOR // PRACTICE ARENA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Submission Counter */}
          {submissionHistory.length > 0 && (
            <div className="hidden items-center gap-1.5 rounded-lg border border-[#c8bea5]/60 bg-[#ece5d5]/40 px-2.5 py-1 md:flex">
              <Send className="h-3 w-3 text-[#8a836f]" />
              <span className="font-mono text-[10px] font-bold text-[#514b3d]">
                {submissionHistory.length}
              </span>
              <span className="font-mono text-[9px] text-[#514b3d]">
                {submissionHistory.length === 1 ? 'attempt' : 'attempts'}
              </span>
            </div>
          )}

          {/* Accepted badge */}
          {submitResult?.status === 'Accepted' && (
            <div className="flex animate-pulse items-center gap-1.5 rounded-lg border border-[#8aa500]/40 bg-[#8aa500]/10 px-2.5 py-1">
              <Trophy className="h-3 w-3 text-[#5f7800]" />
              <span className="font-mono text-[10px] font-bold text-[#5f7800]">Accepted</span>
            </div>
          )}
          {/* Mentor Toggle Button */}
          <button
            id="mentor-toggle-btn"
            onClick={() => {
              setShowEvaluation(false);
              mentor.toggleOpen();
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              mentor.isOpen
                ? 'border-[#a5bd3c]/50 bg-[#a5bd3c]/15 text-[#5c6f1d]'
                : 'border-[#d8d0bb] bg-[#ece5d5]/20 text-[#514b3d] hover:border-[#a5bd3c]/30 hover:text-[#5c6f1d]'
            }`}
          >
            <BrainCircuit className="h-3 w-3" />
            <span>Mentor AI</span>
            {mentor.messages.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#a5bd3c] text-[8px] font-black text-[#10170d]">
                {mentor.messages.filter((m) => m.role === 'mentor').length}
              </span>
            )}
          </button>

          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
          />
        </div>
      </header>

      {/* Mobile Workspace Tabs Selector */}
      <div className="relative z-20 flex border-b border-[#d8d0bb] bg-[#ece5d5] md:hidden shrink-0">
        <button
          onClick={() => handleWorkspaceTabChange('description')}
          className={cn(
            'flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 outline-none',
            activeWorkspaceTab === 'description'
              ? 'border-[#a5bd3c] text-[#5c6f1d] bg-[#a5bd3c]/5'
              : 'border-transparent text-[#514b3d] hover:text-[#10170d]',
          )}
        >
          Description
        </button>
        <button
          onClick={() => handleWorkspaceTabChange('editor')}
          className={cn(
            'flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 outline-none',
            activeWorkspaceTab === 'editor'
              ? 'border-[#a5bd3c] text-[#5c6f1d] bg-[#a5bd3c]/5'
              : 'border-transparent text-[#514b3d] hover:text-[#10170d]',
          )}
        >
          Workspace
        </button>
        <button
          onClick={() => handleWorkspaceTabChange('mentor')}
          className={cn(
            'flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all border-b-2 outline-none relative',
            activeWorkspaceTab === 'mentor'
              ? 'border-[#a5bd3c] text-[#5c6f1d] bg-[#a5bd3c]/5'
              : 'border-transparent text-[#514b3d] hover:text-[#10170d]',
          )}
        >
          AI Coach
          {mentor.messages.length > 0 && (
            <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#a5bd3c] text-[8px] font-black text-[#10170d]">
              {mentor.messages.filter((m) => m.role === 'mentor').length}
            </span>
          )}
        </button>
      </div>

      <div ref={workspaceRef} className="relative z-10 flex min-h-0 flex-1 overflow-hidden p-2">
        {/* Left Panel — Problem Description */}
        <div
          className={cn(
            "h-full flex-col overflow-hidden rounded-l-2xl transition-all duration-150",
            isMobile ? (activeWorkspaceTab === 'description' ? "flex w-full" : "hidden") : "flex w-auto"
          )}
          style={!isMobile ? { width: leftCollapsed ? 0 : `${leftWidth}%` } : undefined}
        >
          {(!leftCollapsed || isMobile) && (
            <LeftPanel
              problem={problem}
              submissionHistory={submissionHistory}
              latestSubmission={submitResult}
              loadSubmittedCode={handleCodeChange}
              totalSubmissions={stats?.userStats?.attempts ?? 0}
              acceptanceRate={stats?.globalStats?.acceptanceRate}
            />
          )}
        </div>

        <button
          onMouseDown={startHorizontalResize}
          onClick={() => setLeftCollapsed((prev) => !prev)}
          title="Drag to resize problem panel. Click to collapse or expand."
          className={cn(
            "mx-1 w-2 items-center justify-center rounded bg-[#ece5d5]/80 text-[#514b3d] transition hover:bg-[#ded7c8] hover:text-[#5c6f1d]",
            isMobile ? "hidden" : "flex cursor-col-resize"
          )}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Center — Code Editor + Console */}
        <div
          ref={centerRef}
          className={cn(
            "min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 md:h-full",
            isMobile ? (activeWorkspaceTab === 'editor' ? "flex w-full" : "hidden") : "flex"
          )}
        >
          <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <CodeEditor
                language={selectedLanguage}
                value={currentCode}
                onChange={handleCodeChange}
                isCodeLoading={isCodeLoading}
                lineIssues={lineIssues}
              />
            </div>
          </div>

          <button
            onMouseDown={startVerticalResize}
            onClick={() => setBottomCollapsed((prev) => !prev)}
            title="Drag to resize terminal. Click to collapse or expand."
            className={cn(
              "my-1 h-2 items-center justify-center rounded bg-[#ece5d5]/80 text-[#514b3d] transition hover:bg-[#ded7c8] hover:text-[#5c6f1d]",
              isMobile ? "hidden" : "flex cursor-row-resize"
            )}
          >
            <GripHorizontal className="h-4 w-4" />
          </button>

          <div
            className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-[#d8d0bb] bg-[#fffaf0]/20 backdrop-blur-xl transition-[height] duration-150"
            style={{ height: bottomCollapsed ? 42 : (isMobile ? 180 : bottomHeight) }}
          >
            <div className="flex-1 overflow-hidden">
              {bottomCollapsed ? (
                <div className="flex h-full items-center justify-between px-4 text-xs text-[#8a836f]">
                  <span>Terminal collapsed</span>
                  <button
                    onClick={() => setBottomCollapsed(false)}
                    className="text-[#5c6f1d] hover:text-[#405400]"
                  >
                    Expand
                  </button>
                </div>
              ) : (
                <>
                  <OutputConsole
                    activeTab={activeConsoleTab}
                    setActiveTab={setActiveConsoleTab}
                    runResult={runResult}
                    submitResult={submitResult}
                    isRunning={isRunning}
                    isSubmitting={isSubmitting}
                    examples={problem.examples}
                    problem={problem}
                    submissionHistory={submissionHistory}
                  />
                </>
              )}
            </div>
            {!bottomCollapsed && (
              <ActionButtons
                isRunning={isRunning}
                isSubmitting={isSubmitting || isEvaluating}
                onRun={runCode}
                onSubmit={() => {
                  if (mentor.isOpen) {
                    mentor.toggleOpen();
                  }
                  setShowEvaluation(true);
                }}
                onReset={resetCode}
                isCoachOpen={mentor.isOpen}
                onToggleCoach={() => {
                  setShowEvaluation(false);
                  mentor.toggleOpen();
                }}
              />
            )}
          </div>
        </div>

        {/* Right — Mentor Panel (slide in) */}
        {mentor.isOpen && (
          <div
            className={cn(
              "animate-in slide-in-from-right-4 h-full shrink-0 overflow-hidden duration-200",
              isMobile ? (activeWorkspaceTab === 'mentor' ? "block w-full" : "hidden") : "block md:w-[25%]"
            )}
          >
            <MentorPanel
              messages={mentor.messages}
              isLoading={mentor.isLoading}
              isOpen={mentor.isOpen}
              onClose={() => {
                mentor.toggleOpen();
                if (isMobile) setActiveWorkspaceTab('editor');
              }}
              onRequestHint={handleRequestHint}
              onSendMessage={mentor.sendMessage}
            />
          </div>
        )}

        {/* Right — Evaluation Panel (slide in) */}
        {showEvaluation && (
          <div
            className={cn(
              "animate-in slide-in-from-right-4 h-full shrink-0 overflow-hidden duration-200",
              isMobile ? (activeWorkspaceTab === 'mentor' ? "block w-full" : "hidden") : "block md:w-[25%]"
            )}
          >
            <EvaluationPanel
              problemId={problem.id}
              submittedCode={currentCode}
              testCases={problem.testCases}
              userId={user?.id || 'anonymous'}
              language={selectedLanguage}
              onClose={() => {
                setShowEvaluation(false);
                if (isMobile) setActiveWorkspaceTab('editor');
              }}
              isEvaluating={isEvaluating}
              setIsEvaluating={setIsEvaluating}
              onEvaluationComplete={(evalData) => {
                if (evalData.lineIssues) {
                  setLineIssues(evalData.lineIssues);
                }
                void refreshSubmissions();
              }}
              supervisorDecision={supervisorDecision}
              supervisorTimeline={supervisorTimeline}
              isSupervisorRunning={isSupervisorRunning}
              onConsultCoach={handleConsultCoach}
            />
          </div>
        )}

        {/* AI Fallback panel (Mobile) */}
        {isMobile && activeWorkspaceTab === 'mentor' && !mentor.isOpen && !showEvaluation && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-[#514b3d] bg-[#fffaf0]/20 rounded-xl border border-[#d8d0bb]/80 h-full w-full">
            <BrainCircuit className="h-10 w-10 text-[#8aa500] mb-3 animate-pulse" />
            <p className="text-sm font-bold text-[#10170d] mb-2">AI Copilot Options</p>
            <p className="text-xs text-[#514b3d] max-w-xs mb-4">
              Get real-time hints, code reviews, and solution explanations from the AI agents.
            </p>
            <button
              onClick={() => mentor.toggleOpen()}
              className="w-full rounded-lg bg-[#a5bd3c]/10 border border-[#a5bd3c]/30 text-[#5c6f1d] py-2.5 text-xs font-bold uppercase tracking-wider transition hover:bg-[#a5bd3c]/20"
            >
              Activate AI Mentor
            </button>
          </div>
        )}
      </div>

      {/* Choose Your Path Advice Modal */}
      <AdviceModal
        isOpen={isAdviceModalOpen}
        onClose={() => setIsAdviceModalOpen(false)}
        decision={supervisorDecision}
        onChooseAction={handleChooseAction}
      />
    </main>
  );
}

