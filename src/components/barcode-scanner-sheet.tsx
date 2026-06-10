'use client';

import * as React from 'react';
import { X, ScanLine } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BarcodeScannerSheetProps {
  open: boolean;
  isBusy?: boolean;
  onDetected: (code: string) => void;
  onOpenChange: (open: boolean) => void;
}

type ScannerControls = {
  stop: () => void;
};

const BARCODE_PATTERN = /^[0-9A-Za-z-]{4,32}$/;

export function BarcodeScannerSheet({
  open,
  isBusy = false,
  onDetected,
  onOpenChange,
}: BarcodeScannerSheetProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const controlsRef = React.useRef<ScannerControls | null>(null);
  const handledCodeRef = React.useRef<string | null>(null);
  const [manualCode, setManualCode] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
  const [message, setMessage] = React.useState('Aponte a câmera para o código de barras.');

  const stopScanner = React.useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const handleCode = React.useCallback((code: string) => {
    const normalizedCode = code.trim();

    if (!BARCODE_PATTERN.test(normalizedCode)) {
      setMessage('Código inválido. Tente novamente ou digite manualmente.');
      return;
    }

    if (handledCodeRef.current === normalizedCode) return;

    handledCodeRef.current = normalizedCode;
    stopScanner();
    onDetected(normalizedCode);
  }, [onDetected, stopScanner]);

  React.useEffect(() => {
    if (!open) {
      stopScanner();
      handledCodeRef.current = null;
      setManualCode('');
      setStatus('idle');
      setMessage('Aponte a câmera para o código de barras.');
      return;
    }

    let cancelled = false;

    async function startScanner() {
      try {
        setStatus('starting');
        setMessage('Abrindo câmera...');

        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 150,
        });

        if (cancelled || !videoRef.current) return;

        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) {
              handleCode(result.getText());
            }
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setStatus('scanning');
        setMessage('Aponte a câmera para o código de barras.');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Não foi possível acessar a câmera. Digite o código manualmente.');
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [open, handleCode, stopScanner]);

  const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleCode(manualCode);
  };

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
                Escanear produto
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-[1.5] text-muted-foreground">
                {message}
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
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
              <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
                {status === 'scanning' ? 'Lendo código' : 'Preparando câmera'}
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
              <label
                className="text-[13px] font-bold leading-[1.35] text-foreground"
                htmlFor="manual-barcode"
              >
                Código manual
              </label>
              <div className="flex gap-2">
                <Input
                  id="manual-barcode"
                  inputMode="numeric"
                  value={manualCode}
                  disabled={isBusy}
                  placeholder="Digite o código de barras"
                  onChange={(event) => setManualCode(event.target.value)}
                  className="h-10 rounded-lg px-3.5 text-base"
                />
                <Button type="submit" disabled={isBusy || manualCode.trim().length < 4}>
                  <ScanLine className="mr-1 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
