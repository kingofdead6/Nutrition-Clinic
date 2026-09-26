import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStatus, useMe } from '../../api/auth';
import { LoadingBlock } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/States';

function useSession() {
  const status = useAuthStatus();
  const me = useMe();
  return {
    status,
    me,
    loading: status.isPending || me.isPending,
    error: status.error ?? me.error,
    retry: () => {
      void status.refetch();
      void me.refetch();
    },
  };
}

function FullPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">{children}</div>
  );
}

function useGate() {
  const { t } = useTranslation();
  const session = useSession();
  if (session.loading)
    return {
      session,
      gate: (
        <FullPage>
          <LoadingBlock label={t('common.loading')} />
        </FullPage>
      ),
    };
  if (session.error)
    return {
      session,
      gate: (
        <FullPage>
          <ErrorState error={session.error} onRetry={session.retry} />
        </FullPage>
      ),
    };
  return { session, gate: null };
}

/** Protected routes: first run → /setup, signed out → /login (remembering the target). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { session, gate } = useGate();
  if (gate) return gate;
  if (session.status.data?.setupRequired) return <Navigate to="/setup" replace />;
  if (!session.me.data) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

/** The login page: only for signed-out users of an already set-up clinic. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { session, gate } = useGate();
  if (gate) return gate;
  if (session.status.data?.setupRequired) return <Navigate to="/setup" replace />;
  if (session.me.data) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }
  return <>{children}</>;
}

/** The first-run page: only while no user exists. */
export function SetupOnly({ children }: { children: ReactNode }) {
  const { session, gate } = useGate();
  if (gate) return gate;
  if (!session.status.data?.setupRequired)
    return <Navigate to={session.me.data ? '/' : '/login'} replace />;
  return <>{children}</>;
}
