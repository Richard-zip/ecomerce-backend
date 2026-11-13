import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando categorías universitarias para Centro Tutorial Cereté...');

  // Crear/Actualizar Categorías Universitarias oficiales
  const categoriesData = [
    { name: 'Libros y Manuales', slug: 'libros-manuales', description: 'Libros de texto, novelas, apuntes y manuales universitarios' },
    { name: 'Tecnología y Calculadoras', slug: 'tecnologia-calculadoras', description: 'Laptops, calculadoras científicas, tablets, accesorios de cómputo' },
    { name: 'Papelería y Útiles', slug: 'papeleria-utiles', description: 'Cuadernos, carpetas, plumones, reglas y materiales de dibujo técnico' },
    { name: 'Snacks y Comida', slug: 'snacks-comida', description: 'Dulces, postres, desayunos y snacks preparados por estudiantes' },
    { name: 'Ropa y Merchandising', slug: 'ropa-merchandising', description: 'Prendas universitarias, gorras, sudaderas y accesorios' },
    { name: 'Servicios e Impresiones', slug: 'servicios-impresiones', description: 'Asesorías académicas, servicios de impresión y encuadernación' },
    { name: 'Varios y Accesorios', slug: 'varios-accesorios', description: 'Mochilas, termos, llaveros y artículos de uso estudiantil' },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categorías universitarias oficiales configuradas.');
  console.log('✨ Base de datos lista: sin usuarios ni productos por defecto.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
