import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/ingenio.js';

const router = Router();

// ─── Middleware ─────────────────────────────────────────────────────────────────

const requireAuth = authenticate;
const requireAdmin = [authenticate, authorize('superadmin')];

// ─── Stages ─────────────────────────────────────────────────────────────────────

// Get all stages
router.get('/stages', async (req, res) => {
    try {
        const stages = await prisma.ingenioStage.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: {
                        wheelSegments: true,
                        contents: true,
                    },
                },
            },
        });
        res.json(stages);
    } catch (error) {
        console.error('Error fetching stages:', error);
        res.status(500).json({ error: 'Error al cargar etapas' });
    }
});

// Create stage (admin only)
router.post('/stages', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, title, description, color, order } = req.body;
        const stage = await prisma.ingenioStage.create({
            data: { name, title, description, color, order },
        });
        res.status(201).json(stage);
    } catch (error) {
        console.error('Error creating stage:', error);
        res.status(500).json({ error: 'Error al crear etapa' });
    }
});

// Update stage (admin only)
router.put('/stages/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, title, description, color, order, isActive } = req.body;
        const stage = await prisma.ingenioStage.update({
            where: { id: req.params.id as string },
            data: { name, title, description, color, order, isActive },
        });
        res.json(stage);
    } catch (error) {
        console.error('Error updating stage:', error);
        res.status(500).json({ error: 'Error al actualizar etapa' });
    }
});

// Delete stage (admin only)
router.delete('/stages/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.ingenioStage.delete({
            where: { id: req.params.id as string },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting stage:', error);
        res.status(500).json({ error: 'Error al eliminar etapa' });
    }
});

// ─── Wheel Segments ─────────────────────────────────────────────────────────────

// Get segments by stage
router.get('/segments/:stageId', async (req: AuthRequest, res: Response) => {
    try {
        const segments = await prisma.ingenioWheelSegment.findMany({
            where: { stageId: req.params.stageId as string },
            orderBy: { number: 'asc' },
        });
        res.json(segments);
    } catch (error) {
        console.error('Error fetching segments:', error);
        res.status(500).json({ error: 'Error al cargar segmentos' });
    }
});

// Create segment (admin only)
router.post('/segments', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { stageId, number, title, description, color, icon, order } = req.body;
        const segment = await prisma.ingenioWheelSegment.create({
            data: { stageId, number, title, description, color, icon, order },
        });
        res.status(201).json(segment);
    } catch (error) {
        console.error('Error creating segment:', error);
        res.status(500).json({ error: 'Error al crear segmento' });
    }
});

// Update segment (admin only)
router.put('/segments/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, color, icon, order, isActive } = req.body;
        const segment = await prisma.ingenioWheelSegment.update({
            where: { id: req.params.id as string },
            data: { title, description, color, icon, order, isActive },
        });
        res.json(segment);
    } catch (error) {
        console.error('Error updating segment:', error);
        res.status(500).json({ error: 'Error al actualizar segmento' });
    }
});

// Delete segment (admin only)
router.delete('/segments/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.ingenioWheelSegment.delete({
            where: { id: req.params.id as string },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting segment:', error);
        res.status(500).json({ error: 'Error al eliminar segmento' });
    }
});

// ─── Contents ───────────────────────────────────────────────────────────────────

// Get contents by stage
router.get('/contents/:stageId', async (req: AuthRequest, res: Response) => {
    try {
        const contents = await prisma.ingenioContent.findMany({
            where: { stageId: req.params.stageId as string },
            orderBy: { order: 'asc' },
        });
        res.json(contents);
    } catch (error) {
        console.error('Error fetching contents:', error);
        res.status(500).json({ error: 'Error al cargar contenidos' });
    }
});

// Create content (admin only)
router.post('/contents', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { stageId, segmentId, type, title, content, url, fileUrl, order } = req.body;
        const newContent = await prisma.ingenioContent.create({
            data: { stageId, segmentId, type, title, content, url, fileUrl, order },
        });
        res.status(201).json(newContent);
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({ error: 'Error al crear contenido' });
    }
});

// Update content (admin only)
router.put('/contents/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { title, content, url, fileUrl, order, isActive } = req.body;
        const updatedContent = await prisma.ingenioContent.update({
            where: { id: req.params.id as string },
            data: { title, content, url, fileUrl, order, isActive },
        });
        res.json(updatedContent);
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Error al actualizar contenido' });
    }
});

// Delete content (admin only)
router.delete('/contents/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.ingenioContent.delete({
            where: { id: req.params.id as string },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ error: 'Error al eliminar contenido' });
    }
});

// ─── Materials ──────────────────────────────────────────────────────────────────

// Get all materials
router.get('/materials', async (req: AuthRequest, res: Response) => {
    try {
        const { stage } = req.query;
        const where = stage ? { stage: stage as string } : {};
        const materials = await prisma.ingenioMaterial.findMany({
            where,
            orderBy: { order: 'asc' },
        });
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ error: 'Error al cargar materiales' });
    }
});

// Create material (admin only)
router.post('/materials', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { stage, segmentNumber, title, description, fileUrl, fileType, fileSize, isPublic, order } = req.body;
        const material = await prisma.ingenioMaterial.create({
            data: { 
                stage, 
                segmentNumber: Number(segmentNumber) || 1, 
                title, 
                description, 
                fileUrl, 
                fileType, 
                fileSize: Number(fileSize) || 0, 
                isPublic: isPublic ?? true, 
                order: Number(order) || 0 
            },
        });
        res.status(201).json(material);
    } catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({ error: 'Error al crear material' });
    }
});

// Update material (admin only)
router.put('/materials/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, fileUrl, fileType, fileSize, isPublic, order, segmentNumber } = req.body;
        const material = await prisma.ingenioMaterial.update({
            where: { id: req.params.id as string },
            data: { 
                title, 
                description, 
                fileUrl, 
                fileType, 
                fileSize: fileSize !== undefined ? Number(fileSize) : undefined,
                isPublic, 
                order: order !== undefined ? Number(order) : undefined,
                segmentNumber: segmentNumber !== undefined ? Number(segmentNumber) : undefined
            },
        });
        res.json(material);
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ error: 'Error al actualizar material' });
    }
});

// Delete material (admin only)
router.delete('/materials/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.ingenioMaterial.delete({
            where: { id: req.params.id as string },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ error: 'Error al eliminar material' });
    }
});

// ─── Students ───────────────────────────────────────────────────────────────────

// Get all students (admin only)
router.get('/students', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const students = await prisma.ingenioStudent.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                assignments: true,
                _count: {
                    select: { referrals: true },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Error al cargar estudiantes' });
    }
});

// Get my student profile
router.get('/students/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const student = await prisma.ingenioStudent.findUnique({
            where: { userId: req.user!.userId },
            include: {
                assignments: true,
                referrals: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        res.json(student);
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ error: 'Error al cargar perfil' });
    }
});

// Register as student
router.post('/students/register', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { phone, city, country, occupation, experience, goals, referralCode } = req.body;
        
        // Check if already registered
        const existing = await prisma.ingenioStudent.findUnique({
            where: { userId: req.user!.userId },
        });
        
        if (existing) {
            return res.status(400).json({ error: 'Ya estás registrado como estudiante' });
        }

        // Generate unique referral code
        const newReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        // Find referrer if code provided
        let referredById = null;
        if (referralCode) {
            const referrer = await prisma.ingenioStudent.findUnique({
                where: { referralCode },
            });
            if (referrer) {
                referredById = referrer.userId;
            }
        }

        const student = await prisma.ingenioStudent.create({
            data: {
                userId: req.user!.userId,
                phone,
                city,
                country,
                occupation,
                experience,
                goals,
                referralCode: newReferralCode,
                referredById,
            },
        });

        // Update user ingenioAccess
        await prisma.user.update({
            where: { id: req.user!.userId },
            data: { ingenioAccess: true },
        });

        res.status(201).json(student);
    } catch (error) {
        console.error('Error registering student:', error);
        res.status(500).json({ error: 'Error al registrar estudiante' });
    }
});

// Update student profile
router.put('/students/me', requireAuth, requireActiveSubscription, async (req: AuthRequest, res: Response) => {
    try {
        const { phone, city, occupation, experience, goals } = req.body;
        const student = await prisma.ingenioStudent.update({
            where: { userId: req.user!.userId },
            data: { phone, city, occupation, experience, goals },
        });
        res.json(student);
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

// ─── Student Assignments ────────────────────────────────────────────────────────

// Get my assignments
router.get('/assignments/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const assignments = await prisma.ingenioStudentAssignment.findMany({
            where: {
                student: { userId: req.user!.userId },
            },
            orderBy: { assignedAt: 'desc' },
        });
        res.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'Error al cargar asignaciones' });
    }
});

// Assign stage to student (admin only)
router.post('/assignments', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { studentId, stage } = req.body;
        const assignment = await prisma.ingenioStudentAssignment.create({
            data: {
                studentId,
                stage,
                status: 'pending',
            },
        });
        res.status(201).json(assignment);
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ error: 'Error al asignar etapa' });
    }
});

// Start assignment
router.post('/assignments/:id/start', requireAuth, requireActiveSubscription, async (req: AuthRequest, res: Response) => {
    try {
        const assignment = await prisma.ingenioStudentAssignment.update({
            where: { id: req.params.id as string },
            data: {
                status: 'in_progress',
                startedAt: new Date(),
            },
        });
        res.json(assignment);
    } catch (error) {
        console.error('Error starting assignment:', error);
        res.status(500).json({ error: 'Error al iniciar asignación' });
    }
});

// Update progress
router.put('/assignments/:id/progress', requireAuth, requireActiveSubscription, async (req: AuthRequest, res: Response) => {
    try {
        const { progress } = req.body;
        const updateData: any = { progress };
        
        if (progress === 100) {
            updateData.status = 'completed';
            updateData.completedAt = new Date();
        }

        const assignment = await prisma.ingenioStudentAssignment.update({
            where: { id: req.params.id as string },
            data: updateData,
        });
        res.json(assignment);
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Error al actualizar progreso' });
    }
});

// ─── Stats ──────────────────────────────────────────────────────────────────────

// Get Ingenio stats (admin only)
router.get('/stats', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalStudents,
            activeStudents,
            totalAssignments,
            completedAssignments,
            e1Count,
            e2Count,
        ] = await Promise.all([
            prisma.ingenioStudent.count(),
            prisma.ingenioStudent.count({ where: { isActive: true } }),
            prisma.ingenioStudentAssignment.count(),
            prisma.ingenioStudentAssignment.count({ where: { status: 'completed' } }),
            prisma.ingenioStudentAssignment.count({ where: { stage: 'E1' } }),
            prisma.ingenioStudentAssignment.count({ where: { stage: 'E2' } }),
        ]);

        res.json({
            totalStudents,
            activeStudents,
            totalAssignments,
            completedAssignments,
            e1Count,
            e2Count,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas' });
    }
});

// ─── Setup / Seed ───────────────────────────────────────────────────────────────

// Initialize Ingenio system with default data
router.post('/setup', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const results = { stages: 0, segments: 0, courses: 0 };

        // Check if already initialized
        const existingStages = await prisma.ingenioStage.count();
        if (existingStages > 0) {
            return res.status(400).json({ 
                error: 'El sistema ya está inicializado',
                message: 'Ya existen etapas en la base de datos. Use el endpoint de reset si desea reiniciar.'
            });
        }

        // Create Stage E1
        const stageE1 = await prisma.ingenioStage.create({
            data: {
                name: 'E1',
                title: 'Presentación E1 - Fundamentos',
                description: 'Los 10 principios fundamentales para construir riqueza',
                color: '#8b5cf6',
                order: 1,
                isActive: true,
            },
        });
        results.stages++;

        // Create segments for E1
        const e1Segments = [
            { number: 1, title: 'Poder del Dinero', description: 'Entiende cómo funciona el dinero y cómo hacer que trabaje para ti.', color: '#ef4444' },
            { number: 2, title: 'Crear más Dinero', description: 'Estrategias para generar múltiples fuentes de ingresos.', color: '#f97316' },
            { number: 3, title: 'Manejar el Dinero', description: 'Presupuestos inteligentes y control de gastos.', color: '#f59e0b' },
            { number: 4, title: 'Proteger el Dinero', description: 'Seguros, emergencias y protección patrimonial.', color: '#84cc16' },
            { number: 5, title: 'Ahorrar el Dinero', description: 'Hábitos de ahorro y fondos de emergencia.', color: '#22c55e' },
            { number: 6, title: 'Crecer el Dinero', description: 'Inversiones que generan retornos consistentes.', color: '#10b981' },
            { number: 7, title: 'Preservar el Dinero', description: 'Legado familiar y planificación a largo plazo.', color: '#06b6d4' },
            { number: 8, title: 'Invertir el Dinero', description: 'Oportunidades de inversión diversificadas.', color: '#3b82f6' },
            { number: 9, title: 'Donar el Dinero', description: 'Filantropía y contribución social.', color: '#6366f1' },
            { number: 10, title: 'Disfrutar el Dinero', description: 'Balance entre ahorro y disfrute de la vida.', color: '#8b5cf6' },
        ];

        for (const seg of e1Segments) {
            await prisma.ingenioWheelSegment.create({
                data: {
                    stageId: stageE1.id,
                    ...seg,
                    order: seg.number,
                    isActive: true,
                },
            });
        }
        results.segments += e1Segments.length;

        // Create Stage E2
        const stageE2 = await prisma.ingenioStage.create({
            data: {
                name: 'E2',
                title: 'Presentación E2 - Avanzado',
                description: 'Los 10 pasos avanzados para la maestría financiera',
                color: '#10b981',
                order: 2,
                isActive: true,
            },
        });
        results.stages++;

        // Create segments for E2
        const e2Segments = [
            { number: 1, title: 'Mentalidad Ganadora', description: 'El éxito comienza en la mente. Desarrolla una mentalidad de abundancia.', color: '#ef4444' },
            { number: 2, title: 'Metas Claras', description: 'Define objetivos financieros específicos y medibles.', color: '#f97316' },
            { number: 3, title: 'Plan de Acción', description: 'Crea un roadmap detallado para alcanzar tus metas.', color: '#f59e0b' },
            { number: 4, title: 'Ingresos Múltiples', description: 'Diversifica tus fuentes de ingreso.', color: '#84cc16' },
            { number: 5, title: 'Inversión Inteligente', description: 'Aprende a invertir en activos que generan retornos pasivos.', color: '#22c55e' },
            { number: 6, title: 'Red de Contactos', description: 'Construye relaciones con personas que impulsen tu crecimiento.', color: '#10b981' },
            { number: 7, title: 'Educación Continua', description: 'Nunca dejes de aprender. Invierte en tu conocimiento.', color: '#06b6d4' },
            { number: 8, title: 'Disciplina Financiera', description: 'La consistencia vence a la intensidad.', color: '#3b82f6' },
            { number: 9, title: 'Dar para Recibir', description: 'La generosidad abre puertas.', color: '#6366f1' },
            { number: 10, title: 'Legado Duradero', description: 'Construye riqueza que trascienda generaciones.', color: '#8b5cf6' },
        ];

        for (const seg of e2Segments) {
            await prisma.ingenioWheelSegment.create({
                data: {
                    stageId: stageE2.id,
                    ...seg,
                    order: seg.number,
                    isActive: true,
                },
            });
        }
        results.segments += e2Segments.length;

        // Create courses for E1 and E2 (for the Academy tabs)
        const instructor = await prisma.user.findFirst({
            where: { roles: { has: 'superadmin' } },
        });

        if (instructor) {
            // Check if E1 course exists
            const existingE1 = await prisma.course.findFirst({
                where: { title: { contains: 'E1' } },
            });

            if (!existingE1) {
                await prisma.course.create({
                    data: {
                        title: 'E1 - Fundamentos del Dinero',
                        slug: 'e1-fundamentos',
                        description: 'Los 10 principios fundamentales para construir riqueza y libertad financiera.',
                        shortDescription: 'Descubre los fundamentos del dinero que nadie te enseñó.',
                        instructorId: instructor.id,
                        instructorName: `${instructor.firstName} ${instructor.lastName}`,
                        category: 'E1', // Ingenio Millonario E1 category
                        level: 'beginner',
                        price: 0,
                        isPublished: true,
                        isFeatured: true,
                    },
                });
                results.courses++;
            }

            // Check if E2 course exists
            const existingE2 = await prisma.course.findFirst({
                where: { title: { contains: 'E2' } },
            });

            if (!existingE2) {
                await prisma.course.create({
                    data: {
                        title: 'E2 - Maestría Financiera',
                        slug: 'e2-maestria',
                        description: 'Los 10 pasos avanzados que los millonarios usan para construir riqueza duradera.',
                        shortDescription: 'Estrategias avanzadas de construcción de riqueza.',
                        instructorId: instructor.id,
                        instructorName: `${instructor.firstName} ${instructor.lastName}`,
                        category: 'E2', // Ingenio Millonario E2 category
                        level: 'advanced',
                        price: 0,
                        isPublished: true,
                        isFeatured: true,
                    },
                });
                results.courses++;
            }
        }

        res.json({
            success: true,
            message: 'Sistema Ingenio Millonario inicializado correctamente',
            results,
        });
    } catch (error) {
        console.error('Error initializing Ingenio:', error);
        res.status(500).json({ error: 'Error al inicializar el sistema' });
    }
});

// ─── Public Routes ──────────────────────────────────────────────────────────────

// ─── Subscriptions ────────────────────────────────────────────────────────────

// Get public config for subscriptions
router.get('/config', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: ['ingenio_price', 'ingenio_max_installments', 'contact_phone']
                }
            }
        });

        const config = {
            price: Number(settings.find(s => s.key === 'ingenio_price')?.value || 700000),
            maxInstallments: Number(settings.find(s => s.key === 'ingenio_max_installments')?.value || 3),
            contactPhone: settings.find(s => s.key === 'contact_phone')?.value || ''
        };

        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// Get my subscription status
router.get('/subscription/me', requireAuth, async (req: AuthRequest, res) => {
    try {
        const sub = await prisma.ingenioSubscription.findUnique({
            where: { userId: req.user!.userId }
        });
        res.json(sub);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener suscripción' });
    }
});

// Request/Update subscription
router.post('/subscribe', requireAuth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { installments, paymentMethod } = req.body;

        // Validar configuración real
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['ingenio_price', 'ingenio_max_installments'] }
            }
        });

        const realPrice = Number(settings.find(s => s.key === 'ingenio_price')?.value || 700000);
        const realMaxInstallments = Number(settings.find(s => s.key === 'ingenio_max_installments')?.value || 3);

        if (installments < 1 || installments > realMaxInstallments) {
            return res.status(400).json({ error: 'Número de cuotas no permitido' });
        }

        const installmentAmount = realPrice / installments;

        // Check if there's an existing subscription
        const existingSub = await prisma.ingenioSubscription.findUnique({ where: { userId } });
        
        const isRevoked = existingSub?.status === 'REVOKED';
        const isPayingQuota = existingSub && (existingSub.status === 'ACTIVE' || isRevoked) && existingSub.paidAmount < existingSub.totalAmount;

        // If paying quota, the amount is one installment (or remainder)
        const totalToPay = isPayingQuota 
            ? Math.round(existingSub.totalAmount / existingSub.installments)
            : installmentAmount;

        const currentQuota = isPayingQuota 
            ? Math.floor(existingSub.paidAmount / (existingSub.totalAmount / existingSub.installments)) + 1
            : 1;

        // Procesar pago si es Wallet
        if (paymentMethod === 'WALLET') {
            const wallet = await prisma.wallet.findUnique({ where: { userId } });
            if (!wallet || wallet.balance < totalToPay) {
                return res.status(400).json({ error: 'Saldo insuficiente en Billetera' });
            }

            // Descontar saldo y crear transacción
            await prisma.$transaction([
                prisma.wallet.update({
                    where: { userId },
                    data: { balance: { decrement: totalToPay } }
                }),
                prisma.transaction.create({
                    data: {
                        userId,
                        walletId: wallet.id,
                        amount: -totalToPay,
                        type: 'expense',
                        description: `Pago suscripción Ingenio Millonario (Cuota ${currentQuota}/${isPayingQuota ? existingSub.installments : installments})`,
                        category: 'Education'
                    }
                }),
                prisma.ingenioSubscription.upsert({
                    where: { userId },
                    update: {
                        status: isRevoked ? 'ACTIVE' : (isPayingQuota ? existingSub.status : 'PENDING_APPROVAL'),
                        totalAmount: isPayingQuota ? existingSub.totalAmount : realPrice,
                        installments: isPayingQuota ? existingSub.installments : installments,
                        paidAmount: { increment: totalToPay },
                        paymentMethod: 'WALLET',
                        approvedAt: isRevoked ? new Date() : (isPayingQuota ? existingSub.approvedAt : null),
                        updatedAt: new Date()
                    },
                    create: {
                        userId,
                        status: 'PENDING_APPROVAL',
                        totalAmount: realPrice,
                        installments,
                        paidAmount: totalToPay,
                        paymentMethod: 'WALLET'
                    }
                }),
                // Si estaba revocado, devolver el acceso al usuario inmediatamente
                ...(isRevoked ? [
                    prisma.user.update({
                        where: { id: userId },
                        data: { ingenioAccess: true }
                    })
                ] : [])
            ]);

            return res.json({ 
                message: isRevoked 
                    ? 'Pago realizado con éxito. Tu acceso ha sido restaurado.' 
                    : 'Pago realizado con éxito. Pendiente de aprobación.' 
            });
        } else {
            // Transferencia bancaria
            const sub = await prisma.ingenioSubscription.upsert({
                where: { userId },
                update: {
                    status: isRevoked ? 'REVOKED' : 'PENDING_APPROVAL', // Si está revocado, sigue revocado hasta que admin apruebe
                    totalAmount: isPayingQuota ? existingSub.totalAmount : realPrice,
                    installments: isPayingQuota ? existingSub.installments : installments,
                    paymentMethod: 'BANK_TRANSFER',
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    status: 'PENDING_APPROVAL',
                    totalAmount: realPrice,
                    installments,
                    paymentMethod: 'BANK_TRANSFER'
                }
            });
            return res.json({ message: 'Solicitud enviada. Por favor realice la transferencia para procesar la activación.' });
        }
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Error al procesar suscripción' });
    }
});

// ─── ADMIN Subscriptions ──────────────────────────────────────────────────────

// Get all subscription requests
router.get('/admin/subscriptions', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const subs = await prisma.ingenioSubscription.findMany({
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(subs);
    } catch (error) {
        console.error('Error fetching admin subscriptions:', error);
        res.status(500).json({ error: 'Error al cargar suscripciones' });
    }
});

// Approve/Update subscription access
router.put('/admin/subscriptions/:id/approve', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { amountPaid } = req.body; // Solo necesario para transferencias
        const subId = req.params.id as string;

        const sub = await prisma.ingenioSubscription.findUnique({
            where: { id: subId }
        });

        if (!sub) return res.status(404).json({ error: 'Suscripción no encontrada' });

        const incomingPayment = Number(amountPaid) || 0;
        const remainingDebt = sub.totalAmount - sub.paidAmount;

        if (incomingPayment > remainingDebt) {
            return res.status(400).json({ 
                error: `El monto ingresado (Gs. ${incomingPayment.toLocaleString()}) supera la deuda pendiente (Gs. ${remainingDebt.toLocaleString()})` 
            });
        }

        const newPaidAmount = sub.paidAmount + incomingPayment;

        await prisma.$transaction([
            prisma.ingenioSubscription.update({
                where: { id: subId },
                data: {
                    status: 'ACTIVE',
                    paidAmount: newPaidAmount,
                    approvedAt: new Date(),
                    updatedAt: new Date()
                }
            }),
            prisma.user.update({
                where: { id: sub.userId },
                data: { ingenioAccess: true }
            })
        ]);

        res.json({ message: 'Acceso concedido exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al aprobar suscripción' });
    }
});

// Revoke access
router.put('/admin/subscriptions/:id/revoke', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const subId = req.params.id as string;
        const sub = await prisma.ingenioSubscription.findUnique({
            where: { id: subId }
        });

        if (!sub) return res.status(404).json({ error: 'Suscripción no encontrada' });

        await prisma.$transaction([
            prisma.ingenioSubscription.update({
                where: { id: subId },
                data: {
                    status: 'REVOKED',
                    updatedAt: new Date()
                }
            }),
            prisma.user.update({
                where: { id: sub.userId },
                data: { ingenioAccess: false }
            })
        ]);
        res.json({ message: 'Acceso revocado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al revocar acceso' });
    }
});

// Delete subscription (admin only)
router.delete('/admin/subscriptions/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const subId = req.params.id as string;
        const sub = await prisma.ingenioSubscription.findUnique({
            where: { id: subId }
        });

        if (!sub) return res.status(404).json({ error: 'Suscripción no encontrada' });

        await prisma.$transaction([
            prisma.ingenioSubscription.delete({
                where: { id: subId }
            }),
            prisma.user.update({
                where: { id: sub.userId },
                data: { ingenioAccess: false }
            }),
            // También eliminamos el perfil de estudiante para que desaparezca totalmente de Ingenio
            prisma.ingenioStudent.deleteMany({
                where: { userId: sub.userId }
            })
        ]);

        res.json({ message: 'Suscripción eliminada exitosamente' });
    } catch (error) {
        console.error('Error deleting subscription:', error);
        res.status(500).json({ error: 'Error al eliminar suscripción' });
    }
});

export default router;
