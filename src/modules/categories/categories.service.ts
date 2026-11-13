import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';

export class CategoriesService {
  async getAll() {
    let categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Auto-seeding en entornos serverless (Vercel) si la base de datos está recién inicializada
    if (categories.length === 0) {
      const defaultCategories = [
        { name: 'Libros y Manuales', slug: 'libros-manuales', description: 'Libros de texto, novelas, apuntes y manuales universitarios' },
        { name: 'Tecnología y Calculadoras', slug: 'tecnologia-calculadoras', description: 'Laptops, calculadoras científicas, tablets, accesorios de cómputo' },
        { name: 'Papelería y Útiles', slug: 'papeleria-utiles', description: 'Cuadernos, carpetas, plumones, reglas y materiales de dibujo técnico' },
        { name: 'Snacks y Comida', slug: 'snacks-comida', description: 'Dulces, postres, desayunos y snacks preparados por estudiantes' },
        { name: 'Ropa y Merchandising', slug: 'ropa-merchandising', description: 'Prendas universitarias, gorras, sudaderas y accesorios' },
        { name: 'Servicios e Impresiones', slug: 'servicios-impresiones', description: 'Asesorías académicas, servicios de impresión y encuadernación' },
        { name: 'Varios y Accesorios', slug: 'varios-accesorios', description: 'Mochilas, termos, llaveros y artículos de uso estudiantil' },
      ];

      for (const cat of defaultCategories) {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        });
      }

      categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    }

    return categories;
  }

  async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { status: 'AVAILABLE' },
          include: {
            seller: {
              select: { id: true, name: true, avatar: true, career: true, campus: true },
            },
          },
        },
      },
    });

    if (!category) {
      throw new AppError('Categoría no encontrada.', 404);
    }

    return category;
  }

  async create(name: string, description?: string) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
      },
    });
  }
}
