import { LayoutTemplate, Plus, Power, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatDateOnly, type DietPlanWithPatient, type Patient } from '@shared';
import {
  useActivatePlan,
  useDietPlans,
  useDuplicatePlan,
  usePatientPlans,
} from '../../api/dietPlans';
import { Button, ButtonLink } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormField } from '../../components/ui/FormField';
import { Checkbox, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { errorText } from '../../lib/errors';
import { useCanEditClinical } from '../../lib/roles';
import { useClinicToday } from '../../lib/useClinicToday';
import { PlanStatusBadge } from './PlanStatusBadge';

/** A patient's plans (newest first), on the patient page and in the dashboard panel. */
export function PatientPlansTab({ patient }: { patient: Patient }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const canEdit = useCanEditClinical();
  const plans = usePatientPlans(patient.id);
  const activate = useActivatePlan();
  const [applying, setApplying] = useState(false);

  const columns: Column<DietPlanWithPatient>[] = [
    {
      key: 'title',
      header: t('plans.columns.title'),
      cell: (p) => <span className="font-semibold text-gray-900">{p.title}</span>,
    },
    {
      key: 'kcal',
      header: t('plans.columns.calories'),
      cell: (p) => <span className="tabular-nums">{p.dailyCalories}</span>,
    },
    {
      key: 'period',
      header: t('plans.columns.period'),
      cell: (p) => (
        <span
          className="whitespace-nowrap"
          dir="ltr"
        >{`${formatDateOnly(p.startDate)} → ${formatDateOnly(p.endDate)}`}</span>
      ),
    },
    { key: 'status', header: t('plans.columns.status'), cell: (p) => <PlanStatusBadge plan={p} /> },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: t('common.actions'),
            headerClassName: 'text-end',
            cell: (p: DietPlanWithPatient) =>
              !p.isActive && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={activate.isPending && activate.variables === p.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      activate.mutate(p.id, {
                        onSuccess: () => toast.success(t('plans.activated')),
                        onError: (err) => toast.error(errorText(t, err)),
                      });
                    }}
                  >
                    <Power className="h-4 w-4" aria-hidden />
                    {t('plans.actions.activate')}
                  </Button>
                </div>
              ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setApplying(true)}>
            <LayoutTemplate className="h-4 w-4" aria-hidden />
            {t('plans.actions.fromTemplate')}
          </Button>
          <ButtonLink to={`/diet-plans/new?patientId=${patient.id}`}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('plans.new')}
          </ButtonLink>
        </div>
      )}
      <DataTable
        caption={t('plans.patientPlans')}
        columns={columns}
        rows={plans.data}
        rowKey={(p) => p.id}
        loading={plans.isPending}
        error={plans.error}
        onRetry={() => void plans.refetch()}
        onRowClick={(p) => navigate(`/diet-plans/${p.id}`)}
        dense
        empty={<EmptyState icon={UtensilsCrossed} title={t('plans.empty')} />}
      />
      {applying && <ApplyTemplateModal patient={patient} onClose={() => setApplying(false)} />}
    </div>
  );
}

function ApplyTemplateModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const today = useClinicToday();
  const templates = useDietPlans({ isTemplate: true, pageSize: 200 });
  const duplicate = useDuplicatePlan();
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [activateNow, setActivateNow] = useState(true);
  const list = templates.data?.data ?? [];

  return (
    <Modal
      open
      onClose={onClose}
      title={t('plans.applyTemplate')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!templateId}
            loading={duplicate.isPending}
            onClick={() =>
              duplicate.mutate(
                {
                  id: templateId,
                  patientId: patient.id,
                  isTemplate: false,
                  startDate,
                  activate: activateNow,
                },
                {
                  onSuccess: (plan) => {
                    toast.success(t('plans.applied'));
                    navigate(`/diet-plans/${plan.id}`);
                  },
                  onError: (err) => toast.error(errorText(t, err)),
                },
              )
            }
          >
            {t('plans.actions.apply')}
          </Button>
        </>
      }
    >
      {list.length === 0 && !templates.isPending ? (
        <p className="text-sm text-gray-600">{t('plans.noTemplates')}</p>
      ) : (
        <div className="space-y-4">
          <FormField id="tpl-choice" label={t('plans.chooseTemplate')} required>
            <Select
              id="tpl-choice"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">—</option>
              {list.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {`${tpl.title} · ${tpl.dailyCalories} ${t('common.kcal')} · ${t('plans.weeks', { count: tpl.durationWeeks })}`}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="tpl-start" label={t('plans.fields.startDate')} required>
            <DatePicker
              id="tpl-start"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={activateNow} onChange={(e) => setActivateNow(e.target.checked)} />
            {t('plans.activateNow')}
          </label>
        </div>
      )}
    </Modal>
  );
}
