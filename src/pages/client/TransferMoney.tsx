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
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuthStore, useWalletStore } from '@/stores';
import { formatCurrency, getInitials } from '@/lib/utils';
import { usersApi, walletApi } from '@/lib/api';

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

    const handleProcessTransfer = async () => {
        setIsProcessing(true);
        try {
            if (!selectedUser) return;

            await walletApi.transfer(
                selectedUser.id,
                parseFloat(amount),
                description || `Transferencia para ${selectedUser.firstName}`
            );

            // Refresh data
            if (currentUser) {
                await fetchWallet(currentUser.id);
                await fetchTransactions(currentUser.walletId);
            }

            setStep('success');
            toast.success('¡Transferencia enviada con éxito!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al procesar la transferencia');
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

    return (
        <div className="p-4 space-y-6 max-w-lg mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => step === 'search' ? navigate(-1) : step === 'success' ? navigate('/app/wallet') : setStep(step === 'amount' ? 'search' : 'amount')}
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-xl font-bold">Transferir Dinero</h1>
            </div>

            <AnimatePresence mode="wait">
                {step === 'search' && (
                    <motion.div
                        key="search"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Nombre, email o teléfono..."
                                className="pl-10 h-12 rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">
                                {searchQuery.length < 3 ? 'Escribe al menos 3 letras' : 'Resultados'}
                            </h3>

                            <div className="space-y-1">
                                {isSearching ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((user) => (
                                        <motion.div
                                            key={user.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSelectUser(user)}
                                            className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-slate-900">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                                    {getInitials(user.firstName, user.lastName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    {user.firstName} {user.lastName}
                                                </p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                        </motion.div>
                                    ))
                                ) : searchQuery.length >= 3 ? (
                                    <div className="text-center py-10">
                                        <User className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                                        <p className="text-slate-500 text-sm">No encontramos al usuario</p>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
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
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-blue-500/10">
                                <AvatarImage src={selectedUser.avatar} />
                                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                    {getInitials(selectedUser.firstName, selectedUser.lastName)}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-lg font-bold">Enviar a {selectedUser.firstName}</h2>
                            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                        </div>

                        <div className="premium-card p-6 bg-slate-900 text-white space-y-4">
                            <div className="text-center space-y-1">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Monto a Enviar</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-bold text-blue-400">₲</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="bg-transparent border-none text-5xl font-black focus:outline-none w-full text-center placeholder:text-slate-700"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                                <span className="text-slate-500">Saldo disponible</span>
                                <span className="font-bold text-blue-400">{formatCurrency(wallet?.balance || 0)}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold px-1">Mensaje (opcional)</label>
                                <Input
                                    placeholder="¿Para qué es el dinero?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="rounded-xl h-12"
                                />
                            </div>

                            <Button
                                className="w-full h-14 text-lg font-black bg-blue-600 hover:bg-blue-700 rounded-2xl"
                                onClick={handleNextToConfirm}
                                disabled={!amount || parseFloat(amount) <= 0}
                            >
                                SIGUIENTE <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 'confirm' && selectedUser && (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                            <div className="flex justify-between items-center pb-6 border-b border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-12 h-12">
                                        <AvatarFallback className="bg-slate-100 text-slate-500">
                                            {getInitials(currentUser?.firstName || '', currentUser?.lastName || '')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <p className="text-xs text-muted-foreground">De</p>
                                        <p className="font-bold">Mí</p>
                                    </div>
                                </div>
                                <div className="h-0.5 flex-1 mx-4 bg-slate-100 dark:bg-slate-800 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 p-1">
                                        <Send className="w-4 h-4 text-blue-500" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Para</p>
                                        <p className="font-bold">{selectedUser.firstName}</p>
                                    </div>
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={selectedUser.avatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                            {getInitials(selectedUser.firstName, selectedUser.lastName)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm py-2">
                                    <span className="text-muted-foreground">Monto</span>
                                    <span className="font-bold">{formatCurrency(parseFloat(amount))}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2">
                                    <span className="text-muted-foreground">Comisión</span>
                                    <span className="font-bold text-green-500">Gratis</span>
                                </div>
                                <div className="flex justify-between text-sm py-2">
                                    <span className="text-muted-foreground">Motivo</span>
                                    <span className="font-medium">{description || 'Sin mensaje'}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="font-bold text-lg">Total</span>
                                    <span className="font-black text-2xl text-blue-600 tracking-tighter">
                                        {formatCurrency(parseFloat(amount))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                className="w-full h-16 text-xl font-black bg-blue-600 hover:bg-blue-700 rounded-3xl shadow-xl shadow-blue-500/20"
                                onClick={handleProcessTransfer}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    'CONFIRMAR Y ENVIAR'
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full font-bold text-slate-400"
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
                        className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6"
                    >
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>

                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">¡Transferencia Exitosa!</h2>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                            Has enviado <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(parseFloat(amount))}</span> correctamente a <span className="font-bold text-slate-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</span>.
                        </p>

                        <div className="w-full space-y-3">
                            <Button
                                variant="outline"
                                className="w-full h-12 font-bold rounded-xl"
                                onClick={resetFlow}
                            >
                                REALIZAR OTRA TRANSFERENCIA
                            </Button>
                            <Button
                                className="w-full h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                                onClick={() => navigate('/app/wallet')}
                            >
                                VOLVER AL INICIO
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
