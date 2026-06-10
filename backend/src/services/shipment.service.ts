import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllShipments = async () => {
  return await prisma.shipment.findMany({
    include: {
      order: { select: { id: true, customerId: true, status: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getShipmentById = async (id: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      order: true,
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!shipment) throw new Error(`ExpÃ©dition ${id} introuvable`);
  return shipment;
};

export const createShipment = async (data: {
  id: string;
  orderId: string;
  destination: string;
  carrier?: string;
  trackingNumber?: string;
  scheduledDate: Date;
  notes?: string;
  createdById?: number;
}) => {
  return await prisma.shipment.create({ data });
};

export const updateShipment = async (id: string, data: {
  status?: string;
  carrier?: string;
  trackingNumber?: string;
  actualDate?: Date;
  notes?: string;
}) => {
  return await prisma.shipment.update({ where: { id }, data });
};

export const getShipmentStats = async () => {
  const [total, planned, inProgress, delivered, cancelled] = await Promise.all([
    prisma.shipment.count(),
    prisma.shipment.count({ where: { status: 'PlanifiÃ©e' } }),
    prisma.shipment.count({ where: { status: 'En cours' } }),
    prisma.shipment.count({ where: { status: 'LivrÃ©e' } }),
    prisma.shipment.count({ where: { status: 'AnnulÃ©e' } }),
  ]);
  return { total, planned, inProgress, delivered, cancelled };
};
