import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// LISTE TOUS LES CLIENTS
// ================================
export const getAllCustomers = async () => {
  return await prisma.customer.findMany({
    include: {
      orders: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          orderDate: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

// ================================
// VOIR UN CLIENT
// ================================
export const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          orderLines: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!customer) throw new Error('Client non trouvé');
  return customer;
};

// ================================
// CRÉER UN CLIENT
// ================================
export const createCustomer = async (data: {
  id: string;
  name: string;
  country: string;
  type: string;
  annualRevenue: number;
  firstContractDate: Date;
  status?: string;
}) => {
  const existing = await prisma.customer.findUnique({
    where: { id: data.id },
  });
  if (existing) throw new Error('Un client avec cet ID existe déjà');

  return await prisma.customer.create({ data });
};

// ================================
// MODIFIER UN CLIENT
// ================================
export const updateCustomer = async (id: string, data: {
  name?: string;
  country?: string;
  type?: string;
  annualRevenue?: number;
  status?: string;
}) => {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new Error('Client non trouvé');

  return await prisma.customer.update({
    where: { id },
    data,
  });
};

// ================================
// SUPPRIMER UN CLIENT
// ================================
export const deleteCustomer = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { orders: true },
  });
  if (!customer) throw new Error('Client non trouvé');

  if (customer.orders.length > 0) {
    throw new Error(
      'Impossible de supprimer — ce client a des commandes actives'
    );
  }

  await prisma.customer.delete({ where: { id } });
  return { message: 'Client supprimé avec succès' };
};

// ================================
// STATISTIQUES CLIENTS
// ================================
export const getCustomerStats = async () => {
  const total = await prisma.customer.count();
  const actifs = await prisma.customer.count({
    where: { status: 'Actif' },
  });
  const grandComptes = await prisma.customer.count({
    where: { type: 'Grand Compte' },
  });
  const revenus = await prisma.customer.aggregate({
    _sum: { annualRevenue: true },
  });

  return {
    total,
    actifs,
    grandComptes,
    totalRevenus: revenus._sum.annualRevenue || 0,
  };
};