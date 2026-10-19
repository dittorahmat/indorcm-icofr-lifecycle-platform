// The six TOD P-I-L-A-R/evidence areas of the verification dialog, as data.
// They were six copies of the same FormField — only the name and the label
// differed — which is what kept VerificationEditDialog.tsx past the 400-LOC soft
// limit. The parent owns the names (they come from its own form type), so
// FieldPath<T> stays honest without a cast.
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

export interface VerificationTextField<T extends FieldValues> {
  name: FieldPath<T>;
  /** Already translated: the parent's `t()` call keeps the key static for check:i18n. */
  label: string;
}

export function VerificationPilarFields<T extends FieldValues>({
  control,
  fields,
}: {
  control: Control<T>;
  fields: readonly VerificationTextField<T>[];
}) {
  const { t } = useTranslation(['common']);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map(({ name, label }) => (
        <FormField
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('common:placeholders.description')}
                  {...field}
                  className="h-20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
