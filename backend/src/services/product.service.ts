import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// LISTE TOUS LES PRODUITS
// ================================
export const getAllProducts = async () => {
  return await prisma.product.findMany({
    include: {
      manufacturingOrders: {
        select: {
          id: true,
          status: true,
          quantity: true,
          site: true,
        },
      },
      orderLines: {
        select: {
          quantity: true,
          lineAmount: true,
        },
      },
    },
    orderBy: { category: 'asc' },
  });
};

// ================================
// VOIR UN PRODUIT
// ================================
export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      manufacturingOrders: {
        include: {
          qualityIncidents: true,
        },
      },
      orderLines: {
        include: {
          order: {
            select: {
              id: true,
              status: true,
              customer: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!product) throw new Error('Produit non trouvé');
  return product;
};

// ================================
// CRÉER UN PRODUIT
// ================================
export const createProduct = async (data: {
  id: string;
  description: string;
  category: string;
  unitPrice: number;
  manufacturingTimeH: number;
  weightKg: number;
  certification: string;
}) => {
  const existing = await prisma.product.findUnique({
    where: { id: data.id },
  });
  if (existing) throw new Error('Un produit avec cet ID existe déjà');

  return await prisma.product.create({ data });
};

// ================================
// MODIFIER UN PRODUIT
// ================================
export const updateProduct = async (id: string, data: {
  description?: string;
  category?: string;
  unitPrice?: number;
  manufacturingTimeH?: number;
  weightKg?: number;
  certification?: string;
}) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error('Produit non trouvé');

  return await prisma.product.update({
    where: { id },
    data,
  });
};

// ================================
// SUPPRIMER UN PRODUIT
// ================================
export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { orderLines: true },
  });
  if (!product) throw new Error('Produit non trouvé');

  if (product.orderLines.length > 0) {
    throw new Error(
      'Impossible de supprimer — ce produit est lié à des commandes'
    );
  }

  await prisma.product.delete({ where: { id } });
  return { message: 'Produit supprimé avec succès' };
};

// ================================
// STATISTIQUES PRODUITS
// ================================
export const getProductStats = async () => {
  const total = await prisma.product.count();

  const parCategorie = await prisma.product.groupBy({
    by: ['category'],
    _count: { id: true },
  });

  const plusCommande = await prisma.orderLine.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 3,
  });

  return {
    total,
    parCategorie,
    top3Produits: plusCommande,
  };
};