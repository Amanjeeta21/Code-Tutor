import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import type { MotionValue, Variants } from 'framer-motion';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Lock,
  Map,
  PlayCircle,
  Route,
  Sparkles,
  Target,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { TopNavigation } from '@/components/common/top-navigation';
import { roadmapNodes, skillMastery } from './data/roadmap-data';
import type { RoadmapNode } from './types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const roadmapPathOffsets = [0, 36, 10, -34, -28, 28, 34, -10, -36, 0];

type RoadmapPathLayout = {
  width: number;
  height: number;
  d: string;
};

const fallbackRoadmapPath: RoadmapPathLayout = {
  width: 200,
  height: 1000,
  d: 'M100,0 C176,120 24,230 128,340 C190,445 18,560 82,675 C142,790 18,890 100,1000',
};

function buildRoadmapPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return fallbackRoadmapPath.d;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x},${point.y}`;

    const previous = points[index - 1];
    const midY = previous.y + (point.y - previous.y) / 2;
    return `${path} C${previous.x},${midY} ${point.x},${midY} ${point.x},${point.y}`;
  }, '');
}


const mapNodeIdToTopic = (id: string): string => {
  const map: Record<string, string> = {
    basics: 'All',
    arrays: 'Arrays',
    strings: 'Strings',
    hashmaps: 'HashMap',
    linkedlists: 'Linked List',
    stack: 'Stack',
    'binary-search': 'Binary Search',
    trees: 'Trees',
    graphs: 'Graphs',
    dp: 'Dynamic Programming',
  };
  return map[id] || 'All';
};

function getPracticePath(node: RoadmapNode) {
  const topic = mapNodeIdToTopic(node.id);
  return topic === 'All' ? '/practice' : (`/practice?topic=${encodeURIComponent(topic)}` as const);
}

function getNodeIcon(node: RoadmapNode) {
  if (node.status === 'completed') return CheckCircle2;
  if (node.status === 'current' || node.status === 'in-progress') return PlayCircle;
  return Lock;
}

export function RoadmapPage() {
  const [expandedNode, setExpandedNode] = useState<string | null>('basics');
  const roadmapTrackRef = useRef<HTMLElement>(null);
  const roadmapContentRef = useRef<HTMLDivElement>(null);
  const roadmapRowsRef = useRef<Array<HTMLDivElement | null>>([]);
  const [pathLayout, setPathLayout] = useState<RoadmapPathLayout>(fallbackRoadmapPath);
  const { scrollYProgress } = useScroll({
    target: roadmapContentRef,
    offset: ['start 72%', 'end 38%'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 52, damping: 20, mass: 0.3 });

  const updateRoadmapPath = useCallback(() => {
    const content = roadmapContentRef.current;
    if (!content) return;

    const contentRect = content.getBoundingClientRect();
    const points = roadmapNodes
      .map((_, index) => {
        const row = roadmapRowsRef.current[index];
        if (!row) return null;

        const rowRect = row.getBoundingClientRect();
        return {
          x: contentRect.width / 2 + roadmapPathOffsets[index % roadmapPathOffsets.length],
          y: rowRect.top - contentRect.top + rowRect.height / 2,
        };
      })
      .filter((point): point is { x: number; y: number } => point !== null);

    if (points.length < 2) return;

    const nextLayout = {
      width: Math.max(contentRect.width, 1),
      height: Math.max(content.scrollHeight, contentRect.height),
      d: buildRoadmapPath(points),
    };

    setPathLayout((current) => (
      current.width === nextLayout.width && current.height === nextLayout.height && current.d === nextLayout.d
        ? current
        : nextLayout
    ));
  }, []);

  const registerRoadmapRow = useCallback((index: number, element: HTMLDivElement | null) => {
    roadmapRowsRef.current[index] = element;
    window.requestAnimationFrame(updateRoadmapPath);
  }, [updateRoadmapPath]);

  useLayoutEffect(() => {
    updateRoadmapPath();

    const observer = new ResizeObserver(updateRoadmapPath);
    const observedElements = [roadmapContentRef.current, ...roadmapRowsRef.current].filter(
      (element): element is HTMLDivElement => element !== null,
    );
    observedElements.forEach((element) => observer.observe(element));
    window.addEventListener('resize', updateRoadmapPath);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateRoadmapPath);
    };
  }, [expandedNode, updateRoadmapPath]);

  const totals = useMemo(() => {
    const completedTopics = roadmapNodes.filter((node) => node.status === 'completed').length;
    const currentNode = roadmapNodes.find((node) => node.status === 'current' || node.status === 'in-progress');
    return {
      overallCompletion: 0,
      completedTopics,
      solvedProblems: 0,
      currentStage: currentNode?.title ?? 'Programming Basics',
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f0e6] font-sans text-[#10170d] antialiased">
      <TopNavigation activeTab="roadmap" />

      <main className="relative z-10 ml-[var(--app-sidebar-width,5rem)] max-w-[1400px] px-4 pb-32 pt-8 transition-[margin] duration-300 sm:px-6 lg:px-8">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.section
            variants={itemVariants}
            className="overflow-hidden rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] shadow-xl shadow-[#10200d]/10"
          >
            <div className="flex flex-col gap-5 border-b border-[#d8d0bb] bg-[#ece5d5]/75 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#5c6f1d]">
                  <Route className="h-3.5 w-3.5" />
                  Roadmap
                </p>
                <h1 className="mt-1 text-xl font-black tracking-tight text-[#10170d] sm:text-2xl">LEARNING ROADMAP</h1>
                <p className="mt-1 max-w-2xl text-xs font-medium text-[#514b3d]">
                  Follow the topic path, unlock practice sets, and build problem-solving depth step by step.
                </p>
              </div>
              <Link
                to="/practice"
                viewTransition
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a5bd3c] px-4 py-2.5 text-xs font-bold text-[#10170d] shadow-sm shadow-[#10200d]/10 transition hover:bg-[#bdd45a]"
              >
                Open Practice
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-px bg-[#d8d0bb] sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile label="Overall" value={`${totals.overallCompletion}%`} helper="Completion" icon={Target} />
              <SummaryTile label="Topics" value={`${totals.completedTopics}/${roadmapNodes.length}`} helper="Completed" icon={CheckCircle2} />
              <SummaryTile label="Solved" value={String(totals.solvedProblems)} helper="Problems" icon={BookOpen} />
              <SummaryTile label="Current" value={totals.currentStage} helper="Stage" icon={CircleDot} compact />
            </div>
          </motion.section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <motion.section
              ref={roadmapTrackRef}
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] px-4 py-10 shadow-lg shadow-[#10200d]/5 sm:px-6"
            >
              <div ref={roadmapContentRef} className="relative z-10 mx-auto max-w-5xl py-4 [perspective:1200px]">
                <div className="pointer-events-none absolute inset-0 z-0">
                  <svg className="h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${pathLayout.width} ${pathLayout.height}`}>
                    <path
                      d={pathLayout.d}
                      fill="none"
                      stroke="#d8d0bb"
                      strokeLinecap="round"
                      strokeWidth="5"
                      vectorEffect="non-scaling-stroke"
                    />
                    <motion.path
                      d={pathLayout.d}
                      fill="none"
                      stroke="#a5bd3c"
                      strokeLinecap="round"
                      strokeWidth="6"
                      style={{ pathLength: smoothProgress }}
                      vectorEffect="non-scaling-stroke"
                    />
                    <motion.path
                      d={pathLayout.d}
                      fill="none"
                      stroke="#5c6f1d"
                      strokeDasharray="2 18"
                      strokeLinecap="round"
                      strokeWidth="7"
                      style={{ pathLength: smoothProgress }}
                      vectorEffect="non-scaling-stroke"
                      animate={{ strokeDashoffset: [0, -80] }}
                      transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
                    />
                  </svg>
                </div>
                <div className="relative z-10 space-y-14">
                {roadmapNodes.map((node, index) => (
                  <RoadmapStep
                    key={node.id}
                    index={index}
                    node={node}
                    isExpanded={expandedNode === node.id}
                    onToggle={() => setExpandedNode((current) => (current === node.id ? null : node.id))}
                    pathOffset={roadmapPathOffsets[index % roadmapPathOffsets.length]}
                    registerRow={registerRoadmapRow}
                  />
                ))}
              </div>
              </div>
            </motion.section>

            <aside className="space-y-6 xl:sticky xl:top-8 xl:h-fit">
              <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
                <div className="mb-5 flex items-center gap-2">
                  <Map className="h-5 w-5 text-[#5c6f1d]" />
                  <div>
                    <h2 className="text-sm font-black text-[#10170d]">Path Overview</h2>
                    <p className="text-[11px] font-medium text-[#8a836f]">All values start from zero.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <InfoRow label="Current Stage" value={totals.currentStage} />
                  <InfoRow label="Topics Completed" value={`${totals.completedTopics} / ${roadmapNodes.length}`} />
                  <InfoRow label="Problems Solved" value="0" />
                  <InfoRow label="Time Spent" value="0h 0m" />
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
                <div className="mb-5 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#5c6f1d]" />
                  <div>
                    <h2 className="text-sm font-black text-[#10170d]">Tutor Note</h2>
                    <p className="text-[11px] font-medium text-[#8a836f]">Start simple and keep momentum.</p>
                  </div>
                </div>
                <p className="text-sm font-medium leading-relaxed text-[#514b3d]">
                  Begin with Programming Basics. Once your local progress data is connected, this path can unlock automatically based on solved questions and accuracy.
                </p>
                <Link
                  to="/practice"
                  viewTransition
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8f2ad] px-4 py-2.5 text-xs font-bold text-[#405400] transition hover:bg-[#dce990]"
                >
                  Start Practice
                  <PlayCircle className="h-4 w-4" />
                </Link>
              </motion.section>

              <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
                <div className="mb-5 flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-[#5c6f1d]" />
                  <h2 className="text-sm font-black text-[#10170d]">Skill Mastery</h2>
                </div>
                <div className="space-y-4">
                  {skillMastery.map((skill) => (
                    <div key={skill.name}>
                      <div className="mb-1 flex justify-between text-xs font-bold text-[#514b3d]">
                        <span>{skill.name}</span>
                        <span>{skill.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#ece5d5]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-[#a5bd3c]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            </aside>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function RoadmapStep({
  index,
  node,
  isExpanded,
  onToggle,
  pathOffset,
  registerRow,
}: {
  index: number;
  node: RoadmapNode;
  isExpanded: boolean;
  onToggle: () => void;
  pathOffset: number;
  registerRow: (index: number, element: HTMLDivElement | null) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ['start 96%', 'end 18%'],
  });
  const smoothRowProgress = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.3 });
  const opacity = useTransform(smoothRowProgress, [0, 0.18, 0.72, 1], [0, 1, 1, 0]);
  const y = useTransform(smoothRowProgress, [0, 0.22, 0.72, 1], [64, 0, 0, -42]);
  const scale = useTransform(smoothRowProgress, [0, 0.22, 0.72, 1], [0.92, 1, 1, 0.96]);
  const filter = useTransform(smoothRowProgress, [0, 0.2, 0.76, 1], ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(7px)']);

  useLayoutEffect(() => {
    registerRow(index, rowRef.current);
    return () => registerRow(index, null);
  }, [index, registerRow]);

  const isLocked = node.status === 'locked';
  const isCurrent = node.status === 'current' || node.status === 'in-progress';
  const NodeIcon = getNodeIcon(node);
  const nodeStyle = { '--node-x': `${pathOffset}px` } as CSSProperties;
  const cardWidth = node.position === 'left'
    ? `calc(50% + ${pathOffset}px - 3.5rem)`
    : `calc(50% - ${pathOffset}px - 3.5rem)`;
  const revealStyle = { width: cardWidth, opacity, y, scale, filter } as CSSProperties & {
    opacity: MotionValue<number>;
    y: MotionValue<number>;
    scale: MotionValue<number>;
    filter: MotionValue<string>;
  };

  return (
    <div
      ref={rowRef}
      style={nodeStyle}
      className={cn(
        'relative z-10 flex min-h-[112px] items-center',
        node.position === 'left' ? 'justify-start pr-14' : 'justify-end pl-14',
      )}
    >
      <motion.div
        style={revealStyle}
        className={cn(
          'min-w-[280px] max-w-[520px] transform-gpu',
          node.position === 'left' ? 'origin-right' : 'origin-left',
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className={cn(
            'group block w-full rounded-2xl border p-4 text-left transition-all duration-300 [transform-style:preserve-3d] hover:-translate-y-2 hover:scale-[1.015]',
            isCurrent
              ? 'border-[#a5bd3c] bg-[#e8f2ad] shadow-[0_22px_45px_rgba(16,32,13,0.18),0_2px_0_rgba(255,255,255,0.8)_inset]'
              : isLocked
                ? 'border-[#d8d0bb] bg-[#f7f1e3] text-[#514b3d] shadow-[0_12px_28px_rgba(16,32,13,0.08),0_1px_0_rgba(255,255,255,0.75)_inset] hover:shadow-[0_20px_40px_rgba(16,32,13,0.14),0_1px_0_rgba(255,255,255,0.85)_inset]'
                : 'border-[#d8d0bb] bg-[#fffaf0] shadow-[0_14px_30px_rgba(16,32,13,0.08),0_1px_0_rgba(255,255,255,0.8)_inset] hover:border-[#a5bd3c] hover:bg-[#f7f1e3] hover:shadow-[0_24px_46px_rgba(16,32,13,0.16),0_1px_0_rgba(255,255,255,0.9)_inset]',
          )}
        >
          <div className="flex items-start justify-between gap-3 [transform:translateZ(18px)]">
            <div className="flex min-w-0 gap-3">
              <span
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-xl border shadow-sm shadow-[#10200d]/10',
                  isCurrent
                    ? 'border-[#a5bd3c]/50 bg-[#fffaf0] text-[#405400]'
                    : isLocked
                      ? 'border-[#d8d0bb] bg-[#ece5d5] text-[#8a836f]'
                      : 'border-[#a5bd3c]/30 bg-[#e8f2ad] text-[#405400]',
                )}
              >
                <NodeIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black text-[#10170d] sm:text-base">{node.title}</h2>
                  {isCurrent && (
                    <span className="rounded-full bg-[#405400] px-2 py-0.5 text-[10px] font-bold uppercase text-[#fffaf0]">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold text-[#514b3d]">{node.problems}</p>
              </div>
            </div>
            <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-[#5c6f1d] transition-transform duration-300', isExpanded && 'rotate-180')} />
          </div>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -8 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -8 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden [transform:translateZ(14px)]"
              >
                <div className="mt-4 border-t border-[#d8d0bb] pt-4">
                  <p className="text-sm font-medium leading-relaxed text-[#514b3d]">{node.focus}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <NodeStat label="Done" value={`${node.stats.completion}%`} />
                    <NodeStat label="Accuracy" value={`${node.stats.accuracy}%`} />
                    <NodeStat label="Time" value={node.stats.timeSpent} />
                  </div>
                  <Link
                    to={getPracticePath(node) as any}
                    viewTransition
                    className={cn(
                      'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition',
                      isLocked
                        ? 'border border-[#d8d0bb] bg-[#ece5d5] text-[#514b3d] hover:bg-[#ded7c8]'
                        : 'bg-[#a5bd3c] text-[#10170d] hover:bg-[#bdd45a]',
                    )}
                  >
                    {isLocked ? 'Practice Prerequisites' : isCurrent ? 'Continue Practice' : 'Review Problems'}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </motion.div>

      <motion.span
        style={{ opacity } as CSSProperties & { opacity: MotionValue<number> }}
        className={cn(
          'absolute top-1/2 z-10 h-px w-[2.375rem] -translate-y-1/2 bg-[#d8d0bb]',
          node.position === 'left' ? 'right-[calc(50%-var(--node-x)+1.125rem)]' : 'left-[calc(50%+var(--node-x)+1.125rem)]',
        )}
      />

      <motion.div
        style={{ opacity, scale } as CSSProperties & { opacity: MotionValue<number>; scale: MotionValue<number> }}
        className="absolute left-[calc(50%+var(--node-x))] top-1/2 z-20 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-[#fffaf0] bg-[#fffaf0] shadow-[0_10px_24px_rgba(16,32,13,0.16)]"
      >
        <div
          className={cn(
            'h-full w-full rounded-full transition-colors',
            isCurrent ? 'bg-[#a5bd3c]' : isLocked ? 'bg-[#d8d0bb]' : 'bg-[#5c6f1d]',
          )}
        />
      </motion.div>

      <motion.span
        style={{ opacity } as CSSProperties & { opacity: MotionValue<number> }}
        className="absolute left-[calc(50%+var(--node-x))] top-1/2 z-20 -translate-x-1/2 -translate-y-[2.45rem] rounded-full border border-[#d8d0bb] bg-[#fffaf0] px-2 py-0.5 text-[10px] font-black text-[#5c5548] shadow-sm shadow-[#10200d]/10"
      >
        {String(index + 1).padStart(2, '0')}
      </motion.span>
    </div>
  );
}
function SummaryTile({
  label,
  value,
  helper,
  icon: Icon,
  compact = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Target;
  compact?: boolean;
}) {
  return (
    <div className="bg-[#fffaf0] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#514b3d]">{label}</p>
          <p className={cn('mt-2 font-black text-[#10170d]', compact ? 'truncate text-lg' : 'text-3xl')}>{value}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e8f2ad] text-[#405400]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-[11px] font-semibold text-[#8a836f]">{helper}</p>
    </div>
  );
}

function NodeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d8d0bb] bg-[#fffaf0]/70 p-2 shadow-inner shadow-white/60">
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8a836f]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#10170d]">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#d8d0bb]/70 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-bold text-[#514b3d]">{label}</span>
      <span className="text-right text-xs font-black text-[#10170d]">{value}</span>
    </div>
  );
}




















