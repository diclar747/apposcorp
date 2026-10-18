import jwt from 'jsonwebtoken';

// Se lee en cada uso (no al importar): en index.ts los imports se evalúan antes de dotenv.config().
const getSecret = (): string => process.env.JWT_SECRET || 'oscorp-secret-key';

/**
 * Sin JWT_SECRET propio cualquiera podría firmar tokens con la clave de desarrollo.
 * No se corta el arranque (el sitio quedaría caído), pero se avisa fuerte en el log para configurarlo.
 */
export const assertJwtConfigured = () => {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('⚠️⚠️  SEGURIDAD: JWT_SECRET no está configurado en producción. Configurarlo cuanto antes.');
  }
};

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  /** Id del superadmin que está gestionando la cuenta de una tienda (modo "Gestionar tienda"). */
  impersonatedBy?: string;
}

export const generateToken = (payload: JWTPayload, expiresIn: string = process.env.JWT_EXPIRES_IN || '7d'): string => {
  return jwt.sign(payload, getSecret(), { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, getSecret()) as JWTPayload;
};
