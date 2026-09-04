import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({ title, children, className, contentClassName }: SectionCardProps) {
  return (
    <Card className={cn('border-[#d8d0bb] bg-[#fffaf0]/95 text-[#10170d] backdrop-blur-sm shadow-sm shadow-[#10200d]/5', className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-[10px] uppercase tracking-wider text-[#5c6f1d]">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(title ? 'pt-0' : 'p-4', contentClassName)}>{children}</CardContent>
    </Card>
  );
}

