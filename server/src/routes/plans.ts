import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all active plans (Public/Seller)
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Error al obtener los planes' });
  }
});

// Admin: Get all plans (including inactive)
router.get('/all', authenticate, async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener todos los planes' });
  }
});

// Admin: Create a new plan
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      name, tier, description, features, price, prices, 
      maxProducts, hasReports, commissionRate, isCommissionBased, isActive 
    } = req.body as any;

    if (!name || !tier) {
      return res.status(400).json({ error: 'Nombre y Nivel del plan son obligatorios' });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name as string,
        tier: tier as string,
        description: description || '',
        features: Array.isArray(features) ? features : [],
        prices: prices || {},
        isCommissionBased: !!isCommissionBased,
        isActive: isActive !== undefined ? !!isActive : true,
        hasReports: !!hasReports,
        price: parseFloat(price) || 0,
        maxProducts: parseInt(maxProducts) || 0,
        commissionRate: parseFloat(commissionRate) || 0,
      }
    });
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Error al crear el plan en la base de datos' });
  }
});

// Admin: Update a plan
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id as string;
    const planData = req.body;
    
    console.log('--- ACTUALIZANDO PLAN ---');
    console.log('Datos recibidos:', JSON.stringify(planData, null, 2));

    const { 
      name, tier, description, features, price, prices, 
      maxProducts, hasReports, commissionRate, isCommissionBased, isActive 
    } = planData as any;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: name as string,
        tier: tier as string,
        description: description as string,
        features,
        prices,
        isCommissionBased,
        isActive,
        hasReports,
        price: price !== undefined ? parseFloat(price) : undefined,
        maxProducts: maxProducts !== undefined ? parseInt(maxProducts) : undefined,
        commissionRate: commissionRate !== undefined ? parseFloat(commissionRate) : undefined,
      }
    });
    console.log('Resultado en DB:', plan.maxProducts);
    res.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Error al actualizar el plan' });
  }
});

// Admin: Delete a plan
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id as string;
    await prisma.subscriptionPlan.delete({
      where: { id }
    });
    res.json({ message: 'Plan eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Error al eliminar el plan' });
  }
});

export default router;
