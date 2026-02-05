
import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// PATCH /:id/click - Mark notification as clicked
router.patch('/:id/click', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        // Ensure the notification belongs to the user
        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification || notification.userId !== req.user!.userId) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }

        if (!notification.clickedAt) {
            await prisma.notification.update({
                where: { id },
                data: {
                    clickedAt: new Date(),
                    isRead: true
                }
            });
        }

        res.json({ message: 'Click registrado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar click' });
    }
});

// Broadcast Notification (Admin only)
router.post('/broadcast', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
    try {
        const { title, message, targetRole, actionUrl } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
        }

        // Determine target users
        const where: any = {};
        if (targetRole && targetRole !== 'all') {
            where.role = targetRole;
        }

        const users = await prisma.user.findMany({
            where,
            select: { id: true }
        });

        if (users.length === 0) {
            return res.json({ message: 'Nenhum usuário encontrado para enviar notificação', count: 0 });
        }

        // Create notifications in batch
        // Prisma createMany is supported for simple inserts
        const notificationsData = users.map(user => ({
            userId: user.id,
            title,
            message,
            type: 'campaign',
            actionUrl: actionUrl || null,
            isRead: false
        }));

        await prisma.notification.createMany({
            data: notificationsData
        });

        res.json({
            message: 'Campanha enviada com sucesso',
            count: users.length
        });

    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Get all notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user!.userId },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to last 50
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Mark as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;

        // Verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }

        if (notification.userId !== req.user!.userId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Mark all as read
router.patch('/read-all', authenticate, async (req: AuthRequest, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user!.userId, isRead: false },
            data: { isRead: true },
        });

        res.json({ message: 'Todas as notificações marcadas como lidas' });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

export default router;
