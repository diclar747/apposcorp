import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Search,
    User,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Send,
    Loader2,
    ChevronRight,
    Sparkles,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuthStore, useWalletStore } from '@/stores';
import { formatCurrency, getInitials } from '@/lib/utils';
import { usersApi, walletApi } from '@/lib/api';
import { PinDialog } from '@/components/client/PinDialog';

const stepLabels = ['Buscar', 'Monto', 'Confirmar', 'Listo'];

export default function TransferMoney() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const { wallet, fetchWallet, fetchTransactions } = useWalletStore();

    const [step, setStep] = useState<'search' | 'amount' | 'confirm' | 'success'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [pinMode, setPinMode] = useState<'setup' | 'verify'>('verify');
    const [hasPin, setHasPin] = useState<boolean | null>(null);

    // Check PIN status on mount
    useEffect(() => {
        walletApi.getPinStatus().then((r) => setHasPin(r.hasPin)).catch(() => setHasPin(false));
    }, []);

    // Search logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                setIsSearching(true);
                try {
                    const results = await usersApi.search(searchQuery);
                    setSearchResults(results);
                } catch (error) {
                    console.error(error);
                    toast.error('Error al buscar usuarios');
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setStep('amount');
    };

    const handleNextToConfirm = () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            toast.error('Ingresa un monto válido');
            return;
        }
        if (numAmount > (wallet?.balance || 0)) {
            toast.error('Saldo insuficiente');
            return;
        }
        setStep('confirm');
    };

    const handleProcessTransfer = () => {
        if (hasPin === false) {
            setPinMode('setup');
        } else {
            setPinMode('verify');
        }
        setShowPinDialog(true);
    };

    const handlePinSubmit = async (pin: string): Promise<boolean> => {
        if (pinMode === 'setup') {
            try {
                await walletApi.setPin(pin);
                setHasPin(true);
                toast.success('PIN configurado correctamente');
                setPinMode('verify');
                return true;
            } catch (e: any) {
                toast.error(e.message || 'Error al configurar PIN');
                return false;
            }
        }

        // Verify mode — do the actual transfer
        setShowPinDialog(false);
        setIsProcessing(true);
        try {
            if (!selectedUser) return false;

            await walletApi.transfer(
                selectedUser.id,
                parseFloat(amount),
                description || `Transferencia para ${selectedUser.firstName}`,
                pin
            );

            if (currentUser) {
                await fetchWallet(currentUser.id);
                if (currentUser.walletId) await fetchTransactions(currentUser.walletId);
            }

            setStep('success');
            toast.success('¡Transferencia enviada con éxito!');
            return true;
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al procesar la transferencia');
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    const resetFlow = () => {
        setStep('search');
        setSelectedUser(null);
        setAmount('');
        setSearchQuery('');
        setDescription('');
    };

    const stepIndex = step === 'search' ? 0 : step === 'amount' ? 1 : step === 'confirm' ? 2 : 3;

    return (
        <div className="pt-6 pb-20 space-y-6 max-w-lg mx-auto px-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => step === 'search' ? navigate(-1) : step === 'success' ? navigate('/app/wallet') : setStep(step === 'amount' ? 'search' : 'amount')}
                    className="w-11 h-11 rounded-2xl glass-premium border border-white/10 flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <div className="flex-1">
                    <h1 className="text-xl font-black tracking-tight">Transferir</h1>
                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.15em]">Envío instantáneo</p>
                </div>
            </div>

            {/* Step Progress Indicator */}
            {step !== 'success' && (
                <div className="flex items-center gap-2 px-2">
                    {stepLabels.slice(0, 3).map((label, index) => (
                        <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full h-1 rounded-full overflow-hidden bg-white/5">
                                <motion.div
                                    className="h-full rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{
                                        width: index < stepIndex ? '100%' : index === stepIndex ? '50%' : '0%',
                                        backgroundColor: index <= stepIndex ? '#3b82f6' : 'rgba(255,255,255,0.1)'
                                    }}
                                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                                />
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${index <= stepIndex ? 'text-blue-500' : 'text-muted-foreground/30'}`}>
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {step === 'search' && (
                    <motion.div
                        key="search"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-5"
                    >
                        {/* Search Input */}
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Search className="w-4 h-4 text-blue-500" />
                            </div>
                            <Input
                                placeholder="Nombre, email o teléfono..."
                                className="pl-14 h-14 rounded-2xl glass-premium border-white/10 text-sm font-medium placeholder:text-muted-foreground/40 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/30"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-1">
                                {searchQuery.length < 3 ? 'Escribe al menos 3 letras' : 'Resultados'}
                            </h3>

                            <div className="space-y-2">
                                {isSearching ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Buscando...</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((user, index) => (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSelectUser(user)}
                                            className="flex items-center gap-4 p-4 rounded-[1.5rem] glass-premium border border-white/5 cursor-pointer hover:border-blue-500/20 transition-all group shadow-lg"
                                        >
                                            <Avatar className="w-12 h-12 ring-2 ring-blue-500/10 shadow-lg">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                                                    {getInitials(user.firstName, user.lastName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm tracking-tight truncate">
                                                    {user.firstName} {user.lastName}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest truncate">{user.email}</p>
                                            </div>
                                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </motion.div>
                                    ))
                                ) : searchQuery.length >= 3 ? (
                                    <div className="text-center py-12 space-y-3">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                                            <User className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-muted-foreground/60 text-xs font-bold uppercase tracking-widest">No encontrado</p>
                                    </div>
                                ) : (
                                    <div className="glass-premium rounded-[1.5rem] p-5 border border-blue-500/10 flex gap-4 items-start shadow-lg">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <p className="text-xs text-muted-foreground/70 leading-relaxed font-medium">
                                            Busca a otros usuarios de Oscorp por su nombre, correo electrónico o número de teléfono registrado.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'amount' && selectedUser && (
                    <motion.div
                        key="amount"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Recipient */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <Avatar className="w-20 h-20 ring-4 ring-blue-500/10 shadow-2xl">
                                    <AvatarImage src={selectedUser.avatar} />
                                    <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black">
                                        {getInitials(selectedUser.firstName, selectedUser.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 border-2 border-background flex items-center justify-center shadow-lg">
                                    <Send className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-lg font-black tracking-tight">Enviar a {selectedUser.firstName}</h2>
                                <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">{selectedUser.email}</p>
                            </div>
                        </div>

                        {/* Amount Input Card */}
                        <div
                            className="rounded-[2rem] p-6 space-y-5 relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(165deg, #1e293b 0%, #0f172a 40%, #020617 100%)',
                                boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {/* Decorative blur */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" />

                            <div className="relative z-10">
                                <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em] text-center mb-4">Monto a enviar</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-black text-blue-400">₲</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="bg-transparent border-none text-5xl font-black text-white focus:outline-none w-full text-center placeholder:text-white/10 tracking-tighter"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="relative z-10 pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.15em]">Saldo disponible</span>
                                <span className="font-black text-sm text-blue-400 tracking-tight">{formatCurrency(wallet?.balance || 0)}</span>
                            </div>
                        </div>

                        {/* Description + Next */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-1">Mensaje (opcional)</label>
                                <Input
                                    placeholder="¿Para qué es el dinero?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="rounded-2xl h-14 glass-premium border-white/10 text-sm font-medium placeholder:text-muted-foreground/40 focus-visible:ring-blue-500/30"
                                />
                            </div>

                            <motion.div whileTap={{ scale: 0.98 }}>
                                <Button
                                    className="w-full h-14 text-sm font-black uppercase tracking-[0.15em] bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-500/20"
                                    onClick={handleNextToConfirm}
                                    disabled={!amount || parseFloat(amount) <= 0}
                                >
                                    SIGUIENTE <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {step === 'confirm' && selectedUser && (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Confirm Card */}
                        <div className="glass-premium rounded-[2.5rem] p-6 border border-white/10 shadow-2xl space-y-6 overflow-hidden relative">
                            {/* Decorative */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />

                            {/* Transfer Flow Visual */}
                            <div className="flex items-center justify-between pb-6 border-b border-white/5 relative z-10">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-12 h-12 ring-2 ring-white/10">
                                        <AvatarFallback className="bg-white/5 text-foreground/60 text-sm font-bold">
                                            {getInitials(currentUser?.firstName || '', currentUser?.lastName || '')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <p className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">De</p>
                                        <p className="font-black text-sm tracking-tight">Mí</p>
                                    </div>
                                </div>

                                <div className="flex-1 mx-4 flex items-center justify-center">
                                    <div className="flex items-center gap-1">
                                        <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-blue-500/40" />
                                        <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                                            <Zap className="w-3.5 h-3.5 text-blue-500" />
                                        </div>
                                        <div className="w-8 h-[1px] bg-gradient-to-r from-blue-500/40 to-transparent" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">Para</p>
                                        <p className="font-black text-sm tracking-tight">{selectedUser.firstName}</p>
                                    </div>
                                    <Avatar className="w-12 h-12 ring-2 ring-blue-500/10">
                                        <AvatarImage src={selectedUser.avatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                                            {getInitials(selectedUser.firstName, selectedUser.lastName)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4 relative z-10">
                                {[
                                    { label: 'Monto', value: formatCurrency(parseFloat(amount)), bold: true },
                                    { label: 'Comisión', value: 'Gratis', accent: true },
                                    { label: 'Motivo', value: description || 'Sin mensaje' },
                                ].map((item) => (
                                    <div key={item.label} className="flex justify-between items-center py-2">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">{item.label}</span>
                                        <span className={`font-bold text-sm ${item.accent ? 'text-emerald-500' : item.bold ? 'text-foreground' : 'text-foreground/80'}`}>
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="font-black text-xs uppercase tracking-[0.15em]">Total</span>
                                    <span className="font-black text-2xl text-blue-500 tracking-tighter">
                                        {formatCurrency(parseFloat(amount))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <motion.div whileTap={{ scale: 0.98 }}>
                                <Button
                                    className="w-full h-16 text-sm font-black uppercase tracking-[0.15em] bg-blue-600 hover:bg-blue-700 rounded-[2rem] shadow-xl shadow-blue-500/20"
                                    onClick={handleProcessTransfer}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 mr-3" />
                                            CONFIRMAR Y ENVIAR
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                            <Button
                                variant="ghost"
                                className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground"
                                onClick={() => setStep('amount')}
                                disabled={isProcessing}
                            >
                                VOLVER
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'success' && selectedUser && (
                    <motion.div
                        key="success"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
                    >
                        {/* Success Animation */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                            className="relative mb-8"
                        >
                            <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                                >
                                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                                </motion.div>
                            </div>
                            {/* Decorative ring */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.3, opacity: 0 }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 rounded-full border-2 border-emerald-500/20"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2 mb-8"
                        >
                            <h2 className="text-2xl font-black tracking-tight">¡Transferencia Exitosa!</h2>
                            <p className="text-muted-foreground/60 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                                Has enviado <span className="font-black text-foreground">{formatCurrency(parseFloat(amount))}</span> a{' '}
                                <span className="font-black text-foreground">{selectedUser.firstName} {selectedUser.lastName}</span>
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="w-full space-y-3"
                        >
                            <Button
                                variant="outline"
                                className="w-full h-14 font-black text-xs uppercase tracking-[0.15em] rounded-2xl border-white/10 glass-premium hover:bg-white/5"
                                onClick={resetFlow}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                NUEVA TRANSFERENCIA
                            </Button>
                            <Button
                                className="w-full h-14 font-black text-xs uppercase tracking-[0.15em] bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-500/20"
                                onClick={() => navigate('/app/wallet')}
                            >
                                VOLVER AL INICIO
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <PinDialog
                open={showPinDialog}
                onClose={() => setShowPinDialog(false)}
                mode={pinMode}
                onPinSubmit={handlePinSubmit}
            />
        </div>
    );
}
