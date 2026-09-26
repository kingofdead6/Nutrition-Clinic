import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

export interface SearchInputProps {
  value: string;
  /** Called after the user stops typing for `delayMs`. */
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  delayMs?: number;
  className?: string;
}

/** Debounced search box; keeps its own text so typing stays instant. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  delayMs = 300,
  className,
}: SearchInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  // Follow outside changes (e.g. back/forward navigation restoring the URL) during
  // render, React's recommended "adjust state when a prop changes" pattern.
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value);
  }

  useEffect(() => {
    if (text.trim() === value) return;
    const timer = window.setTimeout(() => onChange(text.trim()), delayMs);
    return () => window.clearTimeout(timer);
  }, [text, value, delayMs, onChange]);

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? t('common.searchPlaceholder')}
        aria-label={label}
        className="block h-10 w-full rounded-lg border border-gray-300 bg-white pe-9 ps-9 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('');
            onChange('');
          }}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700"
          aria-label={t('common.clear')}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
