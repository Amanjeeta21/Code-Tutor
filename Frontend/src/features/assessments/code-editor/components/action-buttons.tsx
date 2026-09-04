import { Play, Send, RotateCcw, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActionButtonsProps {
  isRunning: boolean;
  isSubmitting: boolean;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isCoachOpen?: boolean;
  onToggleCoach?: () => void;
}

export function ActionButtons({
  isRunning,
  isSubmitting,
  onRun,
  onSubmit,
  onReset,
  isCoachOpen,
  onToggleCoach,
}: ActionButtonsProps) {
  const isPending = isRunning || isSubmitting;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between border-t border-[#d8d0bb]/40 bg-[#fffaf0]/20 px-3 py-2 sm:px-4 sm:py-3">
        {/* Left Actions: Reset + Ask Mentor */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onReset}
                disabled={isPending}
                className="h-8 rounded-md bg-transparent px-3 text-xs text-[#514b3d] shadow-none transition-colors hover:bg-[#ded7c8]/30 hover:text-[#10170d]"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border-[#d8d0bb] bg-[#fffaf0] text-[10px] text-[#514b3d]">
              Reset editor code to template
            </TooltipContent>
          </Tooltip>

          {onToggleCoach && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onToggleCoach}
                  disabled={isPending}
                  className={`h-8 rounded-md px-3 text-xs shadow-none transition-colors ${
                    isCoachOpen
                      ? 'border border-[#a5bd3c]/30 bg-[#a5bd3c]/10 text-[#5c6f1d] hover:bg-[#a5bd3c]/15'
                      : 'bg-transparent text-[#514b3d] hover:bg-[#ded7c8]/30 hover:text-[#5c6f1d]'
                  }`}
                >
                  <BrainCircuit className="mr-1.5 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ask Mentor</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="border-[#d8d0bb] bg-[#fffaf0] text-[10px] text-[#514b3d]">
                Toggle Mentor AI panel
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Right Actions: Run + Submit */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onRun}
                disabled={isPending}
                className="min-h-8 rounded-md border border-[#c8bea5]/50 bg-[#ece5d5]/40 px-3 text-xs text-[#26351d] transition-all hover:border-[#8a836f] hover:bg-[#ded7c8]/50 hover:text-[#10170d] sm:min-h-9 sm:px-4"
              >
                {isRunning ? (
                  <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#8a836f] border-t-transparent" />
                ) : (
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                )}
                <span>Run<span className="hidden sm:inline"> Code</span></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border-[#d8d0bb] bg-[#fffaf0] font-mono text-[10px] text-[#514b3d]">
              Ctrl + Enter
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onSubmit}
                disabled={isPending}
                className="min-h-9 rounded-md bg-gradient-to-r from-[#a5bd3c] to-[#8aa500] px-5 text-xs font-bold text-[#10170d] shadow-[0_0_15px_rgba(245,158,11,0.15)] shadow-md shadow-[#10200d]/10 transition-all duration-300 hover:from-[#bdd45a] hover:to-[#a5bd3c] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)]"
              >
                {isSubmitting ? (
                  <span className="mr-1.5 text-xs">⏳</span>
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="border-[#d8d0bb] bg-[#fffaf0] font-mono text-[10px] text-[#514b3d]">
              Ctrl + Shift + Enter
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

