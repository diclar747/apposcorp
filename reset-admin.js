
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function resetAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
        where: { email: 'admin@oscorp.com' },
        data: { password: hashedPassword }
    });
    console.log('Admin password reset to: admin123');
}

resetAdmin()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
