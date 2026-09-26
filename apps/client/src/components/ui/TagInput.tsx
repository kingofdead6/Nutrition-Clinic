import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

export interface TagInputProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Free-text list (allergies, medications): Enter or comma adds, Backspace removes the last. */
export function TagInput({ id, value, onChange, placeholder, disabled }: TagInputProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const add = () => {
    const tag = draft.trim().replace(/[,،]$/, '').trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 shadow-sm focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-900"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="rounded-full p-0.5 hover:bg-brand-100"
              aria-label={t('common.removeTag', { tag })}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          )}
        </span>
      ))}
      <input
        id={id}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={value.length ? '' : (placeholder ?? t('common.addTag'))}
        className="min-w-[8rem] flex-1 border-0 bg-transparent p-1 text-sm focus:outline-none focus:ring-0"
      />
    </div>
  );
}
