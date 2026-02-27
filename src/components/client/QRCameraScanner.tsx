import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, CameraOff, RefreshCw, Loader2, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QRCameraScannerProps {
  onScan: (decodedText: string) => void;
  active?: boolean;
}

type CameraState = 'requesting' | 'active' | 'denied' | 'error' | 'stopped';

export function QRCameraScanner({ onScan, active = true }: QRCameraScannerProps) {
  const [cameraState, setCameraState] = useState<CameraState>('requesting');
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useRef('qr-reader-' + Math.random().toString(36).slice(2));
  const hasScannedRef = useRef(false);
  const mountedRef = useRef(true);

  // Store onScan in a ref to avoid useCallback dependency loop
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
        scannerRef.current = null;
      }
    } catch {
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return;

    try {
      setCameraState('requesting');

      // Check if camera API is available (requires HTTPS or localhost)
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('error');
        return;
      }

      // Give the DOM time to render the container div (especially after AnimatePresence)
      await new Promise((r) => setTimeout(r, 500));

      if (!mountedRef.current) return;

      const el = document.getElementById(containerId.current);
      if (!el) {
        setCameraState('error');
        return;
      }

      const scanner = new Html5Qrcode(containerId.current, { verbose: false });
      scannerRef.current = scanner;

      // Let html5-qrcode handle camera permission request internally
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
  }, []); // No dependencies — onScan is in a ref

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
      onScanRef.current(manualInput.trim());
    }
  };

  // The video container is ALWAYS visible with min-height so html5-qrcode
  // can read clientWidth/clientHeight. Overlays sit on top for requesting/error states.
  return (
    <div className="space-y-3">
      {/* Video container — always visible, always has dimensions */}
      <div className="relative rounded-[2rem] overflow-hidden bg-black min-h-[300px]">
        <div id={containerId.current} className="w-full" />

        {/* Overlay corners (visible when camera active) */}
        {cameraState === 'active' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning animation line */}
            <motion.div
              initial={{ top: '10%' }}
              animate={{ top: '90%' }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
              className="absolute left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            />
            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-12 h-12 border-l-[3px] border-t-[3px] border-blue-500 rounded-tl-2xl" />
            <div className="absolute top-4 right-4 w-12 h-12 border-r-[3px] border-t-[3px] border-blue-500 rounded-tr-2xl" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-l-[3px] border-b-[3px] border-blue-500 rounded-bl-2xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-[3px] border-b-[3px] border-blue-500 rounded-br-2xl" />
          </div>
        )}

        {/* Requesting permission — overlay on top of the black container */}
        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 space-y-4 z-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20"
            >
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm text-white/80 font-bold">Solicitando cámara...</p>
              <p className="text-[10px] text-white/30 font-medium mt-1 uppercase tracking-widest">
                Acepta el permiso del navegador
              </p>
            </div>
          </div>
        )}

        {/* Permission denied or error — overlay */}
        {(cameraState === 'denied' || cameraState === 'error') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10 p-4">
            <div className="space-y-4 w-full max-w-sm">
              {/* Error card */}
              <div className="glass-premium p-5 rounded-[1.5rem] border border-amber-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20">
                    <CameraOff className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-500 tracking-tight">
                      {cameraState === 'denied' ? 'Permiso denegado' : 'Error de cámara'}
                    </p>
                    <p className="text-[10px] text-white/40 font-medium mt-0.5">
                      {cameraState === 'denied'
                        ? 'Permite el acceso en configuración'
                        : 'Verifica permisos o HTTPS'}
                    </p>
                  </div>
                </div>

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="w-full border-amber-500/20 text-amber-500 hover:bg-amber-500/10 rounded-xl h-10 font-bold text-xs"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </motion.div>
              </div>

              {/* Manual input fallback */}
              <div className="glass-premium p-5 rounded-[1.5rem] border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-muted-foreground/40" />
                  <p className="text-xs font-black tracking-tight">Ingreso manual</p>
                </div>
                <p className="text-[10px] text-muted-foreground/40 font-medium">
                  Pide al vendedor el código QR y pégalo aquí:
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="oscorp://pay?user=..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="text-xs bg-white/5 border-white/10 rounded-xl h-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  />
                  <Button
                    size="sm"
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl h-10 font-bold text-xs px-4"
                  >
                    Verificar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active camera — show helper text below */}
      {cameraState === 'active' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.15em]"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Apunta al código QR del vendedor</span>
        </motion.div>
      )}
    </div>
  );
}
