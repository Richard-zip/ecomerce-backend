import app from './app';
import { config } from './config/env';
import { prisma } from './config/prisma';

async function bootstrap() {
  try {
    // Probar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos Neon PostgreSQL.');

    // Asegurar que las categorías universitarias oficiales siempre existan
    const catCount = await prisma.category.count();
    if (catCount === 0) {
      const defaultCategories = [
        { name: 'Libros y Manuales', slug: 'libros-manuales', description: 'Libros de texto, novelas, apuntes y manuales universitarios' },
        { name: 'Tecnología y Calculadoras', slug: 'tecnologia-calculadoras', description: 'Laptops, calculadoras científicas, tablets, accesorios de cómputo' },
        { name: 'Papelería y Útiles', slug: 'papeleria-utiles', description: 'Cuadernos, carpetas, plumones, reglas y materiales de dibujo técnico' },
        { name: 'Snacks y Comida', slug: 'snacks-comida', description: 'Dulces, postres, desayunos y snacks preparados por estudiantes' },
        { name: 'Ropa y Merchandising', slug: 'ropa-merchandising', description: 'Prendas universitarias, gorras, sudaderas y accesorios' },
        { name: 'Servicios e Impresiones', slug: 'servicios-impresiones', description: 'Asesorías académicas, servicios de impresión y encuadernación' },
        { name: 'Varios y Accesorios', slug: 'varios-accesorios', description: 'Mochilas, termos, llaveros y artículos de uso estudiantil' },
      ];
      await prisma.category.createMany({
        data: defaultCategories,
        skipDuplicates: true,
      });
      console.log('🌱 Categorías universitarias oficiales de Cereté configuradas automáticamente.');
    }

    app.listen(config.port, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${config.port}`);
      console.log(`📡 Healthcheck disponible en http://localhost:${config.port}/health`);
      console.log(`📦 API Base URL: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

bootstrap();
