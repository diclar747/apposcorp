import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Get all system settings (admin only)
router.get('/', authenticate, authorize('superadmin'), async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            orderBy: { key: 'asc' }
        });

        // Transform array to object for easier frontend consumption { key: value }
        // Or return list if metadata is needed
        // Let's return the list to preserve metadata like groups and descriptions
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
});

// Get public settings (no auth required)
router.get('/public', async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { isPublic: true },
            select: { key: true, value: true }
        });

        const settingsMap = settings.reduce((acc, curr) => ({
            ...acc,
            [curr.key]: curr.value
        }), {});

        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar configurações públicas' });
    }
});

// Update settings (admin only)
router.put('/', authenticate, authorize('superadmin'), async (req, res) => {
    try {
        const { settings } = req.body; // Expects array of { key, value, description?, group?, isPublic? }

        if (!Array.isArray(settings)) {
            return res.status(400).json({ error: 'Formato inválido. Esperado array de configurações.' });
        }

        const updates = [];

        // Process upserts in transaction
        const result = await prisma.$transaction(
            settings.map(setting =>
                prisma.systemSetting.upsert({
                    where: { key: setting.key },
                    update: {
                        value: setting.value,
                        description: setting.description,
                        group: setting.group,
                        isPublic: setting.isPublic
                    },
                    create: {
                        key: setting.key,
                        value: setting.value,
                        description: setting.description,
                        group: setting.group || 'general',
                        isPublic: setting.isPublic || false
                    }
                })
            )
        );

        res.json(result);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
});

// Initialize default settings (can be called on setup)
router.post('/init', authenticate, authorize('superadmin'), async (req, res) => {
    try {
        const defaultSettings = [
            { key: 'site_name', value: 'Oscorp System', group: 'general', isPublic: true, description: 'Nome do Sistema' },
            { key: 'site_description', value: 'Sistema de Gestão Completo', group: 'general', isPublic: true, description: 'Descrição do Sistema' },
            { key: 'contact_email', value: 'admin@oscorp.com', group: 'general', isPublic: true, description: 'Email de Contato' },
            { key: 'maintenance_mode', value: 'false', group: 'maintenance', isPublic: true, description: 'Modo Manutenção' },
        ];

        const result = await prisma.$transaction(
            defaultSettings.map(setting =>
                prisma.systemSetting.upsert({
                    where: { key: setting.key },
                    update: {}, // Don't overwrite if exists
                    create: setting
                })
            )
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao inicializar configurações' });
    }
});

export default router;
