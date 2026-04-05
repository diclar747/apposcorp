import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';

const router = Router();

// Verificación completa del sistema de login
router.get('/full-check', async (req, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const testEmail = 'admin@oscorp.com';
    const testPassword = '123456';
    
    // 1. Listar TODOS los usuarios
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        password: true
      }
    });
    
    // 2. Buscar usuario específico
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    
    // 3. Si no existe, crearlo
    let userCreated = false;
    if (!user) {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      await prisma.user.create({
        data: {
          email: testEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'Oscorp',
          phone: '0000000000',
          address: 'Test',
          city: 'Test',
          role: 'superadmin',
          isActive: true
        }
      });
      userCreated = true;
    }
    
    // 4. Verificar contraseña
    const foundUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    
    let passwordValid = false;
    if (foundUser) {
      passwordValid = await bcrypt.compare(testPassword, foundUser.password);
      
      // Si no coincide, forzar actualización
      if (!passwordValid) {
        const newHashed = await bcrypt.hash(testPassword, 10);
        await prisma.user.update({
          where: { email: testEmail },
          data: { password: newHashed, isActive: true }
        });
        
        // Verificar de nuevo
        const updatedUser = await prisma.user.findUnique({
          where: { email: testEmail }
        });
        passwordValid = await bcrypt.compare(testPassword, updatedUser!.password);
      }
    }
    
    // 5. Intentar login completo
    let loginSuccess = false;
    let token = null;
    
    if (foundUser && passwordValid) {
      try {
        token = generateToken({
          userId: foundUser.id,
          email: foundUser.email,
          role: foundUser.role
        });
        loginSuccess = true;
      } catch (e) {
        loginSuccess = false;
      }
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      database: {
        totalUsers: allUsers.length,
        usersList: allUsers.map(u => ({ id: u.id, email: u.email, role: u.role, isActive: u.isActive }))
      },
      testUser: {
        email: testEmail,
        exists: !!foundUser,
        userCreated: userCreated,
        isActive: foundUser?.isActive,
        passwordValid: passwordValid,
        loginSuccess: loginSuccess,
        tokenGenerated: !!token
      },
      credentials: {
        email: testEmail,
        password: testPassword
      },
      ready: loginSuccess
    });

  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Login directo simplificado
router.post('/direct-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }
    
    const bcrypt = await import('bcryptjs');
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no existe', code: 'USER_NOT_FOUND' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Cuenta desactivada', code: 'ACCOUNT_INACTIVE' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Contraseña incorrecta', 
        code: 'INVALID_PASSWORD',
        debug: {
          providedPassword: password,
          storedHash: user.password.substring(0, 20) + '...'
        }
      });
    }
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;
