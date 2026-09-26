import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin', className)} aria-hidden />;
}

/** Centered spinner with an accessible label, for whole-page/section loading. */
export function LoadingBlock({ label, className }: { label: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center gap-3 py-16 text-gray-500', className)}
    >
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
