import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Patient } from '@shared';
import { usePatients } from '../../api/patients';
import { cn } from '../../lib/cn';
import { PatientAvatar } from '../patients/PatientAvatar';

export interface PatientChoice {
  id: string;
  fullName: string;
  fileNumber: string;
  phone: string;
}

/**
 * Patient autocomplete (WAI-ARIA combobox): type a name, phone or file number;
 * arrows move, Enter picks, Escape closes.
 */
export function PatientCombobox({
  id,
  value,
  onChange,
  invalid,
  disabled,
  describedBy,
}: {
  id: string;
  value: PatientChoice | null;
  onChange: (patient: PatientChoice | null) => void;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
}) {
  const { t } = useTranslation();
  const listId = useId();
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<number | undefined>(undefined);
  // -1 = nothing highlighted yet; the first ArrowDown lands on the first option.
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(text.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [text]);

  const results = usePatients({
    search: search || undefined,
    pageSize: 8,
    sort: 'fullName',
    dir: 'asc',
  });
  // Never offer the previous search's rows while the new one loads (a keyboard pick
  // would select the wrong patient).
  const pending = text.trim() !== search || results.isPlaceholderData || results.isPending;
  const options: Patient[] = open && !pending ? (results.data?.data ?? []) : [];

  const pick = (p: Patient) => {
    onChange({ id: p.id, fullName: p.fullName, fileNumber: p.fileNumber, phone: p.phone });
    setText('');
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(0, options.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && open && options.length > 0) {
      e.preventDefault();
      const choice = options[Math.max(0, active)];
      if (choice) pick(choice);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (value) {
    return (
      <div
        className={cn(
          'flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm shadow-sm',
          invalid ? 'border-red-400' : 'border-gray-300',
          disabled && 'bg-gray-50',
        )}
      >
        <span id={id} className="font-semibold text-gray-900">
          {value.fullName}
        </span>
        <span className="font-mono text-xs text-gray-500" dir="ltr">
          {value.fileNumber}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ms-auto rounded p-1 text-gray-400 hover:text-gray-700"
            aria-label={t('appointments.changePatient')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && options[active] ? `${listId}-${options[active].id}` : undefined
        }
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        value={text}
        disabled={disabled}
        placeholder={t('appointments.patientSearch')}
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
        className={cn(
          'block h-10 w-full rounded-lg border bg-white px-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30',
          invalid ? 'border-red-400' : 'border-gray-300',
        )}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/10"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">
              {pending ? t('common.loading') : t('appointments.noPatientFound')}
            </li>
          ) : (
            options.map((p, i) => (
              <li
                key={p.id}
                id={`${listId}-${p.id}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm',
                  i === active && 'bg-brand-50',
                )}
              >
                <PatientAvatar patient={p} className="h-7 w-7" />
                <span className="font-semibold text-gray-900">{p.fullName}</span>
                <span className="ms-auto text-xs text-gray-500" dir="ltr">
                  {p.fileNumber} · {p.phone}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
