import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Users, Bell, Search, Filter, Plus, Smartphone,
    Trash2, Edit, RefreshCw, BarChart, ExternalLink, ImageIcon,
    CheckCircle, AlertCircle, X, Megaphone, Eye, MousePointer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { campaignsApi } from '@/lib/api';
import type { Campaign } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminPushNotifications() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>('dashboard');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Editor State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetRole: 'all',
        actionUrl: '',
        imageUrl: ''
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const data = await campaignsApi.getAll();
            setCampaigns(data);
        } catch (error) {
            toast.error('Error al cargar campañas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingId(campaign.id);
        setFormData({
            title: campaign.title,
            message: campaign.message,
            targetRole: campaign.targetRole,
            actionUrl: campaign.actionUrl || '',
            imageUrl: campaign.imageUrl || ''
        });
        setActiveTab('editor');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta campaña?')) return;
        try {
            await campaignsApi.delete(id);
            toast.success('Campaña eliminada');
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const handleResend = async (id: string) => {
        if (!confirm('¿Reenviar esta campaña a todos los usuarios objetivo?')) return;
        try {
            await campaignsApi.send(id);
            toast.success('Campaña reenviada exitosamente');
            fetchCampaigns();
        } catch (error) {
            toast.error('Error al reenviar');
        }
    };

    const handleSubmit = async (sendNow: boolean) => {
        if (!formData.title || !formData.message) {
            toast.error('Título y mensaje requeridos');
            return;
        }

        try {
            setIsLoading(true);
            const payload = { ...formData, sendNow };

            if (editingId) {
                await campaignsApi.update(editingId, payload);
                toast.success('Campaña actualizada');
            } else {
                await campaignsApi.create(payload);
                toast.success(sendNow ? 'Campaña enviada!' : 'Borrador guardado');
            }

            setEditingId(null);
            setFormData({ title: '', message: '', targetRole: 'all', actionUrl: '', imageUrl: '' });
            setActiveTab('dashboard');
            fetchCampaigns();

        } catch (error: any) {
            toast.error(error.error || 'Error al guardar campaña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">

            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Campañas Push
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona y analiza tus notificaciones masivas.
                    </p>
                </div>

                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            activeTab === 'dashboard'
                                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                        )}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ title: '', message: '', targetRole: 'all', actionUrl: '', imageUrl: '' });
                            setActiveTab('editor');
                        }}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'editor'
                                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                        )}
                    >
                        <Plus className="w-4 h-4" /> Nueva Campaña
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">

                {/* DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid gap-6"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">

                            {/* Stats Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-gray-200 dark:border-slate-800">
                                <div className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Megaphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total Campañas</p>
                                            <h3 className="text-2xl font-bold">{campaigns.length}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Tasa de Apertura</p>
                                            <h3 className="text-2xl font-bold">
                                                {Math.round(campaigns.reduce((acc, c) => acc + (c.stats?.readRate || 0), 0) / (campaigns.length || 1))}%
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                            <MousePointer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Tasa de Clics</p>
                                            <h3 className="text-2xl font-bold">
                                                {Math.round(campaigns.reduce((acc, c) => acc + (c.stats?.clickRate || 0), 0) / (campaigns.length || 1))}%
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Campaigns Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-4">Campaña</th>
                                            <th className="px-6 py-4">Estado</th>
                                            <th className="px-6 py-4">Audiencia</th>
                                            <th className="px-6 py-4 text-center">Enviado</th>
                                            <th className="px-6 py-4 text-center">Vistas</th>
                                            <th className="px-6 py-4 text-center">Clics</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {campaigns.map((campaign) => (
                                            <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {campaign.imageUrl ? (
                                                            <img src={campaign.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                                                                <Bell className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{campaign.title}</p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{campaign.message}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                        campaign.status === 'sent'
                                                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
                                                            : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900"
                                                    )}>
                                                        {campaign.status === 'sent' ? 'Enviado' : 'Borrador'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                        <Users className="w-3 h-3" />
                                                        <span className="capitalize">{campaign.targetRole === 'all' ? 'Todos' : campaign.targetRole}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-gray-500">
                                                    {campaign.stats?.sent || 0}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-medium text-gray-900 dark:text-white">{campaign.stats?.read || 0}</span>
                                                        <span className="text-xs text-gray-400">{campaign.stats?.readRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-medium text-gray-900 dark:text-white">{campaign.stats?.clicked || 0}</span>
                                                        <span className="text-xs text-gray-400">{campaign.stats?.clickRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {campaign.status === 'draft' && (
                                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                                                                <Edit className="w-4 h-4 text-blue-500" />
                                                            </Button>
                                                        )}
                                                        {campaign.status === 'sent' && (
                                                            <Button variant="ghost" size="icon" onClick={() => handleResend(campaign.id)} title="Reenviar">
                                                                <RefreshCw className="w-4 h-4 text-green-500" />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign.id)}>
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {campaigns.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                    No hay campañas creadas aún.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* EDITOR TAB */}
                {activeTab === 'editor' && (
                    <motion.div
                        key="editor"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid lg:grid-cols-2 gap-8"
                    >
                        {/* Form Column */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-border">
                                <h3 className="text-lg font-semibold mb-4">Contenido de la Campaña</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Título</label>
                                        <Input
                                            placeholder="Ej: ¡Oferta Flash de Fin de Semana!"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            maxLength={50}
                                        />
                                        <div className="text-right text-xs text-gray-400 mt-1">{formData.title.length}/50</div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Mensaje</label>
                                        <Textarea
                                            placeholder="Escribe tu mensaje persuasivo aquí..."
                                            className="resize-none h-32"
                                            value={formData.message}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            maxLength={200}
                                        />
                                        <div className="text-right text-xs text-gray-400 mt-1">{formData.message.length}/200</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">Imagen Header (URL)</label>
                                            <div className="relative">
                                                <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <Input
                                                    className="pl-9"
                                                    placeholder="https://..."
                                                    value={formData.imageUrl}
                                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-1.5 block">URL de Acción</label>
                                            <div className="relative">
                                                <ExternalLink className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <Input
                                                    className="pl-9"
                                                    placeholder="/app/ruta o https://..."
                                                    value={formData.actionUrl}
                                                    onChange={e => setFormData({ ...formData, actionUrl: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Audiencia Objetivo</label>
                                        <Select
                                            value={formData.targetRole}
                                            onValueChange={val => setFormData({ ...formData, targetRole: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar audiencia" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos los Usuarios</SelectItem>
                                                <SelectItem value="client">Solo Clientes</SelectItem>
                                                <SelectItem value="seller">Solo Vendedores</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleSubmit(false)}
                                        disabled={isLoading}
                                    >
                                        Guardar Borrador
                                    </Button>
                                    <Button
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => handleSubmit(true)}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Enviando...' : 'Enviar Ahora'} <Send className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Preview Column */}
                        <div className="flex justify-center items-start pt-10 lg:pt-0">
                            <div className="sticky top-10">
                                <div className="text-center mb-4">
                                    <h4 className="font-semibold text-gray-500 uppercase tracking-widest text-xs">Vista Previa Móvil</h4>
                                </div>

                                {/* Iphone Frame */}
                                <div className="relative w-[300px] h-[600px] bg-black rounded-[40px] shadow-2xl border-[8px] border-gray-900 overflow-hidden ring-4 ring-gray-100 dark:ring-slate-800">
                                    {/* Dynamic Island */}
                                    <div className="absolute top-0 inset-x-0 h-6 bg-black z-20 flex justify-center">
                                        <div className="w-24 h-5 bg-black rounded-b-xl"></div>
                                    </div>

                                    {/* Screen Content */}
                                    <div className="w-full h-full bg-slate-50 dark:bg-slate-900 pt-10 px-4 overflow-y-auto">

                                        {/* Fake Header */}
                                        <div className="flex justify-between items-center mb-6 opacity-50">
                                            <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                                            <div className="w-20 h-2 rounded-full bg-gray-300"></div>
                                        </div>

                                        {/* Notification Bubble */}
                                        <motion.div
                                            layout
                                            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-slate-700 space-y-3"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                                                    <img
                                                        src="https://www.oscorp.com.py/assets/images/logos/logo2.png"
                                                        alt="Oscorp"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white">OSCORP</h5>
                                                    <p className="text-xs text-gray-500">Ahora</p>
                                                </div>
                                            </div>

                                            {/* Rich Content Preview */}
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                                                    {formData.title || "Título de la notificación"}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {formData.message || "Aquí aparecerá el mensaje de tu campaña. Escribe algo impactante para tus usuarios."}
                                                </p>
                                            </div>

                                            {/* Image Preview */}
                                            {formData.imageUrl && (
                                                <div className="rounded-lg overflow-hidden mt-3 border border-gray-100 dark:border-slate-700">
                                                    <img
                                                        src={formData.imageUrl}
                                                        alt="Preview"
                                                        className="w-full h-32 object-cover"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                </div>
                                            )}

                                            {formData.actionUrl && (
                                                <div className="pt-2 border-t border-dashed border-gray-100 dark:border-slate-700 mt-2">
                                                    <div className="flex items-center gap-2 text-xs text-blue-500 font-medium">
                                                        <ExternalLink className="w-3 h-3" />
                                                        <span>Abrir: {formData.actionUrl}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>

                                        <div className="mt-8 text-center opacity-30">
                                            <Smartphone className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                            <p className="text-xs text-gray-500">Vista previa en dispositivo</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
