import { X, Sparkles, BrainCircuit, PlayCircle, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: {
    targetAgent: string;
    actionType: string;
    payload?: {
      topic?: string;
      difficulty?: string;
      slug?: string;
      title?: string;
    };
    priority?: string;
    message?: string;
  } | null;
  onChooseAction: (actionKey: 'solve_next' | 'open_mentor' | 'view_mastery') => void;
}

export function AdviceModal({ isOpen, onClose, decision, onChooseAction }: AdviceModalProps) {
  if (!isOpen) return null;

  // Set default fallback values if decision structure is minimal
  const targetAgent = decision?.targetAgent || 'problem-recommendation-agent';
  const actionMessage = decision?.message || 'The AI Coach is ready to direct your learning path.';
  const payload = decision?.payload || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Premium Backdrop Blur */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Glassmorphic Container with Animated Radial Border */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-indigo-950/20 backdrop-blur-2xl transition-all duration-300">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-950/40">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">AI Coach Workspace</p>
              <h2 className="text-base font-extrabold text-white tracking-tight">Choose Your Next Path</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg border border-slate-800/60 bg-slate-900/20 p-1.5 text-slate-400 transition hover:border-slate-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Coach Explanation Banner */}
        <div className="relative z-10 mt-5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400 animate-pulse" />
            <p className="text-xs leading-relaxed text-slate-300 font-medium">
              {actionMessage}
            </p>
          </div>
        </div>

        {/* Selection Options List */}
        <div className="relative z-10 mt-6 grid gap-3.5">
          
          {/* Card 1: Solve Recommended Next Challenge */}
          <button
            onClick={() => onChooseAction('solve_next')}
            className={cn(
              "group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-300",
              targetAgent === 'problem-recommendation-agent'
                ? "border-indigo-500/30 bg-indigo-950/10 shadow-lg shadow-indigo-950/20 hover:border-indigo-500/50 hover:bg-indigo-950/20"
                : "border-slate-800/80 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/20"
            )}
          >
            {targetAgent === 'problem-recommendation-agent' && (
              <div className="absolute right-3 top-3 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
                Recommended
              </div>
            )}
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
              targetAgent === 'problem-recommendation-agent'
                ? "border-indigo-500/20 bg-indigo-950/40 text-indigo-400 group-hover:bg-indigo-900/40"
                : "border-slate-800 bg-slate-900/60 text-slate-400 group-hover:text-slate-200"
            )}>
              <PlayCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                {payload.title ? `Solve Next Challenge: ${payload.title}` : 'Proceed to Next recommended Problem'}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400 font-medium">
                Solve the next topic-aligned challenge. Keep your learning momentum active.
              </p>
              {payload.topic && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-300">
                    {payload.topic}
                  </span>
                  {payload.difficulty && (
                    <span className={cn(
                      "rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      payload.difficulty === 'Easy' && "bg-green-500/10 text-green-400",
                      payload.difficulty === 'Medium' && "bg-amber-500/10 text-amber-400",
                      payload.difficulty === 'Hard' && "bg-rose-500/10 text-rose-400",
                    )}>
                      {payload.difficulty}
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>

          {/* Card 2: Open Socratic Mentor Panel */}
          <button
            onClick={() => onChooseAction('open_mentor')}
            className={cn(
              "group relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-300",
              targetAgent === 'mentor-agent'
                ? "border-amber-500/30 bg-amber-950/10 shadow-lg shadow-amber-950/20 hover:border-amber-500/50 hover:bg-amber-950/20"
                : "border-slate-800/80 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/20"
            )}
          >
            {targetAgent === 'mentor-agent' && (
              <div className="absolute right-3 top-3 rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                Recommended
              </div>
            )}
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
              targetAgent === 'mentor-agent'
                ? "border-amber-500/20 bg-amber-950/40 text-amber-400 group-hover:bg-indigo-900/40"
                : "border-slate-800 bg-slate-900/60 text-slate-400 group-hover:text-slate-200"
            )}>
              <BrainCircuit className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                Start Socratic Debugging Session
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400 font-medium">
                Work through compiler exceptions, logic bugs, or code quality with your AI Mentor.
              </p>
            </div>
          </button>

          {/* Card 3: Check Progress & Mastery */}
          <button
            onClick={() => onChooseAction('view_mastery')}
            className="group flex items-start gap-4 rounded-xl border border-slate-800/80 bg-slate-900/10 p-4 text-left transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/20"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 group-hover:text-slate-200 transition">
              <BarChart2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                Analyze Skill Mastery Profile
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400 font-medium">
                Recalculate dynamic mastery index, difficulty multipliers, and update progress chart.
              </p>
            </div>
          </button>

        </div>

        {/* Footer Actions */}
        <div className="relative z-10 mt-6 flex justify-end gap-3 border-t border-slate-800/60 pt-4">
          <Button
            onClick={onClose}
            className="h-9 rounded-lg border border-slate-800/80 bg-slate-900/40 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-850 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
