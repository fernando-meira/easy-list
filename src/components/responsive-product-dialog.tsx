'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { cn } from '@/lib/utils';

interface ResponsiveProductDialogProps {
  open?: boolean;
  title: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  description?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

type DialogViewportStyle = React.CSSProperties & {
  '--product-dialog-available-height': string;
  '--product-dialog-visual-offset-top': string;
};

const getViewportStyle = (): DialogViewportStyle => {
  if (typeof window === 'undefined') {
    return {
      '--product-dialog-available-height': '100dvh',
      '--product-dialog-visual-offset-top': '0px',
    };
  }

  const visualViewport = window.visualViewport;
  const height = visualViewport?.height ?? window.innerHeight;
  const offsetTop = visualViewport?.offsetTop ?? 0;

  return {
    '--product-dialog-available-height': `${height}px`,
    '--product-dialog-visual-offset-top': `${offsetTop}px`,
  };
};

export function ResponsiveProductDialog({
  open,
  title,
  footer,
  children,
  description,
  onOpenChange,
}: ResponsiveProductDialogProps) {
  const [viewportStyle, setViewportStyle] = React.useState<DialogViewportStyle>(() => ({
    '--product-dialog-available-height': '100dvh',
    '--product-dialog-visual-offset-top': '0px',
  }));

  React.useEffect(() => {
    if (!open) return;

    let frame = 0;

    const updateViewport = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setViewportStyle(getViewportStyle());
      });
    };

    updateViewport();

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', updateViewport);
    visualViewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.cancelAnimationFrame(frame);
      visualViewport?.removeEventListener('resize', updateViewport);
      visualViewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, [open]);

  const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      window.setTimeout(() => {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }, 80);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          style={viewportStyle}
          onFocusCapture={handleFocusCapture}
          className={cn(
            'group fixed inset-x-0 z-50 flex h-[var(--product-dialog-available-height)]',
            'top-[var(--product-dialog-visual-offset-top)] items-end justify-center',
            'pointer-events-none outline-none'
          )}
        >
          <div
            className={cn(
              'pointer-events-auto flex w-full flex-col overflow-hidden rounded-t-2xl',
              'border border-border/60 bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.08)]',
              'min-h-[60dvh] max-h-[var(--product-dialog-available-height)]',
              'group-data-[state=closed]:animate-out group-data-[state=closed]:slide-out-to-bottom',
              'group-data-[state=open]:animate-in group-data-[state=open]:slide-in-from-bottom',
              'sm:mb-6 sm:max-w-[460px] sm:rounded-2xl'
            )}
          >
            <div className="flex flex-shrink-0 justify-center pt-2.5">
              <div className="h-[5px] w-11 rounded-full bg-[#d1d5db]" />
            </div>

            <div className="flex flex-shrink-0 items-start justify-between px-5 pb-4 pt-4">
              <div className="flex flex-1 flex-col gap-1 pr-3">
                <DialogPrimitive.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                  {title}
                </DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>

              <DialogPrimitive.Close
                aria-label="Fechar"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white dark:border-[#242424] dark:bg-[#101010]"
              >
                <X className="h-5 w-5 text-foreground" />
              </DialogPrimitive.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              {children}
            </div>

            {footer ? (
              <div className="flex-shrink-0 border-t border-border bg-background px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
                {footer}
              </div>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
