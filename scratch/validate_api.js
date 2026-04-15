import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const API_URL = 'http://localhost:3001/api';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testData = {
  firstName: 'Dario',
  lastName: 'Test',
  email: `test_${Date.now()}@example.com`,
  password: 'Password123!',
  roles: ['client', 'ingenio']
};

async function runTests() {
  console.log('🚀 Iniciando validación de API (Deep Dive Mode v2)...');

  try {
    // 1. Registro
    console.log('\n1. Probando Registro...');
    const registerRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) throw new Error(`Registro falló: ${JSON.stringify(registerData)}`);
    console.log('✅ Registro exitoso');

    await sleep(500);

    // 2. Extraer token de verificación de la DB
    console.log('\n2. Buscando token de verificación en DB...');
    const user = await prisma.user.findUnique({ where: { email: testData.email } });
    const verifyToken = user.verificationToken;
    console.log('Token encontrado:', verifyToken);

    // 3. Verificación
    console.log('\n3. Probando Verificación...');
    const verifyRes = await fetch(`${API_URL}/auth/verify?token=${verifyToken}`);
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(`Verificación falló: ${JSON.stringify(verifyData)}`);
    console.log('✅ Verificación exitosa');

    // 4. Login
    console.log('\n4. Probando Login...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testData.email,
        password: testData.password
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login falló: ${JSON.stringify(loginData)}`);
    console.log('✅ Login exitoso');
    const token = loginData.token;
    const authHeaders = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    // 5. Wallet
    console.log('\n5. Probando Wallet...');
    const meRes = await fetch(`${API_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    if (meData.wallet) {
      console.log('✅ Billetera creada automáticamente. Saldo:', meData.wallet.balance);
    } else {
      console.log('❌ Error: Billetera no encontrada');
    }

    // 6. Recuperación de Contraseña
    console.log('\n6. Probando Recuperación de Contraseña...');
    const forgotRes = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testData.email })
    });
    const forgotData = await forgotRes.json();
    if (!forgotRes.ok) throw new Error(`Forgot Password falló: ${JSON.stringify(forgotData)}`);

    await sleep(1000); // Dar tiempo al servidor para procesar
    
    // Extraer reset token de DB
    const userUpdate = await prisma.user.findUnique({ where: { email: testData.email } });
    const resetToken = userUpdate.resetToken;
    console.log('Token de reset encontrado en DB:', resetToken);

    if (!resetToken) {
        throw new Error('El token de reset no se guardó en la DB');
    }

    const resetRes = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: 'NewPassword123!'
      })
    });
    const resetData = await resetRes.json();
    if (!resetRes.ok) throw new Error(`Reset falló: ${JSON.stringify(resetData)}`);
    console.log('✅ Reset de contraseña exitoso');

    // 7. Login con nueva contraseña
    console.log('\n7. Probando Login con nueva contraseña...');
    const loginNewRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testData.email,
        password: 'NewPassword123!'
      })
    });
    if (!loginNewRes.ok) throw new Error('Login con nueva contraseña falló');
    console.log('✅ Login con nueva contraseña exitoso');

    console.log('\n✨ VALIDACIÓN COMPLETADA CON ÉXITO ✨');
    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA VALIDACIÓN:');
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runTests();
