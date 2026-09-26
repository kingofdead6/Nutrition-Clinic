import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, type InputProps } from './Input';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'ltr'>>(
  function PasswordInput(props, ref) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    return (
      // The field content is left-to-right, so the wrapper is too: the toggle then always
      // sits on the same side as the reserved padding, in RTL and LTR pages alike.
      <div className="relative" dir="ltr">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          ltr
          className="pe-10 ps-3"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-800"
          aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    );
  },
);
