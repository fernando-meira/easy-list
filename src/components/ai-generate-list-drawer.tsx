'use client';

import { toast } from 'sonner';
import { useState, FormEvent } from 'react';

import { AiGeneratedList } from '@/types/interfaces';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ResponsiveProductDialog } from '@/components/responsive-product-dialog';

interface AiGenerateListDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onGenerated: (result: AiGeneratedList) => void;
}

export function AiGenerateListDrawer({
  open,
  onGenerated,
  onOpenChange,
}: AiGenerateListDrawerProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (isLoading) return;
    setPrompt('');
    onOpenChange?.(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/generate-list', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('API error');

      const result: AiGeneratedList = await response.json();

      setPrompt('');
      onOpenChange?.(false);
      onGenerated(result);
    } catch {
      toast.error('Não foi possível gerar a lista. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveProductDialog
      open={open}
      title="Criar lista com IA"
      description="Descreva o que você precisa e a IA monta a lista."
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
      footer={(
        <button
          type="submit"
          form="ai-generate-list-form"
          disabled={isLoading || !prompt.trim()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size={16} />
              Gerando sua lista...
            </>
          ) : (
            'Gerar lista →'
          )}
        </button>
      )}
    >
      <form id="ai-generate-list-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-[7px]">
          <span className="text-[13px] font-bold leading-[1.35] text-foreground">
            O que você precisa?
          </span>
          <textarea
            required
            value={prompt}
            disabled={isLoading}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: lista para festa de aniversário infantil para 20 crianças"
            className="h-24 w-full resize-none rounded-lg border border-input bg-background px-3.5 py-2.5 text-base font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
        </div>
      </form>
    </ResponsiveProductDialog>
  );
}
