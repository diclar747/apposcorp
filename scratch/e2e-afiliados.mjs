// Prueba de punta a punta del programa de afiliados contra el servidor LOCAL (http://localhost:3001).
// Crea usuarios de prueba con prefijo e2e-, no toca otros datos. Uso: node scratch/e2e-afiliados.mjs
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const API = process.env.API || 'http://localhost:3001/api';
const prisma = new PrismaClient();
const run = Date.now().toString(36);
const PASS = 'Prueba1234';
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
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
};

const mkUser = async (name, roles, balance = 0) => {
  const email = `e2e-${name}-${run}@test.local`;
  const user = await prisma.user.create({
    data: {
      email, password: await bcrypt.hash(PASS, 10), firstName: name, lastName: 'E2E', roles, isVerified: true,
      wallet: { create: { balance, currency: 'PYG' } },
    },
  });
  const login = await call('POST', '/auth/login', null, { email, password: PASS });
  if (!login.data?.token) throw new Error(`login ${name}: ${JSON.stringify(login.data)}`);
  return { ...user, token: login.data.token };
};
const balance = async (userId) => (await prisma.wallet.findUnique({ where: { userId } })).balance;

async function main() {
  // ── Seguridad ──
  const reg = await call('POST', '/auth/register', null, { email: `e2e-hack-${run}@test.local`, password: PASS, firstName: 'H', lastName: 'X', roles: ['superadmin'] });
  check(reg.status === 400, 'Registro con rol superadmin rechazado', reg.status);
  const setup = await call('GET', '/setup');
  check(setup.status === 404, '/api/setup deshabilitado', setup.status);
  const leak = await call('GET', '/health/test-login-query?email=admin@oscorp.com');
  check(leak.status === 404 || !leak.data?.user, '/health/test-login-query eliminado', leak.status);
  const health = await call('GET', '/health/db');
  check(health.status === 200 && !health.data.users, '/health/db sin lista de usuarios', health.data);

  // ── Datos ──
  const admin = await mkUser('admin', ['superadmin']);
  const seller = await mkUser('seller', ['seller', 'client'], 0);
  const seller2 = await mkUser('seller2', ['seller', 'client'], 0);
  const affiliate = await mkUser('afiliado', ['client']);
  const buyer = await mkUser('buyer', ['client'], 5_000_000);

  const planRes = await call('POST', '/plans', seller.token, { name: 'hack', tier: 'x' });
  check(planRes.status === 403, 'Vendedor no puede crear planes', planRes.status);

  const sp = await prisma.sellerProfile.create({ data: { userId: seller.id, storeName: `Tienda E2E ${run}`, storeSlug: `e2e-tienda-${run}`, description: '', address: '', phone: '', email: seller.email, whatsappNumber: '', commissionRate: 5 } });
  const sp2 = await prisma.sellerProfile.create({ data: { userId: seller2.id, storeName: `Otra E2E ${run}`, storeSlug: `e2e-otra-${run}`, description: '', address: '', phone: '', email: seller2.email, whatsappNumber: '', commissionRate: 5 } });
  const mkProduct = (sellerId, name, price, extra = {}) => prisma.product.create({ data: { sellerId, name, description: 'e2e', price, stock: 50, sku: `E2E-${name}-${run}`, images: [], category: 'e2e', tags: [], slug: `e2e-${name.toLowerCase()}-${run}`, ...extra } });
  const pA = await mkProduct(sp.id, 'ProdA', 1_000_000, { affiliateEnabled: true, affiliateRate: 20 });
  const pB = await mkProduct(sp.id, 'ProdB', 100_000); // hereda: participa si la tienda marca "todos"
  const pC = await mkProduct(sp.id, 'ProdC', 50_000, { affiliateEnabled: false });
  const pOther = await mkProduct(sp2.id, 'ProdOtra', 200_000);

  // ── Programa apagado ──
  await call('PUT', '/affiliates/admin/config', admin.token, { enabled: false });
  const joinOff = await call('POST', '/affiliates/join', affiliate.token, { acceptTerms: true });
  check(joinOff.status === 403, 'Programa apagado: no se puede unir', joinOff.status);

  const cfg = await call('PUT', '/affiliates/admin/config', admin.token, { enabled: true, holdDays: 0, cookieDays: 30, minRate: 1, maxRate: 50, autoApprove: true, autoRelease: true, codEnabled: true });
  check(cfg.status === 200, 'Admin configura programa', cfg.data?.config);

  const badRate = await call('PUT', '/affiliates/seller/settings', seller.token, { affiliateEnabled: true, affiliateDefaultRate: 80, affiliateAllProducts: true });
  check(badRate.status === 400, '% fuera de rango rechazado', badRate.data);
  const ss = await call('PUT', '/affiliates/seller/settings', seller.token, { affiliateEnabled: true, affiliateDefaultRate: 10, affiliateAllProducts: true });
  check(ss.status === 200, 'Tienda activa afiliados 10% todos', ss.data);

  // ── Página pública ──
  const pub = await call('GET', `/products/public/${pA.slug}`);
  check(pub.status === 200 && pub.data.affiliate.rate === 20, 'Producto público con % propio 20', pub.data?.affiliate);
  const pubB = await call('GET', `/products/public/${pB.slug}`);
  check(pubB.data?.affiliate?.rate === 10, 'Producto hereda % general 10', pubB.data?.affiliate);
  const pubC = await call('GET', `/products/public/${pC.slug}`);
  check(pubC.data?.affiliate?.participates === false, 'Producto excluido no participa', pubC.data?.affiliate);
  check(pub.data?.cost === undefined, 'La página pública no expone el costo');

  // ── Alta de afiliado y enlaces ──
  const join = await call('POST', '/affiliates/join', affiliate.token, { acceptTerms: true });
  check(join.status === 201 && join.data.profile.status === 'active', 'Afiliado se une (activo al instante)', join.data?.profile?.code);
  const code = join.data.profile.code;
  const linkA = await call('POST', '/affiliates/links', affiliate.token, { productId: pA.id });
  check(linkA.status === 200 && linkA.data.path.includes(`?ref=${code}`), 'Enlace de producto', linkA.data?.path);
  const linkC = await call('POST', '/affiliates/links', affiliate.token, { productId: pC.id });
  check(linkC.status === 400, 'No hay enlace para producto excluido', linkC.status);
  const selfLink = await call('POST', '/affiliates/links', seller.token, { storeSlug: sp.storeSlug });
  check(selfLink.status === 404 || selfLink.status === 400, 'La tienda no puede afiliarse a sí misma', selfLink.status);

  // ── Validaciones de pedidos ──
  const neg = await call('POST', '/orders/checkout', buyer.token, { items: [{ productId: pA.id, quantity: -3 }], paymentMethod: 'wallet' });
  check(neg.status === 400, 'Cantidad negativa rechazada', neg.data);
  const fakePaid = await call('POST', '/orders', buyer.token, { items: [{ productId: pB.id, quantity: 1 }], paymentMethod: 'cash', paymentStatus: 'paid', sellerId: sp.id });
  check(fakePaid.status === 201 && fakePaid.data.paymentStatus === 'pending', '"paid" enviado por el navegador se ignora', fakePaid.data?.paymentStatus);
  const fakePos = await call('POST', '/orders', buyer.token, { items: [{ productId: pB.id, quantity: 1 }], isPosSale: true, sellerId: sp.id, paymentStatus: 'paid' });
  check(fakePos.status === 403, 'Un cliente no puede registrar ventas POS', fakePos.status);
  if (fakePaid.data?.id) await call('PATCH', `/orders/${fakePaid.data.id}/status`, seller.token, { status: 'cancelled' });

  // ── Compra con billetera desde enlace de producto, carrito con 2 tiendas ──
  const visitor = `e2e-visitor-${run}`;
  const tr = await call('POST', '/affiliates/track', null, { code, visitorId: visitor, productSlug: pA.slug });
  check(tr.data?.tracked === true, 'Clic registrado', tr.data);
  const buyerBefore = await balance(buyer.id);
  const buy = await call('POST', '/orders/checkout', buyer.token, {
    items: [{ productId: pA.id, quantity: 1 }, { productId: pB.id, quantity: 1 }, { productId: pOther.id, quantity: 1 }],
    paymentMethod: 'wallet', visitorId: visitor,
  });
  check(buy.status === 201 && buy.data.orders.length === 2, 'Carrito de 2 tiendas → 2 pedidos', buy.data?.orders?.map((o) => o.sellerId));
  const orderMain = buy.data.orders.find((o) => o.sellerId === seller.id);
  const orderOther = buy.data.orders.find((o) => o.sellerId === seller2.id);
  check(orderOther && orderOther.affiliateAmount === 0 && orderOther.sellerEarnings === 190_000, 'Tienda 2 cobra lo suyo (sin afiliado)', orderOther);
  // Solo el enlace de producto A: comisión 20% de A; B no (el enlace de producto cubre solo ese producto)
  check(orderMain.affiliateAmount === 200_000, 'Comisión 20% solo del producto del enlace', orderMain.affiliateAmount);
  check(orderMain.sellerEarnings === 1_100_000 - 55_000 - 200_000, 'Tienda cobra 1.100.000 − 5% − 200.000', orderMain.sellerEarnings);
  check(buyerBefore - (await balance(buyer.id)) === 1_300_000, 'Comprador paga el total');
  check((await balance(seller.id)) === 845_000, 'Saldo de la tienda', await balance(seller.id));
  const affTx = await prisma.transaction.findFirst({ where: { userId: affiliate.id, type: 'affiliate_commission' } });
  check(affTx?.status === 'pending' && (await balance(affiliate.id)) === 0, 'Afiliado ve Pendiente, no suma al saldo', affTx?.status);

  // Entrega + liberación (plazo 0)
  await call('PATCH', `/orders/${orderMain.id}/status`, seller.token, { status: 'delivered' });
  const rel = await call('POST', '/affiliates/admin/release-now', admin.token);
  const rel2 = await call('POST', '/affiliates/admin/release-now', admin.token);
  check(rel.data?.paid === 1 && rel2.data?.paid === 0, 'Liberación paga una vez (idempotente)', [rel.data, rel2.data]);
  check((await balance(affiliate.id)) === 200_000, 'Afiliado cobra 200.000 disponibles', await balance(affiliate.id));

  // Cancelación después de pagar → reversión y reembolso
  const beforeCancelBuyer = await balance(buyer.id);
  const sellerCancel = await call('PATCH', `/orders/${orderMain.id}/status`, seller.token, { status: 'cancelled' });
  const sellerBack = await call('PATCH', `/orders/${orderMain.id}/status`, seller.token, { status: 'in_transit' });
  check(sellerCancel.status === 403 && sellerBack.status === 403, 'La tienda no puede cancelar ni volver atrás un pedido entregado', [sellerCancel.status, sellerBack.status]);
  const cancel = await call('PATCH', `/orders/${orderMain.id}/status`, admin.token, { status: 'cancelled' });
  check(cancel.status === 200, 'Cancelar pedido entregado', cancel.data?.status);
  check((await balance(buyer.id)) - beforeCancelBuyer === 1_100_000, 'Comprador recupera el total');
  check((await balance(affiliate.id)) === 0, 'Comisión revertida al afiliado');
  check((await balance(seller.id)) === 0, 'A la tienda se le descuenta lo cobrado');
  const stockA = (await prisma.product.findUnique({ where: { id: pA.id } })).stock;
  check(stockA === 50, 'Stock repuesto', stockA);
  const cancelAgain = await call('PATCH', `/orders/${orderMain.id}/status`, admin.token, { status: 'cancelled' });
  check(cancelAgain.status === 400, 'No se cancela dos veces', cancelAgain.status);

  // ── Enlace de tienda + contra entrega sin saldo (queda retenida) ──
  await call('POST', '/affiliates/track', null, { code, visitorId: visitor, storeSlug: sp.storeSlug });
  const cod = await call('POST', '/orders/checkout', buyer.token, { items: [{ productId: pB.id, quantity: 2 }], paymentMethod: 'cash', visitorId: visitor });
  const codOrder = cod.data.orders[0];
  check(codOrder.affiliateAmount === 20_000, 'Enlace de tienda cubre productos que participan (10%)', codOrder.affiliateAmount);
  await call('PATCH', `/orders/${codOrder.id}/status`, seller.token, { status: 'delivered' });
  let codComm = await prisma.affiliateCommission.findFirst({ where: { orderId: codOrder.id } });
  check(!codComm.funded && codComm.note?.includes('Retenida'), 'Contra entrega sin saldo de tienda: retenida', codComm.note);
  await prisma.wallet.update({ where: { userId: seller.id }, data: { balance: 50_000 } });
  await call('POST', '/affiliates/admin/release-now', admin.token);
  codComm = await prisma.affiliateCommission.findFirst({ where: { orderId: codOrder.id } });
  check(codComm.funded && codComm.status === 'paid', 'Con saldo, se cobra a la tienda y se paga', codComm.status);
  check((await balance(seller.id)) === 30_000 && (await balance(affiliate.id)) === 20_000, 'Saldos tras contra entrega');

  // ── Compra propia, afiliado suspendido, POS ──
  const selfVisitor = `e2e-self-${run}`;
  await call('POST', '/affiliates/track', affiliate.token, { code, visitorId: selfVisitor, productSlug: pA.slug });
  await prisma.wallet.update({ where: { userId: affiliate.id }, data: { balance: { increment: 2_000_000 } } });
  const own = await call('POST', '/orders/checkout', affiliate.token, { items: [{ productId: pA.id, quantity: 1 }], paymentMethod: 'wallet', visitorId: selfVisitor });
  check(own.status === 201 && own.data.orders[0].affiliateAmount === 0, 'Sin comisión por compra propia', own.data?.orders?.[0]?.affiliateAmount);

  const affProfile = await prisma.affiliateProfile.findUnique({ where: { userId: affiliate.id } });
  await call('PATCH', `/affiliates/admin/affiliates/${affProfile.id}`, admin.token, { status: 'suspended' });
  await prisma.affiliateClick.create({ data: { affiliateId: affProfile.id, sellerId: sp.id, productId: pA.id, visitorId: `e2e-susp-${run}` } });
  const susp = await call('POST', '/orders/checkout', buyer.token, { items: [{ productId: pA.id, quantity: 1 }], paymentMethod: 'wallet', visitorId: `e2e-susp-${run}` });
  check(susp.data?.orders?.[0]?.affiliateAmount === 0, 'Afiliado suspendido no genera comisión', susp.data?.orders?.[0]?.affiliateAmount);
  await call('PATCH', `/affiliates/admin/affiliates/${affProfile.id}`, admin.token, { status: 'active' });

  const pos = await call('POST', '/orders', seller.token, { isPosSale: true, sellerId: sp.id, items: [{ productId: pA.id, quantity: 1 }], paymentMethod: 'cash', paymentStatus: 'paid', orderNumber: 'V-1234' });
  check(pos.status === 201 && pos.data.affiliateAmount === 0 && pos.data.isPosSale, 'POS funciona y nunca genera comisión', pos.data?.orderNumber);

  // ── Clic vencido ──
  const oldVisitor = `e2e-old-${run}`;
  await prisma.affiliateClick.create({ data: { affiliateId: affProfile.id, sellerId: sp.id, productId: pA.id, visitorId: oldVisitor, createdAt: new Date(Date.now() - 40 * 86400000) } });
  const old = await call('POST', '/orders/checkout', buyer.token, { items: [{ productId: pA.id, quantity: 1 }], paymentMethod: 'wallet', visitorId: oldVisitor });
  check(old.data?.orders?.[0]?.affiliateAmount === 0, 'Clic de hace 40 días no cuenta', old.data?.orders?.[0]?.affiliateAmount);

  // ── Paneles ──
  const me = await call('GET', '/affiliates/me', affiliate.token);
  check(me.status === 200 && me.data.earnings.generated > 0, 'Panel afiliado: ganancias', me.data?.earnings?.generated);
  const links = await call('GET', '/affiliates/links', affiliate.token);
  check(links.status === 200 && links.data.length >= 1, 'Mis promociones', links.data?.map((l) => [l.name, l.clicks, l.sales]));
  const stats = await call('GET', '/affiliates/stats', affiliate.token);
  check(stats.status === 200, 'Estadísticas', { clicks: stats.data?.clicks, sales: stats.data?.sales });
  const rep = await call('GET', '/affiliates/seller/report', seller.token);
  check(rep.status === 200 && rep.data.affiliates.length === 1, 'Reporte del vendedor por afiliado', rep.data?.affiliates);
  for (const path of ['/affiliates/admin/affiliates', '/affiliates/admin/commissions', '/affiliates/admin/payouts', '/affiliates/admin/reports', '/affiliates/admin/stores']) {
    const r = await call('GET', path, admin.token);
    check(r.status === 200, `Admin ${path}`);
  }
  const forbidden = await call('GET', '/affiliates/admin/commissions', seller.token);
  check(forbidden.status === 403, 'Vendedor no accede al panel admin', forbidden.status);

  // Usuario desactivado pierde acceso al instante
  await call('PATCH', `/users/${buyer.id}/status`, admin.token, { isActive: false });
  const blocked = await call('GET', '/wallet', buyer.token);
  check(blocked.status === 401, 'Usuario desactivado: token rechazado', blocked.status);

  console.log(failures ? `\n${failures} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
}

main().catch((e) => { console.error(e); failures++; }).finally(async () => {
  await prisma.$disconnect();
  process.exit(failures ? 1 : 0);
});
