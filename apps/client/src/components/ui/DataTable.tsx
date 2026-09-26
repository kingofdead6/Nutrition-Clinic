import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { Button } from './Button';
import { ErrorState, Skeleton } from './States';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Server-side sort field; makes the header clickable. */
  sortKey?: string;
  className?: string;
  headerClassName?: string;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: readonly Column<T>[];
  rows: readonly T[] | undefined;
  rowKey: (row: T) => string;
  caption: string;
  loading?: boolean;
  /** True while new data loads over old: rows stay visible, dimmed (no skeleton flash). */
  refreshing?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  onRowClick?: (row: T) => void;
  /** Highlights one row (e.g. the patient loaded in a side panel). */
  selectedKey?: string;
  pagination?: PaginationState;
  skeletonRows?: number;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  loading,
  refreshing,
  error,
  onRetry,
  empty,
  sort,
  onSortChange,
  onRowClick,
  selectedKey,
  pagination,
  skeletonRows = 6,
  dense = false,
}: DataTableProps<T>) {
  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';

  if (error && !rows) return <ErrorState error={error} onRetry={onRetry} />;

  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    onSortChange({ key, dir: sort?.key === key && sort.dir === 'asc' ? 'desc' : 'asc' });
  };

  const onRowKey = (e: KeyboardEvent, row: T) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className={cn('w-full text-sm transition-opacity', refreshing && 'opacity-60')}>
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {columns.map((col) => {
                const active = sort?.key === col.sortKey;
                const ariaSort = active
                  ? sort?.dir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={col.sortKey ? (ariaSort ?? 'none') : undefined}
                    className={cn(
                      cellPad,
                      'whitespace-nowrap text-start font-semibold',
                      col.headerClassName,
                    )}
                  >
                    {col.sortKey && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.sortKey as string)}
                        className="inline-flex items-center gap-1 rounded hover:text-gray-900"
                      >
                        {col.header}
                        {active ? (
                          sort?.dir === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading && !rows
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className={cellPad}>
                        <Skeleton className="h-4 w-full max-w-[8rem]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row) => {
                  const key = rowKey(row);
                  return (
                    <tr
                      key={key}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={onRowClick ? (e) => onRowKey(e, row) : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      aria-selected={selectedKey !== undefined ? key === selectedKey : undefined}
                      className={cn(
                        onRowClick &&
                          'cursor-pointer hover:bg-brand-50/60 focus-visible:bg-brand-50',
                        key === selectedKey && 'bg-brand-50',
                      )}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={cn(cellPad, col.className)}>
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {rows && rows.length === 0 && !loading && (
          <div className="border-t border-gray-100">{empty}</div>
        )}
      </div>

      {pagination && pagination.total > pagination.pageSize && <Pager {...pagination} />}
    </div>
  );
}

function Pager({ page, pageSize, total, onPageChange }: PaginationState) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav
      className="mt-3 flex items-center justify-between gap-3 text-sm text-gray-600"
      aria-label={t('common.pageInfo', { from, to, total })}
    >
      <span>{t('common.pageInfo', { from, to, total })}</span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          {t('common.previous')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('common.next')}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
