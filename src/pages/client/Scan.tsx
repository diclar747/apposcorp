import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ArrowLeft, CheckCircle, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuthStore, useWalletStore } from '@/stores';
import { formatCurrency } from '@/lib/utils';
import { walletApi } from '@/lib/api';

interface QRData {
    type: 'payment';
    toUserId: string;
    amount: number;
    storeName: string;
}

export default function ClientScan() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { fetchWallet, fetchTransactions } = useWalletStore();

    // States
    const [scanData, setScanData] = useState('');
    const [parsedData, setParsedData] = useState<QRData | null>(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSimulateScan = () => {
        try {
            const data = JSON.parse(scanData);
            if (data.type !== 'payment' || !data.toUserId || !data.amount) {
                toast.error('Código QR inválido');
                return;
            }
            setParsedData(data);
        } catch (e) {
            toast.error('Formato de código inválido');
        }
    };

    const handlePayment = async () => {
        if (!parsedData || !user) return;

        setProcessing(true);
        try {
            // Call API to transfer funds
            await walletApi.transfer(
                parsedData.toUserId,
                parsedData.amount,
                `Pago a ${parsedData.storeName}`
            );

            // Refresh wallet data
            await fetchWallet(user.id);
            await fetchTransactions(user.walletId);

            setSuccess(true);
            toast.success('¡Pago realizado con éxito!');

            // Redirect after delay
            setTimeout(() => {
                navigate('/app/wallet');
            }, 3000);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al procesar el pago');
        } finally {
            setProcessing(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
                >
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">¡Pago Exitoso!</h2>
                <p className="text-slate-500 mb-8">Has pagado {formatCurrency(parsedData?.amount || 0)} a {parsedData?.storeName}</p>
                <Button onClick={() => navigate('/app/wallet')} className="w-full max-w-xs font-bold">
                    VOLVER A LA BILLETERA
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold">Escanear QR</h1>
            </div>

            {!parsedData ? (
                <div className="space-y-6">
                    {/* Simulator Area */}
                    <div className="bg-slate-900 text-white p-8 rounded-3xl aspect-square flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 border-[3px] border-blue-500/30 rounded-3xl m-8 animate-pulse" />
                        <QrCode className="w-16 h-16 opacity-50 mb-4" />
                        <p className="text-sm font-medium opacity-70">Apunta la cámara al código QR <br /> del vendedor</p>

                        {/* Simulation Input Overlay */}
                        <div className="absolute inset-x-8 bottom-8 bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <p className="text-[10px] uppercase font-bold text-blue-300 mb-2">Simulador de Cámara</p>
                            <Input
                                placeholder='Pegar JSON del QR aquí...'
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 mb-2 text-xs"
                                value={scanData}
                                onChange={(e) => setScanData(e.target.value)}
                            />
                            <Button
                                size="sm"
                                className="w-full bg-blue-600 hover:bg-blue-500 font-bold"
                                onClick={handleSimulateScan}
                                disabled={!scanData}
                            >
                                SIMULAR ESCANEO
                            </Button>
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Modo Prueba:</strong> Como no podemos acceder a la cámara en este entorno, copia el código que genera el vendedor y pégalo arriba.
                        </p>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
                            <div className="w-16 h-16 bg-white rounded-xl mx-auto shadow-sm flex items-center justify-center mb-3">
                                <Smartphone className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900">{parsedData.storeName}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Confirmar Pago</p>
                        </div>
                        <div className="p-8 text-center">
                            <p className="text-sm text-slate-400 font-medium uppercase mb-1">Total a Pagar</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                {formatCurrency(parsedData.amount)}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                            onClick={handlePayment}
                            disabled={processing}
                        >
                            {processing ? 'PROCESANDO...' : 'CONFIRMAR PAGO'}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full font-bold text-slate-400"
                            onClick={() => { setParsedData(null); setScanData(''); }}
                            disabled={processing}
                        >
                            CANCELAR
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
