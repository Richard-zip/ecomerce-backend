import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/error.middleware';

export class CategoriesService {
  async getAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
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
