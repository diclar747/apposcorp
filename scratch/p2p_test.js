import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const API_URL = 'http://localhost:3001/api';

async function testP2PTransfer() {
  console.log('🔄 TEST: Transferencia P2P + Sincronización Financiera');

  try {
    // 1. Crear dos usuarios frescos para el test
    const email1 = `test_sender_${Date.now()}@example.com`;
    const email2 = `test_receiver_${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log('Creando usuarios de prueba...');
    await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'Sender', lastName: 'Test', email: email1, password, roles: ['client'] })
    });
    await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'Receiver', lastName: 'Test', email: email2, password, roles: ['client'] })
    });

    // Pequeño sleep para asegurar creación de billetera en DB
    await new Promise(r => setTimeout(r, 500));

    const user1 = await prisma.user.findUnique({ where: { email: email1 } });
    const user2 = await prisma.user.findUnique({ where: { email: email2 } });

    // Verificar
    await prisma.user.update({ where: { id: user1.id }, data: { isVerified: true } });
    await prisma.user.update({ where: { id: user2.id }, data: { isVerified: true } });

    console.log(`Emisor: ${user1.email}`);
    console.log(`Receptor: ${user2.email}`);

    // Asegurar saldo en el emisor
    await prisma.wallet.update({ where: { userId: user1.id }, data: { balance: 100000 } });

    // Login Emisor para obtener token
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email1, password })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) throw new Error(`Login falló: ${JSON.stringify(loginData)}`);

    // 2. Ejecutar Transferencia
    const transferAmount = 50000;
    console.log(`\nEnviando ₲${transferAmount} de ${user1.firstName} a ${user2.firstName}...`);
    
    const transRes = await fetch(`${API_URL}/wallet/transfer`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            toUserId: user2.id,
            amount: transferAmount,
            description: 'Prueba de transferencia integrada'
        })
    });

    if (!transRes.ok) {
        const err = await transRes.json();
        throw new Error(`Transferencia falló: ${JSON.stringify(err)}`);
    }
    console.log('✅ Transferencia exitosa en Wallet');

    // 3. Validar Balances
    const sWallet = await prisma.wallet.findUnique({ where: { userId: user1.id } });
    const rWallet = await prisma.wallet.findUnique({ where: { userId: user2.id } });

    console.log(`\nNuevos Balances:`);
    console.log(`Emisor: ${sWallet.balance}`);
    console.log(`Receptor: ${rWallet.balance}`);

    // 4. Validar Sincronización Financiera (EL CORE DEL REQUERIMIENTO)
    console.log('\nAuditando registros financieros...');
    
    const sRecords = await prisma.financialRecord.findMany({ where: { userId: user1.id }, orderBy: { createdAt: 'desc' }, take: 1 });
    const rRecords = await prisma.financialRecord.findMany({ where: { userId: user2.id }, orderBy: { createdAt: 'desc' }, take: 1 });

    if (sRecords[0]?.type === 'expense' && sRecords[0]?.amount === transferAmount) {
        console.log(`✅ Emisor: Gasto registrado correctamente (₲${sRecords[0].amount})`);
    } else {
        throw new Error('Emisor: Registro financiero incorrecto o inexistente');
    }

    if (rRecords[0]?.type === 'income' && rRecords[0]?.amount === transferAmount) {
        console.log(`✅ Receptor: Ingreso registrado correctamente (₲${rRecords[0].amount})`);
    } else {
        throw new Error('Receptor: Registro financiero incorrecto o inexistente');
    }

    console.log('\n✨ TEST P2P COMPLETADO CON ÉXITO ✨');

  } catch (error) {
    console.error('❌ ERROR EN TEST P2P:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testP2PTransfer();
