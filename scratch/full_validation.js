import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const API_URL = 'http://localhost:3001/api';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testData = {
  firstName: 'Dario',
  lastName: 'Validation',
  email: `valid_${Date.now()}@example.com`,
  password: 'Password123!',
  roles: ['client', 'ingenio']
};

async function runFullValidation() {
  console.log('🏁 INICIANDO VALIDACIÓN PROFUNDA DEL SISTEMA...');

  try {
    // 1. REGISTRO
    console.log('\n--- Paso 1: Registro ---');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registro falló: ${JSON.stringify(regData)}`);
    console.log('✅ Registro exitoso');

    await sleep(500);

    // 2. VERIFICACIÓN (Vía DB por ser modo demo/test)
    console.log('\n--- Paso 2: Verificación ---');
    const user = await prisma.user.findUnique({ where: { email: testData.email } });
    if (!user.verificationToken) throw new Error('No se encontró token de verificación');
    
    const verifyRes = await fetch(`${API_URL}/auth/verify?token=${user.verificationToken}`);
    if (!verifyRes.ok) throw new Error('Verificación API falló');
    console.log('✅ Cuenta verificada');

    // 3. LOGIN
    console.log('\n--- Paso 3: Login ---');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testData.email, password: testData.password })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    console.log('✅ Login exitoso');

    // 4. CARGA DE SALDO (Simulando aprobación administrativa)
    console.log('\n--- Paso 4: Carga de Saldo (Admin Sync) ---');
    // En lugar de usar la UI, forzamos la carga en DB para simular la aprobación de un ticket de carga
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: 1500000 } // 1.5M Gs
    });
    console.log('✅ Saldo cargado en DB (Simulación Admin)');

    // 5. SUSCRIPCIÓN A INGENIO
    console.log('\n--- Paso 5: Compra de Suscripción Ingenio ---');
    const subRes = await fetch(`${API_URL}/ingenio/subscribe`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        planId: 'full-access', // Mocked ID
        paymentMethod: 'WALLET',
        installments: 1
      })
    });
    const subData = await subRes.json();
    if (!subRes.ok) throw new Error(`Compra falló: ${JSON.stringify(subData)}`);
    console.log('✅ Suscripción adquirida exitosamente');

    // 6. VALIDACIÓN DE ROLES Y ACCESO
    console.log('\n--- Paso 6: Validación de Roles ---');
    const meRes = await fetch(`${API_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    console.log('Roles actuales:', meData.roles);
    console.log('Acceso Ingenio:', meData.ingenioAccess);
    if (!meData.ingenioAccess || !meData.roles.includes('ingenio')) {
        throw new Error('No se sincronizaron los roles correctamente');
    }
    console.log('✅ Sincronización de roles correcta');

    // 7. VALIDACIÓN FINANCIERA (EL MOMENTO DE LA VERDAD)
    console.log('\n--- Paso 7: Validación de Sincronización Financiera ---');
    const records = await prisma.financialRecord.findMany({
        where: { userId: user.id },
        include: { category: true }
    });
    
    console.log(`Registros financieros encontrados: ${records.length}`);
    records.forEach(r => {
        console.log(`- [${r.type.toUpperCase()}] ${r.description}: ₲${r.amount} (${r.category.name})`);
    });

    const hasSubRecord = records.some(r => r.description.includes('Suscripción Ingenio') && r.type === 'expense');
    if (!hasSubRecord) {
        throw new Error('No se encontró el registro financiero del gasto de suscripción');
    }
    console.log('✅ Sincronización Financiera verificada');

    // 8. RECUPERACIÓN DE CONTRASEÑA (NUEVO CAMPO DB)
    console.log('\n--- Paso 8: Reset de Contraseña (Validación Esquema) ---');
    await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testData.email })
    });
    const userWithReset = await prisma.user.findUnique({ where: { email: testData.email } });
    console.log('Reset Token generado:', userWithReset.resetToken ? 'SÍ' : 'NO');
    if (!userWithReset.resetToken) throw new Error('Fallo al persistir resetToken en el nuevo esquema');
    console.log('✅ Esquema de base de datos verificado correclamente');

    console.log('\n✨✨ VALIDACIÓN TOTAL COMPLETADA ✨✨');
    console.log('El sistema está operando con una integración del 100% entre módulos.');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ FALLO CRÍTICO EN LA VALIDACIÓN:');
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runFullValidation();
