import { useTranslation } from 'react-i18next';
import type { ClinicSettingsResponse, Locale } from '@clinic/shared';
import { useUpdateSettings } from '../../api/settings';
import { FormField } from '../../components/ui/FormField';
import { Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/useToast';
import { errorText } from '../../lib/errors';

/** Only Arabic is complete for now; French is listed but disabled until translated. */
const AVAILABLE: Record<Locale, boolean> = { ar: true, fr: false };

export function LanguageTab({
  settings,
  readOnly,
}: {
  settings: ClinicSettingsResponse;
  readOnly: boolean;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const update = useUpdateSettings();

  return (
    <div className="max-w-sm">
      <FormField
        id="s-locale"
        label={t('settings.language.label')}
        hint={t('settings.language.hint')}
      >
        <Select
          id="s-locale"
          value={settings.locale}
          disabled={readOnly || update.isPending}
          onChange={(e) =>
            update.mutate(
              { locale: e.target.value as Locale },
              {
                onSuccess: () => toast.success(t('common.saved')),
                onError: (err) => toast.error(errorText(t, err)),
              },
            )
          }
        >
          {(Object.keys(AVAILABLE) as Locale[]).map((l) => (
            <option key={l} value={l} disabled={!AVAILABLE[l]}>
              {t(`settings.language.${l}`)}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  );
}
