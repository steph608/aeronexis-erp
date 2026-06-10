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
  const of = await prisma.manufacturingOrder.findUnique({
    where: { batchNumber },
    include: {
      product: true,
      operator: {
        select: { id: true, firstName: true, lastName: true },
      },
      order: {
        select: { id: true, status: true, customerId: true },
      },
      qualityIncidents: {
        include: {
          responsible: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!of) throw new Error(`Lot ${batchNumber} non trouvé`);

  // Tous les logs d'audit qui mentionnent ce numéro de lot
  const auditLogs = await prisma.auditLog.findMany({
    where: { description: { contains: batchNumber } },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Commentaires de tous les incidents liés à ce lot
  const incidentIds = of.qualityIncidents.map(i => i.id);
  const comments: any[] = [];
  for (const incId of incidentIds) {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT ic.*, u."firstName", u."lastName"
      FROM "IncidentComment" ic
      LEFT JOIN "User" u ON u.id = ic."userId"
      WHERE ic."incidentId" = ${incId}
      ORDER BY ic."createdAt" ASC
    `;
    comments.push(...rows);
  }

  return {
    of,
    auditLogs,
    incidents: of.qualityIncidents.map(inc => ({
      ...inc,
      comments: comments.filter(c => c.incidentId === inc.id),
    })),
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
  operatorId?: number | null;
  site: string;
  orderId?: string | null;
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

  const of = await prisma.manufacturingOrder.create({
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

  // Recalculer totalAmount de la commande liée
  if (data.orderId) {
    await recalculateOrderTotal(data.orderId);
  }

  return of;
};

// Recalcule le totalAmount d'une commande depuis ses OFs liés
const recalculateOrderTotal = async (orderId: string) => {
  const ofs = await prisma.manufacturingOrder.findMany({
    where: { orderId },
    include: { product: { select: { unitPrice: true } } },
  });
  const total = ofs.reduce((sum, of) => sum + of.quantity * of.product.unitPrice, 0);
  await prisma.order.update({
    where: { id: orderId },
    data: { totalAmount: Math.round(total * 100) / 100 },
  });
};

// ================================
// MODIFIER UN ORDRE DE FABRICATION
// ================================
export const updateManufacturingOrder = async (id: string, data: {
  status?: string;
  operatorId?: number | null;
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