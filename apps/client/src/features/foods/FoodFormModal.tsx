import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FOOD_CATEGORIES,
  foodCreateSchema,
  SERVING_UNITS,
  type Food,
  type FoodFormValues,
} from '@clinic/shared';
import { useCreateFood, useUpdateFood } from '../../api/foods';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/useToast';
import { applyServerErrors, errorText } from '../../lib/errors';

type NumberKey = 'servingSize' | 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG';
const toNumber = (v: unknown) => (v === '' || v == null ? undefined : Number(v));

export function FoodFormModal({ food, onClose }: { food: Food | null; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const create = useCreateFood();
  const update = useUpdateFood();
  const mutation = food ? update : create;
  const defaults: FoodFormValues = food
    ? {
        name: food.name,
        nameFr: food.nameFr,
        category: food.category,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        fiberG: food.fiberG,
      }
    : {
        name: '',
        nameFr: '',
        category: 'traditional',
        servingSize: 100,
        servingUnit: 'g',
        calories: Number.NaN,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
      };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(foodCreateSchema), defaultValues: defaults });

  const onSubmit = handleSubmit((values) => {
    const done = {
      onSuccess: () => {
        toast.success(t(food ? 'foods.updated' : 'foods.created'));
        onClose();
      },
      onError: (err: unknown) => {
        if (!applyServerErrors(err, setError)) toast.error(errorText(t, err));
      },
    };
    if (food) update.mutate({ id: food.id, ...values }, done);
    else create.mutate(values, done);
  });

  const numberField = (key: NumberKey, step = '0.1', required = false) => (
    <FormField
      id={`food-${key}`}
      label={t(`foods.fields.${key}`)}
      error={errors[key]?.message}
      required={required}
    >
      <Input
        id={`food-${key}`}
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        ltr
        invalid={!!errors[key]}
        {...register(key, { setValueAs: toNumber })}
      />
    </FormField>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={food ? t('foods.edit') : t('foods.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="food-form" loading={mutation.isPending}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id="food-form" onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="food-name"
            label={t('foods.fields.name')}
            error={errors.name?.message}
            required
          >
            <Input id="food-name" autoFocus invalid={!!errors.name} {...register('name')} />
          </FormField>
          <FormField
            id="food-nameFr"
            label={t('foods.fields.nameFr')}
            error={errors.nameFr?.message}
            optional
          >
            <Input id="food-nameFr" ltr {...register('nameFr')} />
          </FormField>
          <FormField id="food-category" label={t('foods.fields.category')} required>
            <Select id="food-category" {...register('category')}>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`enums.foodCategory.${c}`)}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            {numberField('servingSize', '1', true)}
            <FormField id="food-unit" label={t('foods.fields.servingUnit')} required>
              <Select id="food-unit" {...register('servingUnit')}>
                {SERVING_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {t(`enums.servingUnit.${u}`)}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>
        <fieldset>
          <legend className="mb-3 text-sm font-bold text-gray-900">{t('foods.perServing')}</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            {numberField('calories', '1', true)}
            {numberField('proteinG')}
            {numberField('carbsG')}
            {numberField('fatG')}
            {numberField('fiberG')}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
