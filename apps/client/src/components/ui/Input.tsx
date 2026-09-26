import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

const CONTROL =
  'block w-full rounded-lg border bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';

const stateClass = (invalid?: boolean) => (invalid ? 'border-red-400' : 'border-gray-300');

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Left-to-right content (email, phone, numbers) inside the RTL layout. */
  ltr?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, ltr, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      dir={ltr ? 'ltr' : undefined}
      className={cn(CONTROL, 'h-10', ltr && 'text-end', stateClass(invalid), className)}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'py-2', stateClass(invalid), className)}
      {...rest}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'h-10 pe-8', stateClass(invalid), className)}
      {...rest}
    >
      {children}
    </select>
  );
});

export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>(function Checkbox({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn('h-4 w-4 rounded border-gray-300 text-brand-700 accent-brand-700', className)}
      {...rest}
    />
  );
});
