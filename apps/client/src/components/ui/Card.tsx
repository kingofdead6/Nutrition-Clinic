import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-2xl bg-white p-5 shadow-card', className)} {...rest} />;
}

export function CardTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-gray-900">{children}</h2>
      {actions}
    </div>
  );
}
