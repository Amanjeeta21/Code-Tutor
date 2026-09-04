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
        className="absolute inset-0 bg-[#fffaf0]/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Glassmorphic Container with Animated Radial Border */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#d8d0bb]/80 bg-[#fffaf0]/90 p-6 shadow-2xl shadow-[#10200d]/20 backdrop-blur-2xl transition-all duration-300">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#a5bd3c]/10 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#a5bd3c]/10 blur-3xl" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a5bd3c] to-[#8aa500] shadow-lg shadow-[#10200d]/40">
              <Sparkles className="h-5 w-5 text-[#10170d]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c6f1d]">AI Coach Workspace</p>
              <h2 className="text-base font-extrabold text-[#10170d] tracking-tight">Choose Your Next Path</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg border border-[#d8d0bb]/60 bg-[#ece5d5]/20 p-1.5 text-[#514b3d] transition hover:border-[#c8bea5] hover:text-[#10170d]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Coach Explanation Banner */}
        <div className="relative z-10 mt-5 rounded-xl border border-[#a5bd3c]/10 bg-[#a5bd3c]/5 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a5bd3c] animate-pulse" />
            <p className="text-xs leading-relaxed text-[#26351d] font-medium">
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
                ? "border-[#a5bd3c]/30 bg-[#e8f2ad]/10 shadow-lg shadow-[#10200d]/20 hover:border-[#a5bd3c]/50 hover:bg-[#e8f2ad]/20"
                : "border-[#d8d0bb]/80 bg-[#ece5d5]/10 hover:border-[#c8bea5] hover:bg-[#ece5d5]/20"
            )}
          >
            {targetAgent === 'problem-recommendation-agent' && (
              <div className="absolute right-3 top-3 rounded-full bg-[#a5bd3c]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#5c6f1d] border border-[#a5bd3c]/20">
                Recommended
              </div>
            )}
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
              targetAgent === 'problem-recommendation-agent'
                ? "border-[#a5bd3c]/20 bg-[#e8f2ad]/40 text-[#5c6f1d] group-hover:bg-[#e8f2ad]/40"
                : "border-[#d8d0bb] bg-[#ece5d5]/60 text-[#514b3d] group-hover:text-[#10170d]"
            )}>
              <PlayCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#10170d] group-hover:text-[#5c6f1d] transition-colors">
                {payload.title ? `Solve Next Challenge: ${payload.title}` : 'Proceed to Next recommended Problem'}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#514b3d] font-medium">
                Solve the next topic-aligned challenge. Keep your learning momentum active.
              </p>
              {payload.topic && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="rounded bg-[#ded7c8] px-2 py-0.5 text-[9px] font-semibold text-[#26351d]">
                    {payload.topic}
                  </span>
                  {payload.difficulty && (
                    <span className={cn(
                      "rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      payload.difficulty === 'Easy' && "bg-green-500/10 text-green-400",
                      payload.difficulty === 'Medium' && "bg-[#a5bd3c]/10 text-[#5c6f1d]",
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
                ? "border-[#a5bd3c]/30 bg-[#e8f2ad]/10 shadow-lg shadow-[#10200d]/20 hover:border-[#a5bd3c]/50 hover:bg-[#e8f2ad]/20"
                : "border-[#d8d0bb]/80 bg-[#ece5d5]/10 hover:border-[#c8bea5] hover:bg-[#ece5d5]/20"
            )}
          >
            {targetAgent === 'mentor-agent' && (
              <div className="absolute right-3 top-3 rounded-full bg-[#a5bd3c]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#5c6f1d] border border-[#a5bd3c]/20">
                Recommended
              </div>
            )}
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition",
              targetAgent === 'mentor-agent'
                ? "border-[#a5bd3c]/20 bg-[#e8f2ad]/40 text-[#5c6f1d] group-hover:bg-[#e8f2ad]/40"
                : "border-[#d8d0bb] bg-[#ece5d5]/60 text-[#514b3d] group-hover:text-[#10170d]"
            )}>
              <BrainCircuit className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#10170d] group-hover:text-[#5c6f1d] transition-colors">
                Start Socratic Debugging Session
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#514b3d] font-medium">
                Work through compiler exceptions, logic bugs, or code quality with your AI Mentor.
              </p>
            </div>
          </button>

          {/* Card 3: Check Progress & Mastery */}
          <button
            onClick={() => onChooseAction('view_mastery')}
            className="group flex items-start gap-4 rounded-xl border border-[#d8d0bb]/80 bg-[#ece5d5]/10 p-4 text-left transition-all duration-300 hover:border-[#c8bea5] hover:bg-[#ece5d5]/20"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d8d0bb] bg-[#ece5d5]/60 text-[#514b3d] group-hover:text-[#10170d] transition">
              <BarChart2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#10170d] group-hover:text-[#5c6f1d] transition-colors">
                Analyze Skill Mastery Profile
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#514b3d] font-medium">
                Recalculate dynamic mastery index, difficulty multipliers, and update progress chart.
              </p>
            </div>
          </button>

        </div>

        {/* Footer Actions */}
        <div className="relative z-10 mt-6 flex justify-end gap-3 border-t border-[#d8d0bb]/60 pt-4">
          <Button
            onClick={onClose}
            className="h-9 rounded-lg border border-[#d8d0bb]/80 bg-[#ece5d5]/40 px-4 text-xs font-bold uppercase tracking-wider text-[#514b3d] hover:bg-[#ded7c8] hover:text-[#10170d]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

