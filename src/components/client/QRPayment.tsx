import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Maximize2,
  ScanLine,
  ArrowLeft,
  Camera,
  VideoOff
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
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

export function QRPayment({ isOpen, onClose, userId, userName, balance = 0 }: QRPaymentProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'myqr' | 'scan'>('myqr');
  const [copied, setCopied] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

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
    try {
      const scanner = scannerRef.current;
      if (scanner) {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
        scannerRef.current = null;
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    }
  }, []);

  const startScanner = useCallback(async () => {
    await stopScanner();
    setCameraError(null);

    // Wait for DOM to be ready
    await new Promise(r => setTimeout(r, 300));
    if (!mountedRef.current) return;

    const container = document.getElementById('qr-modal-reader');
    if (!container) return;

    try {
      const scanner = new Html5Qrcode('qr-modal-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // QR detected - stop scanning, close modal, navigate to payment page
          stopScanner();
          onClose();
          navigate('/app/escanear', { state: { qrData: decodedText } });
          toast.success('Codigo QR detectado!');
        },
        () => { /* QR not found in frame - expected */ }
      );
    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg = String(err);
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setCameraError('Permiso de camara denegado. Permite el acceso a la camara.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setCameraError('No se encontro camara en este dispositivo.');
      } else {
        setCameraError('No se pudo acceder a la camara.');
      }
    }
  }, [stopScanner, onClose, navigate]);

  // Manage scanner lifecycle based on mode and modal state
  useEffect(() => {
    mountedRef.current = true;
    if (isOpen && mode === 'scan') {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [isOpen, mode, startScanner, stopScanner]);

  // Reset mode when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode('myqr');
      setCameraError(null);
    }
  }, [isOpen]);

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
            <Button variant="ghost" size="icon" onClick={onClose}>
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
                  className="flex flex-col items-center"
                >
                  <p className="text-center text-muted-foreground mb-6">
                    Apunta tu camara a un codigo QR para pagar
                  </p>

                  {/* Camera Scanner */}
                  <div className="w-72 h-72 rounded-3xl overflow-hidden bg-black relative border-2 border-blue-500" style={{ boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)' }}>
                    <div
                      id="qr-modal-reader"
                      className="qr-scanner-container w-full h-full"
                    />

                    {cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black">
                        <VideoOff className="w-12 h-12 text-slate-500 mb-3" />
                        <p className="text-white text-xs font-medium mb-3">{cameraError}</p>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-500 text-xs"
                          onClick={() => startScanner()}
                        >
                          <Camera className="w-3 h-3 mr-1" />
                          Reintentar
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    El escaner detectara automaticamente el codigo QR
                  </p>
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
