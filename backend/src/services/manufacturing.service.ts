import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// LISTE TOUS LES ORDRES DE FABRICATION
// ================================
export const getAllManufacturingOrders = async () => {
  return await prisma.manufacturingOrder.findMany({
    include: {
      product: {
        select: {
          id: true,
          description: true,
          category: true,
          certification: true,
        },
      },
      operator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      qualityIncidents: {
        select: {
          id: true,
          anomalyType: true,
          severity: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ================================
// VOIR UN ORDRE DE FABRICATION
// ================================
export const getManufacturingOrderById = async (id: string) => {
  const order = await prisma.manufacturingOrder.findUnique({
    where: { id },
    include: {
      product: true,
      operator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      qualityIncidents: true,
    },
  });

  if (!order) throw new Error('Ordre de fabrication non trouvé');
  return order;
};

// ================================
// TRAÇABILITÉ D'UN LOT
// ================================
export const getLotTraceability = async (batchNumber: string) => {
  const order = await prisma.manufacturingOrder.findUnique({
    where: { batchNumber },
    include: {
      product: true,
      operator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      qualityIncidents: {
        include: {
          responsible: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!order) throw new Error(`Lot ${batchNumber} non trouvé`);

  return {
    lot: batchNumber,
    produit: order.product.description,
    certification: order.product.certification,
    site: order.site,
    quantite: order.quantity,
    operateur: order.operator
      ? `${order.operator.firstName} ${order.operator.lastName}`
      : 'Non assigné',
    dateDebut: order.launchDate,
    dateFin: order.expectedEndDate,
    statut: order.status,
    incidents: order.qualityIncidents,
    nbIncidents: order.qualityIncidents.length,
    historiqueComplet: {
      creation: order.createdAt,
      derniereMaj: order.updatedAt,
    },
  };
};

// ================================
// CRÉER UN ORDRE DE FABRICATION
// ================================
export const createManufacturingOrder = async (data: {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  launchDate: Date;
  expectedEndDate: Date;
  status: string;
  operatorId?: number;
  site: string;
}) => {
  // Vérifier que le produit existe
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });
  if (!product) throw new Error('Produit non trouvé');

  // Vérifier que le numéro de lot est unique
  const existingLot = await prisma.manufacturingOrder.findUnique({
    where: { batchNumber: data.batchNumber },
  });
  if (existingLot) throw new Error('Ce numéro de lot existe déjà');

  return await prisma.manufacturingOrder.create({
    data,
    include: {
      product: true,
      operator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

// ================================
// MODIFIER UN ORDRE DE FABRICATION
// ================================
export const updateManufacturingOrder = async (id: string, data: {
  status?: string;
  operatorId?: number;
  expectedEndDate?: Date;
  site?: string;
}) => {
  const order = await prisma.manufacturingOrder.findUnique({ where: { id } });
  if (!order) throw new Error('Ordre de fabrication non trouvé');

  return await prisma.manufacturingOrder.update({
    where: { id },
    data,
    include: {
      product: true,
      operator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

// ================================
// STATISTIQUES FABRICATION
// ================================
export const getManufacturingStats = async () => {
  const total = await prisma.manufacturingOrder.count();
  const enCours = await prisma.manufacturingOrder.count({
    where: { status: 'En cours' },
  });
  const planifie = await prisma.manufacturingOrder.count({
    where: { status: 'Planifié' },
  });
  const termine = await prisma.manufacturingOrder.count({
    where: { status: 'Terminé' },
  });

  // Taux de rendement
  const tauxRendement = total > 0
    ? Math.round((termine / total) * 100)
    : 0;

  return {
    total,
    enCours,
    planifie,
    termine,
    tauxRendement,
  };
};