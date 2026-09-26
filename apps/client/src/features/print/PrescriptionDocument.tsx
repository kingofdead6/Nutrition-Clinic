import { useTranslation } from 'react-i18next';
import { ageOn, type PrescriptionPreview } from '@shared';
import { RichTextView } from '../../components/ui/RichText';
import { Letterhead, PrintFooter } from './PrintLayout';

export interface RxPatient {
  fullName: string;
  fileNumber: string;
  birthDate: string;
}

/**
 * The prescription page: letterhead, patient line, body, recommendations, foods to
 * favor / avoid, signature. Used by the print route and the on-screen preview.
 */
export function PrescriptionDocument({
  doc,
  patient,
}: {
  doc: PrescriptionPreview;
  patient: RxPatient | null;
}) {
  const { t } = useTranslation();
  return (
    <article>
      <Letterhead date={doc.date} />

      {patient && (
        <div className="mb-4 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-gray-50 px-4 py-2 text-sm print:bg-gray-50">
          <span>
            <span className="text-gray-500">{t('print.patient')}: </span>
            <b>{patient.fullName}</b>
          </span>
          <span>
            <span className="text-gray-500">{t('print.age')}: </span>
            <b>{`${ageOn(patient.birthDate, doc.date)} ${t('common.years')}`}</b>
          </span>
          <span>
            <span className="text-gray-500">{t('print.fileNumber')}: </span>
            <b dir="ltr">{patient.fileNumber}</b>
          </span>
        </div>
      )}

      <h1 className="mb-3 text-center text-lg font-extrabold text-brand-900">{doc.title}</h1>
      <RichTextView html={doc.renderedContent} className="mb-4" />

      {doc.recommendations.length > 0 && (
        <section className="mb-4 break-inside-avoid">
          <h2 className="mb-1 text-sm font-bold text-brand-900">{t('print.recommendations')}</h2>
          <ul className="list-disc space-y-0.5 ps-6">
            {doc.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {(doc.foodsToFavor.length > 0 || doc.foodsToAvoid.length > 0) && (
        <div className="mb-4 grid break-inside-avoid grid-cols-2 gap-4">
          <section className="rounded-lg border border-green-200 p-3">
            <h2 className="mb-1 text-sm font-bold text-green-800">✓ {t('print.foodsToFavor')}</h2>
            <ul className="list-disc space-y-0.5 ps-5">
              {doc.foodsToFavor.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-red-200 p-3">
            <h2 className="mb-1 text-sm font-bold text-red-800">✗ {t('print.foodsToAvoid')}</h2>
            <ul className="list-disc space-y-0.5 ps-5">
              {doc.foodsToAvoid.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <div className="mt-10 flex break-inside-avoid justify-end">
        <div className="w-56 text-center">
          <div className="h-16" />
          <p className="border-t border-gray-400 pt-1 text-xs text-gray-600">
            {t('print.signature')}
          </p>
        </div>
      </div>
      <PrintFooter />
    </article>
  );
}
