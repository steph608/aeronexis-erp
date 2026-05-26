import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// LISTE TOUTES LES COMMANDES
// ================================
export const getAllOrders = async () => {
  return await prisma.order.findMany({
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          country: true,
        },
      },
      orderLines: {
        include: {
          product: {
            select: {
              id: true,
              description: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ================================
// VOIR UNE COMMANDE
// ================================
export const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      orderLines: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) throw new Error('Commande non trouvée');
  return order;
};

// ================================
// CRÉER UNE COMMANDE
// ================================
export const createOrder = async (data: {
  id: string;
  customerId: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status: string;
  totalAmount: number;
  priority: string;
  salesManager: string;
  orderLines?: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    lineAmount: number;
    lineStatus: string;
  }[];
}) => {
  // Vérifier que le client existe
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer) throw new Error('Client non trouvé');

  const { orderLines, ...orderData } = data;

  return await prisma.order.create({
    data: {
      ...orderData,
      orderLines: orderLines ? {
        create: orderLines,
      } : undefined,
    },
    include: {
      customer: true,
      orderLines: {
        include: { product: true },
      },
    },
  });
};

// ================================
// MODIFIER UNE COMMANDE
// ================================
export const updateOrder = async (id: string, data: {
  status?: string;
  priority?: string;
  expectedDeliveryDate?: Date;
  totalAmount?: number;
}) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error('Commande non trouvée');

  return await prisma.order.update({
    where: { id },
    data,
    include: {
      customer: true,
      orderLines: true,
    },
  });
};

// ================================
// SUPPRIMER UNE COMMANDE
// ================================
export const deleteOrder = async (id: string) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error('Commande non trouvée');

  // Supprimer d'abord les lignes de commande
  await prisma.orderLine.deleteMany({ where: { orderId: id } });

  // Puis supprimer la commande
  await prisma.order.delete({ where: { id } });

  return { message: 'Commande supprimée avec succès' };
};

// ================================
// STATISTIQUES
// ================================
export const getOrderStats = async () => {
  const total = await prisma.order.count();
  const enProduction = await prisma.order.count({
    where: { status: 'En production' },
  });
  const planifiee = await prisma.order.count({
    where: { status: 'Planifiée' },
  });
  const terminee = await prisma.order.count({
    where: { status: 'Terminée' },
  });
  const totalRevenue = await prisma.order.aggregate({
    _sum: { totalAmount: true },
  });

  return {
    total,
    enProduction,
    planifiee,
    terminee,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
  };
};