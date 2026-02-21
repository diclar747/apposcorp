import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Shield, Bell, Wrench, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import { settingsApi } from '@/lib/api';

interface SystemSetting {
    id: string;
    key: string;
    value: string;
    group: string;
    description: string | null;
    isPublic: boolean;
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await settingsApi.get();
            setSettings(data);
        } catch (error) {
            // Settings may not exist yet - show empty state
        } finally {
            setLoading(false);
        }
    };

    const getSettingValue = (key: string, defaultValue: string = '') => {
        const setting = settings.find(s => s.key === key);
        return setting ? setting.value : defaultValue;
    };

    const updateLocalSetting = (key: string, value: string, group: string = 'general', isPublic: boolean = false) => {
        setSettings(prev => {
            const existingIndex = prev.findIndex(s => s.key === key);
            if (existingIndex >= 0) {
                const newSettings = [...prev];
                newSettings[existingIndex] = { ...newSettings[existingIndex], value };
                return newSettings;
            } else {
                return [...prev, { id: 'temp-' + key, key, value, group, description: '', isPublic }];
            }
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsApi.update({ settings });
            toast.success('Configurações salvas com sucesso');
            fetchSettings();
        } catch (error) {
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const initializeDefaults = async () => {
        try {
            setLoading(true);
            await settingsApi.init();
            toast.success('Configurações padrão inicializadas');
            fetchSettings();
        } catch (err) {
            toast.error('Erro ao inicializar');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações do Sistema</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie as configurações globais da plataforma</p>
                </div>
                <div className="flex gap-2">
                    {settings.length === 0 && (
                        <Button variant="outline" onClick={initializeDefaults}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Restaurar Padrões
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="general">Geral</TabsTrigger>
                    <TabsTrigger value="contact">Contato</TabsTrigger>
                    <TabsTrigger value="security">Segurança</TabsTrigger>
                    <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />
                                Informações Básicas
                            </CardTitle>
                            <CardDescription>
                                Configurações visíveis publicamente como nome e descrição do site.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="site_name">Nome do Sistema</Label>
                                <Input
                                    id="site_name"
                                    value={getSettingValue('site_name')}
                                    onChange={(e) => updateLocalSetting('site_name', e.target.value, 'general', true)}
                                    placeholder="Ex: Oscorp System"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="site_description">Descrição</Label>
                                <Textarea
                                    id="site_description"
                                    value={getSettingValue('site_description')}
                                    onChange={(e) => updateLocalSetting('site_description', e.target.value, 'general', true)}
                                    placeholder="Breve descrição do sistema..."
                                />
                            </div>
                            <div className="grid gap-2 pt-4 border-t">
                                <Label htmlFor="ingenio_price">Costo Acceso Ingenio Millonario (Gs)</Label>
                                <Input
                                    id="ingenio_price"
                                    type="number"
                                    value={getSettingValue('ingenio_price', '700000')}
                                    onChange={(e) => updateLocalSetting('ingenio_price', e.target.value, 'general', true)}
                                    placeholder="700000"
                                />
                                <p className="text-xs text-muted-foreground">Define el costo total que verán los usuarios al solicitar acceso.</p>
                            </div>
                            <div className="grid gap-2 pt-4">
                                <Label htmlFor="ingenio_max_installments">Máximo de Cuotas Permitidas</Label>
                                <Select
                                    value={getSettingValue('ingenio_max_installments', '3')}
                                    onValueChange={(value) => updateLocalSetting('ingenio_max_installments', value, 'general', true)}
                                >
                                    <SelectTrigger id="ingenio_max_installments">
                                        <SelectValue placeholder="Seleccionar cuotas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Pago Único</SelectItem>
                                        <SelectItem value="2">Hasta 2 Cuotas</SelectItem>
                                        <SelectItem value="3">Hasta 3 Cuotas</SelectItem>
                                        <SelectItem value="4">Hasta 4 Cuotas</SelectItem>
                                        <SelectItem value="5">Hasta 5 Cuotas</SelectItem>
                                        <SelectItem value="6">Hasta 6 Cuotas</SelectItem>
                                        <SelectItem value="10">Hasta 10 Cuotas</SelectItem>
                                        <SelectItem value="12">Hasta 12 Cuotas</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Define el plan de financiamiento máximo disponible para los clientes.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contact Settings */}
                <TabsContent value="contact">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="w-5 h-5 text-green-500" />
                                Informações de Contato
                            </CardTitle>
                            <CardDescription>
                                Informações de contato exibidas para os usuários.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="contact_email">Email de Suporte</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="contact_email"
                                        className="pl-9"
                                        value={getSettingValue('contact_email')}
                                        onChange={(e) => updateLocalSetting('contact_email', e.target.value, 'contact', true)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contact_phone">Telefone / WhatsApp</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="contact_phone"
                                        className="pl-9"
                                        value={getSettingValue('contact_phone')}
                                        onChange={(e) => updateLocalSetting('contact_phone', e.target.value, 'contact', true)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contact_address">Endereço</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="contact_address"
                                        className="pl-9"
                                        value={getSettingValue('contact_address')}
                                        onChange={(e) => updateLocalSetting('contact_address', e.target.value, 'contact', true)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-red-500" />
                                Segurança e Acesso
                            </CardTitle>
                            <CardDescription>
                                Configurações de segurança e políticas de senha.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Registro de Usuários</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Permitir que novos usuários se registrem na plataforma.
                                    </p>
                                </div>
                                <Switch
                                    checked={getSettingValue('allow_registration', 'true') === 'true'}
                                    onCheckedChange={(checked) => updateLocalSetting('allow_registration', String(checked), 'security', true)}
                                />
                            </div>
                            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Verificação de Email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Exigir verificação de email para novos cadastros.
                                    </p>
                                </div>
                                <Switch
                                    checked={getSettingValue('require_email_verification', 'false') === 'true'}
                                    onCheckedChange={(checked) => updateLocalSetting('require_email_verification', String(checked), 'security', true)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Maintenance Settings */}
                <TabsContent value="maintenance">
                    <Card className="border-red-200 dark:border-red-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <Wrench className="w-5 h-5" />
                                Manutenção do Sistema
                            </CardTitle>
                            <CardDescription>
                                Controle o acesso ao sistema durante manutenções.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold text-red-700 dark:text-red-400">Modo Manutenção</Label>
                                    <p className="text-sm text-red-600/80 dark:text-red-400/80">
                                        Quando ativo, apenas administradores poderão acessar o sistema.
                                    </p>
                                </div>
                                <Switch
                                    checked={getSettingValue('maintenance_mode', 'false') === 'true'}
                                    onCheckedChange={(checked) => updateLocalSetting('maintenance_mode', String(checked), 'maintenance', true)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
