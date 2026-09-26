import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { USER_ROLES, userCreateSchema, type User } from '@shared';
import { useMe } from '../../api/auth';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '../../api/users';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FormField } from '../../components/ui/FormField';
import { Checkbox, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { LoadingBlock } from '../../components/ui/Spinner';
import { Alert, EmptyState, ErrorState } from '../../components/ui/States';
import { useToast } from '../../components/ui/useToast';
import { cn } from '../../lib/cn';
import { applyServerErrors, errorText } from '../../lib/errors';

/** Editing: an empty password means "keep the current one". */
const editSchema = userCreateSchema.extend({
  password: z
    .string()
    .refine((v) => v === '' || v.length >= 8, { error: 'validation.passwordMin' }),
});

export function UsersTab() {
  const { t } = useTranslation();
  const toast = useToast();
  const users = useUsers();
  const meId = useMe().data?.id;
  const remove = useDeleteUser();
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  if (users.isPending) return <LoadingBlock label={t('common.loading')} />;
  if (users.isError) return <ErrorState error={users.error} onRetry={() => void users.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('users.add')}
        </Button>
      </div>

      {users.data.length === 0 ? (
        <EmptyState title={t('users.empty')} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {(['name', 'email', 'role', 'status'] as const).map((col) => (
                  <th key={col} scope="col" className="px-4 py-2.5 text-start font-semibold">
                    {t(`users.${col}`)}
                  </th>
                ))}
                <th scope="col" className="px-4 py-2.5 text-end font-semibold">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.data.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    {u.name}{' '}
                    {u.id === meId && (
                      <span className="text-xs text-gray-500">{t('users.you')}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5" dir="ltr">
                    <span className="block text-end">{u.email}</span>
                  </td>
                  <td className="px-4 py-2.5">{t(`enums.role.${u.role}`)}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        u.isActive
                          ? 'bg-pastel-green text-status-green'
                          : 'bg-gray-100 text-status-gray',
                      )}
                    >
                      {u.isActive ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(u)}
                        aria-label={`${t('common.edit')} ${u.name}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      {u.id !== meId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-700 hover:bg-red-50"
                          onClick={() => setDeleting(u)}
                          aria-label={`${t('common.delete')} ${u.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <UserFormModal
          user={editing === 'new' ? null : editing}
          isSelf={editing !== 'new' && editing.id === meId}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={t('users.deleteTitle')}
        message={t('users.deleteConfirm', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        danger
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              setDeleting(null);
              toast.success(t('users.deleted'));
            },
            onError: (err) => toast.error(errorText(t, err)),
          })
        }
      />
    </div>
  );
}

function UserFormModal({
  user,
  isSelf,
  onClose,
}: {
  user: User | null;
  isSelf: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const create = useCreateUser();
  const update = useUpdateUser();
  const mutation = user ? update : create;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(user ? editSchema : userCreateSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      role: user?.role ?? 'nutritionist',
      isActive: user?.isActive ?? true,
    },
  });

  const onSubmit = handleSubmit((values) => {
    const done = {
      onSuccess: () => {
        toast.success(t(user ? 'users.updated' : 'users.created'));
        onClose();
      },
      onError: (err: unknown) => {
        applyServerErrors(err, setError);
      },
    };
    if (user) {
      const { password, ...rest } = values;
      update.mutate({ id: user.id, ...rest, ...(password ? { password } : {}) }, done);
    } else {
      create.mutate(values, done);
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={user ? t('users.edit') : t('users.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="user-form" loading={mutation.isPending}>
            {user ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={onSubmit} noValidate className="space-y-4">
        {mutation.error && !(errors.email || errors.name) && (
          <Alert>{errorText(t, mutation.error)}</Alert>
        )}
        <FormField id="u-name" label={t('users.name')} error={errors.name?.message} required>
          <Input id="u-name" autoFocus invalid={!!errors.name} {...register('name')} />
        </FormField>
        <FormField id="u-email" label={t('users.email')} error={errors.email?.message} required>
          <Input id="u-email" type="email" ltr invalid={!!errors.email} {...register('email')} />
        </FormField>
        <FormField
          id="u-password"
          label={t('users.password')}
          hint={user ? t('users.passwordKeep') : t('auth.setup.passwordHint')}
          error={errors.password?.message}
          required={!user}
        >
          <PasswordInput
            id="u-password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>
        <FormField id="u-role" label={t('users.role')} error={errors.role?.message}>
          <Select id="u-role" {...register('role')}>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`enums.role.${r}`)}
              </option>
            ))}
          </Select>
        </FormField>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <Checkbox disabled={isSelf} {...register('isActive')} />
          {t('users.isActive')}
        </label>
      </form>
    </Modal>
  );
}
