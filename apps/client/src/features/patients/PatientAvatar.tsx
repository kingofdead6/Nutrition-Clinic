import type { Patient } from '@clinic/shared';
import { patientPhotoUrl } from '../../api/patients';
import female from '../../assets/avatar-female.svg';
import male from '../../assets/avatar-male.svg';
import { cn } from '../../lib/cn';

/** Uploaded photo, or a local default by gender (no remote images). */
export function PatientAvatar({
  patient,
  className,
}: {
  patient: Pick<Patient, 'id' | 'photoPath' | 'updatedAt' | 'gender'>;
  className?: string;
}) {
  const src = patientPhotoUrl(patient) ?? (patient.gender === 'female' ? female : male);
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={cn('h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-black/5', className)}
    />
  );
}
