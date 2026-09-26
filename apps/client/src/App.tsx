import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router-dom';
import { useAuthStatus } from './api/auth';
import { AppShell } from './components/layout/AppShell';
import { GuestOnly, RequireAuth, SetupOnly } from './features/auth/guards';
import { LoginPage } from './features/auth/LoginPage';
import { SetupPage } from './features/auth/SetupPage';
import { LoadingBlock } from './components/ui/Spinner';
import { NotFoundPage } from './pages/PlaceholderPages';

// Pages load on demand (charts etc. stay out of the first bundle).
const AppointmentsPage = lazy(() =>
  import('./features/appointments/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })),
);
const DashboardPage = lazy(() =>
  import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const DietPlansPage = lazy(() =>
  import('./features/plans/DietPlansPage').then((m) => ({ default: m.DietPlansPage })),
);
const PlanBuilderPage = lazy(() =>
  import('./features/plans/PlanBuilderPage').then((m) => ({ default: m.PlanBuilderPage })),
);
const BackupPage = lazy(() =>
  import('./features/backup/BackupPage').then((m) => ({ default: m.BackupPage })),
);
const FoodsPage = lazy(() =>
  import('./features/foods/FoodsPage').then((m) => ({ default: m.FoodsPage })),
);
const PrescriptionsPage = lazy(() =>
  import('./features/prescriptions/PrescriptionsPage').then((m) => ({
    default: m.PrescriptionsPage,
  })),
);
const IssuePrescriptionPage = lazy(() =>
  import('./features/prescriptions/IssuePrescriptionPage').then((m) => ({
    default: m.IssuePrescriptionPage,
  })),
);
const PrescriptionDetailPage = lazy(() =>
  import('./features/prescriptions/PrescriptionDetailPage').then((m) => ({
    default: m.PrescriptionDetailPage,
  })),
);
const PrintPrescriptionPage = lazy(() =>
  import('./features/print/PrintPages').then((m) => ({ default: m.PrintPrescriptionPage })),
);
const PrintDietPlanPage = lazy(() =>
  import('./features/print/PrintPages').then((m) => ({ default: m.PrintDietPlanPage })),
);
const PrintPatientSummaryPage = lazy(() =>
  import('./features/print/PrintPages').then((m) => ({ default: m.PrintPatientSummaryPage })),
);
const ReportsPage = lazy(() =>
  import('./features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const PrintPatientReportPage = lazy(() =>
  import('./features/reports/PatientReport').then((m) => ({ default: m.PrintPatientReportPage })),
);
const PatientDetailPage = lazy(() =>
  import('./features/patients/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })),
);
const PatientFormPage = lazy(() =>
  import('./features/patients/PatientFormPage').then((m) => ({ default: m.PatientFormPage })),
);
const PatientsListPage = lazy(() =>
  import('./features/patients/PatientsListPage').then((m) => ({ default: m.PatientsListPage })),
);
const ProfilePage = lazy(() =>
  import('./features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

/** Applies the clinic's configured interface language (and so the text direction). */
function useClinicLocale() {
  const { i18n } = useTranslation();
  const locale = useAuthStatus().data?.clinic.locale;
  useEffect(() => {
    if (locale && i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [locale, i18n]);
}

export function App() {
  useClinicLocale();

  const { t } = useTranslation();
  return (
    <Suspense fallback={<LoadingBlock label={t('common.loading')} />}>
      <Routes>
        <Route
          path="/setup"
          element={
            <SetupOnly>
              <SetupPage />
            </SetupOnly>
          }
        />
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        {/* Print views: signed in, but without sidebar/header (A4 sheets). */}
        <Route
          path="/print/prescription/:id"
          element={
            <RequireAuth>
              <PrintPrescriptionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/print/diet-plan/:id"
          element={
            <RequireAuth>
              <PrintDietPlanPage />
            </RequireAuth>
          }
        />
        <Route
          path="/print/patient/:id"
          element={
            <RequireAuth>
              <PrintPatientSummaryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/print/report/:id"
          element={
            <RequireAuth>
              <PrintPatientReportPage />
            </RequireAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsListPage />} />
          <Route path="patients/new" element={<PatientFormPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="patients/:id/edit" element={<PatientFormPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="diet-plans" element={<DietPlansPage />} />
          <Route path="diet-plans/new" element={<PlanBuilderPage />} />
          <Route path="diet-plans/:id" element={<PlanBuilderPage />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="prescriptions/new" element={<IssuePrescriptionPage />} />
          <Route path="prescriptions/:id" element={<PrescriptionDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="foods" element={<FoodsPage />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
