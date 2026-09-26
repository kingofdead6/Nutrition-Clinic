import { cn } from '../../lib/cn';

/** Initial-letter avatar (offline: no remote images). */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0) || '?';
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800',
        className,
      )}
    >
      {initial}
    </span>
  );
}
