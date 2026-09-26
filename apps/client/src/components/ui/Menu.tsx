import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

/**
 * Small dropdown menu (menu button pattern): opens below the trigger aligned to the
 * end side, arrow keys move between items, Escape/outside click closes.
 */
export function Menu({
  trigger,
  label,
  items,
}: {
  trigger: ReactNode;
  label: string;
  items: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) buttonRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const els = itemRefs.current.filter((el): el is HTMLButtonElement => el !== null);
    const index = els.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      els[(index + 1) % els.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      els[(index - 1 + els.length) % els.length]?.focus();
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-0.5 hover:bg-gray-100"
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onKeyDown}
          className="absolute end-0 top-full z-30 mt-2 min-w-44 rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5"
        >
          {items.map((item, i) => (
            <button
              key={item.label}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close(false);
                item.onSelect();
              }}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2 text-start text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                item.danger ? 'text-red-700' : 'text-gray-800',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
