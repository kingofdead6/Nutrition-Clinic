import { Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Food } from '@shared';
import { useFoods } from '../../api/foods';
import { cn } from '../../lib/cn';

/** Search-as-you-type food combobox that adds the picked food to a meal. */
export function FoodPicker({ onPick, label }: { onPick: (food: Food) => void; label: string }) {
  const { t } = useTranslation();
  const listId = useId();
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<number | undefined>(undefined);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(text.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [text]);

  const results = useFoods(
    { search: search || undefined, pageSize: 12 },
    open && search.length > 0,
  );
  const pending = text.trim() !== search || results.isPlaceholderData || results.isPending;
  const options: Food[] = open && search && !pending ? (results.data?.data ?? []) : [];

  const pick = (food: Food) => {
    onPick(food);
    setText('');
    setSearch('');
    setActive(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(0, options.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const choice = options[Math.max(0, active)];
      if (choice) pick(choice);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Plus
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700"
        aria-hidden
      />
      <input
        role="combobox"
        aria-label={label}
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && options[active] ? `${listId}-${options[active].id}` : undefined
        }
        value={text}
        placeholder={t('plans.addFood')}
        autoComplete="off"
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          // Cancel a close scheduled by a quick blur → refocus (otherwise the list we just
          // reopened would snap shut).
          window.clearTimeout(blurTimer.current);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
        className="block h-9 w-full rounded-lg border border-dashed border-gray-300 bg-white pe-3 ps-9 text-sm placeholder:text-gray-500 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
      />
      {open && search && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/10"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              {pending ? t('common.loading') : t('plans.noFoodFound')}
            </li>
          ) : (
            options.map((f, i) => (
              <li
                key={f.id}
                id={`${listId}-${f.id}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(f)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm',
                  i === active && 'bg-brand-50',
                )}
              >
                <span className="font-semibold text-gray-900">{f.name}</span>
                <span className="text-xs text-gray-500">
                  {t(`enums.foodCategory.${f.category}`)}
                </span>
                <span className="ms-auto whitespace-nowrap text-xs text-gray-600">
                  {`${f.calories} ${t('common.kcal')} / ${f.servingSize} ${t(`enums.servingUnit.${f.servingUnit}`)}`}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
