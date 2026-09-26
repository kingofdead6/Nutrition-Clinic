import defaultLogo from '../../assets/logo.svg';
import { apiClient } from '../../lib/apiClient';
import { cn } from '../../lib/cn';

/** The uploaded clinic logo, or the bundled default (offline, no remote images). */
export function ClinicLogo({
  logoUrl,
  className,
}: {
  logoUrl: string | null | undefined;
  className?: string;
}) {
  return (
    <img
      src={logoUrl ? apiClient.url(logoUrl) : defaultLogo}
      alt=""
      className={cn('h-11 w-11 shrink-0 rounded-full object-contain', className)}
    />
  );
}
