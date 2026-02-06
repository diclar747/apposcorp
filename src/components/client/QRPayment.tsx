import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Download,
  Copy,
  Check,
  Maximize2,
  ScanLine,
  Camera,
  CameraOff,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QRPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  balance?: number;
}

const MODAL_READER_ID = 'qr-modal-reader';

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

export function QRPayment({ isOpen, onClose, userId, userName, balance = 0 }: QRPaymentProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'myqr' | 'scan'>('myqr');
  const [copied, setCopied] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);
  const hasProcessedRef = useRef(false);

  const qrValue = `oscorp://pay?user=${userId}&name=${encodeURIComponent(userName)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const link = document.createElement('a');
          link.download = `oscorp-qr-${userId}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  };

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // Scanner may already be stopped
      }
      isScanningRef.current = false;
    }
  }, []);

  const cleanupScanner = useCallback(() => {
    stopScanner();
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      html5QrCodeRef.current = null;
    }
    setCameraState('idle');
    hasProcessedRef.current = false;
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    setCameraState('requesting');
    setErrorMessage('');

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraState('error');
        setErrorMessage('No se encontraron cámaras en este dispositivo.');
        return;
      }

      const readerElement = document.getElementById(MODAL_READER_ID);
      if (!readerElement) {
        setCameraState('error');
        setErrorMessage('Error al inicializar el escáner.');
        return;
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(MODAL_READER_ID);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (hasProcessedRef.current) return;
          hasProcessedRef.current = true;

          // Try to parse as payment QR
          let isValid = false;
          try {
            const data = JSON.parse(decodedText);
            if (data.type === 'payment' && data.toUserId && data.amount) {
              isValid = true;
            }
          } catch {
            // Check URL format
            if (decodedText.startsWith('oscorp://pay')) {
              isValid = true;
            }
          }

          if (isValid) {
            toast.success('Código QR detectado');
            stopScanner();
            onClose();
            // Navigate to scan page - it will handle the payment flow
            // Pass the decoded data via URL state
            navigate('/app/scan', { state: { qrData: decodedText } });
          } else {
            hasProcessedRef.current = false;
            toast.error('Código QR no reconocido');
          }
        },
        () => {
          // QR code not found in frame - normal
        }
      );

      isScanningRef.current = true;
      setCameraState('active');
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err?.toString?.()?.includes('NotAllowedError') ||
          err?.toString?.()?.includes('Permission')) {
        setCameraState('denied');
        setErrorMessage('Permiso de cámara denegado. Habilita el acceso en la configuración de tu navegador.');
      } else {
        setCameraState('error');
        setErrorMessage(err?.message || 'No se pudo acceder a la cámara.');
      }
    }
  }, [stopScanner, onClose, navigate]);

  // Start/stop scanner based on mode
  useEffect(() => {
    if (isOpen && mode === 'scan') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => startScanner(), 100);
      return () => {
        clearTimeout(timer);
        cleanupScanner();
      };
    } else {
      cleanupScanner();
    }
  }, [isOpen, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      setMode('myqr');
    }
  }, [isOpen, cleanupScanner]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Button variant="ghost" size="icon" onClick={() => { cleanupScanner(); onClose(); }}>
              <X className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold">Pago QR</h2>
            <div className="w-10" />
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center p-4">
            <div className="inline-flex gap-1 bg-muted rounded-xl p-1">
              <button
                onClick={() => setMode('myqr')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === 'myqr'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ScanLine className="w-4 h-4" />
                Mi QR
              </button>
              <button
                onClick={() => setMode('scan')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === 'scan'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Camera className="w-4 h-4" />
                Escanear
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <AnimatePresence mode="wait">
              {mode === 'myqr' ? (
                <motion.div
                  key="myqr"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center"
                >
                  {/* QR Display */}
                  <div
                    ref={qrRef}
                    className="qr-display p-8 mb-6"
                  >
                    <div className="relative">
                      <QRCodeSVG
                        value={qrValue}
                        size={220}
                        level="H"
                        includeMargin={false}
                        bgColor="transparent"
                        fgColor="currentColor"
                        className="text-foreground"
                      />
                      {/* Logo in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-background rounded-xl shadow-lg flex items-center justify-center border border-border">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">O</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="text-center mb-6">
                    <p className="font-semibold text-lg">{userName}</p>
                    <p className="text-sm text-muted-foreground">Muestra este QR para recibir pagos</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl" onClick={downloadQR}>
                      <Download className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                    <Button variant="outline" className="rounded-xl" onClick={copyToClipboard}>
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-emerald-500" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => setShowFullscreen(true)}>
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Ampliar
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center max-w-sm mx-auto"
                >
                  <p className="text-center text-muted-foreground mb-4 text-sm">
                    Apunta tu cámara al código QR del vendedor para pagar
                  </p>

                  {/* Camera scanner area */}
                  <div className="w-full bg-slate-900 rounded-2xl overflow-hidden relative">
                    <div
                      id={MODAL_READER_ID}
                      className="w-full aspect-square"
                      style={{ display: cameraState === 'active' ? 'block' : 'none' }}
                    />

                    {cameraState !== 'active' && (
                      <div className="w-full aspect-square flex flex-col items-center justify-center text-center p-6">
                        {cameraState === 'idle' || cameraState === 'requesting' ? (
                          <>
                            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
                            <p className="text-white font-medium text-sm">Iniciando cámara...</p>
                            <p className="text-white/50 text-xs mt-1">Permite el acceso a la cámara</p>
                          </>
                        ) : cameraState === 'denied' ? (
                          <>
                            <CameraOff className="w-10 h-10 text-red-400 mb-3" />
                            <p className="text-white font-medium text-sm mb-1">Cámara no disponible</p>
                            <p className="text-white/50 text-xs mb-3 leading-relaxed px-4">{errorMessage}</p>
                            <Button size="sm" variant="outline" onClick={startScanner} className="border-white/20 text-white hover:bg-white/10">
                              <RefreshCw className="w-3 h-3 mr-2" />
                              Reintentar
                            </Button>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
                            <p className="text-white font-medium text-sm mb-1">Error de cámara</p>
                            <p className="text-white/50 text-xs mb-3 leading-relaxed px-4">{errorMessage}</p>
                            <Button size="sm" variant="outline" onClick={startScanner} className="border-white/20 text-white hover:bg-white/10">
                              <RefreshCw className="w-3 h-3 mr-2" />
                              Reintentar
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Scan frame overlay */}
                    {cameraState === 'active' && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-[200px] h-[200px]">
                          <div className="absolute top-0 left-0 w-6 h-6 border-l-3 border-t-3 border-blue-500 rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-r-3 border-t-3 border-blue-500 rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-3 border-b-3 border-blue-500 rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-3 border-b-3 border-blue-500 rounded-br-lg" />
                          <motion.div
                            className="absolute left-2 right-2 h-0.5 bg-blue-500 shadow-lg shadow-blue-500/50"
                            animate={{ top: ['8%', '92%', '8%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {cameraState === 'active' && (
                    <p className="text-center text-xs text-muted-foreground mt-4">
                      El escáner detectará automáticamente el código QR
                    </p>
                  )}

                  {/* Fallback: go to full scanner page */}
                  <Button
                    variant="outline"
                    className="mt-4 w-full rounded-xl"
                    onClick={() => {
                      cleanupScanner();
                      onClose();
                      navigate('/app/scan');
                    }}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Abrir escáner completo
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fullscreen QR Modal */}
          <AnimatePresence>
            {showFullscreen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center"
                onClick={() => setShowFullscreen(false)}
              >
                <button
                  onClick={() => setShowFullscreen(false)}
                  className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-6 h-6 text-white" />
                </button>

                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="bg-white p-8 rounded-3xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <QRCodeSVG
                    value={qrValue}
                    size={280}
                    level="H"
                    includeMargin={false}
                  />
                </motion.div>

                <p className="text-white text-center mt-6 font-semibold">{userName}</p>
                <p className="text-white/60 text-sm">Escanea para pagar</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
