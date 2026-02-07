import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all courses (public)
router.get('/', async (req, res) => {
  try {
    const { category, level, search } = req.query;
    
    const where: any = { isPublished: true };
    
    if (category) {
      where.category = category as string;
    }
    
    if (level) {
      where.level = level as string;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    const courses = await prisma.course.findMany({
      where,
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
        enrollments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get course by slug (public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          include: {
            lessons: true,
          },
          orderBy: { order: 'asc' },
        },
        resources: true,
        enrollments: {
          select: {
            id: true,
            progress: true,
          },
        },
      },
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get my enrollments (must be before /:id to avoid Express matching "my" as :id)
router.get('/my/enrollments', authenticate, async (req: AuthRequest, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Update lesson progress (must be before /:id to avoid Express matching "enrollment" as :id)
router.patch('/enrollment/:enrollmentId/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const enrollmentId = req.params.enrollmentId as string;
    const { lessonId, completed } = req.body;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment || enrollment.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }

    const completedLessons = new Set(enrollment.completedLessons);

    if (completed) {
      completedLessons.add(lessonId);
    } else {
      completedLessons.delete(lessonId);
    }

    const course = await prisma.course.findUnique({
      where: { id: enrollment.courseId },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    let totalLessons = 0;
    if (course?.modules) {
      for (const module of course.modules) {
        totalLessons += module.lessons?.length || 0;
      }
    }

    const progress = totalLessons > 0
      ? (completedLessons.size / totalLessons) * 100
      : 0;

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        completedLessons: Array.from(completedLessons),
        progress,
        lastAccessedAt: new Date(),
        completedAt: progress === 100 ? new Date() : null,
      },
    });

    res.json(updatedEnrollment);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Get course by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true,
          },
          orderBy: { order: 'asc' },
        },
        resources: true,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Create course (admin only)
router.post('/', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { modules, ...courseData } = req.body;
    
    const course = await prisma.course.create({
      data: {
        ...courseData,
        instructorId: req.user!.userId,
        modules: {
          create: modules?.map((module: any) => ({
            title: module.title,
            description: module.description,
            order: module.order,
            lessons: {
              create: module.lessons?.map((lesson: any) => ({
                title: lesson.title,
                description: lesson.description,
                videoUrl: lesson.videoUrl,
                duration: lesson.duration,
                order: lesson.order,
                isPreview: lesson.isPreview,
              })),
            },
          })),
        },
      },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });
    
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Update course
router.put('/:id', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const course = await prisma.course.update({
      where: { id },
      data: req.body,
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Delete course
router.delete('/:id', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    await prisma.course.delete({
      where: { id },
    });
    
    res.json({ message: 'Curso deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Enroll in course
router.post('/:id/enroll', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    
    const course = await prisma.course.findUnique({
      where: { id },
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.userId,
          courseId: id,
        },
      },
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ error: 'Já matriculado neste curso' });
    }
    
    // If course is paid, check wallet
    if (course.price > 0) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: req.user!.userId },
      });
      
      if (!wallet || wallet.balance < course.price) {
        return res.status(400).json({ error: 'Saldo insuficiente' });
      }
      
      // Process payment
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: course.price },
            totalOut: { increment: course.price },
          },
        });
        
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: req.user!.userId,
            type: 'purchase',
            amount: -course.price,
            description: `Compra do curso: ${course.title}`,
            status: 'completed',
          },
        });
        
        await tx.course.update({
          where: { id },
          data: { enrolledCount: { increment: 1 } },
        });
        
        return tx.enrollment.create({
          data: {
            userId: req.user!.userId,
            courseId: id,
          },
        });
      });
    } else {
      // Free course, just enroll
      await prisma.course.update({
        where: { id },
        data: { enrolledCount: { increment: 1 } },
      });
      
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: req.user!.userId,
          courseId: id,
        },
      });
      
      return res.status(201).json(enrollment);
    }
    
    res.status(201).json({ message: 'Matriculado com sucesso' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

export default router;
