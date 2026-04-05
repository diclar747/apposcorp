import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── Middleware ─────────────────────────────────────────────────────────────────

const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
};

const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
};

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
router.post('/stages', requireAdmin, async (req, res) => {
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
router.put('/stages/:id', requireAdmin, async (req, res) => {
    try {
        const { name, title, description, color, order, isActive } = req.body;
        const stage = await prisma.ingenioStage.update({
            where: { id: req.params.id },
            data: { name, title, description, color, order, isActive },
        });
        res.json(stage);
    } catch (error) {
        console.error('Error updating stage:', error);
        res.status(500).json({ error: 'Error al actualizar etapa' });
    }
});

// Delete stage (admin only)
router.delete('/stages/:id', requireAdmin, async (req, res) => {
    try {
        await prisma.ingenioStage.delete({
            where: { id: req.params.id },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting stage:', error);
        res.status(500).json({ error: 'Error al eliminar etapa' });
    }
});

// ─── Wheel Segments ─────────────────────────────────────────────────────────────

// Get segments by stage
router.get('/segments/:stageId', async (req, res) => {
    try {
        const segments = await prisma.ingenioWheelSegment.findMany({
            where: { stageId: req.params.stageId },
            orderBy: { number: 'asc' },
        });
        res.json(segments);
    } catch (error) {
        console.error('Error fetching segments:', error);
        res.status(500).json({ error: 'Error al cargar segmentos' });
    }
});

// Create segment (admin only)
router.post('/segments', requireAdmin, async (req, res) => {
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
router.put('/segments/:id', requireAdmin, async (req, res) => {
    try {
        const { title, description, color, icon, order, isActive } = req.body;
        const segment = await prisma.ingenioWheelSegment.update({
            where: { id: req.params.id },
            data: { title, description, color, icon, order, isActive },
        });
        res.json(segment);
    } catch (error) {
        console.error('Error updating segment:', error);
        res.status(500).json({ error: 'Error al actualizar segmento' });
    }
});

// Delete segment (admin only)
router.delete('/segments/:id', requireAdmin, async (req, res) => {
    try {
        await prisma.ingenioWheelSegment.delete({
            where: { id: req.params.id },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting segment:', error);
        res.status(500).json({ error: 'Error al eliminar segmento' });
    }
});

// ─── Contents ───────────────────────────────────────────────────────────────────

// Get contents by stage
router.get('/contents/:stageId', async (req, res) => {
    try {
        const contents = await prisma.ingenioContent.findMany({
            where: { stageId: req.params.stageId },
            orderBy: { order: 'asc' },
        });
        res.json(contents);
    } catch (error) {
        console.error('Error fetching contents:', error);
        res.status(500).json({ error: 'Error al cargar contenidos' });
    }
});

// Create content (admin only)
router.post('/contents', requireAdmin, async (req, res) => {
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
router.put('/contents/:id', requireAdmin, async (req, res) => {
    try {
        const { title, content, url, fileUrl, order, isActive } = req.body;
        const updatedContent = await prisma.ingenioContent.update({
            where: { id: req.params.id },
            data: { title, content, url, fileUrl, order, isActive },
        });
        res.json(updatedContent);
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Error al actualizar contenido' });
    }
});

// Delete content (admin only)
router.delete('/contents/:id', requireAdmin, async (req, res) => {
    try {
        await prisma.ingenioContent.delete({
            where: { id: req.params.id },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ error: 'Error al eliminar contenido' });
    }
});

// ─── Materials ──────────────────────────────────────────────────────────────────

// Get all materials
router.get('/materials', async (req, res) => {
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
router.post('/materials', requireAdmin, async (req, res) => {
    try {
        const { stage, title, description, fileUrl, fileType, fileSize, isPublic, order } = req.body;
        const material = await prisma.ingenioMaterial.create({
            data: { stage, title, description, fileUrl, fileType, fileSize, isPublic, order },
        });
        res.status(201).json(material);
    } catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({ error: 'Error al crear material' });
    }
});

// Update material (admin only)
router.put('/materials/:id', requireAdmin, async (req, res) => {
    try {
        const { title, description, fileUrl, isPublic, order } = req.body;
        const material = await prisma.ingenioMaterial.update({
            where: { id: req.params.id },
            data: { title, description, fileUrl, isPublic, order },
        });
        res.json(material);
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ error: 'Error al actualizar material' });
    }
});

// Delete material (admin only)
router.delete('/materials/:id', requireAdmin, async (req, res) => {
    try {
        await prisma.ingenioMaterial.delete({
            where: { id: req.params.id },
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ error: 'Error al eliminar material' });
    }
});

// ─── Students ───────────────────────────────────────────────────────────────────

// Get all students (admin only)
router.get('/students', requireAdmin, async (req, res) => {
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
router.get('/students/me', requireAuth, async (req, res) => {
    try {
        const student = await prisma.ingenioStudent.findUnique({
            where: { userId: req.user!.id },
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
router.post('/students/register', requireAuth, async (req, res) => {
    try {
        const { phone, city, country, occupation, experience, goals, referralCode } = req.body;
        
        // Check if already registered
        const existing = await prisma.ingenioStudent.findUnique({
            where: { userId: req.user!.id },
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
                userId: req.user!.id,
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
            where: { id: req.user!.id },
            data: { ingenioAccess: true },
        });

        res.status(201).json(student);
    } catch (error) {
        console.error('Error registering student:', error);
        res.status(500).json({ error: 'Error al registrar estudiante' });
    }
});

// Update student profile
router.put('/students/me', requireAuth, async (req, res) => {
    try {
        const { phone, city, occupation, experience, goals } = req.body;
        const student = await prisma.ingenioStudent.update({
            where: { userId: req.user!.id },
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
router.get('/assignments/me', requireAuth, async (req, res) => {
    try {
        const assignments = await prisma.ingenioStudentAssignment.findMany({
            where: {
                student: { userId: req.user!.id },
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
router.post('/assignments', requireAdmin, async (req, res) => {
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
router.post('/assignments/:id/start', requireAuth, async (req, res) => {
    try {
        const assignment = await prisma.ingenioStudentAssignment.update({
            where: { id: req.params.id },
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
router.put('/assignments/:id/progress', requireAuth, async (req, res) => {
    try {
        const { progress } = req.body;
        const updateData: any = { progress };
        
        if (progress === 100) {
            updateData.status = 'completed';
            updateData.completedAt = new Date();
        }

        const assignment = await prisma.ingenioStudentAssignment.update({
            where: { id: req.params.id },
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
router.get('/stats', requireAdmin, async (req, res) => {
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

// ─── Public Routes ──────────────────────────────────────────────────────────────

// Get public wheel data (no auth required)
router.get('/public/wheel/:stageName', async (req, res) => {
    try {
        const stage = await prisma.ingenioStage.findFirst({
            where: { name: req.params.stageName, isActive: true },
            include: {
                wheelSegments: {
                    where: { isActive: true },
                    orderBy: { number: 'asc' },
                },
            },
        });
        
        if (!stage) {
            return res.status(404).json({ error: 'Etapa no encontrada' });
        }

        res.json(stage);
    } catch (error) {
        console.error('Error fetching wheel data:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

export default router;
