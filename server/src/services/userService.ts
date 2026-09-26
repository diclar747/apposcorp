import crypto from 'crypto';
import pkg from 'bcryptjs';
import type { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { generateStoreSlug } from '../utils/slug.js';
const { hash } = pkg;

// Roles que alguien puede elegir al registrarse solo. 'superadmin' únicamente lo asigna otro superadmin.
export const PUBLIC_ROLES: UserRole[] = ['client', 'seller', 'ingenio'];
export const ALL_ROLES: UserRole[] = ['client', 'seller', 'ingenio', 'superadmin'];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]/;

export const validatePassword = (password: string): string | null => {
  if (!password || password.length < 8 || !PASSWORD_REGEX.test(password)) {
    return 'La contraseña debe tener al menos 8 caracteres, incluir una letra y un número';
  }
  return null;
};

/** Filtra los roles pedidos contra los permitidos. Devuelve null si alguno no está permitido. */
export const sanitizeRoles = (requested: unknown, allowed: UserRole[]): UserRole[] | null => {
  if (requested === undefined || requested === null) return ['client'];
  if (!Array.isArray(requested) || requested.length === 0) return null;
  const unique = [...new Set(requested as string[])];
  if (unique.some((r) => !allowed.includes(r as UserRole))) return null;
  return unique as UserRole[];
};

const newCardNumber = () => `OSC${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * Crea la billetera (y su tarjeta virtual) si el usuario no tiene. Idempotente.
 * Acepta un cliente de transacción para usarse dentro de otra operación.
 */
export const ensureWallet = async (userId: string, tx: Prisma.TransactionClient = prisma) => {
  const existing = await tx.wallet.findUnique({ where: { userId } });
  if (existing) return existing;

  const wallet = await tx.wallet.create({ data: { userId, balance: 0, currency: 'PYG' } });
  const hasCard = await tx.virtualCard.findUnique({ where: { userId } });
  if (!hasCard) {
    const cardNumber = newCardNumber();
    await tx.virtualCard.create({
      data: {
        userId,
        walletId: wallet.id,
        cardNumber,
        qrData: JSON.stringify({ userId, cardNumber }),
        design: 'gradient_blue',
      },
    });
  }
  return wallet;
};

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  roles: UserRole[];
  initialInterface?: string;
  isVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  /** Solo para roles con 'seller': nombre real de la tienda, si ya se conoce (así el enlace sale legible desde el inicio). */
  storeName?: string;
}

/** Crea el usuario con billetera, tarjeta y perfil de vendedor según sus roles. */
export const createUserAccount = async (input: CreateUserInput) => {
  const hashedPassword = await hash(input.password, 10);
  const needsWallet = input.roles.includes('client') || input.roles.includes('seller');

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        address: input.address,
        city: input.city,
        roles: input.roles,
        initialInterface: input.initialInterface || 'OSCORP',
        ingenioAccess: false,
        avatar: null,
        isVerified: input.isVerified,
        verificationToken: input.isVerified ? null : input.verificationToken ?? null,
        verificationTokenExpires: input.isVerified ? null : input.verificationTokenExpires ?? null,
      },
    });

    if (needsWallet) await ensureWallet(user.id, tx);

    if (input.roles.includes('seller')) {
      const storeName = input.storeName?.trim() || `${input.firstName}'s Store`;
      await tx.sellerProfile.create({
        data: {
          userId: user.id,
          storeName,
          storeSlug: await generateStoreSlug(storeName),
          description: '',
          address: input.address || '',
          phone: input.phone || '',
          email: input.email,
          whatsappNumber: input.phone || '',
          planActive: false,
          planExpiryDate: null,
        },
      });
    }

    return user;
  });
};
