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
      return res.json(null);
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
// Deposit money to wallet (Pending manual approval)
router.post('/deposit', authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount, description, receiptUrl } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Billetera no encontrada' });
    }

    // Create a PENDING transaction record
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        userId: req.user!.userId,
        type: 'deposit',
        amount: parseFloat(amount),
        description: description || 'Depósito pendiente de aprobación',
        status: 'pending',
        metadata: receiptUrl ? { receiptUrl } : undefined,
      },
    });

    // Send push to user about pending request
    sendPushToUser(req.user!.userId, {
      title: 'Solicitud de Depósito',
      body: `Tu solicitud de recarga por ₲ ${amount.toLocaleString()} ha sido recibida y está en proceso de validación.`,
      url: '/app/wallet',
      tag: 'deposit-request'
    }).catch(console.error);

    // Notify admins about new deposit request
    try {
      const client = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { firstName: true, lastName: true }
      });
      const clientName = client ? `${client.firstName} ${client.lastName}` : 'Un cliente';

      const admins = await prisma.user.findMany({
        where: { roles: { has: 'superadmin' } },
        select: { id: true }
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            title: 'Nueva Solicitud de Recarga',
            message: `${clientName} ha solicitado una recarga de ₲ ${amount.toLocaleString('es-PY')}.`,
            type: 'info',
            actionUrl: '/admin/transacciones',
            isRead: false
          }))
        });
      }
    } catch (notifyError) {
      console.error('Failed to notify admins:', notifyError);
    }

    res.json({ message: 'Solicitud recibida', transaction });
  } catch (error) {
    console.error('Error in deposit:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Approve deposit (Admin only)
router.post('/approve-deposit/:id', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: id as string },
      include: { wallet: true }
    });

    if (!transaction || transaction.type !== 'deposit' || transaction.status !== 'pending') {
      return res.status(404).json({ error: 'Transacción pendiente no encontrada' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: { increment: transaction.amount },
          totalIn: { increment: transaction.amount },
        },
      });

      // 2. Mark transaction as completed
      await tx.transaction.update({
        where: { id: id as string },
        data: { status: 'completed' },
      });

      // 3. Create financial record
      let category = await tx.financialCategory.findFirst({
        where: { userId: transaction.userId, name: 'Depósitos', type: 'income' }
      });

      if (!category) {
        category = await tx.financialCategory.create({
          data: {
            userId: transaction.userId,
            name: 'Depósitos',
            type: 'income',
            color: '#10b981',
            icon: 'wallet'
          }
        });
      }

      await tx.financialRecord.create({
        data: {
          userId: transaction.userId,
          amount: transaction.amount,
          description: `Recarga Aprobada: ${transaction.description}`,
          type: 'income',
          categoryId: category.id,
          date: new Date()
        }
      });

      return updatedWallet;
    });

    // Notify user
    sendPushToUser(transaction.userId, {
      title: 'Depósito Aprobado',
      body: `Tu recarga por ₲ ${transaction.amount.toLocaleString()} ha sido validada y acreditada.`,
      url: '/app/wallet',
      tag: 'deposit-approved'
    }).catch(console.error);

    res.json({ success: true, wallet: result });
  } catch (error) {
    console.error('Error approving deposit:', error);
    res.status(500).json({ error: 'Error al aprobar depósito' });
  }
});

// Reject deposit (Admin only)
router.post('/reject-deposit/:id', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.updateMany({
      where: { id: id as string, status: 'pending', type: 'deposit' },
      data: { status: 'failed' }
    });

    if (transaction.count === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada o ya procesada' });
    }

    // Get original transaction for notification
    const originalTx = await prisma.transaction.findUnique({ where: { id: id as string } });
    if (originalTx) {
      sendPushToUser(originalTx.userId, {
        title: 'Depósito Rechazado',
        body: 'Tu solicitud de recarga ha sido rechazada tras la validación.',
        url: '/app/wallet',
        tag: 'deposit-rejected'
      }).catch(console.error);
    }

    res.json({ success: true, message: 'Depósito rechazado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al rechazar depósito' });
  }
});

// Approve withdrawal (Admin only)
router.post('/approve-withdrawal/:id', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: id as string },
    });

    if (!transaction || transaction.type !== 'withdrawal' || transaction.status !== 'pending') {
      return res.status(404).json({ error: 'Solicitud de retiro no encontrada o ya procesada' });
    }

    await prisma.transaction.update({
      where: { id: id as string },
      data: { status: 'completed' }
    });

    // Notify user
    sendPushToUser(transaction.userId, {
      title: 'Retiro Procesado',
      body: `Tu solicitud de retiro por ₲ ${Math.abs(transaction.amount).toLocaleString()} ha sido aprobada y procesada.`,
      url: '/app/wallet',
      tag: 'withdrawal-approved'
    }).catch(console.error);

    res.json({ success: true, message: 'Retiro aprobado con éxito' });
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    res.status(500).json({ error: 'Error al aprobar retiro' });
  }
});

// Reject withdrawal (Admin only) - Refunds the amount to user
router.post('/reject-withdrawal/:id', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: id as string },
        include: { wallet: true }
      });

      if (!transaction || transaction.type !== 'withdrawal' || transaction.status !== 'pending') {
        throw new Error('NOT_PENDING');
      }

      const amount = Math.abs(transaction.amount);

      // 1. Mark transaction as failed
      await tx.transaction.update({
        where: { id: id as string },
        data: { status: 'failed', description: `${transaction.description} (Rechazado - Reembolsado)` }
      });

      // 2. Refund wallet
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { 
          balance: { increment: amount },
          totalOut: { decrement: amount }
        }
      });

      return transaction;
    });

    // Notify user
    sendPushToUser(result.userId, {
      title: 'Retiro Rechazado',
      body: `Tu solicitud de retiro por ₲ ${Math.abs(result.amount).toLocaleString()} ha sido rechazada y reembolsada a tu billetera.`,
      url: '/app/wallet',
      tag: 'withdrawal-rejected'
    }).catch(console.error);

    res.json({ success: true, message: 'Retiro rechazado y reembolsado' });
  } catch (error: any) {
    if (error.message === 'NOT_PENDING') {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }
    console.error('Error rejecting withdrawal:', error);
    res.status(500).json({ error: 'Error al rechazar retiro' });
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

// Verify transaction PIN
router.post('/pin/verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: 'PIN requerido' });

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet) return res.status(404).json({ error: 'Billetera no encontrada' });
    if (!wallet.transactionPin) return res.status(400).json({ error: 'PIN no configurado' });

    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(pin, wallet.transactionPin);

    if (!isValid) return res.status(400).json({ error: 'PIN incorrecto' });

    res.json({ message: 'PIN verificado correctamente' });
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
      if (!isValid) return res.status(400).json({ error: 'PIN actual incorrecto' });
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

    if (amount <= 0 || isNaN(amount)) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    // 1. Check sender wallet and PIN
    const fromWallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!fromWallet) {
      return res.status(404).json({ error: 'Tu billetera no fue encontrada' });
    }

    if (fromWallet.transactionPin) {
      if (!pin) return res.status(400).json({ error: 'PIN de transacción requerido' });
      const bcrypt = await import('bcryptjs');
      const pinValid = await bcrypt.compare(pin, fromWallet.transactionPin);
      if (!pinValid) return res.status(400).json({ error: 'PIN incorrecto' });
    }

    // 2. Check receiver wallet
    const toWallet = await prisma.wallet.findUnique({
      where: { userId: toUserId },
    });

    if (!toWallet) {
      return res.status(404).json({ error: 'Billetera del destinatario no encontrada' });
    }

    if (toUserId === req.user!.userId) {
      return res.status(400).json({ error: 'No puedes transferirte a ti mismo' });
    }

    // 3. Execution in ACID Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Atomic Balance Check & Deduction
      // We use a where clause with balance gte amount to ensure consistency
      const senderWallet = await tx.wallet.update({
        where: { 
          id: fromWallet.id,
          balance: { gte: amount } 
        },
        data: {
          balance: { decrement: amount },
          totalOut: { increment: amount },
        },
      }).catch(() => {
        throw new Error('INSUFFICIENT_BALANCE');
      });

      // Add to receiver
      await tx.wallet.update({
        where: { id: toWallet.id },
        data: {
          balance: { increment: amount },
          totalIn: { increment: amount },
        },
      });

      // Create history for both
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

      // Financial Records Integration (For Budget/Reports)
      // Categoría para Gasto (Emisor)
      let catOut = await tx.financialCategory.findFirst({
        where: { userId: req.user!.userId, name: 'Transferencias', type: 'expense' }
      });

      if (!catOut) {
        catOut = await tx.financialCategory.create({
          data: { userId: req.user!.userId, name: 'Transferencias', type: 'expense', color: '#ef4444', icon: 'send' }
        });
      }

      await tx.financialRecord.create({
        data: {
          userId: req.user!.userId,
          amount,
          description: description || `Transferencia a usuario ${toUserId}`,
          type: 'expense',
          categoryId: catOut.id,
          date: new Date()
        }
      });

      // Categoría para Ingreso (Receptor)
      let catIn = await tx.financialCategory.findFirst({
        where: { userId: toUserId, name: 'Transferencias', type: 'income' }
      });

      if (!catIn) {
        catIn = await tx.financialCategory.create({
          data: { userId: toUserId, name: 'Transferencias', type: 'income', color: '#10b981', icon: 'download' }
        });
      }

      await tx.financialRecord.create({
        data: {
          userId: toUserId,
          amount,
          description: description || `Transferencia de usuario ${req.user!.userId}`,
          type: 'income',
          categoryId: catIn.id,
          date: new Date()
        }
      });

      return { success: true, message: 'Transferencia realizada con éxito' };
    });

    // 4. Notifications (Post-transaction)
    const sender = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { firstName: true, lastName: true },
    });

    sendPushToUser(toUserId, {
      title: 'Transferencia recibida',
      body: `${sender?.firstName} te envió ₲ ${amount.toLocaleString()}`,
      url: '/app/wallet',
      tag: 'transfer-in',
    }).catch(() => {});

    res.json(result);
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ error: 'Saldo insuficiente para realizar la operación' });
    }
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Error interno al procesar la transferencia' });
  }
});

// Request withdrawal
router.post('/withdraw', authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount, description } = req.body;

    if (amount <= 0 || isNaN(amount)) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Billetera no encontrada' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Atomic Balance Check & Deduction
      const updatedWallet = await tx.wallet.update({
        where: { 
          id: wallet.id,
          balance: { gte: amount }
        },
        data: {
          balance: { decrement: amount },
          totalOut: { increment: amount },
        },
      }).catch(() => {
        throw new Error('INSUFFICIENT_BALANCE');
      });

      // Create transaction record as PENDING
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user!.userId,
          type: 'withdrawal',
          amount: -amount,
          description: description || 'Solicitud de retiro',
          status: 'pending',
        },
      });

      return updatedWallet;
    });

    res.json({ success: true, wallet: result });
  } catch (error: any) {
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ error: 'Saldo insuficiente para el retiro' });
    }
    console.error('Withdraw search error:', error);
    res.status(500).json({ error: 'Error del servidor al procesar el retiro' });
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
