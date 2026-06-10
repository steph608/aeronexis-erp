import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// LISTE TOUS LES INCIDENTS
// ================================
export const getAllIncidents = async () => {
  return await prisma.qualityIncident.findMany({
    include: {
      responsible: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
      manufacturingOrder: {
        select: {
          id: true,
          batchNumber: true,
          site: true,
          orderId: true,
          product: { select: { description: true, category: true } },
        },
      },
    },
    orderBy: { detectionDate: 'desc' },
  });
};

// ================================
// VOIR UN INCIDENT
// ================================
export const getIncidentById = async (id: string) => {
  const incident = await prisma.qualityIncident.findUnique({
    where: { id },
    include: {
      responsible: true,
      manufacturingOrder: { include: { product: true } },
    },
  });
  if (!incident) throw new Error('Incident non trouvé');
  return incident;
};

// ================================
// CRÉER UN INCIDENT
// ================================
export const createIncident = async (data: {
  id: string;
  detectionDate: Date;
  batchNumber: string;
  anomalyType: string;
  severity: string;
  status: string;
  responsibleId?: number | null;
  correctiveAction: string;
  orderId?: string | null;
}) => {
  const lot = await prisma.manufacturingOrder.findUnique({
    where: { batchNumber: data.batchNumber },
  });
  if (!lot) throw new Error('Numéro de lot non trouvé');

  // Le client Prisma généré ne connaît pas encore orderId — on le retire du create
  // puis on le persiste via SQL brut si fourni
  const { orderId, ...prismaData } = data;

  const incident = await (prisma.qualityIncident as any).create({
    data: prismaData,
    include: {
      responsible: { select: { id: true, firstName: true, lastName: true } },
      manufacturingOrder: {
        select: { batchNumber: true, site: true, orderId: true, product: { select: { description: true } } },
      },
    },
  });

  if (orderId) {
    await prisma.$executeRaw`UPDATE "QualityIncident" SET "orderId" = ${orderId} WHERE id = ${incident.id}`;
  }

  return { ...incident, orderId: orderId ?? null };
};

// ================================
// MODIFIER UN INCIDENT
// ================================
export const updateIncident = async (id: string, data: {
  status?: string;
  correctiveAction?: string;
  responsibleId?: number | null;
  severity?: string;
}) => {
  const incident = await prisma.qualityIncident.findUnique({ where: { id } });
  if (!incident) throw new Error('Incident non trouvé');

  return await prisma.qualityIncident.update({
    where: { id },
    data,
    include: {
      responsible: { select: { id: true, firstName: true, lastName: true } },
      manufacturingOrder: true,
    },
  });
};

// ================================
// COMMENTAIRES D'UN INCIDENT
// ================================
export const getComments = async (incidentId: string) => {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "IncidentComment"
    WHERE "incidentId" = ${incidentId}
    ORDER BY "createdAt" ASC
  `;
  return rows;
};

export const addComment = async (data: {
  incidentId: string;
  userId?: number | null;
  userEmail: string;
  userName: string;
  content: string;
}) => {
  await prisma.$executeRaw`
    INSERT INTO "IncidentComment" ("incidentId", "userId", "userEmail", "userName", "content", "createdAt")
    VALUES (${data.incidentId}, ${data.userId ?? null}, ${data.userEmail}, ${data.userName}, ${data.content}, NOW())
  `;
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "IncidentComment"
    WHERE "incidentId" = ${data.incidentId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return rows[0];
};

// ================================
// STATISTIQUES INCIDENTS
// ================================
export const getIncidentStats = async () => {
  const total    = await prisma.qualityIncident.count();
  const enCours  = await prisma.qualityIncident.count({ where: { status: 'En cours' } });
  const resolu   = await prisma.qualityIncident.count({ where: { status: 'Résolu' } });
  const critique = await prisma.qualityIncident.count({ where: { severity: 'Critique' } });

  return {
    total, enCours, resolu,
    critique,
    tauxResolution: total > 0 ? Math.round((resolu / total) * 100) : 0,
  };
};
