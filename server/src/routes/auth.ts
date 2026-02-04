import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        wallet: true,
        virtualCard: true,
        sellerProfile: true,
        bankData: true,
      },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Conta desativada' });
    }
    
    // Em produção usar bcrypt.compare, aqui simplificado para teste
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address, city, role } = req.body;
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email já registrado' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userCount = await prisma.user.count();
    const cardNumber = `OSC${String(userCount + 1).padStart(6, '0')}`;
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        address,
        city,
        role: role || 'client',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        wallet: {
          create: {
            balance: 0,
            currency: 'USD',
          },
        },
        virtualCard: {
          create: {
            cardNumber,
            qrData: JSON.stringify({ userId: '', cardNumber }),
            design: 'gradient_blue',
          },
        },
      },
      include: {
        wallet: true,
        virtualCard: true,
      },
    });
    
    // Update virtual card with userId
    await prisma.virtualCard.update({
      where: { userId: user.id },
      data: {
        qrData: JSON.stringify({ userId: user.id, cardNumber }),
      },
    });
    
    // If seller, create seller profile
    if (role === 'seller') {
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
        },
      });
    }
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        wallet: true,
        virtualCard: true,
        sellerProfile: true,
        bankData: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Update user
router.put('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, phone, address, city, avatar } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        firstName,
        lastName,
        phone,
        address,
        city,
        avatar,
      },
      include: {
        wallet: true,
        virtualCard: true,
        sellerProfile: true,
        bankData: true,
      },
    });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

export default router;
