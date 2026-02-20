import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  CreditCard,
  QrCode,
  Wifi,
  Maximize2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { VirtualCard } from '@/components/client/VirtualCard';
import { generateQRValue } from '@/lib/qr';

export default function ClientCard() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const cardNumber = user?.virtualCard?.cardNumber || 'OSC 0000 0000 0001';
  const cardHolder = `${user?.firstName || 'USUARIO'} ${user?.lastName || 'OSCORP'}`;
  const expiryDate = '12/28';
  const qrValue = generateQRValue(user?.id || '', user?.firstName || 'Usuario');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
          link.download = `oscorp-qr-${user?.id}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  };

  return (
    <div className="pt-6 space-y-6 max-w-lg mx-auto px-4">
      {/* Page Title */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-black tracking-tight">Mi Tarjeta</h1>
        <p className="text-sm text-muted-foreground/60 font-medium">Gestiona tu tarjeta virtual y pagos QR</p>
      </div>

      {/* Unified Virtual Card Component */}
      <VirtualCard
        balance={0}
        cardNumber={cardNumber}
        cardHolder={cardHolder}
        expiryDate={expiryDate}
        cvv="***"
        qrValue={qrValue}
      />

      {/* Add Fullscreen Option for current QR view if needed, but VirtualCard handles its own QR toggle */}
      {/* We keep the details section below */}

      {/* Card Details */}
      <div className="premium-card p-4 space-y-4">
        <h3 className="font-semibold">Detalles de la tarjeta</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground text-sm">Numero de tarjeta</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{cardNumber}</span>
              <button
                onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ''))}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground text-sm">Titular</span>
            <span className="font-medium uppercase">{cardHolder}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground text-sm">Fecha de vencimiento</span>
            <span className="font-mono">{expiryDate}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground text-sm">Tipo</span>
            <span className="font-medium">Debito Oscorp</span>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-medium text-sm">Tarjeta segura</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tu tarjeta esta protegida con encriptacion de 256 bits. Los datos se actualizan automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
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
              <QRCodeSVG value={qrValue} size={300} level="H" includeMargin={false} fgColor="#0d0d0d" />
              <p className="text-center mt-4 font-semibold text-gray-900">{cardHolder}</p>
              <p className="text-center text-sm text-gray-500">Escanea para pagar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
