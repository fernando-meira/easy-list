'use client';

import { useEffect, useMemo, useState } from 'react';

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

  // Usando useMemo para pegar o valor atual do formulário
  const formValue = useMemo(() => props.form.getValues(props.name), [props.form, props.name]);

  // Atualiza o valor do inputValue quando o valor do formulário for alterado
  useEffect(() => {
    // Verifica se o valor do formulário mudou e atualiza o inputValue, se necessário
    if (formValue !== undefined && formValue !== inputValue) {
      setInputValue(formatCurrency(Number(formValue)));
    }
  }, [formValue, inputValue]); // Agora, depende apenas de formValue e inputValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Remove qualquer caractere não numérico
    const numericValue = (Number(rawValue) / 100).toFixed(2); // Converte para centavos
    setInputValue(rawValue); // Atualiza o estado local
    props.form.setValue(props.name, numericValue, { shouldValidate: true }); // Atualiza o valor no formulário
  };

  const handleBlur = () => {
    if (inputValue) {
      const formattedValue = formatCurrency(Number(inputValue) / 100); // Formata como moeda
      setInputValue(formattedValue);
    }
  };

  const handleFocus = () => {
    const currentValue = props.form.getValues(props.name);
    if (currentValue) {
      setInputValue((Number(currentValue) * 100).toString()); // Exibe o valor sem o formato de moeda
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
