import {
  CheckCircle2,
  Copy,
  LayoutTemplate,
  Plus,
  Power,
  PowerOff,
  Printer,
  Save,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  DEFAULT_MACROS,
  dietPlanCreateSchema,
  formatDateOnly,
  macroGrams,
  MEAL_TYPES,
  PATIENT_GOALS,
  planEndDate,
  type DietPlanWithPatient,
  type MealType,
  type PatientGoal,
} from '@shared';
import {
  useActivatePlan,
  useCreatePlan,
  useDeactivatePlan,
  useDeletePlan,
  useDietPlan,
  useDuplicatePlan,
  useUpdatePlan,
} from '../../api/dietPlans';
import { usePatient } from '../../api/patients';
import { Button } from '../../components/ui/Button';
import { Card, CardTitle } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormField } from '../../components/ui/FormField';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { LoadingBlock } from '../../components/ui/Spinner';
import { Alert, ErrorState, InfoNote } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { cn } from '../../lib/cn';
import { errorText, translateMessage } from '../../lib/errors';
import { openPrint } from '../../lib/print';
import { useCanEditClinical } from '../../lib/roles';
import { useClinicToday } from '../../lib/useClinicToday';
import { PatientCombobox } from '../appointments/PatientCombobox';
import { CalorieSuggestion } from './CalorieSuggestion';
import { MealEditor } from './MealEditor';
import {
  copyDayToAll,
  dayStateTotals,
  emptyPlan,
  newMeal,
  planToState,
  stateToInput,
  toDaily,
  toWeekly,
  type DayState,
  type PlanState,
} from './planState';
import { TargetMeters } from './TargetMeters';

/** `/diet-plans/new[?patientId=…|?template=1]` and `/diet-plans/:id`. */
export function PlanBuilderPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [params] = useSearchParams();
  const today = useClinicToday();
  const plan = useDietPlan(id);
  const presetPatientId = params.get('patientId') ?? undefined;
  const preset = usePatient(id ? undefined : presetPatientId);

  if (id) {
    if (plan.isPending) return <LoadingBlock label={t('common.loading')} />;
    if (plan.isError) return <ErrorState error={plan.error} onRetry={() => void plan.refetch()} />;
    return <PlanBuilder key={plan.data.id} plan={plan.data} initial={planToState(plan.data)} />;
  }
  if (presetPatientId && preset.isPending) return <LoadingBlock label={t('common.loading')} />;
  const p = preset.data;
  return (
    <PlanBuilder
      initial={emptyPlan({
        patient: p
          ? { id: p.id, fullName: p.fullName, fileNumber: p.fileNumber, phone: p.phone }
          : null,
        goal: p?.goal,
        startDate: today,
        isTemplate: params.get('template') === '1',
      })}
    />
  );
}

function PlanBuilder({ initial, plan }: { initial: PlanState; plan?: DietPlanWithPatient }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const canEdit = useCanEditClinical();
  const readOnly = !canEdit;
  const [s, setS] = useState<PlanState>(initial);
  const [dayIndex, setDayIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [newMealType, setNewMealType] = useState<MealType>('morning_snack');
  const [confirm, setConfirm] = useState<'delete' | 'toDaily' | null>(null);

  const create = useCreatePlan();
  const update = useUpdatePlan();
  const activate = useActivatePlan();
  const deactivate = useDeactivatePlan();
  const duplicate = useDuplicatePlan();
  const remove = useDeletePlan();
  const saving = create.isPending || update.isPending || activate.isPending;

  const set = <K extends keyof PlanState>(key: K, value: PlanState[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));
  const weekly = s.days.length > 1 || s.days[0]?.day !== 'daily';
  const day = s.days[Math.min(dayIndex, s.days.length - 1)] as DayState;
  const setDay = (next: DayState) =>
    setS((prev) => ({ ...prev, days: prev.days.map((d) => (d.day === next.day ? next : d)) }));
  const totals = dayStateTotals(day);
  const macroSum = s.macroTargets.proteinPct + s.macroTargets.carbsPct + s.macroTargets.fatPct;
  const grams = macroGrams(s.dailyCalories || 0, s.macroTargets);
  const endDate =
    s.startDate && s.durationWeeks > 0 ? planEndDate(s.startDate, s.durationWeeks) : null;

  const title = plan
    ? plan.isTemplate
      ? t('plans.templateTitle')
      : t('plans.editTitle')
    : s.isTemplate
      ? t('plans.newTemplate')
      : t('plans.newTitle');

  /** Validates with the shared schema; returns the payload or shows the problems. */
  const validated = (activateNow: boolean) => {
    const parsed = dietPlanCreateSchema.safeParse({ ...stateToInput(s), activate: activateNow });
    const problems = parsed.success
      ? []
      : parsed.error.issues.map((i) => `${i.path.join('.')}: ${translateMessage(t, i.message)}`);
    if (!s.isTemplate && !s.patient)
      problems.unshift(`${t('plans.fields.patient')}: ${t('validation.required')}`);
    setErrors(problems);
    return problems.length === 0 && parsed.success ? parsed.data : null;
  };

  const onError = (err: unknown) => toast.error(errorText(t, err));

  const save = (activateNow: boolean) => {
    const input = validated(activateNow);
    if (!input) return toast.error(t('plans.invalid'));
    if (!plan) {
      create.mutate(input, {
        onSuccess: (saved) => {
          toast.success(t('plans.created'));
          navigate(`/diet-plans/${saved.id}`, { replace: true });
        },
        onError,
      });
      return;
    }
    const { activate: _a, ...patch } = input;
    update.mutate(
      { id: plan.id, ...patch },
      {
        onSuccess: (saved) => {
          if (activateNow && !saved.isActive) {
            activate.mutate(saved.id, {
              onSuccess: () => toast.success(t('plans.activated')),
              onError,
            });
          } else {
            toast.success(t('plans.updated'));
          }
        },
        onError,
      },
    );
  };

  const switchToWeekly = () => {
    setS((prev) => ({ ...prev, days: toWeekly(prev.days[0] as DayState) }));
    setDayIndex(0);
  };
  const switchToDaily = () => {
    setS((prev) => ({ ...prev, days: toDaily(day) }));
    setDayIndex(0);
    setConfirm(null);
  };

  return (
    <>
      <PageHeader
        title={title}
        subtitle={plan?.patient ? `${plan.patient.fullName} · ${plan.title}` : undefined}
        actions={
          plan?.isActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-green px-3 py-1 text-sm font-bold text-status-green">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {t('plans.activeBadge')}
            </span>
          )
        }
      />
      {readOnly && (
        <div className="mb-4">
          <InfoNote>{t('plans.readOnly')}</InfoNote>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardTitle>{t('plans.sections.general')}</CardTitle>
          <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
            {!s.isTemplate && (
              <FormField
                id="plan-patient"
                label={t('plans.fields.patient')}
                required
                className="sm:col-span-2"
              >
                <PatientCombobox
                  id="plan-patient"
                  value={s.patient}
                  disabled={readOnly}
                  onChange={(p) => set('patient', p)}
                />
              </FormField>
            )}
            <FormField
              id="plan-title"
              label={t('plans.fields.title')}
              required
              className="sm:col-span-2"
            >
              <Input
                id="plan-title"
                value={s.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </FormField>
            <FormField id="plan-goal" label={t('plans.fields.goal')}>
              <Select
                id="plan-goal"
                value={s.goal}
                onChange={(e) => set('goal', e.target.value as PatientGoal)}
              >
                {PATIENT_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {t(`enums.goal.${g}`)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="plan-start" label={t('plans.fields.startDate')} required>
              <DatePicker
                id="plan-start"
                value={s.startDate}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </FormField>
            <FormField id="plan-weeks" label={t('plans.fields.durationWeeks')} required>
              <Input
                id="plan-weeks"
                type="number"
                min={1}
                max={104}
                ltr
                value={Number.isFinite(s.durationWeeks) ? s.durationWeeks : ''}
                onChange={(e) =>
                  set('durationWeeks', e.target.value === '' ? Number.NaN : Number(e.target.value))
                }
              />
            </FormField>
            <FormField id="plan-end" label={t('plans.fields.endDate')}>
              <Input
                id="plan-end"
                readOnly
                ltr
                value={endDate ? formatDateOnly(endDate) : '—'}
                className="bg-gray-50"
              />
            </FormField>
            <FormField
              id="plan-notes"
              label={t('plans.fields.notes')}
              optional
              className="sm:col-span-2"
            >
              <Textarea
                id="plan-notes"
                rows={2}
                value={s.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </FormField>
          </fieldset>
        </Card>

        <Card>
          <CardTitle>{t('plans.sections.targets')}</CardTitle>
          <fieldset disabled={readOnly} className="space-y-4">
            <FormField id="plan-kcal" label={t('plans.fields.dailyCalories')} required>
              <Input
                id="plan-kcal"
                type="number"
                min={600}
                max={6000}
                step={50}
                ltr
                value={Number.isFinite(s.dailyCalories) ? s.dailyCalories : ''}
                onChange={(e) =>
                  set('dailyCalories', e.target.value === '' ? Number.NaN : Number(e.target.value))
                }
              />
            </FormField>
            <div className="grid grid-cols-3 gap-2">
              {(['proteinPct', 'carbsPct', 'fatPct'] as const).map((k) => (
                <FormField key={k} id={`plan-${k}`} label={t(`plans.fields.${k}`)}>
                  <Input
                    id={`plan-${k}`}
                    type="number"
                    min={0}
                    max={100}
                    ltr
                    value={s.macroTargets[k]}
                    onChange={(e) =>
                      set('macroTargets', { ...s.macroTargets, [k]: Number(e.target.value) })
                    }
                  />
                  <p className="text-xs text-gray-500" dir="ltr">
                    {t('plans.macroGrams', {
                      g: grams[k.replace('Pct', 'G') as 'proteinG' | 'carbsG' | 'fatG'],
                    })}
                  </p>
                </FormField>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span
                className={cn(
                  'font-semibold',
                  macroSum === 100 ? 'text-green-800' : 'text-red-700',
                )}
              >
                {t('plans.macrosSum', { sum: macroSum })}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => set('macroTargets', { ...DEFAULT_MACROS[s.goal] })}
              >
                {t('plans.suggestion.defaultMacros')}
              </Button>
            </div>
            {!s.isTemplate && (
              <CalorieSuggestion
                patientId={s.patient?.id}
                goal={s.goal}
                onUse={(kcal) => set('dailyCalories', kcal)}
              />
            )}
          </fieldset>
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle>{t('plans.sections.meals')}</CardTitle>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div
            role="radiogroup"
            aria-label={t('plans.mode.label')}
            className="inline-flex rounded-lg bg-gray-100 p-1"
          >
            {(['daily', 'weekly'] as const).map((mode) => {
              const selected = (mode === 'weekly') === weekly;
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={readOnly}
                  onClick={() =>
                    selected
                      ? undefined
                      : mode === 'weekly'
                        ? switchToWeekly()
                        : setConfirm('toDaily')
                  }
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-semibold',
                    selected
                      ? 'bg-white text-brand-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  {t(`plans.mode.${mode}`)}
                </button>
              );
            })}
          </div>
          {weekly && !readOnly && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setS((prev) => ({ ...prev, days: copyDayToAll(prev.days, day) }));
                toast.success(t('plans.mode.copied'));
              }}
            >
              <Copy className="h-4 w-4" aria-hidden />
              {t('plans.mode.copyToAll')}
            </Button>
          )}
        </div>

        {weekly && (
          <div
            role="tablist"
            aria-label={t('plans.mode.weekly')}
            className="mb-4 flex flex-wrap gap-1 border-b border-gray-200"
          >
            {s.days.map((d, i) => {
              const selected = i === dayIndex;
              return (
                <button
                  key={d.day}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setDayIndex(i)}
                  className={cn(
                    '-mb-px border-b-2 px-3 py-2 text-sm font-semibold',
                    selected
                      ? 'border-brand-700 text-brand-800'
                      : 'border-transparent text-gray-500 hover:text-gray-800',
                  )}
                >
                  {t(`enums.weekday.${d.day as 'sat'}`)}
                  <span className="ms-1 text-xs font-normal text-gray-400">
                    {Math.round(dayStateTotals(d).calories)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Live totals of the day being edited vs the targets. */}
        <div className="sticky top-16 z-10 -mx-5 mb-4 border-y border-gray-100 bg-white/95 px-5 py-3 backdrop-blur">
          <p className="mb-2 text-xs font-bold text-gray-700">
            {t('plans.dayTotal')}
            {weekly && ` — ${t(`enums.weekday.${day.day as 'sat'}`)}`}
          </p>
          <TargetMeters
            totals={totals}
            dailyCalories={s.dailyCalories}
            macroTargets={s.macroTargets}
          />
        </div>

        <div className="space-y-3">
          {day.meals.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">{t('plans.noMeals')}</p>
          )}
          {day.meals.map((meal, i) => (
            <MealEditor
              key={meal.key}
              meal={meal}
              index={i}
              count={day.meals.length}
              readOnly={readOnly}
              onChange={(m) =>
                setDay({ ...day, meals: day.meals.map((x) => (x.key === m.key ? m : x)) })
              }
              onRemove={() =>
                setDay({ ...day, meals: day.meals.filter((x) => x.key !== meal.key) })
              }
              onMove={(delta) => {
                const meals = [...day.meals];
                const [moved] = meals.splice(i, 1);
                if (moved) meals.splice(i + delta, 0, moved);
                setDay({ ...day, meals });
              }}
            />
          ))}
        </div>

        {!readOnly && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Select
              aria-label={t('plans.mealType')}
              value={newMealType}
              onChange={(e) => setNewMealType(e.target.value as MealType)}
              className="w-56"
            >
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>
                  {t(`enums.mealType.${m}`)}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={() => setDay({ ...day, meals: [...day.meals, newMeal(newMealType)] })}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('plans.addMeal')}
            </Button>
          </div>
        )}
      </Card>

      {errors.length > 0 && (
        <Alert className="mt-4">
          <ul className="list-inside list-disc space-y-0.5">
            {errors.slice(0, 8).map((e) => (
              <li key={e} dir="auto">
                {e}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {canEdit && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap gap-2 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
          <Button loading={saving} onClick={() => save(false)}>
            <Save className="h-4 w-4" aria-hidden />
            {t('plans.actions.save')}
          </Button>
          {!s.isTemplate && !plan?.isActive && (
            <Button variant="secondary" loading={saving} onClick={() => save(true)}>
              <Power className="h-4 w-4" aria-hidden />
              {t('plans.actions.saveActivate')}
            </Button>
          )}
          {plan && (
            <>
              {plan.isActive && (
                <Button
                  variant="secondary"
                  loading={deactivate.isPending}
                  onClick={() =>
                    deactivate.mutate(plan.id, {
                      onSuccess: () => toast.success(t('plans.deactivated')),
                      onError,
                    })
                  }
                >
                  <PowerOff className="h-4 w-4" aria-hidden />
                  {t('plans.actions.deactivate')}
                </Button>
              )}
              <Button
                variant="ghost"
                loading={duplicate.isPending}
                onClick={() =>
                  duplicate.mutate(
                    {
                      id: plan.id,
                      title: `${plan.title} ${t('plans.copySuffix')}`,
                      isTemplate: plan.isTemplate,
                    },
                    {
                      onSuccess: (copy) => {
                        toast.success(t('plans.duplicated'));
                        navigate(`/diet-plans/${copy.id}`);
                      },
                      onError,
                    },
                  )
                }
              >
                <Copy className="h-4 w-4" aria-hidden />
                {t('plans.actions.duplicate')}
              </Button>
              {!plan.isTemplate && (
                <Button
                  variant="ghost"
                  loading={duplicate.isPending}
                  onClick={() =>
                    duplicate.mutate(
                      { id: plan.id, isTemplate: true },
                      { onSuccess: () => toast.success(t('plans.templateSaved')), onError },
                    )
                  }
                >
                  <LayoutTemplate className="h-4 w-4" aria-hidden />
                  {t('plans.actions.saveTemplate')}
                </Button>
              )}
              <Button variant="ghost" onClick={() => openPrint(`/print/diet-plan/${plan.id}`)}>
                <Printer className="h-4 w-4" aria-hidden />
                {t('plans.actions.print')}
              </Button>
              <Button
                variant="ghost"
                className="ms-auto text-red-700 hover:bg-red-50"
                onClick={() => setConfirm('delete')}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('plans.actions.delete')}
              </Button>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirm === 'toDaily'}
        title={t('plans.mode.daily')}
        message={t('plans.mode.toDailyConfirm', {
          day: t(`enums.weekday.${(day.day === 'daily' ? 'sat' : day.day) as 'sat'}`),
        })}
        onCancel={() => setConfirm(null)}
        onConfirm={switchToDaily}
      />
      {plan && (
        <ConfirmDialog
          open={confirm === 'delete'}
          title={t('plans.actions.delete')}
          message={t('plans.deleteConfirm', { title: plan.title })}
          confirmLabel={t('common.delete')}
          danger
          loading={remove.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() =>
            remove.mutate(plan.id, {
              onSuccess: () => {
                toast.success(t('plans.deleted'));
                navigate(
                  plan.patientId
                    ? `/patients/${plan.patientId}?tab=dietPlans`
                    : '/diet-plans?tab=templates',
                  { replace: true },
                );
              },
              onError,
            })
          }
        />
      )}
    </>
  );
}
