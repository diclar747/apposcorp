import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    QrCode, ArrowLeft, CheckCircle, Smartphone, AlertCircle,
    Camera, CameraOff, SwitchCamera, Keyboard, Loader2, RefreshCw
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
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

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

const READER_ID = 'qr-reader';

function parseQRContent(text: string): QRData | null {
    // Format 1: JSON from POS -> {"type":"payment","toUserId":"...","amount":...,"storeName":"..."}
    try {
        const data = JSON.parse(text);
        if (data.type === 'payment' && data.toUserId && data.amount) {
            return {
                type: 'payment',
                toUserId: data.toUserId,
                amount: Number(data.amount),
                storeName: data.storeName || 'Comercio',
            };
        }
    } catch {
        // Not JSON, try other formats
    }

    // Format 2: oscorp://pay?user=...&name=...&amount=...&store=...
    if (text.startsWith('oscorp://pay')) {
        try {
            const url = new URL(text.replace('oscorp://', 'https://oscorp.app/'));
            const userId = url.searchParams.get('user');
            const name = url.searchParams.get('name');
            const amount = url.searchParams.get('amount');
            const store = url.searchParams.get('store');
            if (userId && amount) {
                return {
                    type: 'payment',
                    toUserId: userId,
                    amount: Number(amount),
                    storeName: store || name || 'Comercio',
                };
            }
        } catch {
            // Invalid URL
        }
    }

    return null;
}

export default function ClientScan() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { fetchWallet, fetchTransactions } = useWalletStore();

    const [cameraState, setCameraState] = useState<CameraState>('idle');
    const [parsedData, setParsedData] = useState<QRData | null>(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showManualInput, setShowManualInput] = useState(false);
    const [scanData, setScanData] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);
    const hasProcessedRef = useRef(false);

    const stopScanner = useCallback(async () => {
        if (html5QrCodeRef.current && isScanningRef.current) {
            try {
                await html5QrCodeRef.current.stop();
            } catch {
                // Scanner may already be stopped
            }
            isScanningRef.current = false;
        }
    }, []);

    const handleQRDetected = useCallback(async (decodedText: string) => {
        if (hasProcessedRef.current) return;
        hasProcessedRef.current = true;

        const data = parseQRContent(decodedText);
        if (data) {
            await stopScanner();
            setParsedData(data);
            toast.success('Código QR detectado');
        } else {
            hasProcessedRef.current = false;
            toast.error('Código QR no reconocido. Debe ser un QR de pago válido.');
        }
    }, [stopScanner]);

    const startScanner = useCallback(async () => {
        setCameraState('requesting');
        setErrorMessage('');

        try {
            // Check if camera is available
            const devices = await Html5Qrcode.getCameras();
            if (!devices || devices.length === 0) {
                setCameraState('error');
                setErrorMessage('No se encontraron cámaras en este dispositivo.');
                return;
            }

            // Ensure reader element exists
            const readerElement = document.getElementById(READER_ID);
            if (!readerElement) {
                setCameraState('error');
                setErrorMessage('Error al inicializar el escáner.');
                return;
            }

            // Create scanner instance
            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode(READER_ID);
            }

            await html5QrCodeRef.current.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText) => {
                    handleQRDetected(decodedText);
                },
                () => {
                    // QR code not found in frame - this is normal
                }
            );

            isScanningRef.current = true;
            setCameraState('active');
        } catch (err: any) {
            console.error('Camera error:', err);

            if (err?.toString?.()?.includes('NotAllowedError') ||
                err?.toString?.()?.includes('Permission')) {
                setCameraState('denied');
                setErrorMessage('Permiso de cámara denegado. Por favor, habilita el acceso a la cámara en la configuración de tu navegador.');
            } else {
                setCameraState('error');
                setErrorMessage(
                    err?.message || 'No se pudo acceder a la cámara. Verifica que no esté siendo usada por otra aplicación.'
                );
            }
        }
    }, [handleQRDetected]);

    // Handle QR data passed from QRPayment modal via navigation state
    useEffect(() => {
        const state = location.state as { qrData?: string } | null;
        if (state?.qrData) {
            const data = parseQRContent(state.qrData);
            if (data) {
                setParsedData(data);
                // Clear the state so it doesn't re-trigger
                window.history.replaceState({}, document.title);
                return;
            }
        }
    }, [location.state]);

    // Start camera on mount (only if no pre-parsed data)
    useEffect(() => {
        if (parsedData) return; // Don't start camera if we already have data

        startScanner();

        return () => {
            stopScanner();
            if (html5QrCodeRef.current) {
                try {
                    html5QrCodeRef.current.clear();
                } catch {
                    // Ignore cleanup errors
                }
                html5QrCodeRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleManualScan = () => {
        const data = parseQRContent(scanData);
        if (data) {
            stopScanner();
            setParsedData(data);
        } else {
            toast.error('Código QR inválido. Verifica el formato.');
        }
    };

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
            if (user.walletId) {
                await fetchTransactions(user.walletId);
            }

            setSuccess(true);
            toast.success('¡Pago realizado con éxito!');

            setTimeout(() => {
                navigate('/app/wallet');
            }, 3000);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al procesar el pago. Verifica tu saldo.');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        setParsedData(null);
        hasProcessedRef.current = false;
        setScanData('');
        startScanner();
    };

    // Success screen
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
                <p className="text-slate-500 mb-2">
                    Has pagado {formatCurrency(parsedData?.amount || 0)} a {parsedData?.storeName}
                </p>
                <p className="text-xs text-slate-400 mb-8">Redirigiendo a tu billetera...</p>
                <Button onClick={() => navigate('/app/wallet')} className="w-full max-w-xs font-bold">
                    VOLVER A LA BILLETERA
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => { stopScanner(); navigate(-1); }}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold">Escanear QR</h1>
            </div>

            {!parsedData ? (
                <div className="space-y-4">
                    {/* Camera Area */}
                    <div className="bg-slate-900 rounded-3xl overflow-hidden relative">
                        {/* Scanner container */}
                        <div
                            id={READER_ID}
                            className="w-full aspect-square"
                            style={{
                                display: cameraState === 'active' ? 'block' : 'none',
                            }}
                        />

                        {/* Overlay states */}
                        {cameraState !== 'active' && (
                            <div className="w-full aspect-square flex flex-col items-center justify-center text-center p-8">
                                {cameraState === 'idle' || cameraState === 'requesting' ? (
                                    <>
                                        <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                                        <p className="text-white font-medium text-sm">
                                            Solicitando acceso a la cámara...
                                        </p>
                                        <p className="text-white/50 text-xs mt-2">
                                            Permite el acceso cuando el navegador lo solicite
                                        </p>
                                    </>
                                ) : cameraState === 'denied' ? (
                                    <>
                                        <CameraOff className="w-12 h-12 text-red-400 mb-4" />
                                        <p className="text-white font-medium text-sm mb-2">
                                            Acceso a cámara denegado
                                        </p>
                                        <p className="text-white/50 text-xs mb-4 leading-relaxed">
                                            {errorMessage}
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={startScanner}
                                            className="border-white/20 text-white hover:bg-white/10"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Reintentar
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
                                        <p className="text-white font-medium text-sm mb-2">
                                            Error de cámara
                                        </p>
                                        <p className="text-white/50 text-xs mb-4 leading-relaxed">
                                            {errorMessage}
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={startScanner}
                                            className="border-white/20 text-white hover:bg-white/10"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Reintentar
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Scan frame overlay when camera is active */}
                        {cameraState === 'active' && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="relative w-[250px] h-[250px]">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-blue-500 rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-blue-500 rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-blue-500 rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-blue-500 rounded-br-lg" />
                                    {/* Animated scan line */}
                                    <motion.div
                                        className="absolute left-2 right-2 h-0.5 bg-blue-500 shadow-lg shadow-blue-500/50"
                                        animate={{ top: ['8%', '92%', '8%'] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status hint */}
                    {cameraState === 'active' && (
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-3 items-center">
                            <Camera className="w-5 h-5 text-blue-600 shrink-0" />
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>Cámara activa.</strong> Apunta al código QR del vendedor para escanear y pagar.
                            </p>
                        </div>
                    )}

                    {/* Manual input toggle */}
                    <button
                        onClick={() => setShowManualInput(!showManualInput)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 py-2 transition-colors"
                    >
                        <Keyboard className="w-4 h-4" />
                        {showManualInput ? 'Ocultar entrada manual' : 'Ingresar código manualmente'}
                    </button>

                    {/* Manual input fallback */}
                    <AnimatePresence>
                        {showManualInput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                    <p className="text-xs text-slate-500 font-medium">
                                        Si la cámara no funciona, pega el código QR del vendedor aquí:
                                    </p>
                                    <Input
                                        placeholder='Pegar código del QR aquí...'
                                        className="bg-white text-sm"
                                        value={scanData}
                                        onChange={(e) => setScanData(e.target.value)}
                                    />
                                    <Button
                                        size="sm"
                                        className="w-full bg-blue-600 hover:bg-blue-500 font-bold"
                                        onClick={handleManualScan}
                                        disabled={!scanData}
                                    >
                                        PROCESAR CÓDIGO
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                /* Payment confirmation */
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
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    PROCESANDO...
                                </>
                            ) : (
                                'CONFIRMAR PAGO'
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full font-bold text-slate-400"
                            onClick={handleCancel}
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
