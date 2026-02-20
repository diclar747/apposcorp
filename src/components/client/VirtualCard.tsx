import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  QrCode,
  Copy,
  Wifi,
  Plus,
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
      className={cn('relative overflow-hidden rounded-[2.5rem] p-6 cursor-pointer group', className)}
      style={{
        background: 'linear-gradient(165deg, #1e293b 0%, #0f172a 40%, #020617 100%)',
        boxShadow: `
          0 20px 50px -12px rgba(0, 0, 0, 0.5), 
          inset 0 1px 1px rgba(255, 255, 255, 0.1),
          inset 0 -1px 1px rgba(0, 0, 0, 0.4)
        `
      }}
    >
      {/* Decorative Blur Spheres */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" />

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-200/80 via-yellow-400/80 to-yellow-600/80 p-0.5 shadow-inner opacity-80">
              <div className="w-full h-full border border-black/10 rounded-[3px]" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-[13px] font-black tracking-tight leading-none italic">OSCORP</span>
              <span className="text-white/40 text-[8px] font-bold tracking-[0.2em] leading-none uppercase">Premium</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Plus className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.15em]">Balance Disponible</p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white/40 text-lg font-bold">₲</span>
            <p className="text-white text-3xl sm:text-4xl font-black tracking-tighter">
              {balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex gap-4">
            <span className="text-white/20 text-xs font-mono tracking-[0.2em]">**** 6457</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-500/80 translate-x-2" />
            <div className="w-6 h-6 rounded-full bg-orange-500/80" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
