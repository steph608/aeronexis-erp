import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUnreadNotifications = async (userId: number) => {
  return await (prisma.notification as any).findMany({
    where: { OR: [{ userId }, { userId: null }], isRead: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
};

export const getAllNotifications = async (userId: number) => {
  return await (prisma.notification as any).findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const markNotificationRead = async (id: number, userId: number) => {
  return await (prisma.notification as any).updateMany({
    where: { id, OR: [{ userId }, { userId: null }] },
    data: { isRead: true },
  });
};

export const markAllNotificationsRead = async (userId: number) => {
  return await (prisma.notification as any).updateMany({
    where: { OR: [{ userId }, { userId: null }], isRead: false },
    data: { isRead: true },
  });
};

export const createNotification = async (data: {
  userId?: number;
  title: string;
  message: string;
  type: string;
  materialId?: string;
}) => {
  return await (prisma.notification as any).create({ data });
};

// â”€â”€ Note sur une alerte stock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const updateNotificationNote = async (id: number, note: string) => {
  return await (prisma.notification as any).update({
    where: { id },
    data: { note },
  });
};

// â”€â”€ CrÃ©e des notifications pour les matiÃ¨res en rupture â”€â”€â”€â”€â”€â”€
// DÃ©duplique : une seule notification active par materialId
export const checkAndCreateStockAlertNotifications = async () => {
  const materials = await prisma.rawMaterial.findMany();

  const enRupture = materials.filter(m => {
    const dispo = m.currentStock - m.reservedStock;
    return dispo <= m.minimumStock;
  });

  // RÃ©sorber les alertes rÃ©solues (matiÃ¨re revenue au-dessus du seuil)
  const idsEnRupture = enRupture.map(m => m.id);
  await (prisma.notification as any).updateMany({
    where: {
      materialId: { notIn: idsEnRupture.length ? idsEnRupture : ['__none__'] },
      type: 'stock-alert',
      isRead: false,
    },
    data: { isRead: true },
  });

  // CrÃ©er une notification pour chaque rupture sans alerte active
  for (const m of enRupture) {
    const existing = await (prisma.notification as any).findFirst({
      where: { materialId: m.id, type: 'stock-alert', isRead: false },
    });
    if (existing) continue; // dÃ©jÃ  une alerte active

    const dispo = m.currentStock - m.reservedStock;
    const manque = m.minimumStock - dispo;

    await (prisma.notification as any).create({
      data: {
        title: `Rupture : ${m.description}`,
        message: `Stock disponible : ${dispo} ${m.unit} â€” Minimum : ${m.minimumStock} ${m.unit} (manque ${manque.toFixed(1)} ${m.unit}). Fournisseur : ${m.supplier}.`,
        type: 'stock-alert',
        isRead: false,
        materialId: m.id,
      },
    });
  }

  return enRupture.length;
};

// â”€â”€ RÃ©cupÃ¨re toutes les alertes stock non lues â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getStockAlertNotifications = async () => {
  return await (prisma.notification as any).findMany({
    where: { type: 'stock-alert', isRead: false },
    orderBy: { createdAt: 'desc' },
  });
};

// Notifie tous les utilisateurs actifs sauf l'auteur de l'action
export const notifyAllUsersExcept = async (
  excludeUserId: number,
  data: { title: string; message: string; type: string }
) => {
  const users = await prisma.user.findMany({
    where: { id: { not: excludeUserId }, isActive: true },
    select: { id: true },
  });
  for (const u of users) {
    await (prisma.notification as any).create({ data: { ...data, userId: u.id } });
  }
};
