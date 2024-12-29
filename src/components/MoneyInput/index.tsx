'use client';

import { useEffect, useState } from 'react';

import { formatCurrency } from '@/utils';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type MoneyInputProps = {
  name: string;
  label: string;
  placeholder?: string;
  value?: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
};

export const MoneyInput = (props: MoneyInputProps) => {
  const [inputValue, setInputValue] = useState<string>(props.value ? formatCurrency(Number(props.value)) : '');

  useEffect(() => {
    const formValue = props.form.getValues(props.name);

    if (formValue !== undefined && formValue !== inputValue) {
      setInputValue(formatCurrency(Number(formValue)));
    }
  }, [props.form, props.name, props.form.getValues(props.name), inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = (Number(rawValue) / 100).toFixed(2);
    setInputValue(rawValue);
    props.form.setValue(props.name, numericValue, { shouldValidate: true });
  };

  const handleBlur = () => {
    if (inputValue) {
      const formattedValue = formatCurrency(Number(inputValue) / 100);
      setInputValue(formattedValue);
    }
  };

  const handleFocus = () => {
    const currentValue = props.form.getValues(props.name);
    if (currentValue) {
      setInputValue((Number(currentValue) * 100).toString()); // Exibir em formato sem a moeda
    }
  };

  return (
    <FormField
      name={props.name}
      control={props.form.control}
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormLabel>{props.label}</FormLabel>
          <FormControl>
            <Input
              type="text"
              name={field.name}
              value={inputValue}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onChange={handleChange}
              placeholder={props.placeholder}
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};
