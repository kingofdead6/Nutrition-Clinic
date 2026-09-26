import { Apple, Download, PackagePlus, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FOOD_CATEGORIES, FOOD_CSV_COLUMNS, type Food, type FoodCategory } from '@shared';
import { useDeleteFood, useFoods, useInstallDefaultFoods } from '../../api/foods';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { errorText } from '../../lib/errors';
import { useCanEditClinical } from '../../lib/roles';
import { FoodFormModal } from './FoodFormModal';
import { FoodImportModal } from './FoodImportModal';

const PAGE_SIZE = 25;

/** A downloadable CSV template (UTF-8 with BOM so Excel shows Arabic correctly). */
function downloadTemplate() {
  const rows = [FOOD_CSV_COLUMNS.join(','), 'مسفوف,Mesfouf,traditional,200,g,330,10,55,7,3'];
  const blob = new Blob([String.fromCharCode(0xfeff) + rows.join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'foods-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function FoodsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const canEdit = useCanEditClinical();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const category = FOOD_CATEGORIES.includes(params.get('category') as FoodCategory)
    ? (params.get('category') as FoodCategory)
    : undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);
  const list = useFoods({ search: search || undefined, category, page, pageSize: PAGE_SIZE });
  const install = useInstallDefaultFoods();
  const remove = useDeleteFood();
  const [editing, setEditing] = useState<Food | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Food | null>(null);
  const [importing, setImporting] = useState(false);

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const num = (v: number) => <span className="tabular-nums">{v}</span>;
  const columns: Column<Food>[] = [
    {
      key: 'name',
      header: t('foods.fields.name'),
      cell: (f) => (
        <span className="flex flex-col">
          <span className="font-semibold text-gray-900">
            {f.name}
            {f.isCustom && (
              <span className="ms-2 rounded-full bg-pastel-purple px-2 py-0.5 text-[0.7rem] font-bold text-violet-800">
                {t('foods.custom')}
              </span>
            )}
          </span>
          {f.nameFr && (
            <span className="text-xs text-gray-500" dir="ltr">
              {f.nameFr}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'category',
      header: t('foods.fields.category'),
      cell: (f) => t(`enums.foodCategory.${f.category}`),
    },
    {
      key: 'serving',
      header: t('foods.columns.serving'),
      cell: (f) => (
        <span className="whitespace-nowrap">{`${f.servingSize} ${t(`enums.servingUnit.${f.servingUnit}`)}`}</span>
      ),
    },
    {
      key: 'cal',
      header: t('foods.columns.calories'),
      cell: (f) => <b className="tabular-nums">{f.calories}</b>,
    },
    { key: 'p', header: t('foods.columns.protein'), cell: (f) => num(f.proteinG) },
    { key: 'c', header: t('foods.columns.carbs'), cell: (f) => num(f.carbsG) },
    { key: 'f', header: t('foods.columns.fat'), cell: (f) => num(f.fatG) },
    { key: 'fib', header: t('foods.columns.fiber'), cell: (f) => num(f.fiberG) },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: t('common.actions'),
            headerClassName: 'text-end',
            cell: (f: Food) => (
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(f)}
                  aria-label={`${t('common.edit')} ${f.name}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700 hover:bg-red-50"
                  onClick={() => setDeleting(f)}
                  aria-label={`${t('common.delete')} ${f.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const installDefaults = () =>
    install.mutate(undefined, {
      onSuccess: ({ added }) =>
        toast.success(added ? t('foods.installed', { count: added }) : t('foods.noneMissing')),
      onError: (err) => toast.error(errorText(t, err)),
    });

  return (
    <>
      <PageHeader
        title={t('foods.title')}
        subtitle={t('foods.subtitle')}
        actions={
          canEdit && (
            <>
              <Button variant="secondary" onClick={downloadTemplate}>
                <Download className="h-4 w-4" aria-hidden />
                {t('foods.template')}
              </Button>
              <Button variant="secondary" onClick={() => setImporting(true)}>
                <Upload className="h-4 w-4" aria-hidden />
                {t('foods.import')}
              </Button>
              <Button variant="secondary" loading={install.isPending} onClick={installDefaults}>
                <PackagePlus className="h-4 w-4" aria-hidden />
                {t('foods.installDefaults')}
              </Button>
              <Button onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" aria-hidden />
                {t('foods.add')}
              </Button>
            </>
          )
        }
      />

      <Card>
        <div role="search" className="mb-4 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(v) => update({ search: v || undefined })}
            label={t('foods.searchPlaceholder')}
            placeholder={t('foods.searchPlaceholder')}
            className="w-full sm:w-72"
          />
          <div className="w-full sm:w-56">
            <Select
              aria-label={t('foods.fields.category')}
              value={category ?? ''}
              onChange={(e) => update({ category: e.target.value || undefined })}
            >
              <option value="">{`${t('foods.fields.category')}: ${t('common.all')}`}</option>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`enums.foodCategory.${c}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <DataTable
          caption={t('foods.title')}
          columns={columns}
          rows={list.data?.data}
          rowKey={(f) => f.id}
          loading={list.isPending}
          refreshing={list.isPlaceholderData}
          error={list.error}
          onRetry={() => void list.refetch()}
          dense
          pagination={
            list.data && {
              page: list.data.page,
              pageSize: list.data.pageSize,
              total: list.data.total,
              onPageChange: (p) => update({ page: String(p) }),
            }
          }
          empty={
            <EmptyState
              icon={Apple}
              title={t('foods.empty')}
              description={search || category ? undefined : t('foods.emptyHint')}
              action={
                canEdit && !search && !category ? (
                  <Button loading={install.isPending} onClick={installDefaults}>
                    {t('foods.installDefaults')}
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </Card>

      {editing && (
        <FoodFormModal food={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}
      {importing && <FoodImportModal onClose={() => setImporting(false)} />}
      <ConfirmDialog
        open={deleting !== null}
        title={t('foods.deleteTitle')}
        message={t('foods.deleteConfirm', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        danger
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success(t('foods.deleted'));
            },
            onError: (err) => toast.error(errorText(t, err)),
          })
        }
      />
    </>
  );
}
