import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  QrCode,
  Copy,
  Eye,
  EyeOff,
  Wifi,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';

interface VirtualCardProps {
  balance: number;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  qrValue: string;
  className?: string;
}

export function VirtualCard({
  balance,
  cardNumber,
  cardHolder,
  expiryDate,
  cvv,
  qrValue,
  className
}: VirtualCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatCardNumber = (num: string) => {
    if (!showDetails) return '•••• •••• •••• ' + num.slice(-4);
    return num.replace(/(\d{4})/g, '$1 ').trim();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        {!showQR ? (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative aspect-[1.586/1] p-6 flex flex-col justify-between overflow-hidden rounded-2xl shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)',
                backgroundSize: '100% 100%'
              }}
            />

            {/* Card Header */}
            <div className="flex items-start justify-between relative z-10 w-full">
              {/* Chip and Contactless */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner border border-yellow-600/50 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 opacity-50 border-[0.5px] border-black/20 rounded-[5px]" />
                  <div className="w-full h-[1px] bg-black/20 absolute top-1/3" />
                  <div className="w-full h-[1px] bg-black/20 absolute bottom-1/3" />
                  <div className="h-full w-[1px] bg-black/20 absolute left-1/3" />
                  <div className="h-full w-[1px] bg-black/20 absolute right-1/3" />
                </div>
                <Wifi className="w-8 h-8 text-white/60 rotate-90" />
              </div>

              {/* Bank/Brand Name */}
              <div className="text-right">
                <h3 className="text-white/90 font-bold text-lg tracking-wider italic">OSCORP</h3>
                <p className="text-white/50 text-[10px] uppercase tracking-widest">Platino</p>
              </div>
            </div>

            {/* Card Body - Number & QR */}
            <div className="flex items-center justify-between relative z-10 mt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-white text-[22px] sm:text-[26px] tracking-[0.15em] font-mono drop-shadow-md" style={{ fontFamily: '"Courier Prime", monospace', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {cardNumber}
                  </span>
                  <button
                    onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ''))}
                    className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    {copied ? (
                      <span className="text-emerald-400 text-[10px]">✓</span>
                    ) : (
                      <Copy className="w-3 h-3 text-white/40" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mini QR on Card */}
              <div className="bg-white p-1 rounded-md shadow-sm opacity-90">
                <QRCodeSVG
                  value={qrValue}
                  size={45}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-end justify-between relative z-10">
              <div className="flex items-end gap-8">
                <div className="space-y-0.5">
                  <p className="text-white/40 text-[8px] uppercase tracking-widest ml-1">Titular</p>
                  <p className="text-white font-medium uppercase tracking-widest text-sm sm:text-base drop-shadow-sm">{cardHolder}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-white/40 text-[8px] uppercase tracking-widest ml-1">Vencimiento</p>
                  <p className="text-white font-medium text-sm sm:text-base tracking-wider drop-shadow-sm">{expiryDate}</p>
                </div>
              </div>

              {/* Visa Logo Style */}
              <div className="italic font-black text-2xl text-white tracking-tighter opacity-90 pr-2">
                VISA
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="qr-display aspect-[1.586/1] relative"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
              onClick={() => setShowQR(false)}
            >
              <CreditCard className="w-4 h-4" />
            </Button>

            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1e3a5f"
              />
            </div>

            <div className="mt-4 text-center">
              <p className="font-semibold text-foreground">{cardHolder}</p>
              <p className="text-sm text-muted-foreground">Escanear para pagar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for dashboard
export function VirtualCardCompact({
  balance,
  onShowQR,
  className
}: {
  balance: number;
  onShowQR?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        'premium-card-dark p-5 cursor-pointer relative overflow-hidden',
        className
      )}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="card-chip" />
            <Wifi className="w-4 h-4 text-white/40" />
          </div>
          <div className="flex -space-x-1.5">
            <div className="w-6 h-6 rounded-full bg-red-500/90" />
            <div className="w-6 h-6 rounded-full bg-yellow-500/90" />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-white/50 text-xs mb-1">Saldo Actual</p>
          <p className="text-white text-3xl font-bold">{formatCurrency(balance)}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/40 text-sm font-mono">•••• 4589</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onShowQR?.();
            }}
          >
            <QrCode className="w-4 h-4 mr-1" />
            QR
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
