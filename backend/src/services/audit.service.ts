import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// ENREGISTRER UNE ACTION
// ================================
export const logAction = async (data: {
  userId?: number;
  userEmail?: string;
  action: string;
  module: string;
  description: string;
  ipAddress?: string;
}) => {
  return await prisma.auditLog.create({ data });
};

// ================================
// LISTE TOUS LES LOGS
// ================================
export const getAllLogs = async (userId?: number) => {
  return await prisma.auditLog.findMany({
    where: userId ? { userId } : undefined,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
};

// ================================
// LOGS D'UN UTILISATEUR
// ================================
export const getUserLogs = async (userId: number) => {
  return await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};