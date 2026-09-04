import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
  Search,
  Zap,
  Trophy,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { fetchQuestions, simulateAttempt } from './services/practice-service';
import { TopNavigation } from '@/components/common/top-navigation';
import { useTheme } from '@/providers/theme-provider';
import { availableTopics } from './data/practice-data';
import type { Question, Difficulty } from './types';

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// --- Main Page Component ---
export function PracticePage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All');
  const [topic, setTopic] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('topic') || 'All';
    }
    return 'All';
  });
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Load Data via Service
  const loadQuestions = async () => {
    try {
      const response = await fetchQuestions({
        search: searchTerm,
        difficulty,
        topic,
        page: currentPage,
        perPage,
      });
      setQuestions(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch questions', error);
    } finally {
      setLoading(false);
    }
  };

  // Effect triggers when filters or pagination change
  useEffect(() => {
    const request = window.setTimeout(() => {
      void loadQuestions();
    }, 0);
    return () => window.clearTimeout(request);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, topic, perPage, currentPage]);

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 on search
      void loadQuestions();
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Listen to practice progress updates from code submissions
  useEffect(() => {
    const handleRefresh = () => {
      void loadQuestions();
    };
    window.addEventListener('skill-lens:practice-progress-updated', handleRefresh);
    return () => {
      window.removeEventListener('skill-lens:practice-progress-updated', handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, topic, perPage, currentPage, searchTerm]);

  const handleActionClick = async (question: Question) => {
    if (question.status === 'Not Attempted') {
      // Optimistic update for UI
      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? { ...q, status: 'Attempted' } : q)),
      );
      await simulateAttempt(question.id);
    }

    void navigate({
      to: '/editor/$problemSlug',
      params: { problemSlug: question.slug || question.id },
    });
  };

  const themeClass = isDark
    ? 'bg-[#f4f0e6] text-[#10170d]'
    : 'bg-[#f4f0e6] text-[#10170d]';

  const panelClass = isDark
    ? 'rounded-2xl border border-[#d8d0bb] bg-[#fffaf0]/95 backdrop-blur-sm shadow-xl shadow-[#10200d]/10'
    : 'rounded-2xl border border-[#d8d0bb] bg-[#fffaf0]/95 backdrop-blur-sm shadow-xl shadow-[#10200d]/10';

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Easy')
      return 'text-[#405400] bg-[#e8f2ad] border-[#a5bd3c]/40';
    if (diff === 'Medium')
      return 'text-[#6a4300] bg-[#fff0c7] border-[#d8941f]/30';
    if (diff === 'Hard')
      return 'text-[#7b2116] bg-[#ffe0d8] border-[#c75f4a]/30';
    return '';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Not Attempted')
      return 'text-[#5c5548] bg-[#ece5d5] border-[#d8d0bb]';
    if (status === 'Attempted')
      return 'text-[#6b4b00] bg-[#fff1bd] border-[#d7a21d]/30';
    if (status === 'Solved')
      return 'text-[#405400] bg-[#e8f2ad] border-[#a5bd3c]/40';
    return '';
  };

  return (
    <div
      className={cn(
        'min-h-screen overflow-x-hidden font-sans antialiased transition-all duration-500',
        themeClass,
      )}
    >
      {/* Top Navigation */}
      <TopNavigation activeTab="practice" />

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-[1400px] px-4 pb-32 pt-36 sm:px-6 lg:px-8">
        {/* Animated Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)', scale: 0.97 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className={cn(
              'flex flex-wrap justify-center bg-gradient-to-b bg-clip-text text-5xl font-black tracking-tighter text-transparent md:text-7xl',
              isDark
                ? 'from-[#10170d] via-[#26351d] to-[#8aa500]'
                : 'from-[#10170d] via-[#26351d] to-[#8aa500]',
            )}
          >
            PRACTICE
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={cn(panelClass, 'overflow-hidden')}
        >
          {/* Filters & Search Toolbar */}
          <div
            className={cn(
              'border-b p-6',
              isDark ? 'border-[#d8d0bb] bg-[#ded7c8]' : 'border-[#d8d0bb] bg-[#ded7c8]',
            )}
          >
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search
                  className={cn(
                    'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                    isDark ? 'text-[#5c6f1d]' : 'text-[#5c6f1d]',
                  )}
                />
                <input
                  type="text"
                  placeholder="Search problems by name or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#a5bd3c]/40',
                    isDark
                      ? 'border-[#d8d0bb] bg-[#fffaf0] text-[#10170d] placeholder:text-[#8a836f]'
                      : 'border-[#d8d0bb] bg-[#fffaf0] text-[#10170d] shadow-sm shadow-[#10200d]/10 placeholder:text-[#8a836f]',
                  )}
                />
              </div>

              {/* Filters */}
              <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
                <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Filter
                      className={cn('h-4 w-4', isDark ? 'text-[#5c6f1d]' : 'text-[#5c6f1d]')}
                    />
                    <span className="text-xs font-semibold md:hidden">Filter:</span>
                  </div>

                  {/* Difficulty Dropdown */}
                  <div className="relative flex-1 min-w-[130px] md:flex-initial">
                    <select
                      value={difficulty}
                      onChange={(e) => {
                        setDifficulty(e.target.value as Difficulty | 'All');
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'w-full cursor-pointer appearance-none rounded-lg border py-2 pl-3 pr-8 text-xs font-semibold transition-all focus:outline-none md:text-sm md:pl-4',
                        isDark
                          ? 'border-[#d8d0bb] bg-[#fffaf0] text-[#10170d]'
                          : 'border-[#d8d0bb] bg-[#ece5d5] text-[#10170d] shadow-sm shadow-[#10200d]/10',
                      )}
                    >
                      <option value="All">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
                  </div>

                  {/* Topic Dropdown */}
                  <div className="relative flex-1 min-w-[130px] md:flex-initial">
                    <select
                      value={topic}
                      onChange={(e) => {
                        setTopic(e.target.value);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'w-full cursor-pointer appearance-none rounded-lg border py-2 pl-3 pr-8 text-xs font-semibold transition-all focus:outline-none md:text-sm md:pl-4',
                        isDark
                          ? 'border-[#d8d0bb] bg-[#fffaf0] text-[#10170d]'
                          : 'border-[#d8d0bb] bg-[#ece5d5] text-[#10170d] shadow-sm shadow-[#10200d]/10',
                      )}
                    >
                      {availableTopics.map((t) => (
                        <option key={t} value={t}>
                          {t === 'All' ? 'All Topics' : t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table/Card Section */}
          <div className="min-h-[400px] w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Zap
                  className={cn(
                    'mb-3 h-8 w-8 animate-pulse',
                    isDark ? 'text-[#8aa500]' : 'text-[#5c6f1d]',
                  )}
                />
                <span className="font-bold tracking-wide">Loading questions...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Database className="mb-3 h-8 w-8 opacity-20" />
                <span className="font-medium">
                  No problems found matching your criteria.
                </span>
              </div>
            ) : isMobile ? (
              // Mobile View: Cards Layout
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-4 p-4"
              >
                <AnimatePresence>
                  {questions.map((q, index) => {
                    const absoluteIndex = (currentPage - 1) * perPage + index + 1;
                    const isAttempted = q.status !== 'Not Attempted';
                    return (
                      <motion.div
                        key={q.id}
                        variants={itemVariants}
                        className={cn(
                          'rounded-xl border p-4 transition-all duration-300',
                          isDark
                            ? 'border-[#d8d0bb] bg-[#fffaf0] hover:bg-[#f7f1e3]'
                            : 'border-[#d8d0bb] bg-[#fffaf0] hover:bg-[#f7f1e3]',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-xs font-semibold opacity-40">#{absoluteIndex}</span>
                            <div>
                              <h3
                                onClick={() => void handleActionClick(q)}
                                className={cn(
                                  'flex cursor-pointer items-center gap-1.5 font-bold transition-colors text-sm sm:text-base leading-snug',
                                  q.status === 'Solved'
                                    ? isDark
                                      ? 'text-[#5f7800]'
                                      : 'text-[#5f7800]'
                                    : isDark
                                      ? 'text-[#10170d] hover:text-[#5c6f1d]'
                                      : 'text-[#10170d] hover:text-[#5c6f1d]',
                                )}
                              >
                                {q.title}
                                {q.status === 'Solved' && (
                                  <Trophy className="h-3.5 w-3.5 shrink-0 text-[#8aa500]" />
                                )}
                              </h3>
                              <span className="mt-1.5 flex flex-wrap gap-1 text-[9px] font-semibold opacity-60">
                                {q.topics.map((t) => (
                                  <span key={t} className="rounded-full bg-[#e8f2ad] px-1.5 py-0.5 text-[#405400]">{t}</span>
                                ))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-500/10 pt-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                                  getDifficultyColor(q.difficulty),
                                )}
                              >
                                {q.difficulty}
                              </span>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                                  getStatusColor(q.status),
                                )}
                              >
                                {q.status === 'Solved' ? 'Solved' : q.status === 'Attempted' ? 'Attempted' : 'New'}
                              </span>
                            </div>
                            <span className="text-[11px] font-medium text-[#514b3d]">
                              Acceptance: {q.acceptanceRate}%
                            </span>
                          </div>

                          <button
                            onClick={() => void handleActionClick(q)}
                            className={cn(
                              'rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-all',
                              isAttempted
                                ? isDark
                                  ? 'bg-[#ece5d5] text-[#10170d] hover:bg-[#ded7c8]'
                                  : 'bg-[#ece5d5] text-[#10170d] hover:bg-[#ded7c8]'
                                : 'bg-[#a5bd3c] text-[#10170d] shadow-[#10200d]/10 hover:bg-[#bdd45a]',
                            )}
                          >
                            {isAttempted ? 'Reattempt' : 'Solve'}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              // Desktop View: Table Layout
              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr
                      className={cn(
                        'text-xs uppercase tracking-wider',
                        isDark ? 'bg-[#ece5d5] text-[#514b3d]' : 'bg-[#ece5d5] text-[#514b3d]',
                      )}
                    >
                      <th className="px-6 py-4 font-bold">S.No.</th>
                      <th className="px-6 py-4 font-bold">Problem Name</th>
                      <th className="px-6 py-4 font-bold">Difficulty</th>
                      <th className="px-6 py-4 font-bold">Acceptance</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 text-right font-bold">Action</th>
                    </tr>
                  </thead>

                  <motion.tbody
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn('text-sm', isDark ? 'text-[#514b3d]' : 'text-[#514b3d]')}
                  >
                    <AnimatePresence>
                      {questions.map((q, index) => {
                        const absoluteIndex = (currentPage - 1) * perPage + index + 1;
                        const isAttempted = q.status !== 'Not Attempted';

                        return (
                          <motion.tr
                            key={q.id}
                            variants={itemVariants}
                            className={cn(
                              'group border-b transition-colors',
                              isDark
                                ? 'border-[#d8d0bb] hover:bg-[#f7f1e3]'
                                : 'border-[#d8d0bb] hover:bg-[#f7f1e3]',
                            )}
                          >
                            <td className="px-6 py-4 font-medium opacity-50">{absoluteIndex}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span
                                  onClick={() => void handleActionClick(q)}
                                  className={cn(
                                    'flex cursor-pointer items-center gap-1.5 font-bold transition-colors',
                                    q.status === 'Solved'
                                      ? isDark
                                        ? 'text-[#5f7800] group-hover:text-[#405400]'
                                        : 'text-[#5f7800] group-hover:text-[#405400]'
                                      : isDark
                                        ? 'text-[#10170d] group-hover:text-[#5c6f1d]'
                                        : 'text-[#10170d] group-hover:text-[#5c6f1d]',
                                  )}
                                >
                                  {q.title}
                                  {q.status === 'Solved' && (
                                    <Trophy className="h-3.5 w-3.5 shrink-0 text-[#8aa500]" />
                                  )}
                                </span>
                                <span className="mt-1 flex gap-2 text-[10px] font-medium opacity-60">
                                  {q.topics.slice(0, 2).map((t) => (
                                    <span key={t}>{t}</span>
                                  ))}
                                  {q.topics.length > 2 && <span>+{q.topics.length - 2}</span>}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  'rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider',
                                  getDifficultyColor(q.difficulty),
                                )}
                              >
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-semibold">{q.acceptanceRate}%</td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                                  getStatusColor(q.status),
                                )}
                              >
                                {q.status === 'Solved' ? (
                                  <>
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8aa500]" />
                                    Solved
                                  </>
                                ) : q.status === 'Attempted' ? (
                                  <>
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
                                    Attempted
                                  </>
                                ) : (
                                  'Not Attempted'
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => void handleActionClick(q)}
                                className={cn(
                                  'rounded-lg px-4 py-1.5 text-xs font-bold shadow-sm transition-all',
                                  isAttempted
                                    ? isDark
                                      ? 'bg-[#ece5d5] text-[#10170d] hover:bg-[#ded7c8]'
                                      : 'bg-[#ece5d5] text-[#10170d] hover:bg-[#ded7c8]'
                                    : 'bg-[#a5bd3c] text-[#10170d] shadow-[#10200d]/10 hover:bg-[#bdd45a]',
                                )}
                              >
                                {isAttempted ? 'Reattempt' : 'Solve'}
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </motion.tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Toolbar */}
          <div
            className={cn(
              'flex flex-col items-center justify-between gap-4 border-t px-6 py-4 sm:flex-row',
              isDark
                ? 'border-[#d8d0bb] bg-[#ded7c8]'
                : 'border-[#d8d0bb] bg-[#ded7c8]',
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'text-xs font-semibold',
                  isDark ? 'text-[#514b3d]' : 'text-[#514b3d]',
                )}
              >
                Rows per page:
              </span>
              <div className="relative">
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'cursor-pointer appearance-none rounded-md border py-1.5 pl-3 pr-7 text-xs font-bold transition-all focus:outline-none',
                    isDark
                      ? 'border-[#d8d0bb] bg-[#fffaf0] text-[#10170d]'
                      : 'border-[#d8d0bb] bg-[#fffaf0] text-[#10170d]',
                  )}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 opacity-50" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={cn(
                  'text-xs font-semibold',
                  isDark ? 'text-[#514b3d]' : 'text-[#514b3d]',
                )}
              >
                Page {currentPage} of {totalPages || 1} ({totalItems} total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className={cn(
                    'rounded-md p-1.5 transition',
                    isDark
                      ? 'hover:bg-[#ece5d5] disabled:opacity-30'
                      : 'hover:bg-[#ece5d5] disabled:opacity-30',
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0 || loading}
                  className={cn(
                    'rounded-md p-1.5 transition',
                    isDark
                      ? 'hover:bg-[#ece5d5] disabled:opacity-30'
                      : 'hover:bg-[#ece5d5] disabled:opacity-30',
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}



