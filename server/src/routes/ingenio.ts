import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// STAGES (E1, E2, etc.)
// ============================================

// Get all stages
router.get('/stages', authenticate, async (req, res) => {
  try {
    const stages = await prisma.ingenioStage.findMany({
      include: {
        _count: {
          select: { materials: true, students: true }
        }
      },
      orderBy: { order: 'asc' }
    });
    res.json(stages);
  } catch (error) {
    console.error('Get stages error:', error);
    res.status(500).json({ error: 'Error al obtener etapas' });
  }
});

// Get stage by ID with all details
router.get('/stages/:id', authenticate, async (req, res) => {
  try {
    const stage = await prisma.ingenioStage.findUnique({
      where: { id: req.params.id },
      include: {
        materials: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        segments: {
          where: { isActive: true },
          orderBy: { number: 'asc' }
        },
        contents: {
          where: { isActive: true },
          orderBy: [{ segmentNumber: 'asc' }, { order: 'asc' }]
        }
      }
    });
    if (!stage) {
      return res.status(404).json({ error: 'Etapa no encontrada' });
    }
    res.json(stage);
  } catch (error) {
    console.error('Get stage error:', error);
    res.status(500).json({ error: 'Error al obtener etapa' });
  }
});

// Create stage (admin only)
router.post('/stages', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { code, name, description, color, order } = req.body;
    
    const stage = await prisma.ingenioStage.create({
      data: {
        code,
        name,
        description,
        color,
        order: order || 0
      }
    });
    
    res.status(201).json(stage);
  } catch (error) {
    console.error('Create stage error:', error);
    res.status(500).json({ error: 'Error al crear etapa' });
  }
});

// Update stage (admin only)
router.put('/stages/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { name, description, color, isActive, order } = req.body;
    
    const stage = await prisma.ingenioStage.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        color,
        isActive,
        order
      }
    });
    
    res.json(stage);
  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({ error: 'Error al actualizar etapa' });
  }
});

// ============================================
// WHEEL SEGMENTS
// ============================================

// Get segments for a stage
router.get('/stages/:stageId/segments', authenticate, async (req, res) => {
  try {
    const segments = await prisma.ingenioWheelSegment.findMany({
      where: { stageId: req.params.stageId, isActive: true },
      orderBy: { number: 'asc' }
    });
    res.json(segments);
  } catch (error) {
    console.error('Get segments error:', error);
    res.status(500).json({ error: 'Error al obtener segmentos' });
  }
});

// Create or update segments (admin only)
router.post('/stages/:stageId/segments', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { segments } = req.body; // Array of { number, color, title, description }
    
    // Delete existing segments and create new ones
    await prisma.ingenioWheelSegment.deleteMany({
      where: { stageId: req.params.stageId }
    });
    
    const created = await prisma.ingenioWheelSegment.createMany({
      data: segments.map((s: any) => ({
        stageId: req.params.stageId,
        number: s.number,
        color: s.color,
        title: s.title,
        description: s.description,
        isActive: true
      }))
    });
    
    res.status(201).json({ count: created.count });
  } catch (error) {
    console.error('Create segments error:', error);
    res.status(500).json({ error: 'Error al crear segmentos' });
  }
});

// ============================================
// CONTENTS (by wheel number)
// ============================================

// Get contents for a specific segment number
router.get('/stages/:stageId/contents/:segmentNumber', authenticate, async (req, res) => {
  try {
    const contents = await prisma.ingenioContent.findMany({
      where: {
        stageId: req.params.stageId,
        segmentNumber: parseInt(req.params.segmentNumber),
        isActive: true
      },
      orderBy: { order: 'asc' }
    });
    res.json(contents);
  } catch (error) {
    console.error('Get contents error:', error);
    res.status(500).json({ error: 'Error al obtener contenidos' });
  }
});

// Create content (admin only)
router.post('/contents', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { stageId, segmentNumber, title, description, type, url, order } = req.body;
    
    const content = await prisma.ingenioContent.create({
      data: {
        stageId,
        segmentNumber,
        title,
        description,
        type,
        url,
        order: order || 0
      }
    });
    
    res.status(201).json(content);
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ error: 'Error al crear contenido' });
  }
});

// Update content (admin only)
router.put('/contents/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { title, description, type, url, order, isActive } = req.body;
    
    const content = await prisma.ingenioContent.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        type,
        url,
        order,
        isActive
      }
    });
    
    res.json(content);
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Error al actualizar contenido' });
  }
});

// Delete content (admin only)
router.delete('/contents/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    await prisma.ingenioContent.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Error al eliminar contenido' });
  }
});

// ============================================
// MATERIALS
// ============================================

// Get materials for a stage
router.get('/stages/:stageId/materials', authenticate, async (req, res) => {
  try {
    const materials = await prisma.ingenioMaterial.findMany({
      where: {
        stageId: req.params.stageId,
        isActive: true
      },
      orderBy: { order: 'asc' }
    });
    res.json(materials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
});

// Create material (admin only)
router.post('/materials', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { stageId, title, description, type, url, fileName, fileSize, thumbnailUrl, duration, order } = req.body;
    
    const material = await prisma.ingenioMaterial.create({
      data: {
        stageId,
        title,
        description,
        type,
        url,
        fileName,
        fileSize,
        thumbnailUrl,
        duration,
        order: order || 0
      }
    });
    
    res.status(201).json(material);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Error al crear material' });
  }
});

// Update material (admin only)
router.put('/materials/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { title, description, type, url, fileName, fileSize, thumbnailUrl, duration, order, isActive } = req.body;
    
    const material = await prisma.ingenioMaterial.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        type,
        url,
        fileName,
        fileSize,
        thumbnailUrl,
        duration,
        order,
        isActive
      }
    });
    
    res.json(material);
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Error al actualizar material' });
  }
});

// Delete material (admin only)
router.delete('/materials/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    await prisma.ingenioMaterial.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Error al eliminar material' });
  }
});

// ============================================
// STUDENTS
// ============================================

// Get all students (admin only)
router.get('/students', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const students = await prisma.ingenioStudent.findMany({
      include: {
        assignments: {
          include: {
            stage: {
              select: { code: true, name: true }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// Get student by ID
router.get('/students/:id', authenticate, async (req, res) => {
  try {
    const student = await prisma.ingenioStudent.findUnique({
      where: { id: req.params.id },
      include: {
        assignments: {
          include: {
            stage: true
          }
        },
        progress: {
          include: {
            material: true
          }
        }
      }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
});

// Create student (admin only)
router.post('/students', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, documentId, company, notes,
      paymentStatus, paymentAmount, totalAmount, installmentsPaid, totalInstallments,
      stageIds // Array of stage IDs to assign
    } = req.body;
    
    // Check if email already exists
    const existing = await prisma.ingenioStudent.findUnique({
      where: { email }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un estudiante con este email' });
    }
    
    const student = await prisma.ingenioStudent.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        documentId,
        company,
        notes,
        paymentStatus: paymentStatus || 'pending',
        paymentAmount,
        totalAmount,
        installmentsPaid,
        totalInstallments,
        assignments: stageIds ? {
          create: stageIds.map((stageId: string) => ({
            stageId
          }))
        } : undefined
      },
      include: {
        assignments: {
          include: {
            stage: true
          }
        }
      }
    });
    
    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Error al crear estudiante' });
  }
});

// Update student (admin only)
router.put('/students/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, documentId, company, notes,
      paymentStatus, paymentAmount, totalAmount, installmentsPaid, totalInstallments,
      isActive, expiresAt
    } = req.body;
    
    const student = await prisma.ingenioStudent.update({
      where: { id: req.params.id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        documentId,
        company,
        notes,
        paymentStatus,
        paymentAmount,
        totalAmount,
        installmentsPaid,
        totalInstallments,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      }
    });
    
    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
});

// Delete student (admin only)
router.delete('/students/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    await prisma.ingenioStudent.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
});

// ============================================
// STUDENT ASSIGNMENTS
// ============================================

// Assign stages to student (admin only)
router.post('/students/:studentId/assign', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { stageIds } = req.body; // Array of stage IDs
    
    // Create assignments
    const assignments = await prisma.ingenioStudentAssignment.createMany({
      data: stageIds.map((stageId: string) => ({
        studentId: req.params.studentId,
        stageId
      })),
      skipDuplicates: true
    });
    
    res.json({ count: assignments.count });
  } catch (error) {
    console.error('Assign stages error:', error);
    res.status(500).json({ error: 'Error al asignar etapas' });
  }
});

// Remove assignment (admin only)
router.delete('/students/:studentId/assign/:stageId', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    await prisma.ingenioStudentAssignment.deleteMany({
      where: {
        studentId: req.params.studentId,
        stageId: req.params.stageId
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ error: 'Error al remover asignación' });
  }
});

// ============================================
// MATERIAL PROGRESS (for students)
// ============================================

// Get my progress
router.get('/my-progress', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    
    // Find student record for this user
    const student = await prisma.ingenioStudent.findFirst({
      where: { userId },
      include: {
        assignments: {
          include: {
            stage: {
              include: {
                materials: {
                  where: { isActive: true }
                }
              }
            }
          }
        },
        progress: true
      }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'No eres estudiante de Ingenio Millonario' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Error al obtener progreso' });
  }
});

// Update material progress
router.post('/progress/:materialId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { progress, completed } = req.body;
    
    // Find student
    const student = await prisma.ingenioStudent.findFirst({
      where: { userId }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'No eres estudiante' });
    }
    
    // Upsert progress
    const progressRecord = await prisma.ingenioMaterialProgress.upsert({
      where: {
        studentId_materialId: {
          studentId: student.id,
          materialId: req.params.materialId
        }
      },
      update: {
        progress,
        completed: completed || false,
        completedAt: completed ? new Date() : undefined,
        lastAccessedAt: new Date()
      },
      create: {
        studentId: student.id,
        materialId: req.params.materialId,
        progress: progress || 0,
        completed: completed || false,
        completedAt: completed ? new Date() : undefined
      }
    });
    
    res.json(progressRecord);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Error al actualizar progreso' });
  }
});

// ============================================
// PUBLIC/CLIENT ENDPOINTS
// ============================================

// Get stage data for students (with access check)
router.get('/presentations/:stageCode', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { stageCode } = req.params;
    
    // Check if user has access to this stage
    const student = await prisma.ingenioStudent.findFirst({
      where: { userId },
      include: {
        assignments: {
          include: {
            stage: true
          }
        }
      }
    });
    
    if (!student || !student.isActive) {
      return res.status(403).json({ error: 'No tienes acceso a Ingenio Millonario' });
    }
    
    const hasAccess = student.assignments.some(a => a.stage.code === stageCode);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes acceso a esta presentación' });
    }
    
    // Get stage with all content
    const stage = await prisma.ingenioStage.findFirst({
      where: { code: stageCode },
      include: {
        materials: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        },
        segments: {
          where: { isActive: true },
          orderBy: { number: 'asc' }
        },
        contents: {
          where: { isActive: true },
          orderBy: [{ segmentNumber: 'asc' }, { order: 'asc' }]
        }
      }
    });
    
    if (!stage) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }
    
    // Get student's progress for materials
    const progress = await prisma.ingenioMaterialProgress.findMany({
      where: { studentId: student.id }
    });
    
    res.json({
      stage,
      progress,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        paymentStatus: student.paymentStatus
      }
    });
  } catch (error) {
    console.error('Get presentation error:', error);
    res.status(500).json({ error: 'Error al obtener presentación' });
  }
});

export default router;
