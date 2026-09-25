import jwt from 'jsonwebtoken';

// Se lee en cada uso (no al importar): en index.ts los imports se evalúan antes de dotenv.config().
const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // Sin secreto propio, cualquiera podría firmar tokens con la clave de desarrollo.
      throw new Error('JWT_SECRET no está configurado en producción');
    }
    return 'oscorp-secret-key';
  }
  return secret;
};

export const assertJwtConfigured = () => {
  getSecret();
};

export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
}

export const generateToken = (payload: JWTPayload): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, getSecret(), { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, getSecret()) as JWTPayload;
};
