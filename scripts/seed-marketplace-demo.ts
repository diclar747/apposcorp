import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !['127.0.0.1', 'localhost', '::1'].includes(new URL(databaseUrl).hostname)) {
  throw new Error('El catálogo demo solo se puede cargar en una base de datos local.');
}

const prisma = new PrismaClient();
const imageBase = '/images/marketplace-modern/products';
const descriptionSuffix = 'Producto de muestra de OSCORP. Foto y precio ilustrativos; no está disponible para comprar.';

const catalog = [
  { sku: 'OSC-DEMO-001', slug: 'demo-telefono-azul', name: 'Teléfono inteligente azul', category: 'Celulares', price: 2290000, image: 'smartphone.png', description: 'Pantalla amplia y diseño elegante para el día a día.' },
  { sku: 'OSC-DEMO-002', slug: 'demo-auriculares-inalambricos', name: 'Auriculares inalámbricos Pro', category: 'Tecnología', price: 390000, image: 'headphones.png', description: 'Audio envolvente y comodidad para cada momento.' },
  { sku: 'OSC-DEMO-003', slug: 'demo-notebook-ultraliviana', name: 'Notebook ultraliviana 13 pulgadas', category: 'Computación', price: 4790000, image: 'laptop.png', description: 'Ligera, versátil y preparada para estudiar o trabajar.' },
  { sku: 'OSC-DEMO-004', slug: 'demo-zapatillas-urbanas', name: 'Zapatillas urbanas blancas', category: 'Deportes', price: 285000, image: 'sneakers.png', description: 'Estilo y comodidad para todos los días.' },
  { sku: 'OSC-DEMO-005', slug: 'demo-perfume-floral', name: 'Perfume floral 50 ml', category: 'Belleza', price: 280000, image: 'perfume.png', description: 'Una fragancia delicada con presentación elegante.' },
  { sku: 'OSC-DEMO-006', slug: 'demo-lampara-de-mesa', name: 'Lámpara de mesa Nórdica', category: 'Hogar', price: 340000, image: 'lamp.png', description: 'Luz cálida y diseño simple para cualquier ambiente.' },
  { sku: 'OSC-DEMO-007', slug: 'demo-cafe-artesanal', name: 'Café tostado artesanal 250 g', category: 'Almacén', price: 49000, image: 'coffee.png', description: 'Una propuesta gourmet para empezar bien el día.' },
  { sku: 'OSC-DEMO-008', slug: 'demo-bolso-clasico', name: 'Bolso de mano clásico', category: 'Moda', price: 450000, image: 'handbag.png', description: 'Un accesorio versátil con acabado elegante.' },
  { sku: 'OSC-DEMO-009', slug: 'demo-reloj-inteligente', name: 'Reloj inteligente negro', category: 'Tecnología', price: 550000, image: 'smartwatch.png', description: 'Diseño moderno para acompañar tu actividad diaria.' },
  { sku: 'OSC-DEMO-010', slug: 'demo-bloques-de-madera', name: 'Bloques didácticos de madera', category: 'Juguetes', price: 169000, image: 'blocks.png', description: 'Juego creativo para aprender construyendo.' },
  { sku: 'OSC-DEMO-011', slug: 'demo-libro-de-notas', name: 'Libro de notas creativo', category: 'Libros', price: 85000, image: 'book.png', description: 'Un espacio para escribir ideas, planes y proyectos.' },
  { sku: 'OSC-DEMO-012', slug: 'demo-licuadora-compacta', name: 'Licuadora compacta blanca', category: 'Hogar', price: 420000, image: 'blender.png', description: 'Práctica y compacta para preparar tus recetas favoritas.' },
] as const;

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'catalogo-demo@oscorp.invalid' },
    update: { isActive: true },
    create: {
      email: 'catalogo-demo@oscorp.invalid',
      password: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
      firstName: 'Catálogo',
      lastName: 'Demo',
      roles: ['seller'],
      isActive: true,
    },
  });

  const seller = await prisma.sellerProfile.upsert({
    where: { userId: user.id },
    update: { storeName: 'Catálogo de muestra OSCORP', category: 'Demostración' },
    create: {
      userId: user.id,
      storeName: 'Catálogo de muestra OSCORP',
      storeSlug: 'catalogo-demo-oscorp',
      description: 'Ejemplos visuales de cómo se presentan los productos en OSCORP.',
      logo: '/oscorp-logo.png',
      banner: '/images/marketplace-modern/hero-screen.png',
      address: 'Paraguay',
      phone: 'No disponible',
      email: 'catalogo-demo@oscorp.invalid',
      whatsappNumber: 'No disponible',
      category: 'Demostración',
      planActive: false,
      isVerified: false,
    },
  });

  await prisma.store.upsert({
    where: { sellerId: seller.id },
    update: { name: 'Catálogo de muestra OSCORP', category: 'Demostración' },
    create: {
      sellerId: seller.id,
      name: 'Catálogo de muestra OSCORP',
      slug: 'catalogo-demo-oscorp',
      description: 'Productos de ejemplo para mostrar el diseño de la tienda.',
      logo: '/oscorp-logo.png',
      banner: '/images/marketplace-modern/hero-screen.png',
      address: 'Paraguay',
      phone: 'No disponible',
      email: 'catalogo-demo@oscorp.invalid',
      whatsappNumber: 'No disponible',
      category: 'Demostración',
    },
  });

  for (const item of catalog) {
    const data = {
      sellerId: seller.id,
      name: item.name,
      slug: item.slug,
      description: `${item.description} ${descriptionSuffix}`,
      price: item.price,
      stock: 0,
      images: [`${imageBase}/${item.image}`],
      category: item.category,
      type: 'physical' as const,
      visibility: 'local' as const,
      status: 'active',
      tags: ['oscorp-demo'],
      isFeatured: true,
    };
    await prisma.product.upsert({
      where: { sku: item.sku },
      update: data,
      create: { ...data, sku: item.sku },
    });
  }

  console.log(`Catálogo demo listo: ${catalog.length} productos con foto, sin stock y sin compra online.`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
