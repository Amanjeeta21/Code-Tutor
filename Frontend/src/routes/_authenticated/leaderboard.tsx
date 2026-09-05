import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, Trophy } from 'lucide-react';

import { TopNavigation } from '@/components/common/top-navigation';

function LeaderboardPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f0e6] font-sans text-[#10170d] antialiased">
      <TopNavigation activeTab="leaderboard" />
      <main className="relative z-10 ml-[var(--app-sidebar-width,5rem)] max-w-[1000px] px-4 pb-24 pt-8 transition-[margin] duration-300 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-6 shadow-xl shadow-[#10200d]/10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f2ad] text-[#405400]">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c6f1d]">Leaderboard</p>
              <h1 className="text-xl font-black tracking-tight">COMING SOON</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-[#514b3d]">
            Rankings and peer progress will appear here once leaderboard data is connected.
          </p>
          <Link to="/practice" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#a5bd3c] px-4 py-2.5 text-xs font-bold text-[#10170d] transition hover:bg-[#bdd45a]">
            Go to Practice
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/leaderboard')({
  component: LeaderboardPage,
});
