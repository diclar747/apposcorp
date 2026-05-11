import { Router } from 'express';
import pkg from 'bcryptjs';
const { compare, hash } = pkg;
import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Helper: fetch user with all relations, with fallback for DB schema mismatches
async function findUserWithRelations(where: { id?: string; email?: string }) {
  // Try full query first
  try {
    return await prisma.user.findUnique({
      where: where as any,
      include: {
        wallet: true,
        virtualCard: true,
        sellerProfile: { include: { plan: true } },
        bankData: true,
        ingenioSubscription: true,
        sellerSubscription: true,
      },
    });
  } catch (e) {
    console.warn('Full user query failed, trying without sellerSubscription:', (e as any)?.message);
  }
  // Fallback without sellerSubscription
  try {
    return await prisma.user.findUnique({
      where: where as any,
      include: {
        wallet: true,
        virtualCard: true,
        sellerProfile: { include: { plan: true } },
        bankData: true,
        ingenioSubscription: true,
      },
    });
  } catch (e) {
    console.warn('Second user query failed, trying minimal includes:', (e as any)?.message);
  }
  // Fallback minimal
  try {
    return await prisma.user.findUnique({
      where: where as any,
      include: {
        wallet: true,
        virtualCard: true,
        sellerProfile: true,
      },
    });
  } catch (e) {
    console.warn('Third user query failed, trying bare query:', (e as any)?.message);
  }
  // Last resort: no includes
  return await prisma.user.findUnique({ where: where as any });
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'El email y la contraseña son obligatorios' });
    }

    const user = await findUserWithRelations({ email });

    // 1. Mensaje Genérico: Evitamos enumeración de usarios
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const isValidPassword = await compare(password, user.password);

    // 1. Mensaje Genérico: Misma respuesta exacta
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Checking status AFTER password match to prevent certain timing attacks
    if (!user.isActive) {
      return res.status(403).json({ error: 'La cuenta ha sido desactivada' });
    }

    // 2. Bloquear no verificados
    if (user.isVerified === false) {
      return res.status(403).json({ error: 'Cuenta no verificada. Por favor, revise su correo electrónico.' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error en el servidor al intentar iniciar sesión' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address, city, roles, initialInterface } = req.body;

    // 1. Mandatory fields validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Campos obligatorios faltantes (email, password, firstName, lastName)' });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // 3. Password strength validation (min 8 chars, 1 number, 1 letter)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, incluir una letra y un número' });
    }

    // 4. Duplicate email validation
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Check if registration is allowed
    const allowRegistration = await prisma.systemSetting.findUnique({
      where: { key: 'allow_registration' }
    });

    if (allowRegistration?.value === 'false') {
      return res.status(403).json({ error: 'El registro de nuevos usuarios está temporalmente deshabilitado.' });
    }

    // Check if email verification is required
    const requireEmailVerification = await prisma.systemSetting.findUnique({
      where: { key: 'require_email_verification' }
    });

    const isVerifiedInitially = requireEmailVerification?.value === 'false';

    const hashedPassword = await hash(password, 10);

    // 5. Generate verification token and expiration
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const cardNumber = `OSC${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const includesWallet = roles?.includes('client') || roles?.includes('seller');
    const includesIngenio = roles?.includes('ingenio');
    const finalRoles = roles || ['client'];

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        address,
        city,
        roles: finalRoles,
        initialInterface: initialInterface || 'OSCORP',
        ingenioAccess: false,
        avatar: null,
        isVerified: isVerifiedInitially,
        verificationToken: isVerifiedInitially ? null : verificationToken,
        verificationTokenExpires: isVerifiedInitially ? null : verificationTokenExpires,
        ...(includesWallet ? {
          wallet: {
            create: {
              balance: 0,
              currency: 'USD',
            },
          },
        } : {}),
      },
      include: {
        wallet: true,
        virtualCard: true,
      },
    });

    if (includesWallet && user.wallet) {
      await prisma.virtualCard.create({
        data: {
          userId: user.id,
          walletId: user.wallet.id,
          cardNumber,
          qrData: JSON.stringify({ userId: user.id, cardNumber }),
          design: 'gradient_blue',
        },
      });
    }

    // If seller, create seller profile with 7-day trial
    if (roles?.includes('seller')) {
      await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          storeName: `${firstName}'s Store`,
          storeSlug: `store-${Date.now()}`,
          description: '',
          address: address || '',
          phone: phone || '',
          email,
          whatsappNumber: phone || '',
          planActive: false,
          planExpiryDate: null,
        },
      });
    }

    // Re-fetch full user with all relations
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        wallet: true,
        virtualCard: true,
        sellerProfile: {
          include: {
            plan: true
          }
        },
        bankData: true,
        ingenioSubscription: true,
      },
    });

    // 6. Real Email Sending via Nodemailer or Demo Mode
    const isDemoMode = !process.env.SMTP_USER || !process.env.SMTP_PASS;

    if (!isVerifiedInitially && !isDemoMode) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verify=${verificationToken}`;

      const mailOptions = {
        from: `"Oscorp Platform" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Oscorp Platform - Verifica tu cuenta',
        text: `Hola ${firstName},\n\nGracias por registrarte. Para iniciar sesión y usar todas nuestras herramientas, por favor verifica tu cuenta de correo electrónico copiando y pegando el siguiente enlace en tu navegador:\n\n${verifyUrl}\n\nSi no solicitaste este registro, por favor ignora este correo.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #1e293b; text-align: center;">¡Bienvenido a Oscorp!</h2>
            <p style="color: #475569; font-size: 16px;">Hola ${firstName},</p>
            <p style="color: #475569; font-size: 16px;">Gracias por registrarte. Para iniciar sesión y usar todas nuestras herramientas, por favor verifica tu cuenta de correo electrónico haciendo clic en el siguiente botón:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verificar mi cuenta</a>
            </div>
            <p style="color: #475569; font-size: 14px;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
            <p style="color: #2563eb; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">Si no solicitaste este registro, por favor ignora este correo.</p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL ENVIADO] Verificación enviada exitosamente a ${email}`);
      } catch (mailError) {
        console.error('[EMAIL ERROR] Error enviando correo de verificación:', mailError);
        // Opcional: Podrías decidir revertir el registro o continuar pero advirtiendo
      }
    } else if (!isVerifiedInitially) {
      console.log('MODO DEMO: Token de verificación ->', verificationToken);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    const { password: _, ...userWithoutPassword } = fullUser!;

    res.status(201).json({
      message: isVerifiedInitially 
        ? 'Registro exitoso.' 
        : (isDemoMode 
          ? 'Registro exitoso (Modo Demo). Use el demoToken para verificar.' 
          : 'Registro exitoso. Se ha enviado un correo de verificación.'),
      token,
      user: userWithoutPassword,
      ...((!isVerifiedInitially && isDemoMode) && { demoToken: verificationToken })
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await findUserWithRelations({ id: req.user!.userId });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get /me error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Update user
router.put('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, phone, address, city, avatar } = req.body;

    // Do the update first with no includes (safe)
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { firstName, lastName, phone, address, city, avatar },
    });

    // Then fetch the full user with relations using safe helper
    const user = await findUserWithRelations({ id: req.user!.userId });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update /me error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


// Change password
router.put('/me/password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la actual' });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]/;
    if (newPassword.length < 8 || !passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres, incluir una letra y un número' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isValid = await compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Verify email
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token de verificación faltante o inválido' });
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o cuenta ya verificada' });
    }

    if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ error: 'El token de verificación ha expirado' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    // Option A: Redirect user to login with success message
    // return res.redirect('/login?verified=true');
    
    // Option B: Just map JSON response
    res.json({ message: 'Cuenta verificada exitosamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Error en el servidor al verificar cuenta' });
  }
});
// Add Role
router.post('/add-role', authenticate, async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Rol requerido' });

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { wallet: true, virtualCard: true, sellerProfile: { include: { plan: true } }, bankData: true }
    });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Validate role
    if (!['client', 'ingenio', 'seller'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Check if user already has role
    if (user.roles.includes(role)) {
      return res.json(user); // Already has it
    }

    const updatedRoles = [...user.roles, role];
    let updateData: any = { roles: updatedRoles };

    if (role === 'client' && !user.wallet) {
      // Create Wallet if adding 'client' role and doesn't exist
      updateData.wallet = { create: { balance: 0, currency: 'USD' } };
    }
    
    // Also change initialInterface to the new one so when they login next, they enter the newly added interface? 
    // Wait, the prompt says "si tiene ambos roles: Llevarlo a la initialInterface guardada". So we leave initialInterface as is, but later on login they could switch it.

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: { wallet: true, virtualCard: true, sellerProfile: { include: { plan: true } }, bankData: true }
    });

    // If we just created the wallet for 'client', create virtual card too
    if (role === 'client' && !user.wallet && updatedUser.wallet) {
      const crypto = await import('crypto');
      const cardNumber = `OSC${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      await prisma.virtualCard.create({
        data: {
          userId: user.id,
          walletId: updatedUser.wallet.id,
          cardNumber,
          qrData: JSON.stringify({ userId: user.id, cardNumber }),
          design: 'gradient_blue',
        },
      });
      // reload user to get the card
      const finalUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { wallet: true, virtualCard: true, sellerProfile: { include: { plan: true } }, bankData: true, ingenioSubscription: true }
      });
      
      const newToken = generateToken({
        userId: finalUser!.id,
        email: finalUser!.email,
        roles: finalUser!.roles,
      });

      const { password: _, ...userWithoutPassword } = finalUser!;
      return res.json({ token: newToken, user: userWithoutPassword });
    }

    const newToken = generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      roles: updatedUser.roles,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ token: newToken, user: userWithoutPassword });
  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({ error: 'Error en el servidor al agregar rol' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Mensaje genérico por seguridad (no confirmar si el email existe)
    if (!user) {
      return res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
    }

    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    const isDemoMode = !process.env.SMTP_USER || !process.env.SMTP_PASS;

    if (!isDemoMode) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"Oscorp Security" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Recuperación de contraseña - Oscorp',
        text: `Has solicitado restablecer tu contraseña.\n\nCopia y pega el siguiente enlace en tu navegador para continuar:\n${resetUrl}\n\nEste enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #1e293b; text-align: center;">Recuperación de Contraseña</h2>
            <p style="color: #475569; font-size: 16px;">Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
            </div>
            <p style="color: #475569; font-size: 14px;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL ENVIADO] Recuperación enviada a ${email}`);
      } catch (mailError) {
        console.error('[EMAIL ERROR] Error enviando recuperación:', mailError);
        // Continuamos de todas formas para que el usuario pueda usar el modo demo o el admin lo ayude
      }
    } else {
      console.log('MODO DEMO: Token de recuperación para', email, '->', resetToken);
    }

    res.json({ 
      message: 'Si el correo está registrado, recibirás un enlace de recuperación.',
      ...(isDemoMode && { demoToken: resetToken })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado' });
    }

    const hashedPassword = await hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
});

export default router;
