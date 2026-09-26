import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { ToastContext, type ToastApi } from './useToast';

type ToastKind = 'success' | 'error';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback(
    (id: number) => setItems((list) => list.filter((i) => i.id !== id)),
    [],
  );

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 print:hidden"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.kind === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ring-1',
              item.kind === 'success'
                ? 'bg-white text-gray-900 ring-brand-200'
                : 'bg-red-50 text-red-900 ring-red-200',
            )}
          >
            {item.kind === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
            )}
            <span className="flex-1">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded p-1 text-gray-500 hover:bg-black/5"
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
