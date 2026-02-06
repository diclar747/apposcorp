import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Middleware to ensure only admins access campaigns
router.use(authenticate, authorize('superadmin'));

// GET / - List all campaigns with stats
router.get('/', async (req, res) => {
    try {
        const campaigns = await prisma.campaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { notifications: true }
                }
            }
        });

        // Aggregate stats efficiently
        const result = await Promise.all(campaigns.map(async (c) => {
            try {
                // Use simple counts instead of groupBy to avoid potential issues
                const read = await prisma.notification.count({
                    where: { campaignId: c.id, isRead: true }
                });

                const clickedCount = await prisma.notification.count({
                    where: { campaignId: c.id, clickedAt: { not: null } }
                });

                const sent = c._count.notifications;

                return {
                    ...c,
                    stats: {
                        sent,
                        read,
                        clicked: clickedCount,
                        readRate: sent > 0 ? Math.round((read / sent) * 100) : 0,
                        clickRate: read > 0 ? Math.round((clickedCount / read) * 100) : 0
                    }
                };
            } catch (err) {
                console.error(`Error calculating stats for campaign ${c.id}:`, err);
                // Return campaign with zero stats on error to prevent full failure
                return {
                    ...c,
                    stats: { sent: 0, read: 0, clicked: 0, readRate: 0, clickRate: 0 }
                };
            }
        }));

        res.json(result);
    } catch (error) {
        console.error('Get campaigns error:', error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        res.status(500).json({ error: 'Falha ao buscar campanhas', details: error instanceof Error ? error.message : String(error) });
    }
});

// POST / - Create Campaign (Draft or Send)
router.post('/', async (req: AuthRequest, res) => {
    try {
        const { title, message, imageUrl, actionUrl, targetRole, sendNow } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
        }

        const campaign = await prisma.campaign.create({
            data: {
                title,
                message,
                imageUrl,
                actionUrl,
                targetRole,
                status: sendNow ? 'sent' : 'draft',
                sentAt: sendNow ? new Date() : null,
                createdBy: req.user!.userId
            }
        });

        if (sendNow) {
            // Trigger send logic
            await sendCampaignNotifications(campaign.id);
        }

        res.json(campaign);
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: 'Falha ao criar campanha' });
    }
});

// PUT /:id - Update Campaign (Draft only)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, imageUrl, actionUrl, targetRole } = req.body;

        const campaign = await prisma.campaign.findUnique({ where: { id } });
        if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
        if (campaign.status === 'sent') return res.status(400).json({ error: 'Não é possível editar uma campanha já enviada' });

        const updated = await prisma.campaign.update({
            where: { id },
            data: { title, message, imageUrl, actionUrl, targetRole }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar campanha' });
    }
});

// DELETE /:id - Delete Campaign
router.delete('/:id', async (req, res) => {
    try {
        await prisma.campaign.delete({ where: { id: req.params.id } });
        res.json({ message: 'Campanha excluída' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir campanha' });
    }
});

// POST /:id/send - Send Draft Campaign
router.post('/:id/send', async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await prisma.campaign.findUnique({ where: { id } });

        if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
        if (campaign.status === 'sent') return res.status(400).json({ error: 'Campanha já enviada' });

        await prisma.campaign.update({
            where: { id },
            data: { status: 'sent', sentAt: new Date() }
        });

        await sendCampaignNotifications(id);

        res.json({ message: 'Campanha enviada com sucesso' });
    } catch (error) {
        console.error('Send error:', error);
        res.status(500).json({ error: 'Erro ao enviar campanha' });
    }
});

// Helper function to create notifications
async function sendCampaignNotifications(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return;

    const where: any = {};
    if (campaign.targetRole && campaign.targetRole !== 'all') {
        where.role = campaign.targetRole;
    }

    const users = await prisma.user.findMany({
        where,
        select: { id: true }
    });

    if (users.length === 0) return;

    const notificationsData = users.map(user => ({
        userId: user.id,
        campaignId: campaign.id,
        title: campaign.title,
        message: campaign.message,
        imageUrl: campaign.imageUrl,
        actionUrl: campaign.actionUrl,
        type: 'campaign',
        isRead: false
    }));

    await prisma.notification.createMany({
        data: notificationsData
    });
}

export default router;
