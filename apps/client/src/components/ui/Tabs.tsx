import { useRef, type KeyboardEvent } from 'react';
import { cn } from '../../lib/cn';

export interface TabItem<K extends string> {
  id: K;
  label: string;
}

export interface TabsProps<K extends string> {
  items: readonly TabItem<K>[];
  value: K;
  onChange: (id: K) => void;
  /** Prefix for tab/panel ids; panels use `${idPrefix}-panel-${id}`. */
  idPrefix: string;
  label: string;
}

/**
 * WAI-ARIA tabs (roving tabindex, arrow keys follow the reading direction, Home/End).
 * Render the active panel with <TabPanel> using the same idPrefix.
 */
export function Tabs<K extends string>({ items, value, onChange, idPrefix, label }: TabsProps<K>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((i) => i.id === value);
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next: number;
    if (e.key === forward) next = (index + 1) % items.length;
    else if (e.key === backward) next = (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    const item = items[next];
    if (item) {
      onChange(item.id);
      refs.current[next]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200"
    >
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              selected
                ? 'border-brand-700 text-brand-800'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  idPrefix,
  id,
  children,
}: {
  idPrefix: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
