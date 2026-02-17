import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, MapPin, Star, Store as StoreIcon,
    ChevronRight, Filter, ArrowRight, ShieldCheck,
    TrendingUp, Sparkles, ShoppingBag, Clock, Loader2
} from 'lucide-react';
import { storesApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, isStoreOpen } from '@/lib/utils';

const categories = ['Todas', 'Tecnología', 'Moda', 'Gourmet', 'Servicios', 'Hogar'];

export default function ClientStores() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const data = await storesApi.getAll();
                setStores(data);
            } catch (error) {
                console.error('Error fetching stores:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    const filteredStores = useMemo(() => {
        return stores.filter(store => {
            const matchesSearch = (store.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (store.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'Todas' ||
                (store.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        });
    }, [stores, searchTerm, selectedCategory]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-32">
            {/* Hero Section - Marketplace Experience */}
            <section className="relative py-16 md:py-24 overflow-hidden -mt-6">
                <div className="absolute inset-0 bg-blue-600/5 dark:bg-blue-600/10 backdrop-blur-3xl" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-[120px]" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-400/20 rounded-full blur-[100px]" />

                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-2xl text-center md:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-blue-100 dark:border-slate-800 mb-6"
                            >
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Marketplace Oficial Oscorp</span>
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-6 leading-[1.1]"
                            >
                                Tus marcas favoritas, <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent italic">en un solo lugar.</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed"
                            >
                                Explora tiendas verificadas, disfruta de pagos seguros con Oscorp Pay
                                y recibe tus productos con la mayor rapidez del mercado.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="relative group w-full max-w-lg"
                            >
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="¿Qué tienda estás buscando hoy?"
                                    className="pl-14 h-16 bg-white dark:bg-slate-900 border-0 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.06)] dark:shadow-none rounded-[2rem] text-lg focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="hidden lg:block relative"
                        >
                            <div className="relative z-10 p-8 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                                        <TrendingUp className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase">Crecimiento Mensual</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">+245 Tiendas</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-2xl">
                                            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse" />
                                            <div className="space-y-2">
                                                <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                                                <div className="w-16 h-2 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute -inset-4 bg-blue-600/10 blur-2xl rounded-[4rem] -z-10" />
                        </motion.div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 -mt-10">
                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-3 overflow-x-auto pb-4 md:pb-0 scrollbar-hide w-full md:w-auto">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={cn(
                                    "px-8 py-3.5 rounded-2xl transition-all font-black text-sm whitespace-nowrap shadow-sm",
                                    selectedCategory === category
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none translate-y-[-2px]"
                                        : "bg-white dark:bg-slate-900 text-gray-500 hover:text-blue-600 border border-gray-100 dark:border-slate-800"
                                )}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <Button variant="outline" className="h-14 rounded-2xl px-6 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-bold hidden md:flex">
                        <Filter className="w-4 h-4 mr-2" />
                        Más Filtros
                    </Button>
                </div>

                {/* Stores Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <AnimatePresence mode="popLayout">
                        {filteredStores.map((store, index) => (
                            <StoreCard key={store.id} store={store} index={index} />
                        ))}
                    </AnimatePresence>
                </div>
                )}

                {!loading && filteredStores.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-32 bg-white dark:bg-slate-900 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-slate-800"
                    >
                        <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                            <StoreIcon className="w-12 h-12 text-gray-300" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Mmm... no encontramos nada</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">
                            Prueba buscando con términos diferentes o cambia la categoría para explorar más tiendas.
                        </p>
                        <Button
                            variant="link"
                            onClick={() => { setSearchTerm(''); setSelectedCategory('Todas'); }}
                            className="text-blue-600 font-black mt-4 text-lg"
                        >
                            Ver todas las tiendas <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function StoreCard({ store, index }: { store: any, index: number }) {
    const open = isStoreOpen(store.businessHours);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            whileHover={{ y: -10 }}
            className="group relative"
        >
            <Link to={`/app/tienda?store=${store.slug}`} className="block">
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-gray-100 dark:border-slate-800 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] transition-all duration-700 h-full flex flex-col">
                    {/* Cover Image */}
                    <div className="h-44 relative overflow-hidden bg-gray-100">
                        {store.banner ? (
                            <img
                                src={store.banner}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-violet-700 opacity-80" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <div className="absolute top-5 left-5">
                            <Badge className="bg-white/95 backdrop-blur-md text-gray-900 border-0 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                                {store.category || 'General'}
                            </Badge>
                        </div>

                        <div className="absolute top-5 right-5">
                            <div className={cn(
                                "w-3 h-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)]",
                                open ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                            )} />
                        </div>

                        <div className="absolute bottom-4 left-6 flex items-center gap-1.5 text-white">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-black text-sm">{store.rating?.toFixed(1) || '5.0'}</span>
                            <span className="text-white/70 text-xs font-bold">({store.reviewCount || 0})</span>
                        </div>
                    </div>

                    <div className="p-8 pt-10 relative flex-1">
                        {/* Logo Overlay */}
                        <div className="absolute -top-12 right-10 w-24 h-24 p-1.5 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-50 dark:border-slate-800 transition-transform duration-500 group-hover:-translate-y-2">
                            {store.logo ? (
                                <img src={store.logo} className="w-full h-full rounded-[1.8rem] object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-[1.8rem] bg-gray-50 flex items-center justify-center">
                                    <StoreIcon className="w-8 h-8 text-gray-300" />
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                                {store.name}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium line-clamp-2 leading-relaxed">
                                {store.description}
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-50 dark:border-slate-800 mt-auto flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-black uppercase tracking-wider">{(store.address || 'Sin dirección').split(',')[0]}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-black uppercase tracking-wider">{store.productCount || store.products?.length || 0} Productos</span>
                                </div>
                            </div>

                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                <ChevronRight className="w-6 h-6 transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
