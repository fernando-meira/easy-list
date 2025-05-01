'use client';

import React, { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormRegisterReturn } from 'react-hook-form';

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  label?: string;
  value?: string;
  register?: UseFormRegisterReturn;
  onValueChange?: (value: string) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  register,
  onValueChange,
  value: propValue,
  id = 'currency-input',
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  const formatAsCurrency = (value: string): string => {
    // Garantir que o valor seja uma string
    const valueStr = String(value || '');
    const numericValue = valueStr.replace(/\D/g, '');

    const floatValue = parseInt(numericValue || '0', 10) / 100;

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(floatValue);
  };

  const extractNumericValue = (formattedValue: string): string => {
    // Garantir que o valor seja uma string
    const valueStr = String(formattedValue || '');
    return valueStr.replace(/\D/g, '');
  };

  useEffect(() => {
    if (propValue) {
      setDisplayValue(formatAsCurrency(propValue));
    }
  }, [propValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = extractNumericValue(rawValue);

    setDisplayValue(formatAsCurrency(numericValue));

    if (onValueChange) {
      const valueInReais = (parseInt(numericValue || '0', 10) / 100).toFixed(2);
      onValueChange(valueInReais);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    setTimeout(() => {
      input.selectionStart = input.value.length;
      input.selectionEnd = input.value.length;
    }, 0);
  };

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        className="text-right"
        {...props}
        {...(register && register)}
      />
    </div>
  );
};
