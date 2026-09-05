import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  FileCode2,
  Target,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { TopNavigation } from '@/components/common/top-navigation';
import { fetchUserStats, fetchActivityData, fetchRecentSubmissions } from './services/dashboard-services';
import type { UserStats, ContributionDay, Submission } from './types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const metricCards = [
  { label: 'Total Problems', key: 'problemsSolved', icon: CheckCircle2, helper: 'Solved so far' },
  { label: 'Current Streak', key: 'currentStreak', icon: CalendarDays, helper: 'Active days' },
  { label: 'Accuracy Rate', key: 'accuracyRate', icon: Target, helper: 'Accepted ratio' },
  { label: 'Skill Rank', key: 'skillRank', icon: BarChart3, helper: 'Current tier' },
] as const;

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activityData, setActivityData] = useState<ContributionDay[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsRes, activityRes, submissionsRes] = await Promise.all([
          fetchUserStats(),
          fetchActivityData(),
          fetchRecentSubmissions(),
        ]);
        setStats(statsRes);
        setActivityData(activityRes);
        setSubmissions(submissionsRes);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    void loadDashboardData();
  }, []);

  const safeStats = stats ?? {
    currentStreak: 0,
    problemsSolved: 0,
    skillRank: '0',
    accuracyRate: 0,
  };

  const totalActivity = activityData.reduce((sum, day) => sum + day.count, 0);
  const acceptedCount = submissions.filter((item) => item.status === 'Accepted').length;
  const failedCount = submissions.length - acceptedCount;

  const getMetricValue = (key: (typeof metricCards)[number]['key']) => {
    if (key === 'accuracyRate') return `${safeStats.accuracyRate}%`;
    return safeStats[key];
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-[#ece5d5]';
    if (count === 1) return 'bg-[#c5d86d]';
    if (count === 2) return 'bg-[#a5bd3c]';
    if (count === 3) return 'bg-[#7a921e]';
    return 'bg-[#405400]';
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f0e6] font-sans text-[#10170d] antialiased">
      <TopNavigation activeTab="dashboard" />

      <main className="relative z-10 ml-[var(--app-sidebar-width,5rem)] max-w-[1280px] px-4 pb-24 pt-8 transition-[margin] duration-300 sm:px-6 lg:px-8">
        {loading && (
          <div className="mb-5 rounded-lg border border-[#d8d0bb] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#514b3d] shadow-sm shadow-[#10200d]/5">
            Loading workspace...
          </div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-5"
        >
          <motion.section
            variants={itemVariants}
            className="overflow-hidden rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] shadow-xl shadow-[#10200d]/10"
          >
            <div className="flex flex-col gap-4 border-b border-[#d8d0bb] bg-[#ece5d5]/75 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c6f1d]">Overview</p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-[#10170d] sm:text-2xl">YOUR PRACTICE WORKSPACE</h1>
                <p className="mt-1 text-xs font-medium text-[#514b3d]">Monitor progress, recent activity, and next practice steps.</p>
              </div>
              <button
                onClick={() => void navigate({ to: '/practice' })}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a5bd3c] px-4 py-2.5 text-xs font-bold text-[#10170d] shadow-sm shadow-[#10200d]/10 transition hover:bg-[#bdd45a]"
              >
                Practice
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-px bg-[#d8d0bb] sm:grid-cols-2 lg:grid-cols-4">
              {metricCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="bg-[#fffaf0] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#514b3d]">{card.label}</p>
                        <p className="mt-2 text-3xl font-black text-[#10170d]">{getMetricValue(card.key)}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f2ad] text-[#405400]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] font-semibold text-[#8a836f]">{card.helper}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5 lg:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#5c6f1d]" />
                  <div>
                    <h2 className="text-sm font-black text-[#10170d]">Practice Activity</h2>
                    <p className="text-[11px] font-medium text-[#8a836f]">{totalActivity} activities recorded</p>
                  </div>
                </div>
                <span className="rounded-full border border-[#d8d0bb] bg-[#ece5d5] px-3 py-1 text-[10px] font-bold uppercase text-[#514b3d]">
                  Last 90 days
                </span>
              </div>

              <div className="overflow-x-auto pb-1">
                <div className="grid min-w-[620px] grid-flow-col grid-rows-7 gap-1.5">
                  {activityData.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} activities`}
                      className={cn('h-3.5 w-3.5 rounded-sm transition hover:scale-110', getHeatmapColor(day.count))}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#d8d0bb] pt-4 sm:grid-cols-4">
                <MiniStat label="Runs" value="0" />
                <MiniStat label="Submissions" value={String(submissions.length)} />
                <MiniStat label="Accepted" value={String(acceptedCount)} />
                <MiniStat label="Failed" value={String(failedCount)} />
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
              <div className="mb-5 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#5c6f1d]" />
                <div>
                  <h2 className="text-sm font-black text-[#10170d]">Daily Goal</h2>
                  <p className="text-[11px] font-medium text-[#8a836f]">0 of 0 completed</p>
                </div>
              </div>

              <div className="flex items-center justify-center py-4">
                <div className="grid h-32 w-32 place-items-center rounded-full border-[14px] border-[#ece5d5] bg-[#fffaf0] text-center shadow-inner shadow-[#10200d]/5">
                  <div>
                    <p className="text-3xl font-black text-[#10170d]">0%</p>
                    <p className="text-[10px] font-bold uppercase text-[#8a836f]">Complete</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => void navigate({ to: '/practice' })}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#a5bd3c]/40 bg-[#e8f2ad] py-2.5 text-xs font-bold text-[#405400] transition hover:bg-[#dce990]"
              >
                Start Practice
                <Code2 className="h-4 w-4" />
              </button>
            </motion.section>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
              <div className="mb-5 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#5c6f1d]" />
                <h2 className="text-sm font-black text-[#10170d]">Topic Progress</h2>
              </div>
              <div className="space-y-4">
                {['Arrays', 'Strings', 'Trees', 'Graphs'].map((topic) => (
                  <div key={topic}>
                    <div className="mb-1 flex justify-between text-xs font-bold text-[#514b3d]">
                      <span>{topic}</span>
                      <span>0%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#ece5d5]">
                      <div className="h-full w-0 rounded-full bg-[#a5bd3c]" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-[#5c6f1d]" />
                  <h2 className="text-sm font-black text-[#10170d]">Recent Submissions</h2>
                </div>
                <span className="text-[11px] font-bold text-[#8a836f]">0 total</span>
              </div>

              {submissions.length === 0 ? (
                <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[#d8d0bb] bg-[#ece5d5]/35 p-6 text-center">
                  <FileCode2 className="mb-3 h-8 w-8 text-[#8a836f]" />
                  <p className="text-sm font-bold text-[#10170d]">No submissions yet</p>
                  <p className="mt-1 text-xs text-[#514b3d]">Solved and submitted problems will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-[#d8d0bb]/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-[#405400]" />
                        <div>
                          <h3 className="text-xs font-bold text-[#10170d]">{item.title}</h3>
                          <span className="text-[10px] text-[#514b3d]">{item.language} - {item.time}</span>
                        </div>
                      </div>
                      <span className="rounded-md bg-[#e8f2ad] px-2 py-0.5 text-[10px] font-bold text-[#405400]">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          </div>

          <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-[#10170d]">Weekly Performance</h2>
                <p className="text-[11px] font-medium text-[#8a836f]">Submissions completed per day</p>
              </div>
              <span className="rounded-full bg-[#ece5d5] px-3 py-1 text-[10px] font-bold uppercase text-[#514b3d]">0 this week</span>
            </div>
            <div className="flex h-44 items-end gap-3 rounded-xl border border-[#d8d0bb] bg-[#ece5d5]/35 p-4">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="h-28 w-full rounded-t-lg bg-[#fffaf0] shadow-inner shadow-[#10200d]/5">
                    <div className="h-0 rounded-t-lg bg-[#a5bd3c]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#8a836f]">{day}</span>
                </div>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d8d0bb] bg-[#ece5d5]/35 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a836f]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#10170d]">{value}</p>
    </div>
  );
}




