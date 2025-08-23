import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MoneyInputProps {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MoneyInput({ value = 0, onChange, placeholder = "R$ 0,00", className, disabled }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const parseCurrency = (formatted: string): number => {
    const cleanedValue = formatted
      .replace(/[^\d,-]/g, '')
      .replace(',', '.');
    
    const numericValue = parseFloat(cleanedValue);
    return isNaN(numericValue) ? 0 : numericValue;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow clearing the input
    if (inputValue === '') {
      setDisplayValue('');
      onChange?.(0);
      return;
    }

    // Extract numbers and format
    const numbers = inputValue.replace(/[^\d]/g, '');
    if (numbers === '') {
      setDisplayValue('');
      onChange?.(0);
      return;
    }

    // Convert to cents and back to currency
    const cents = parseInt(numbers, 10);
    const amount = cents / 100;
    
    const formatted = formatCurrency(amount);
    setDisplayValue(formatted);
    onChange?.(amount);
  };

  const handleBlur = () => {
    if (displayValue === '') {
      setDisplayValue(formatCurrency(0));
      onChange?.(0);
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn("font-mono", className)}
      disabled={disabled}
    />
  );
}