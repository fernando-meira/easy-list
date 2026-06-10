'use client';

/* eslint-disable @next/next/no-img-element */

import * as React from 'react';
import { X, Plus, Pencil, ImageOff } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Button } from '@/components/ui/button';

export interface BarcodeLookupResult {
  name?: string;
  brand?: string;
  found: boolean;
  barcode: string;
  imageUrl?: string;
}

interface BarcodeProductPreviewProps {
  open: boolean;
  onAdd: () => void;
  onEdit: () => void;
  isCreating?: boolean;
  duplicateName?: string;
  onEditDuplicate?: () => void;
  result: BarcodeLookupResult | null;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeProductPreview({
  open,
  onAdd,
  onEdit,
  result,
  onOpenChange,
  duplicateName,
  onEditDuplicate,
  isCreating = false,
}: BarcodeProductPreviewProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [result?.imageUrl]);

  if (!result) return null;

  const title = duplicateName ? 'Produto já está na lista' : 'Produto encontrado';
  const description = duplicateName
    ? `${duplicateName} tem o mesmo código de barras nesta categoria.`
    : 'Confira as informações antes de adicionar.';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.12)] outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom sm:bottom-6 sm:rounded-2xl">
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
          </div>

          <div className="flex items-start justify-between px-5 pb-4 pt-4">
            <div className="flex flex-col gap-1 pr-3">
              <DialogPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-[1.5] text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            </div>

            <DialogPrimitive.Close
              aria-label="Fechar"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
            >
              <X className="h-5 w-5 text-foreground" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
            <div className="flex gap-3 rounded-2xl border border-border bg-[#f5f5f5] p-3 dark:border-[#242424] dark:bg-[#1a1a1a]">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background">
                {result.imageUrl && !imageFailed ? (
                  <img
                    src={result.imageUrl}
                    alt="Imagem do produto"
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <ImageOff className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-lg font-semibold leading-tight text-foreground">
                  {result.name}
                </span>
                {result.brand ? (
                  <span className="text-sm font-medium text-muted-foreground">
                    {result.brand}
                  </span>
                ) : null}
                <span className="mt-auto font-mono text-xs text-muted-foreground">
                  {result.barcode}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {duplicateName && onEditDuplicate ? (
                <Button type="button" variant="outline" onClick={onEditDuplicate}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar produto existente
                </Button>
              ) : null}

              <Button type="button" disabled={isCreating} onClick={onAdd}>
                <Plus className="mr-2 h-4 w-4" />
                {duplicateName ? 'Adicionar mesmo assim' : 'Adicionar à lista'}
              </Button>

              <Button type="button" variant="outline" disabled={isCreating} onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar antes
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
