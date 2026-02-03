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
            className="premium-card-dark aspect-[1.586/1] p-6 flex flex-col justify-between relative"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="card-chip" />
                <Wifi className="w-5 h-5 text-white/40" />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setShowQR(true)}
                >
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Card Number */}
            <div className="space-y-2 relative z-10">
              <p className="text-white/50 text-xs">Card Number</p>
              <div className="flex items-center gap-3">
                <span className="text-white text-2xl tracking-wider font-mono">
                  {formatCardNumber(cardNumber)}
                </span>
                <button
                  onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ''))}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  {copied ? (
                    <span className="text-emerald-400 text-xs">✓</span>
                  ) : (
                    <Copy className="w-3 h-3 text-white/60" />
                  )}
                </button>
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-end justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-white/50 text-[10px] uppercase tracking-wider">Card Holder</p>
                <p className="text-white font-medium uppercase tracking-wider">{cardHolder}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">Expires</p>
                  <p className="text-white font-medium">{showDetails ? expiryDate : '••/••'}</p>
                </div>
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">CVV</p>
                  <p className="text-white font-medium">{showDetails ? cvv : '•••'}</p>
                </div>
              </div>
              
              {/* Mastercard Logo */}
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-red-500/90" />
                <div className="w-10 h-10 rounded-full bg-yellow-500/90" />
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
              <p className="text-sm text-muted-foreground">Scan to pay</p>
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
          <p className="text-white/50 text-xs mb-1">Current Balance</p>
          <p className="text-white text-3xl font-bold">₲ {balance.toLocaleString()}</p>
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
