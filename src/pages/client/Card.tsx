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
import { useAuthStore, useWalletStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { generateQRValue } from '@/lib/qr';

export default function ClientCard() {
  const { user } = useAuthStore();
  const { wallet } = useWalletStore();
  const [showQR, setShowQR] = useState(false);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <Link to="/app/wallet">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">Mi Tarjeta</h1>
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex gap-1 bg-muted rounded-full p-1">
            <button
              onClick={() => setShowQR(false)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                !showQR
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CreditCard className="w-4 h-4" />
              Tarjeta
            </button>
            <button
              onClick={() => setShowQR(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                showQR
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <QrCode className="w-4 h-4" />
              QR
            </button>
          </div>
        </div>

        {/* Card/QR Display */}
        <AnimatePresence mode="wait">
          {!showQR ? (
            <motion.div
              key="card"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="relative aspect-[1.586/1] p-6 flex flex-col justify-between overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #111111 100%)',
                boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)'
              }}
            >
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(16,185,129,0.2) 0%, transparent 40%)`
                }}
              />

              {/* Top row: Chip + Contactless + Brand */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Chip */}
                  <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner border border-yellow-700/40 relative overflow-hidden">
                    <div className="absolute inset-[2px] rounded-[4px] border border-black/15" />
                    <div className="absolute top-1/3 left-0 right-0 h-[0.5px] bg-black/20" />
                    <div className="absolute bottom-1/3 left-0 right-0 h-[0.5px] bg-black/20" />
                    <div className="absolute left-1/3 top-0 bottom-0 w-[0.5px] bg-black/20" />
                    <div className="absolute right-1/3 top-0 bottom-0 w-[0.5px] bg-black/20" />
                  </div>
                  <Wifi className="w-7 h-7 text-white/40 rotate-90" />
                </div>
                {/* Brand */}
                <img
                  src="/oscorp-logo.png"
                  alt="Oscorp"
                  className="h-10 w-auto object-contain drop-shadow-[0_2px_6px_rgba(255,255,255,0.15)]"
                />
              </div>

              {/* Card Number + Mini QR */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xl sm:text-2xl tracking-[0.18em] font-mono"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                  >
                    {cardNumber}
                  </span>
                  <button
                    onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ''))}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/30" />}
                  </button>
                </div>
                {/* Mini QR */}
                <div className="bg-white p-[3px] rounded-md shadow-md">
                  <QRCodeSVG value={qrValue} size={44} level="M" includeMargin={false} />
                </div>
              </div>

              {/* Bottom: Holder + Expiry + DEBIT */}
              <div className="relative z-10 flex items-end justify-between">
                <div className="flex items-end gap-6">
                  <div>
                    <span className="text-white/35 text-[9px] uppercase tracking-[0.2em]">Titular</span>
                    <p className="text-white text-sm font-medium uppercase tracking-wider">{cardHolder}</p>
                  </div>
                  <div>
                    <span className="text-white/35 text-[9px] uppercase tracking-[0.2em]">Vence</span>
                    <p className="text-white text-sm font-medium tracking-wider">{expiryDate}</p>
                  </div>
                </div>
                <span className="text-white/50 text-[11px] font-bold uppercase tracking-[0.3em]">Debit</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="qr"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* QR Container */}
              <div
                ref={qrRef}
                className="bg-white rounded-3xl p-8 shadow-xl mx-auto max-w-sm"
              >
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <QRCodeSVG
                      value={qrValue}
                      size={240}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#0d0d0d"
                    />
                    {/* Logo in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center p-1">
                        <img
                          src="/images/oscorp-round.png"
                          alt="Oscorp"
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="font-semibold text-gray-900">{cardHolder}</p>
                    <p className="text-sm text-gray-500 mt-1">Escanea para pagar</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" className="rounded-xl" onClick={downloadQR}>
                  <Download className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setShowFullscreen(true)}>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Pantalla completa
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
