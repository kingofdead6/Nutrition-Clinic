import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { translateMessage } from '../../lib/errors';

export interface FormFieldProps {
  /** Must match the control's `id` so the label is associated. */
  id: string;
  label: string;
  /** Raw message from react-hook-form/zod (an i18n key); translated here. */
  error?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error, wired for screen readers via aria-describedby ids. */
export function FormField({
  id,
  label,
  error,
  hint,
  required,
  optional,
  className,
  children,
}: FormFieldProps) {
  const { t } = useTranslation();
  const message = translateMessage(t, error);
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <>
            <span className="text-red-600" aria-hidden>
              {' '}
              *
            </span>
            <span className="sr-only"> ({t('common.required')})</span>
          </>
        )}
        {optional && (
          <span className="ms-1 text-xs font-normal text-gray-400">({t('common.optional')})</span>
        )}
      </label>
      {children}
      {message ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {message}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-gray-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
