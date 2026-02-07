import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QRCameraScannerProps {
  onScan: (decodedText: string) => void;
  active?: boolean;
}

type CameraState = 'requesting' | 'active' | 'denied' | 'error' | 'stopped';

export function QRCameraScanner({ onScan, active = true }: QRCameraScannerProps) {
  const [cameraState, setCameraState] = useState<CameraState>('stopped');
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useRef('qr-reader-' + Math.random().toString(36).slice(2));
  const hasScannedRef = useRef(false);
  const mountedRef = useRef(true);
  // Use ref for onScan to avoid recreating startScanner on every render
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    // Prevent double-start
    if (scannerRef.current) return;

    setCameraState('requesting');

    // Wait for DOM element to be available
    await new Promise((r) => setTimeout(r, 100));

    if (!mountedRef.current) return;

    const el = document.getElementById(containerId.current);
    if (!el) {
      setCameraState('error');
      return;
    }

    try {
      const scanner = new Html5Qrcode(containerId.current, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decodedText) => {
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            onScanRef.current(decodedText);
          }
        },
        () => {} // ignore per-frame decode failures
      );

      if (mountedRef.current) {
        setCameraState('active');
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg = (err?.message || String(err)).toLowerCase();
      if (msg.includes('permission') || msg.includes('notallowed') || msg.includes('denied')) {
        setCameraState('denied');
      } else {
        setCameraState('error');
      }
    }
  }, []); // No dependencies - uses refs for callbacks

  useEffect(() => {
    mountedRef.current = true;
    if (active) {
      hasScannedRef.current = false;
      startScanner();
    } else {
      stopScanner();
      setCameraState('stopped');
    }
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [active, startScanner, stopScanner]);

  const handleRetry = () => {
    hasScannedRef.current = false;
    stopScanner().then(startScanner);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  };

  // Always render the container div so it's in the DOM when the scanner needs it
  return (
    <div className="space-y-3">
      {/* Camera feed container - always in DOM, hidden when not active */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black"
        style={{ display: cameraState === 'active' || cameraState === 'requesting' ? 'block' : 'none' }}
      >
        <div id={containerId.current} className="w-full" />

        {/* Loading overlay while requesting */}
        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <p className="text-sm text-white/80 text-center mt-4">
              Abriendo cámara...
            </p>
          </div>
        )}

        {/* Overlay corners when active */}
        {cameraState === 'active' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-10 h-10 border-l-4 border-t-4 border-blue-500 rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-10 h-10 border-r-4 border-t-4 border-blue-500 rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-l-4 border-b-4 border-blue-500 rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-r-4 border-b-4 border-blue-500 rounded-br-xl" />
          </div>
        )}
      </div>

      {/* Active camera helper text */}
      {cameraState === 'active' && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Camera className="w-4 h-4" />
          <span>Apunta al código QR del vendedor</span>
        </div>
      )}

      {/* Permission denied or error — show fallback */}
      {(cameraState === 'denied' || cameraState === 'error') && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                <CameraOff className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  {cameraState === 'denied' ? 'Permiso de cámara denegado' : 'Error de cámara'}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {cameraState === 'denied'
                    ? 'Permite el acceso en la configuración del navegador'
                    : 'No se pudo iniciar la cámara'}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="w-full border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>

          {/* Manual input fallback */}
          <div className="bg-card p-4 rounded-2xl border space-y-3">
            <p className="text-sm font-semibold">Ingresar código manualmente</p>
            <p className="text-xs text-muted-foreground">
              Pide al vendedor el código QR y pégalo aquí:
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="oscorp://pay?user=..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button size="sm" onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                Verificar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
