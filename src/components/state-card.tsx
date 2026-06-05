'use client';

import { useRouter } from 'next/navigation';
import { PackagePlus, TriangleAlert } from 'lucide-react';

interface StateCardProps {
  variant: 'empty' | 'error';
  onAdd?: () => void;
}

export function StateCard({ variant, onAdd }: StateCardProps) {
  const router = useRouter();
  const isEmpty = variant === 'empty';

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] border border-[var(--color-hairline)] p-3">
      {isEmpty
        ? <PackagePlus className="w-5 h-5 text-[var(--color-success)]" />
        : <TriangleAlert className="w-5 h-5 text-[var(--color-error)]" />}

      <p className="text-[12px] font-semibold text-[var(--color-ink)]">
        {isEmpty
          ? 'Nenhum produto nesta categoria ainda.'
          : 'Não encontramos essa categoria.'}
      </p>

      <button
        onClick={isEmpty ? onAdd : () => router.push('/')}
        className="text-[12px] font-semibold text-[var(--color-ink)] text-left"
      >
        {isEmpty ? 'Adicionar primeiro produto' : 'Voltar para Home'}
      </button>
    </div>
  );
}
