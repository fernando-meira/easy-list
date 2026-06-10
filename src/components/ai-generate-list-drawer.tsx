'use client';

import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useState, FormEvent } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';
import { AiGeneratedList } from '@/types/interfaces';
import { LoadingSpinner } from '@/components/loading-spinner';

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
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <DrawerPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col',
            'rounded-t-2xl bg-background outline-none',
            'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]',
            'sm:mx-auto sm:max-w-[460px] sm:rounded-2xl sm:mb-6'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex flex-col gap-4 px-5 pb-4 pt-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DrawerPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  Criar lista com IA
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  Descreva o que você precisa e a IA monta a lista.
                </DrawerPrimitive.Description>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={handleClose}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

              <div className="flex flex-col gap-2.5">
                <button
                  type="submit"
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
              </div>
            </form>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
