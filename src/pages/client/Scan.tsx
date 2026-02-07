import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Smartphone, Camera, VideoOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
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

function parseQRData(text: string): QRData | null {
    // Try JSON format (from POS wallet payment QR)
    try {
        const data = JSON.parse(text);
        if (data.type === 'payment' && data.toUserId && data.amount) {
            return data as QRData;
        }
    } catch { /* not JSON */ }

    // Try oscorp:// URL format (from "Mi QR" display)
    try {
        if (text.startsWith('oscorp://pay?')) {
            const params = new URLSearchParams(text.split('?')[1]);
            const userId = params.get('user');
            const name = params.get('name');
            if (userId) {
                return {
                    type: 'payment',
                    toUserId: userId,
                    amount: 0,
                    storeName: name ? decodeURIComponent(name) : 'Usuario',
                };
            }
        }
    } catch { /* not a valid URL */ }

    return null;
}

export default function ClientScan() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { fetchWallet, fetchTransactions } = useWalletStore();

    const [parsedData, setParsedData] = useState<QRData | null>(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(true);

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

        // Poll for DOM element to be ready
        let container: HTMLElement | null = null;
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 200));
            if (!mountedRef.current) return;
            container = document.getElementById('qr-reader');
            if (container) break;
        }
        if (!container || !mountedRef.current) return;

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        const onSuccess = (decodedText: string) => {
            const data = parseQRData(decodedText);
            if (data) {
                stopScanner();
                setParsedData(data);
                toast.success('Codigo QR detectado!');
            }
        };
        const onError = () => { /* QR not found in frame - expected */ };

        // Try rear camera first, then fallback to any available camera
        try {
            await scanner.start({ facingMode: 'environment' }, config, onSuccess, onError);
            return;
        } catch (e) {
            console.warn('Rear camera failed, trying fallback:', e);
        }

        try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
                const backCam = cameras.find(c =>
                    c.label.toLowerCase().includes('back') ||
                    c.label.toLowerCase().includes('rear') ||
                    c.label.toLowerCase().includes('environment')
                );
                await scanner.start(
                    backCam ? backCam.id : cameras[cameras.length - 1].id,
                    config, onSuccess, onError
                );
                return;
            }
        } catch (e) {
            console.warn('Camera fallback also failed:', e);
        }

        if (!mountedRef.current) return;
        scannerRef.current = null;
        setCameraError('No se pudo acceder a la camara. Verifica los permisos en tu navegador.');
    }, [stopScanner]);

    // Check for data passed via navigation state (from QRPayment modal)
    useEffect(() => {
        const stateData = location.state?.qrData;
        if (stateData) {
            const data = parseQRData(stateData);
            if (data) {
                setParsedData(data);
            }
        }
    }, [location.state]);

    // Start scanner on mount when no data; stop on unmount
    useEffect(() => {
        mountedRef.current = true;
        if (!parsedData && !success) {
            startScanner();
        }
        return () => {
            mountedRef.current = false;
            stopScanner();
        };
    }, [parsedData, success, startScanner, stopScanner]);

    const handlePayment = async () => {
        if (!parsedData || !user) return;

        setProcessing(true);
        try {
            await walletApi.transfer(
                parsedData.toUserId,
                parsedData.amount,
                `Pago a ${parsedData.storeName}`
            );

            await fetchWallet(user.id);
            await fetchTransactions(user.walletId);

            setSuccess(true);
            toast.success('Pago realizado con exito!');

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
                <h2 className="text-2xl font-black text-slate-900 mb-2">Pago Exitoso!</h2>
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
                    {/* Camera Scanner */}
                    <div className="bg-slate-900 rounded-3xl overflow-hidden relative">
                        <div
                            id="qr-reader"
                            className="qr-scanner-container w-full"
                        />

                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
                                <VideoOff className="w-16 h-16 text-slate-500 mb-4" />
                                <p className="text-white text-sm font-medium mb-4">{cameraError}</p>
                                <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-500"
                                    onClick={() => startScanner()}
                                >
                                    <Camera className="w-4 h-4 mr-2" />
                                    Reintentar
                                </Button>
                            </div>
                        )}
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        Apunta tu camara al codigo QR del vendedor para pagar
                    </p>
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
                            onClick={() => { setParsedData(null); }}
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
