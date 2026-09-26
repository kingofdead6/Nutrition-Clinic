import { forwardRef } from 'react';
import { Input, type InputProps } from './Input';

/**
 * Date-only field (`YYYY-MM-DD` value). Uses the native picker: keyboard accessible,
 * localized by the OS, works offline and in Electron without a calendar library.
 */
export const DatePicker = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'ltr'>>(
  function DatePicker(props, ref) {
    return <Input ref={ref} type="date" ltr {...props} />;
  },
);
