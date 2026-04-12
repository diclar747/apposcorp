import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from './auth.js';

export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Special case: Super Admin has global access to everything
        if (req.user?.roles.includes('superadmin')) {
            return next();
        }

        // Check user record for full access flag (legacy or manually activated)
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: { ingenioAccess: true }
        });

        if (user?.ingenioAccess) {
            return next();
        }

        // Check for an ACTIVE subscription as a backup
        const sub = await prisma.ingenioSubscription.findUnique({
            where: { userId: req.user!.userId }
        });

        if (sub?.status === 'ACTIVE') {
            return next();
        }

        return res.status(403).json({
            error: 'Suscripción requerida',
            message: 'Debes adquirir el Acceso a Ingenio Millonario para realizar esta acción.',
            code: 'REQUIRES_SUBSCRIPTION'
        });
    } catch (error) {
        console.error('Error in requireActiveSubscription:', error);
        res.status(500).json({ error: 'Error al verificar suscripción' });
    }
};
