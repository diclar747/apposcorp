// Regresión: funciones que ya existían y tocamos indirectamente. Uso: node scratch/e2e-regresion.mjs
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const API = 'http://localhost:3001/api';
const prisma = new PrismaClient();
const run = Date.now().toString(36);
let failures = 0;
const check = (cond, label, extra) => {
  console.log(`${cond ? '✅' : '❌'} ${label}${extra !== undefined ? ` → ${JSON.stringify(extra)}` : ''}`);
  if (!cond) failures++;
};
const call = async (method, path, token, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};

async function main() {
  // Registro público normal (cliente y vendedor) sigue funcionando
  const email = `r-client-${run}@test.local`;
  const reg = await call('POST', '/auth/register', null, { email, password: 'Prueba1234', firstName: 'Reg', lastName: 'Cliente' });
  check(reg.status === 201 && reg.data.user.roles.join() === 'client' && !!reg.data.user.wallet, 'Registro cliente con billetera', reg.data?.user?.roles);
  const regS = await call('POST', '/auth/register', null, { email: `r-seller-${run}@test.local`, password: 'Prueba1234', firstName: 'Reg', lastName: 'Vend', roles: ['seller'] });
  check(regS.status === 201 && !!regS.data.user.sellerProfile, 'Registro vendedor crea tienda', regS.data?.user?.sellerProfile?.storeSlug);
  const regI = await call('POST', '/auth/register', null, { email: `r-ing-${run}@test.local`, password: 'Prueba1234', firstName: 'Reg', lastName: 'Ing', roles: ['ingenio'], initialInterface: 'INGENIO' });
  check(regI.status === 201, 'Registro Ingenio', regI.status);
  const dup = await call('POST', '/auth/register', null, { email, password: 'Prueba1234', firstName: 'x', lastName: 'y' });
  check(dup.status === 400, 'Email duplicado rechazado', dup.data);

  // Login y /me (localmente se exige verificar el email: se marca verificado en la base)
  await prisma.user.updateMany({ where: { email: { contains: `-${run}@test.local` } }, data: { isVerified: true } });
  const login = await call('POST', '/auth/login', null, { email, password: 'Prueba1234' });
  check(login.status === 200 && login.data.token, 'Login normal');
  const me = await call('GET', '/auth/me', login.data.token);
  check(me.status === 200 && me.data.email === email, '/auth/me');

  // Admin crea usuarios (incluido superadmin) por el endpoint nuevo
  const adminEmail = `r-admin-${run}@test.local`;
  await prisma.user.create({ data: { email: adminEmail, password: await bcrypt.hash('Prueba1234', 10), firstName: 'A', lastName: 'R', roles: ['superadmin'], isVerified: true } });
  const adminTok = (await call('POST', '/auth/login', null, { email: adminEmail, password: 'Prueba1234' })).data.token;
  const created = await call('POST', '/users', adminTok, { email: `r-new-${run}@test.local`, password: 'Prueba1234', firstName: 'N', lastName: 'U', roles: ['seller'] });
  check(created.status === 201 && created.data.user.sellerProfile, 'Admin crea vendedor', created.data?.user?.roles);
  const createdSA = await call('POST', '/users', adminTok, { email: `r-sa-${run}@test.local`, password: 'Prueba1234', firstName: 'N', lastName: 'U', roles: ['superadmin'] });
  check(createdSA.status === 201, 'Admin puede crear superadmin', createdSA.status);
  const noAdmin = await call('POST', '/users', login.data.token, { email: `r-x-${run}@test.local`, password: 'Prueba1234', firstName: 'N', lastName: 'U', roles: ['superadmin'] });
  check(noAdmin.status === 403, 'Cliente no puede usar el alta de admin', noAdmin.status);
  const list = await call('GET', '/users', adminTok);
  check(list.status === 200 && Array.isArray(list.data), 'Admin lista usuarios');

  // Planes: lectura pública sigue abierta; aprobar suscripción solo admin
  const plans = await call('GET', '/plans');
  check(plans.status === 200, 'Planes públicos visibles', plans.data?.length);
  const subs = await call('GET', '/seller-subscriptions/all', adminTok);
  check(subs.status === 200, 'Admin ve suscripciones de vendedores');
  const sellerTok = (await call('POST', '/auth/login', null, { email: `r-seller-${run}@test.local`, password: 'Prueba1234' })).data.token;
  const subsNo = await call('GET', '/seller-subscriptions/all', sellerTok);
  check(subsNo.status === 403, 'Vendedor no ve suscripciones ajenas', subsNo.status);
  if (plans.data?.[0]) {
    const w = await call('POST', '/seller-subscriptions/subscribe', sellerTok, { planId: plans.data[0].id, paymentMethod: 'WALLET', billingCycle: 'monthly' });
    check(w.status === 200 && w.data.status === 'PENDING_PAYMENT', 'Pagar plan con "WALLET" ya no lo activa gratis', w.data?.status);
  }

  // Billetera: transferencia y retiro de cliente
  const other = await call('POST', '/auth/register', null, { email: `r-other-${run}@test.local`, password: 'Prueba1234', firstName: 'O', lastName: 'T' });
  await prisma.user.updateMany({ where: { email: { contains: `-${run}@test.local` } }, data: { isVerified: true } });
  const me2 = me.data;
  await prisma.wallet.update({ where: { userId: me2.id }, data: { balance: 100000 } });
  const pin = await call('POST', '/wallet/pin/set', login.data.token, { pin: '1234' });
  const tr = await call('POST', '/wallet/transfer', login.data.token, { toUserId: other.data.user.id, amount: 10000, description: 'test', pin: '1234' });
  check(tr.status === 200, 'Transferencia entre billeteras', tr.data?.error || tr.status);
  const wd = await call('POST', '/wallet/withdraw', login.data.token, { amount: 5000 });
  check(wd.status === 200, 'Cliente puede solicitar retiro', wd.data?.error || wd.status);
  const w = await call('GET', '/wallet', login.data.token);
  check(w.data.balance === 85000, 'Saldo tras transferencia y retiro', w.data.balance);

  // Productos: vendedor crea (con slug), borrar con ventas desactiva
  const sp = await prisma.sellerProfile.findUnique({ where: { userId: regS.data.user.id } });
  // El checkout online exige un plan con "Tienda Online" (que no sea el Básico): mismo requisito que en producción
  const onlinePlan = await prisma.subscriptionPlan.create({ data: { name: `Plan Reg ${run}`, description: '', features: ['Tienda Online'] } });
  await prisma.sellerProfile.update({ where: { id: sp.id }, data: { planActive: true, planId: onlinePlan.id } });
  const prod = await call('POST', '/products', sellerTok, { name: 'Café Molido Ñandutí', description: 'x', price: 25000, stock: 10, category: 'General', type: 'physical', visibility: 'both' });
  check(prod.status === 201 && /^cafe-molido-nanduti-/.test(prod.data.slug), 'Producto nuevo con slug legible', prod.data?.slug);
  const pos = await call('POST', '/orders', sellerTok, { isPosSale: true, sellerId: sp.id, items: [{ productId: prod.data.id, quantity: 2, price: 1 }], paymentMethod: 'cash', paymentStatus: 'paid', orderNumber: 'V-1234' });
  check(pos.status === 201 && pos.data.total === 50000 && pos.data.orderNumber !== 'V-1234', 'POS: precio del servidor y número repetido con sufijo', pos.data?.orderNumber);
  const del = await call('DELETE', `/products/${prod.data.id}`, sellerTok);
  check(del.status === 200 && del.data.deactivated, 'Borrar producto con ventas lo desactiva', del.data);
  const pubList = await call('GET', `/products?sellerId=${sp.id}`);
  check(pubList.data.length === 0, 'Productos inactivos no visibles al público');
  const ownList = await call('GET', `/products?sellerId=${sp.id}`, sellerTok);
  check(ownList.data.length === 1, 'La tienda sí ve sus inactivos');

  // Pedido viejo (formato anterior al checkout) sigue funcionando
  await prisma.product.update({ where: { id: prod.data.id }, data: { status: 'active' } });
  await prisma.wallet.update({ where: { userId: me2.id }, data: { balance: 100000 } });
  const legacy = await call('POST', '/orders', login.data.token, { sellerId: sp.id, items: [{ productId: prod.data.id, quantity: 1 }], paymentMethod: 'wallet', deliveryType: 'delivery' });
  check(legacy.status === 201 && legacy.data.orderNumber, 'POST /orders (formato viejo) sigue respondiendo un pedido', legacy.data?.error);
  const st = await call('PATCH', `/orders/${legacy.data.id}/status`, adminTok, { status: 'shipped' });
  check(st.status === 200 && st.data.status === 'in_transit', 'Estado "shipped" del panel admin se guarda como en camino', st.data?.status);
  const bad = await call('PATCH', `/orders/${legacy.data.id}/status`, adminTok, { status: 'inventado' });
  check(bad.status === 400, 'Estado inválido rechazado', bad.status);

  // Reportes y dashboards existentes
  for (const [path, tok] of [['/reports/financial', adminTok], ['/reports/admin-stats', adminTok], ['/reports/seller-stats', sellerTok], ['/reports/client-stats', login.data.token], ['/stores', null], [`/stores/${sp.storeSlug}`, null], ['/settings/public', null]]) {
    const r = await call('GET', path, tok);
    check(r.status === 200, `GET ${path}`, r.status === 200 ? undefined : r.data);
  }

  console.log(failures ? `\n${failures} prueba(s) fallaron` : '\nTodas las pruebas de regresión pasaron');
}

main().catch((e) => { console.error(e); failures++; }).finally(async () => {
  await prisma.$disconnect();
  process.exit(failures ? 1 : 0);
});
