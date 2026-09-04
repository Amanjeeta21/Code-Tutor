import type { ReactNode } from 'react';

import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger';

const toneToVariant: Record<StatusTone, BadgeProps['variant']> = {
  neutral: 'secondary',
  success: 'outline',
  warning: 'outline',
  danger: 'destructive',
};

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-[#d8d0bb] bg-[#ece5d5] text-[#514b3d]',
  success: 'border-[#a5bd3c]/35 bg-[#e8f2ad] text-[#405400]',
  warning: 'border-[#d7a21d]/30 bg-[#fff1bd] text-[#6b4b00]',
  danger: 'border-[#c75f4a]/30 bg-[#ffe0d8] text-[#7b2116]',
};

interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ children, tone = 'neutral', className }: StatusBadgeProps) {
  return (
    <Badge
      variant={toneToVariant[tone]}
      className={cn(
        'gap-1.5 text-[9px] font-bold uppercase tracking-widest',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </Badge>
  );
}

