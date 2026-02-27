import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  Check,
  Download,
  Maximize2,
  X,
  Shield,
  Fingerprint
} from 'lucide-react';
import { useAuthStore, useWalletStore } from '@/stores';
import { cn } from '@/lib/utils';
import { VirtualCard } from '@/components/client/VirtualCard';
import { generateQRValue } from '@/lib/qr';

export default function ClientCard() {
  const { user } = useAuthStore();
  const { wallet, fetchWallet } = useWalletStore();

  useEffect(() => {
    if (user) {
      fetchWallet(user.id);
    }
  }, [user, fetchWallet]);
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

  const cardDetails = [
    { label: 'Número de tarjeta', value: cardNumber, mono: true, copyable: true },
    { label: 'Titular', value: cardHolder, uppercase: true },
    { label: 'Fecha de vencimiento', value: expiryDate, mono: true },
    { label: 'Tipo', value: 'Débito Oscorp Premium' },
  ];

  return (
    <div className="pt-6 pb-20 space-y-6 max-w-lg mx-auto px-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight">Mi Tarjeta</h1>
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.15em]">Tarjeta virtual y pagos QR</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowFullscreen(true)}
          className="w-11 h-11 rounded-2xl glass-premium border border-white/10 flex items-center justify-center shadow-lg"
        >
          <Maximize2 className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Unified Virtual Card Component */}
      <VirtualCard
        balance={wallet?.balance || 0}
        cardNumber={cardNumber}
        cardHolder={cardHolder}
        expiryDate={expiryDate}
        cvv="***"
        qrValue={qrValue}
      />

      {/* Quick Actions Row */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={downloadQR}
          className="flex-1 glass-premium rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-2 shadow-lg hover:border-blue-500/20 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Descargar QR</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ''))}
          className="flex-1 glass-premium rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-2 shadow-lg hover:border-emerald-500/20 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-emerald-500" />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">{copied ? 'Copiado' : 'Copiar Nro.'}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFullscreen(true)}
          className="flex-1 glass-premium rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-2 shadow-lg hover:border-purple-500/20 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-purple-500" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Pantalla</span>
        </motion.button>
      </div>

      {/* Card Details */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-1">Detalles de la tarjeta</h3>
        <div className="glass-premium rounded-[2rem] border border-white/10 shadow-xl overflow-hidden divide-y divide-white/5">
          {cardDetails.map((detail, index) => (
            <motion.div
              key={detail.label}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">{detail.label}</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'font-bold text-sm',
                  detail.mono && 'font-mono tracking-wider',
                  detail.uppercase && 'uppercase text-xs tracking-widest'
                )}>
                  {detail.value}
                </span>
                {detail.copyable && (
                  <button
                    onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ''))}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground/40" />}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Info */}
      <div className="glass-premium rounded-[2rem] p-5 border border-emerald-500/10 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 shadow-lg">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm tracking-tight mb-1">Tarjeta segura</p>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Tu tarjeta está protegida con encriptación de 256 bits. Los datos se actualizan automáticamente.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-emerald-500/40" />
          </div>
        </div>
      </div>

      {/* Hidden QR ref for download */}
      <div ref={qrRef} className="hidden">
        <QRCodeSVG value={qrValue} size={400} level="H" includeMargin fgColor="#0d0d0d" />
      </div>

      {/* Fullscreen QR Modal */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'linear-gradient(165deg, #0f172a 0%, #020617 50%, #0f172a 100%)' }}
            onClick={() => setShowFullscreen(false)}
          >
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white/60" />
            </button>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div className="bg-white p-6 rounded-[2rem] shadow-2xl relative">
                  <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-[2rem]" />
                  <QRCodeSVG value={qrValue} size={280} level="H" includeMargin={false} fgColor="#0d0d0d" className="relative z-10" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-black text-white text-lg tracking-tight">{cardHolder}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Escanear para pagar</p>
              </div>
              <Button
                onClick={downloadQR}
                variant="ghost"
                className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
