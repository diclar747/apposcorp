import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  QrCode,
  Copy,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VirtualCardProps {
  balance: number;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  qrValue: string;
  className?: string;
}

const OSCORP_LOGO = '/oscorp-logo.png';

function OscorpBrand({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  const imgH = size === 'sm' ? 'h-7' : 'h-9';
  return (
    <div className={cn('flex items-center', className)}>
      <img
        src={OSCORP_LOGO}
        alt="Oscorp"
        className={cn(imgH, 'w-auto object-contain drop-shadow-[0_2px_6px_rgba(255,255,255,0.15)]')}
      />
    </div>
  );
}

function CardChip() {
  return (
    <div className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner border border-yellow-700/40 relative overflow-hidden">
      <div className="absolute inset-[2px] rounded-[4px] border border-black/15" />
      <div className="absolute top-1/3 left-0 right-0 h-[0.5px] bg-black/20" />
      <div className="absolute bottom-1/3 left-0 right-0 h-[0.5px] bg-black/20" />
      <div className="absolute left-1/3 top-0 bottom-0 w-[0.5px] bg-black/20" />
      <div className="absolute right-1/3 top-0 bottom-0 w-[0.5px] bg-black/20" />
    </div>
  );
}

export function VirtualCard({
  cardNumber,
  cardHolder,
  expiryDate,
  qrValue,
  className
}: VirtualCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

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
            className="relative aspect-[1.586/1] p-5 sm:p-6 flex flex-col justify-between overflow-hidden rounded-2xl"
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
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <CardChip />
                <Wifi className="w-6 h-6 text-white/40 rotate-90" />
              </div>
              <OscorpBrand />
            </div>

            {/* Middle: Card number + mini QR */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span
                  className="text-white text-lg sm:text-xl tracking-[0.18em] font-mono"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                  {cardNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ''))}
                  className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors"
                >
                  {copied ? (
                    <span className="text-emerald-400 text-[10px]">&#10003;</span>
                  ) : (
                    <Copy className="w-3 h-3 text-white/30" />
                  )}
                </button>
              </div>
              <div className="bg-white p-[3px] rounded-md shadow-md">
                <QRCodeSVG value={qrValue} size={40} level="M" includeMargin={false} />
              </div>
            </div>

            {/* Bottom: Holder + Expiry + DEBIT label */}
            <div className="flex items-end justify-between relative z-10">
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-white/35 text-[8px] uppercase tracking-[0.2em] mb-0.5">Titular</p>
                  <p className="text-white font-medium uppercase tracking-wider text-xs sm:text-sm">{cardHolder}</p>
                </div>
                <div>
                  <p className="text-white/35 text-[8px] uppercase tracking-[0.2em] mb-0.5">Vence</p>
                  <p className="text-white font-medium text-xs sm:text-sm tracking-wider">{expiryDate}</p>
                </div>
              </div>
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em]">Debit</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="aspect-[1.586/1] relative flex flex-col items-center justify-center rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #111111 100%)',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)'
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/10"
              onClick={() => setShowQR(false)}
            >
              <CreditCard className="w-4 h-4" />
            </Button>

            <div className="bg-white p-3 rounded-xl shadow-lg">
              <QRCodeSVG
                value={qrValue}
                size={140}
                level="H"
                includeMargin={false}
                fgColor="#0d0d0d"
              />
            </div>

            <div className="mt-3 text-center">
              <p className="font-semibold text-white text-sm">{cardHolder}</p>
              <p className="text-[11px] text-white/40">Escanear para pagar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button below card */}
      <div className="flex justify-center mt-3">
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showQR ? <CreditCard className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
          {showQR ? 'Ver tarjeta' : 'Ver QR'}
        </button>
      </div>
    </div>
  );
}

// Compact version for Home dashboard
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
      className={cn('relative overflow-hidden rounded-2xl p-5 cursor-pointer', className)}
      style={{
        background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 50%, #111111 100%)',
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      }}
    >
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <CardChip />
            <Wifi className="w-4 h-4 text-white/30 rotate-90" />
          </div>
          <OscorpBrand size="sm" />
        </div>

        <div className="mb-4">
          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Saldo Disponible</p>
          <p className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
            &#8370; {balance.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/30 text-xs font-mono tracking-wider">&#8226;&#8226;&#8226;&#8226; &#8226;&#8226;&#8226;&#8226; &#8226;&#8226;&#8226;&#8226; &#8226;&#8226;&#8226;&#8226;</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/50 hover:text-white hover:bg-white/10 h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onShowQR?.();
            }}
          >
            <QrCode className="w-3.5 h-3.5 mr-1" />
            QR
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
