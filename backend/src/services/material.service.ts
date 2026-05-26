import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// LISTE TOUT LE STOCK
// ================================
export const getAllMaterials = async () => {
  return await prisma.rawMaterial.findMany({
    orderBy: { description: 'asc' },
  });
};

// ================================
// VOIR UNE MATIÈRE
// ================================
export const getMaterialById = async (id: string) => {
  const material = await prisma.rawMaterial.findUnique({
    where: { id },
  });
  if (!material) throw new Error('Matière première non trouvée');
  return material;
};

// ================================
// ALERTES RUPTURE DE STOCK
// ================================
export const getLowStockAlerts = async () => {
  const materials = await prisma.rawMaterial.findMany();
  
  return materials.filter(m => {
    const stockDisponible = m.currentStock - m.reservedStock;
    return stockDisponible <= m.minimumStock;
  }).map(m => ({
    ...m,
    stockDisponible: m.currentStock - m.reservedStock,
    manque: m.minimumStock - (m.currentStock - m.reservedStock),
  }));
};

// ================================
// METTRE À JOUR LE STOCK
// ================================
export const updateMaterial = async (id: string, data: {
  currentStock?: number;
  reservedStock?: number;
  minimumStock?: number;
  supplier?: string;
}) => {
  const material = await prisma.rawMaterial.findUnique({ where: { id } });
  if (!material) throw new Error('Matière première non trouvée');

  return await prisma.rawMaterial.update({
    where: { id },
    data,
  });
};

// ================================
// RÉSERVER DU STOCK
// ================================
export const reserveStock = async (id: string, quantity: number) => {
  const material = await prisma.rawMaterial.findUnique({ where: { id } });
  if (!material) throw new Error('Matière première non trouvée');

  const stockDisponible = material.currentStock - material.reservedStock;
  if (stockDisponible < quantity) {
    throw new Error(`Stock insuffisant — disponible: ${stockDisponible} ${material.unit}`);
  }

  return await prisma.rawMaterial.update({
    where: { id },
    data: {
      reservedStock: material.reservedStock + quantity,
    },
  });
};

// ================================
// STATISTIQUES STOCK
// ================================
export const getStockStats = async () => {
  const materials = await prisma.rawMaterial.findMany();
  
  const total = materials.length;
  const enAlerte = materials.filter(m => 
    (m.currentStock - m.reservedStock) <= m.minimumStock
  ).length;
  const stockSuffisant = total - enAlerte;

  return {
    total,
    enAlerte,
    stockSuffisant,
    tauxDisponibilite: Math.round((stockSuffisant / total) * 100),
  };
};