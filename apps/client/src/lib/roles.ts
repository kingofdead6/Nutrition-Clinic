import { useMe } from '../api/auth';

/** Foods and diet plans are clinical data: admins and nutritionists edit, assistants read. */
export function useCanEditClinical(): boolean {
  const role = useMe().data?.role;
  return role === 'admin' || role === 'nutritionist';
}
