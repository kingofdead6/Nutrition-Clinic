import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };

/**
 * Built on the native <dialog>: focus trapping, Escape to close, inert background and
 * top-layer rendering come from the browser (and Electron) for free.
 */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop targets the <dialog> element itself.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        'w-[calc(100%-2rem)] rounded-2xl bg-white p-0 text-gray-900 shadow-xl backdrop:bg-gray-900/40',
        SIZES[size],
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <footer className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
