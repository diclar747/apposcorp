import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { sendPushToUser } from '../services/pushService.js';

const router = Router();

// Get all credits for current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const credits = await prisma.credit.findMany({
      where: { userId: req.user!.userId },
      include: {
        documents: true,
        paymentSchedule: {
          orderBy: { installmentNumber: 'asc' },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get credit by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    const credit = await prisma.credit.findUnique({
      where: { id },
      include: {
        documents: true,
        paymentSchedule: {
          orderBy: { installmentNumber: 'asc' },
        },
        payments: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    
    if (!credit) {
      return res.status(404).json({ error: 'Crédito não encontrado' });
    }
    
    // Only owner or admin can view
    if (req.user!.role !== 'superadmin' && credit.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    res.json(credit);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Create credit request
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount, concept, installments, interestRate = 0 } = req.body;
    
    if (amount <= 0 || installments <= 0) {
      return res.status(400).json({ error: 'Valores inválidos' });
    }
    
    // Calculate installment amount
    const totalInterest = (amount * interestRate * installments) / 100;
    const totalToPay = amount + totalInterest;
    const installmentAmount = totalToPay / installments;
    
    // Create payment schedule
    const paymentSchedule = [];
    const today = new Date();
    
    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const principal = amount / installments;
      const interest = totalInterest / installments;
      
      paymentSchedule.push({
        installmentNumber: i,
        dueDate,
        amount: installmentAmount,
        principal,
        interest,
      });
    }
    
    const credit = await prisma.credit.create({
      data: {
        userId: req.user!.userId,
        amount,
        concept,
        installments,
        installmentAmount,
        totalToPay,
        interestRate,
        status: 'pending',
        paymentSchedule: {
          create: paymentSchedule,
        },
      },
      include: {
        paymentSchedule: true,
      },
    });
    
    res.status(201).json(credit);
  } catch (error) {
    console.error('Create credit error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Approve credit (admin only)
router.patch('/:id/approve', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    const result = await prisma.$transaction(async (tx) => {
      const credit = await tx.credit.update({
        where: { id },
        data: {
          status: 'active',
          approvedBy: req.user!.userId,
          approvedAt: new Date(),
        },
        include: {
          user: true,
        },
      });
      
      // Add money to user's wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: credit.userId },
      });
      
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: credit.amount },
            totalIn: { increment: credit.amount },
          },
        });
        
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: credit.userId,
            type: 'credit',
            amount: credit.amount,
            description: `Crédito aprovado: ${credit.concept}`,
            status: 'completed',
            relatedCreditId: credit.id,
          },
        });
      }
      
      return credit;
    });

    // Push notification: credit approved
    sendPushToUser(result.userId, {
      title: 'Credito aprobado',
      body: `Tu credito de ₲${result.amount.toLocaleString('es-PY')} por "${result.concept}" fue aprobado`,
      url: '/app/creditos',
      tag: 'credit-approved',
    }).catch(() => {});

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Reject credit (admin only)
router.patch('/:id/reject', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    const credit = await prisma.credit.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedBy: req.user!.userId,
        approvedAt: new Date(),
      },
    });

    // Push notification: credit rejected
    sendPushToUser(credit.userId, {
      title: 'Credito rechazado',
      body: `Tu solicitud de credito por "${credit.concept}" fue rechazada`,
      url: '/app/creditos',
      tag: 'credit-rejected',
    }).catch(() => {});

    res.json(credit);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Pay installment
router.post('/:id/pay', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { installmentId, paymentMethod } = req.body;
    
    const credit = await prisma.credit.findUnique({
      where: { id },
      include: {
        paymentSchedule: true,
      },
    });
    
    if (!credit) {
      return res.status(404).json({ error: 'Crédito não encontrado' });
    }
    
    if (credit.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const installment = credit.paymentSchedule.find(p => p.id === installmentId);
    
    if (!installment) {
      return res.status(404).json({ error: 'Parcela não encontrada' });
    }
    
    if (installment.status === 'paid') {
      return res.status(400).json({ error: 'Parcela já paga' });
    }
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });
    
    if (!wallet || wallet.balance < installment.amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: installment.amount },
          totalOut: { increment: installment.amount },
        },
      });
      
      // Create payment record
      await tx.creditPayment.create({
        data: {
          creditId: id,
          installmentId,
          amount: installment.amount,
          paymentMethod,
        },
      });
      
      // Update installment status
      await tx.paymentScheduleItem.update({
        where: { id: installmentId },
        data: {
          status: 'paid',
          paidAt: new Date(),
        },
      });
      
      // Check if all installments are paid
      const allInstallments = await tx.paymentScheduleItem.findMany({
        where: { creditId: id },
      });
      
      const allPaid = allInstallments.every((i: { status: string }) => i.status === 'paid');
      
      if (allPaid) {
        await tx.credit.update({
          where: { id },
          data: { status: 'completed' },
        });
      }
      
      // Create transaction record
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user!.userId,
          type: 'expense',
          amount: -installment.amount,
          description: `Pagamento de parcela ${installment.installmentNumber} - ${credit.concept}`,
          status: 'completed',
          relatedCreditId: id,
        },
      });
      
      return { message: 'Pagamento realizado com sucesso' };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Pay installment error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get all credits (admin only)
router.get('/admin/all', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const credits = await prisma.credit.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        paymentSchedule: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(credits);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

export default router;
