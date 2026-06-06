'use client';
import { ShoppingCart } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CartToggleRowProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function CartToggleRow({ checked, onCheckedChange }: CartToggleRowProps) {
  return (
    <div className="flex h-14 items-center justify-between rounded-xl border border-border bg-background px-3.5">
      <div className="flex items-center gap-2.5">
        <ShoppingCart
          className="h-[22px] w-[22px] flex-shrink-0 transition-colors"
          style={{ color: checked ? '#10b981' : '#fb923c' }}
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-[750] leading-[1.35] text-foreground">
            {checked ? 'Produto no carrinho' : 'Adicionar direto ao carrinho'}
          </span>
          <span className="text-xs font-semibold leading-[1.35] text-muted-foreground">
            {checked ? 'Ativado' : 'Desativado por padrão'}
          </span>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? 'Produto no carrinho — ativado' : 'Adicionar direto ao carrinho — desativado'}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative flex h-[30px] w-[52px] flex-shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200',
          checked ? 'bg-[#10b981]' : 'bg-[#e5e7eb]'
        )}
      >
        <span
          className={cn(
            'h-6 w-6 flex-shrink-0 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
