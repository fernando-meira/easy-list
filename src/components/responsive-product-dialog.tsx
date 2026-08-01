'use client';

import { Drawer } from 'vaul';
import * as React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ResponsiveProductDialogProps {
  open?: boolean;
  title: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  description?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

interface KeyboardViewportOverride {
  bottom: number;
  maxHeight: number;
}

const getKeyboardViewportOverride = (): KeyboardViewportOverride | null => {
  if (typeof window === 'undefined' || !window.visualViewport) return null;

  const { height, offsetTop } = window.visualViewport;
  const bottom = Math.max(0, Math.round(window.innerHeight - height - offsetTop));

  if (bottom === 0) return null;

  return { bottom, maxHeight: Math.round(height) };
};

export function ResponsiveProductDialog({
  open,
  title,
  footer,
  children,
  description,
  onOpenChange,
}: ResponsiveProductDialogProps) {
  const [keyboardOverride, setKeyboardOverride] = React.useState<KeyboardViewportOverride | null>(
    null
  );

  React.useEffect(() => {
    if (!open) return;

    let frame = 0;
    const visualViewport = window.visualViewport;

    const updateOverride = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setKeyboardOverride(getKeyboardViewportOverride());
      });
    };

    updateOverride();
    visualViewport?.addEventListener('resize', updateOverride);
    visualViewport?.addEventListener('scroll', updateOverride);

    return () => {
      window.cancelAnimationFrame(frame);
      setKeyboardOverride(null);
      visualViewport?.removeEventListener('resize', updateOverride);
      visualViewport?.removeEventListener('scroll', updateOverride);
    };
  }, [open]);

  let contentStyle: React.CSSProperties | undefined;

  if (keyboardOverride) {
    contentStyle = {
      minHeight: 0,
      bottom: keyboardOverride.bottom,
      maxHeight: keyboardOverride.maxHeight,
    };
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false} autoFocus>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />

        <Drawer.Content
          style={contentStyle}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[96dvh] min-h-[60dvh] flex-col outline-none',
            'rounded-t-2xl border border-border/60 bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.08)]',
            'sm:mx-auto sm:bottom-6 sm:max-w-[460px] sm:rounded-2xl'
          )}
        >
          <div className="flex flex-shrink-0 justify-center pt-2.5">
            <div className="h-[5px] w-11 rounded-full bg-border" aria-hidden="true" />
          </div>

          <div className="flex flex-shrink-0 items-start justify-between px-5 pb-4 pt-4">
            <div className="flex flex-1 flex-col gap-1 pr-3">
              <Drawer.Title className="text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-foreground">
                {title}
              </Drawer.Title>
              {description ? (
                <Drawer.Description className="text-sm leading-[1.5] text-[#374151] dark:text-[#a1a1aa]">
                  {description}
                </Drawer.Description>
              ) : null}
            </div>

            <Drawer.Close
              aria-label="Fechar"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background"
            >
              <X className="h-5 w-5 text-foreground" />
            </Drawer.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
            {children}
          </div>

          {footer ? (
            <div className="flex-shrink-0 border-t border-border bg-background px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
              {footer}
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
