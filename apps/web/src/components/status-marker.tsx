import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const toneClasses = {
  ok: 'bg-primary',
  off: 'border-[1.5px] border-muted-foreground bg-transparent',
  action: 'bg-warning',
} as const;

export type StatusTone = keyof typeof toneClasses;

/** Small square marker + label. The square is decoration: the text carries the meaning. */
export function StatusMarker({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-sm',
        tone === 'off' && 'text-muted-foreground',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-2.5 shrink-0 rounded-[2px]', toneClasses[tone])}
      />
      {children}
    </span>
  );
}
