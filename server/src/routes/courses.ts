import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all courses (public gets published only, admin gets all)
router.get('/', async (req: any, res) => {
  try {
    const { category, level, search, all } = req.query;

    const where: any = {};

    // If not requesting all (admin), only show published
    if (all !== 'true') {
      where.isPublished = true;
    }

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
            lessons: {
              include: { resources: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        resources: true,
        userCourses: {
          select: {
            id: true,
            userId: true,
            progress: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Error del servidor' });
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
            lessons: {
              include: { resources: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        resources: true,
        userCourses: {
          select: {
            id: true,
            progress: true,
            userId: true,
            status: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Get my enrollments (must be before /:id to avoid Express matching "my" as :id)
router.get('/my/enrollments', authenticate, async (req: AuthRequest, res) => {
  try {
    const userCourses = await prisma.userCourse.findMany({
      where: { userId: req.user!.userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  include: { resources: true },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    res.json(userCourses);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});


// Update lesson progress (must be before /:id to avoid Express matching "enrollment" as :id)
router.patch('/access/:accessId/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const accessId = req.params.accessId as string;
    const { lessonId, completed } = req.body;

    const userCourse = await prisma.userCourse.findUnique({
      where: { id: accessId },
    });

    if (!userCourse || userCourse.userId !== req.user!.userId) {
      return res.status(404).json({ error: 'Acceso al curso no encontrado' });
    }

    const completedLessons = new Set(userCourse.completedLessons);

    if (completed) {
      completedLessons.add(lessonId);
    } else {
      completedLessons.delete(lessonId);
    }

    const course = await prisma.course.findUnique({
      where: { id: userCourse.courseId },
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

    const updatedAccess = await prisma.userCourse.update({
      where: { id: accessId },
      data: {
        completedLessons: Array.from(completedLessons),
        progress,
        lastAccessedAt: new Date(),
        completedAt: progress === 100 ? new Date() : null,
      },
    });

    res.json(updatedAccess);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
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
            lessons: {
              include: { resources: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        resources: true,
        userCourses: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Create course (admin only)
router.post('/', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { title, description, shortDescription, price, category, level, instructorName, coverImage, previewVideo, isPublished } = req.body;

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    // Get instructor name from current user if not provided
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || '',
        shortDescription: shortDescription || description?.substring(0, 120) || '',
        instructorId: req.user!.userId,
        instructorName: instructorName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin',
        category: category || 'General',
        level: level || 'beginner',
        price: price ? Number(price) : 0,
        coverImage: coverImage || null,
        previewVideo: previewVideo || null,
        isPublished: isPublished ?? true,
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
    res.status(500).json({ error: 'Error al crear curso' });
  }
});

// Update course
router.put('/:id', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { 
      title, description, shortDescription, price, comparePrice,
      category, level, instructorName, coverImage, previewVideo, 
      isPublished, isFeatured 
    } = req.body;

    const existingCourse = await prisma.course.findUnique({ where: { id } });
    if (!existingCourse) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const updateData: any = {};
    if (title !== undefined) {
      updateData.title = title;
      // If title changes, we might want to update slug (optional, but requested implicitly by "completing CRUD")
      // In this system, slugs include a timestamp, so we often keep them persistent, 
      // but let's allow it if the system expects title-slug sync.
      // updateData.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    }
    
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (price !== undefined) updateData.price = Number(price);
    if (comparePrice !== undefined) updateData.comparePrice = Number(comparePrice);
    if (category !== undefined) updateData.category = category;
    if (level !== undefined) updateData.level = level;
    if (instructorName !== undefined) updateData.instructorName = instructorName;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (previewVideo !== undefined) updateData.previewVideo = previewVideo;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        modules: {
          include: {
            lessons: {
              include: { resources: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        resources: true,
      },
    });

    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Error al actualizar curso' });
  }
});

// Patch course
router.patch('/:id', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { 
      title, description, shortDescription, price, comparePrice,
      category, level, instructorName, coverImage, previewVideo, 
      isPublished, isFeatured 
    } = req.body;

    const existingCourse = await prisma.course.findUnique({ where: { id } });
    if (!existingCourse) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (price !== undefined) updateData.price = Number(price);
    if (comparePrice !== undefined) updateData.comparePrice = Number(comparePrice);
    if (category !== undefined) updateData.category = category;
    if (level !== undefined) updateData.level = level;
    if (instructorName !== undefined) updateData.instructorName = instructorName;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (previewVideo !== undefined) updateData.previewVideo = previewVideo;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        modules: {
          include: {
            lessons: {
              include: { resources: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        resources: true,
      },
    });

    res.json(course);
  } catch (error) {
    console.error('Patch course error:', error);
    res.status(500).json({ error: 'Error al actualizar curso' });
  }
});

// Delete course
router.delete('/:id', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    // Check existence first
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Deletion: Cascade on UserCourse, Module, Resource is handled by @relation(onDelete: Cascade) in schema.prisma
    await prisma.course.delete({
      where: { id },
    });

    res.json({ message: 'Curso eliminado exitosamente', id });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Error al eliminar el curso. Verifique si tiene dependencias activas.' });
  }
});

// ============ MODULES ============

// Add module to course
router.post('/:id/modules', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const courseId = req.params.id as string;
    const { title, description } = req.body;

    // Get next order number
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const module = await prisma.module.create({
      data: {
        courseId,
        title,
        description: description || '',
        order: (lastModule?.order || 0) + 1,
      },
      include: {
        lessons: {
          include: { resources: true },
        },
      },
    });

    res.status(201).json(module);
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Error al crear módulo' });
  }
});

// Update module
router.put('/modules/:moduleId', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const moduleId = req.params.moduleId as string;
    const { title, description, order } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;

    const module = await prisma.module.update({
      where: { id: moduleId },
      data: updateData,
      include: {
        lessons: {
          include: { resources: true },
        },
      },
    });

    res.json(module);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar módulo' });
  }
});

// Delete module
router.delete('/modules/:moduleId', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const moduleId = req.params.moduleId as string;

    await prisma.module.delete({
      where: { id: moduleId },
    });

    res.json({ message: 'Módulo eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar módulo' });
  }
});

// ============ LESSONS / MATERIALS ============

// Add lesson/material to module
router.post('/modules/:moduleId/lessons', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const moduleId = req.params.moduleId as string;
    const { title, description, videoUrl, duration, isPreview } = req.body;

    // Get next order number
    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
    });

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title,
        description: description || '',
        videoUrl: videoUrl || null,
        duration: duration || 0,
        order: (lastLesson?.order || 0) + 1,
        isPreview: isPreview || false,
      },
      include: { resources: true },
    });

    res.status(201).json(lesson);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Error al crear lección' });
  }
});

// Update lesson
router.put('/lessons/:lessonId', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const lessonId = req.params.lessonId as string;
    const { title, description, videoUrl, duration, order, isPreview } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (duration !== undefined) updateData.duration = duration;
    if (order !== undefined) updateData.order = order;
    if (isPreview !== undefined) updateData.isPreview = isPreview;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
      include: { resources: true },
    });

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar lección' });
  }
});

// Delete lesson
router.delete('/lessons/:lessonId', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const lessonId = req.params.lessonId as string;

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    res.json({ message: 'Lección eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar lección' });
  }
});

// ============ RESOURCES (PDF, Images, YouTube) ============

// Add resource to a lesson or course
router.post('/resources', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { courseId, lessonId, title, type, url } = req.body;

    const resource = await prisma.resource.create({
      data: {
        courseId: courseId || null,
        lessonId: lessonId || null,
        title,
        type, // 'pdf', 'image', 'video', 'link'
        url,
      },
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Error al crear recurso' });
  }
});

// Delete resource
router.delete('/resources/:resourceId', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const resourceId = req.params.resourceId as string;

    await prisma.resource.delete({
      where: { id: resourceId },
    });

    res.json({ message: 'Recurso eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar recurso' });
  }
});

// ============ ENROLLMENTS ============

// Get enrollments for a course (admin)
router.get('/:id/access', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const courseId = req.params.id as string;

    const userCourses = await prisma.userCourse.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(userCourses);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Assign user to course (admin)
router.post('/:id/assign', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const courseId = req.params.id as string;
    const { userId } = req.body;

    // Check course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Check if already has access
    const existing = await prisma.userCourse.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      return res.status(400).json({ error: 'El usuario ya tiene acceso a este curso' });
    }

    // Create access and activate ingenio access
    const [userCourse] = await prisma.$transaction([
      prisma.userCourse.create({
        data: { userId, courseId, status: 'active' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
        },
      }),
      prisma.course.update({
        where: { id: courseId },
        data: { enrolledCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { ingenioAccess: true },
      }),
    ]);

    res.status(201).json(userCourse);
  } catch (error) {
    console.error('Assign user error:', error);
    res.status(500).json({ error: 'Error al asignar usuario' });
  }
});

// Remove access (admin)
router.delete('/:id/access/:accessId', authenticate, authorize('superadmin'), async (req: AuthRequest, res) => {
  try {
    const accessId = req.params.accessId as string;

    const userCourse = await prisma.userCourse.findUnique({ where: { id: accessId } });
    if (!userCourse) {
      return res.status(404).json({ error: 'Acceso no encontrado' });
    }

    await prisma.$transaction([
      prisma.userCourse.delete({ where: { id: accessId } }),
      prisma.course.update({
        where: { id: userCourse.courseId },
        data: { enrolledCount: { decrement: 1 } },
      }),
    ]);

    res.json({ message: 'Acceso eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar inscripción' });
  }
});

// Enroll in course (user self-enroll for free courses or paid)
router.post('/:id/enroll', authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Check if already has access
    const existingAccess = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.userId,
          courseId: id,
        },
      },
    });

    if (existingAccess) {
      return res.status(400).json({ error: 'Ya tienes acceso a este curso' });
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
      const userCourse = await prisma.$transaction(async (tx) => {
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
            description: `Compra del curso: ${course.title}`,
            status: 'completed',
          },
        });

        await tx.course.update({
          where: { id },
          data: { enrolledCount: { increment: 1 } },
        });

        return tx.userCourse.create({
          data: {
            userId: req.user!.userId,
            courseId: id,
            status: 'active',
          },
        });
      });

      return res.status(201).json(userCourse);
    } else {
      // Free course, just enroll
      await prisma.course.update({
        where: { id },
        data: { enrolledCount: { increment: 1 } },
      });

      const userCourse = await prisma.userCourse.create({
        data: {
          userId: req.user!.userId,
          courseId: id,
          status: 'active',
        },
      });

      return res.status(201).json(userCourse);
    }
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Error al inscribirse' });
  }
});

// Request access to course (user)
router.post('/:id/request', authenticate, async (req: AuthRequest, res) => {
  try {
    const courseId = req.params.id as string;
    const userId = req.user!.userId;

    // Check course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Check if already has access
    const existing = await prisma.userCourse.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      return res.status(400).json({ error: 'Ya tienes acceso a este curso' });
    }

    // Create a notification for the admin
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Find admin users
    const admins = await prisma.user.findMany({
      where: { role: 'superadmin' },
      select: { id: true },
    });

    // Create notification for each admin
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'system',
          title: 'Solicitud de acceso a curso',
          message: `${user?.firstName} ${user?.lastName} solicita acceso al curso "${course.title}"`,
          actionUrl: `/admin/cursos?assign=${courseId}&user=${userId}`,
        },
      });
    }

    res.json({ message: 'Solicitud enviada al administrador' });
  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({ error: 'Error al enviar solicitud' });
  }
});

export default router;
