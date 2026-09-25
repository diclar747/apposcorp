import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// El token dura días, así que en cada request se revisa en la base que el usuario siga activo
// y se toman sus roles actuales (no los del token). Un caché corto evita una consulta por request:
// desactivar a alguien o quitarle un rol tarda como mucho ACTIVE_CACHE_MS en aplicarse.
const ACTIVE_CACHE_MS = 30_000;
const activeCache = new Map<string, { active: boolean; roles: string[]; at: number }>();

const getUserState = async (userId: string) => {
  const cached = activeCache.get(userId);
  if (cached && Date.now() - cached.at < ACTIVE_CACHE_MS) return cached;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true, roles: true } });
  const state = { active: !!user?.isActive, roles: (user?.roles as string[]) || [], at: Date.now() };
  activeCache.set(userId, state);
  return state;
};

export const invalidateUserActiveCache = (userId: string) => {
  activeCache.delete(userId);
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let decoded: JWTPayload;
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de autenticación no proporcionado' });
    }

    // verifyToken automatically checks signature and expiration date
    decoded = verifyToken(token);
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'El token ha expirado. Por favor, inicie sesión nuevamente.' });
    }
    return res.status(401).json({ error: 'Token de autenticación inválido' });
  }

  try {
    const state = await getUserState(decoded.userId);
    if (!state.active) {
      return res.status(401).json({ error: 'Tu cuenta está desactivada. Contacta con soporte.' });
    }
    decoded = { ...decoded, roles: state.roles };
  } catch (error) {
    console.error('Auth active-check error:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }

  req.user = decoded;
  next();
};

/** Para rutas públicas que muestran más datos si hay sesión. No falla: sin token válido devuelve null. */
export const getOptionalUser = async (req: Request): Promise<JWTPayload | null> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    const state = await getUserState(decoded.userId);
    return state.active ? { ...decoded, roles: state.roles } : null;
  } catch {
    return null;
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!req.user.roles.some((r: string) => roles.includes(r))) {
      return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
    }

    next();
  };
};
