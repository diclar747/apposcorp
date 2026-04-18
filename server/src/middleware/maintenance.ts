import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { verifyToken } from '../utils/jwt.js';

export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Skip maintenance check for critical routes
        const skipPaths = [
            '/api/settings/public',
            '/api/auth',
            '/api/health',
            '/api/setup'
        ];

        if (skipPaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        const maintenanceSetting = await prisma.systemSetting.findUnique({
            where: { key: 'maintenance_mode' }
        });

        if (maintenanceSetting?.value === 'true') {
            // Try to see if user is superadmin
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                try {
                    const decoded = verifyToken(token);
                    if (decoded && decoded.roles.includes('superadmin')) {
                        return next();
                    }
                } catch (e) {
                    // Invalid token, treat as guest
                }
            }

            return res.status(503).json({
                error: 'MAINTENANCE_MODE',
                message: 'El sistema se encuentra en mantenimiento. Por favor, intente más tarde.'
            });
        }

        next();
    } catch (error) {
        console.error('Maintenance check error:', error);
        next();
    }
};
