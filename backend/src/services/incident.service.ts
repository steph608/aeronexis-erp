import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// LISTE TOUS LES INCIDENTS
// ================================
export const getAllIncidents = async () => {
  return await prisma.qualityIncident.findMany({
    include: {
      responsible: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      manufacturingOrder: {
        select: {
          id: true,
          batchNumber: true,
          site: true,
          product: {
            select: {
              description: true,
              category: true,
            },
          },
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
      manufacturingOrder: {
        include: {
          product: true,
        },
      },
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
  responsibleId?: number;
  correctiveAction: string;
}) => {
  // Vérifier que le lot existe
  const lot = await prisma.manufacturingOrder.findUnique({
    where: { batchNumber: data.batchNumber },
  });
  if (!lot) throw new Error('Numéro de lot non trouvé');

  return await prisma.qualityIncident.create({
    data,
    include: {
      responsible: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      manufacturingOrder: {
        select: {
          batchNumber: true,
          site: true,
          product: {
            select: { description: true },
          },
        },
      },
    },
  });
};

// ================================
// MODIFIER UN INCIDENT
// ================================
export const updateIncident = async (id: string, data: {
  status?: string;
  correctiveAction?: string;
  responsibleId?: number;
  severity?: string;
}) => {
  const incident = await prisma.qualityIncident.findUnique({
    where: { id },
  });
  if (!incident) throw new Error('Incident non trouvé');

  return await prisma.qualityIncident.update({
    where: { id },
    data,
    include: {
      responsible: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      manufacturingOrder: true,
    },
  });
};

// ================================
// STATISTIQUES INCIDENTS
// ================================
export const getIncidentStats = async () => {
  const total = await prisma.qualityIncident.count();
  const enCours = await prisma.qualityIncident.count({
    where: { status: 'En cours' },
  });
  const resolu = await prisma.qualityIncident.count({
    where: { status: 'Résolu' },
  });
  const critique = await prisma.qualityIncident.count({
    where: { severity: 'Critique' },
  });
  const moyen = await prisma.qualityIncident.count({
    where: { severity: 'Moyenne' },
  });
  const faible = await prisma.qualityIncident.count({
    where: { severity: 'Faible' },
  });

  return {
    total,
    enCours,
    resolu,
    parSeverite: {
      critique,
      moyen,
      faible,
    },
    tauxResolution: total > 0
      ? Math.round((resolu / total) * 100)
      : 0,
  };
};