import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../services/pushService.js';

const router = Router();

// Get all transactions (Admin only)
router.get('/all-transactions', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

// Get wallet of current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Billetera no encontrada' });
    }

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Get transactions
router.get('/transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { limit = '20', offset = '0' } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Deposit money to wallet
router.post('/deposit', authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount, description } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Billetera no encontrada' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          totalIn: { increment: amount },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user!.userId,
          type: 'deposit',
          amount,
          description: description || 'Depósito',
          status: 'completed',
        },
      });

      return updatedWallet;
    });

    // Push notification for deposit
    sendPushToUser(req.user!.userId, {
      title: 'Deposito acreditado',
      body: `Se acreditaron ₲${amount.toLocaleString()} a tu billetera`,
      url: '/app/wallet',
      tag: 'deposit',
    }).catch(() => {});

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Check if user has PIN set
router.get('/pin-status', authenticate, async (req: AuthRequest, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
      select: { transactionPin: true },
    });
    if (!wallet) return res.status(404).json({ error: 'Billetera no encontrada' });
    res.json({ hasPin: !!wallet.transactionPin });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Set transaction PIN (first time)
router.post('/pin/set', authenticate, async (req: AuthRequest, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos' });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!wallet) return res.status(404).json({ error: 'Billetera no encontrada' });
    if (wallet.transactionPin) {
      return res.status(400).json({ error: 'Ya tienes un PIN configurado' });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPin = await bcrypt.hash(pin, 10);

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { transactionPin: hashedPin },
    });

    res.json({ message: 'PIN configurado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Change transaction PIN
router.post('/pin/change', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!newPin || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'El nuevo PIN debe ser de 4 dígitos' });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!wallet) return res.status(404).json({ error: 'Billetera no encontrada' });

    if (wallet.transactionPin) {
      if (!currentPin) return res.status(400).json({ error: 'PIN actual requerido' });
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(currentPin, wallet.transactionPin);
      if (!isValid) return res.status(401).json({ error: 'PIN actual incorrecto' });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPin = await bcrypt.hash(newPin, 10);

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { transactionPin: hashedPin },
    });

    res.json({ message: 'PIN actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Transfer money to another user
router.post('/transfer', authenticate, async (req: AuthRequest, res) => {
  try {
    const { toUserId, amount, description, pin } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const fromWallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!fromWallet) {
      return res.status(404).json({ error: 'Billetera no encontrada' });
    }

    // Verify transaction PIN if set
    if (fromWallet.transactionPin) {
      if (!pin) return res.status(400).json({ error: 'PIN de transacción requerido' });
      const bcrypt = await import('bcryptjs');
      const pinValid = await bcrypt.compare(pin, fromWallet.transactionPin);
      if (!pinValid) return res.status(401).json({ error: 'PIN incorrecto' });
    }

    const toWallet = await prisma.wallet.findUnique({
      where: { userId: toUserId },
    });

    if (!toWallet) {
      return res.status(404).json({ error: 'Billetera del destinatario no encontrada' });
    }

    if (fromWallet.balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.wallet.update({
        where: { id: fromWallet.id },
        data: {
          balance: { decrement: amount },
          totalOut: { increment: amount },
        },
      });

      // Add to receiver
      await tx.wallet.update({
        where: { id: toWallet.id },
        data: {
          balance: { increment: amount },
          totalIn: { increment: amount },
        },
      });

      // Create transaction for sender
      await tx.transaction.create({
        data: {
          walletId: fromWallet.id,
          userId: req.user!.userId,
          type: 'transfer_out',
          amount: -amount,
          description: description || 'Transferencia enviada',
          status: 'completed',
          relatedUserId: toUserId,
        },
      });

      // Create transaction for receiver
      await tx.transaction.create({
        data: {
          walletId: toWallet.id,
          userId: toUserId,
          type: 'transfer_in',
          amount,
          description: description || 'Transferencia recibida',
          status: 'completed',
          relatedUserId: req.user!.userId,
        },
      });

      return { message: 'Transferencia realizada con éxito' };
    });

    // Push notification to receiver
    const sender = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { firstName: true, lastName: true },
    });
    sendPushToUser(toUserId, {
      title: 'Transferencia recibida',
      body: `${sender?.firstName} ${sender?.lastName} te envio ₲${amount.toLocaleString()}`,
      url: '/app/wallet',
      tag: 'transfer-in',
    }).catch(() => {});

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Request withdrawal
router.post('/withdraw', authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount, description } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Billetera no encontrada' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          totalOut: { increment: amount },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user!.userId,
          type: 'withdrawal',
          amount: -amount,
          description: description || 'Solicitud de retiro',
          status: 'pending', // Withdrawals usually require approval
        },
      });

      return updatedWallet;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Get virtual card
router.get('/card', authenticate, async (req: AuthRequest, res) => {
  try {
    const card = await prisma.virtualCard.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!card) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Update card design
router.patch('/card/design', authenticate, async (req: AuthRequest, res) => {
  try {
    const { design } = req.body;

    const card = await prisma.virtualCard.update({
      where: { userId: req.user!.userId },
      data: { design },
    });

    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
