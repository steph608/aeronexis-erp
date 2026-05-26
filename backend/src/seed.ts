import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Importation des données...');

  // ================================
  // CLIENTS
  // ================================
  await prisma.customer.createMany({
    data: [
      { id: 'CLI001', name: 'Lufthansa Technik', country: 'Allemagne', type: 'Grand Compte', annualRevenue: 2850000, firstContractDate: new Date('2019-03-15'), status: 'Actif' },
      { id: 'CLI002', name: 'Air France Industries', country: 'France', type: 'Grand Compte', annualRevenue: 1950000, firstContractDate: new Date('2018-06-01'), status: 'Actif' },
      { id: 'CLI003', name: 'Boeing Supply Chain', country: 'USA', type: 'Grand Compte', annualRevenue: 3200000, firstContractDate: new Date('2020-03-01'), status: 'Actif' },
      { id: 'CLI004', name: 'Safran Aircraft Engines', country: 'France', type: 'Grand Compte', annualRevenue: 2100000, firstContractDate: new Date('2017-11-15'), status: 'Actif' },
      { id: 'CLI005', name: 'Airbus Operations', country: 'France', type: 'Grand Compte', annualRevenue: 4500000, firstContractDate: new Date('2016-09-01'), status: 'Actif' },
      { id: 'CLI006', name: 'DroneTech Industries', country: 'UK', type: 'PME', annualRevenue: 450000, firstContractDate: new Date('2021-06-01'), status: 'Actif' },
      { id: 'CLI007', name: 'AeroSystems Canada', country: 'Canada', type: 'Moyen', annualRevenue: 780000, firstContractDate: new Date('2020-08-01'), status: 'Actif' },
      { id: 'CLI008', name: 'Nordic Aviation Parts', country: 'Suède', type: 'Moyen', annualRevenue: 650000, firstContractDate: new Date('2022-04-01'), status: 'Actif' },
      { id: 'CLI009', name: 'Iberia Maintenance', country: 'Espagne', type: 'Moyen', annualRevenue: 890000, firstContractDate: new Date('2019-12-01'), status: 'Actif' },
      { id: 'CLI010', name: 'Emirates Engineering', country: 'UAE', type: 'Grand Compte', annualRevenue: 1650000, firstContractDate: new Date('2021-09-01'), status: 'Actif' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Clients importés');

  // ================================
  // PRODUITS
  // ================================
  await prisma.product.createMany({
    data: [
      { id: 'PROD-AX-2401', description: 'Vanne hydraulique série AX', category: 'Hydraulique', unitPrice: 1250, manufacturingTimeH: 8, weightKg: 2.3, certification: 'EN9100' },
      { id: 'PROD-AX-2402', description: 'Raccord haute pression 3/4"', category: 'Hydraulique', unitPrice: 340, manufacturingTimeH: 3, weightKg: 0.8, certification: 'EN9100' },
      { id: 'PROD-MT-1105', description: 'Arbre de transmission renforcé', category: 'Mécanique', unitPrice: 2890, manufacturingTimeH: 15, weightKg: 12.5, certification: 'AS9100' },
      { id: 'PROD-MT-1106', description: 'Carter aluminium usiné CNC', category: 'Mécanique', unitPrice: 1670, manufacturingTimeH: 12, weightKg: 5.2, certification: 'AS9100' },
      { id: 'PROD-EL-3301', description: 'Module contrôle moteur v2', category: 'Électronique', unitPrice: 4200, manufacturingTimeH: 6, weightKg: 1.1, certification: 'DO-178C' },
      { id: 'PROD-EL-3302', description: 'Capteur pression différentielle', category: 'Électronique', unitPrice: 890, manufacturingTimeH: 4, weightKg: 0.3, certification: 'DO-160' },
      { id: 'PROD-DR-5501', description: 'Support caméra drone longue portée', category: 'Drone', unitPrice: 560, manufacturingTimeH: 5, weightKg: 0.9, certification: 'CE' },
      { id: 'PROD-DR-5502', description: 'Système fixation batterie', category: 'Drone', unitPrice: 420, manufacturingTimeH: 4, weightKg: 1.2, certification: 'CE' },
      { id: 'PROD-ST-7801', description: 'Joint torique viton haute temp', category: 'Accessoire', unitPrice: 45, manufacturingTimeH: 1, weightKg: 0.05, certification: 'AMS' },
      { id: 'PROD-ST-7802', description: 'Vis titane M8x40 aéro', category: 'Accessoire', unitPrice: 12, manufacturingTimeH: 0.5, weightKg: 0.02, certification: 'NAS' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Produits importés');

  // ================================
  // COMMANDES
  // ================================
  await prisma.order.createMany({
    data: [
      { id: 'CMD-2026-001', customerId: 'CLI001', orderDate: new Date('2026-01-15'), expectedDeliveryDate: new Date('2026-03-20'), status: 'En production', totalAmount: 125000, priority: 'Haute', salesManager: 'Sophie Martin' },
      { id: 'CMD-2026-002', customerId: 'CLI003', orderDate: new Date('2026-01-17'), expectedDeliveryDate: new Date('2026-03-07'), status: 'En production', totalAmount: 89000, priority: 'Urgente', salesManager: 'Marc Dubois' },
      { id: 'CMD-2026-003', customerId: 'CLI005', orderDate: new Date('2026-01-20'), expectedDeliveryDate: new Date('2026-04-22'), status: 'Planifiée', totalAmount: 245000, priority: 'Normale', salesManager: 'Sophie Martin' },
      { id: 'CMD-2026-004', customerId: 'CLI002', orderDate: new Date('2026-01-23'), expectedDeliveryDate: new Date('2026-03-12'), status: 'En production', totalAmount: 67000, priority: 'Haute', salesManager: 'Julie Leroux' },
      { id: 'CMD-2026-005', customerId: 'CLI006', orderDate: new Date('2026-01-25'), expectedDeliveryDate: new Date('2026-03-08'), status: 'Terminée', totalAmount: 34500, priority: 'Normale', salesManager: 'Marc Dubois' },
      { id: 'CMD-2026-006', customerId: 'CLI010', orderDate: new Date('2026-01-27'), expectedDeliveryDate: new Date('2026-04-01'), status: 'En production', totalAmount: 156000, priority: 'Haute', salesManager: 'Sophie Martin' },
      { id: 'CMD-2026-007', customerId: 'CLI004', orderDate: new Date('2026-01-30'), expectedDeliveryDate: new Date('2026-03-17'), status: 'En production', totalAmount: 98000, priority: 'Urgente', salesManager: 'Julie Leroux' },
      { id: 'CMD-2026-008', customerId: 'CLI007', orderDate: new Date('2026-02-02'), expectedDeliveryDate: new Date('2026-04-17'), status: 'Planifiée', totalAmount: 52000, priority: 'Normale', salesManager: 'Marc Dubois' },
      { id: 'CMD-2026-009', customerId: 'CLI008', orderDate: new Date('2026-02-06'), expectedDeliveryDate: new Date('2026-03-31'), status: 'En production', totalAmount: 71000, priority: 'Normale', salesManager: 'Julie Leroux' },
      { id: 'CMD-2026-010', customerId: 'CLI009', orderDate: new Date('2026-02-10'), expectedDeliveryDate: new Date('2026-04-12'), status: 'Planifiée', totalAmount: 89500, priority: 'Haute', salesManager: 'Sophie Martin' },
      { id: 'CMD-2026-011', customerId: 'CLI001', orderDate: new Date('2026-02-13'), expectedDeliveryDate: new Date('2026-03-27'), status: 'En production', totalAmount: 142000, priority: 'Urgente', salesManager: 'Sophie Martin' },
      { id: 'CMD-2026-012', customerId: 'CLI003', orderDate: new Date('2026-02-15'), expectedDeliveryDate: new Date('2026-04-07'), status: 'Planifiée', totalAmount: 198000, priority: 'Normale', salesManager: 'Marc Dubois' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Commandes importées');

  // ================================
  // MATIÈRES PREMIÈRES
  // ================================
  await prisma.rawMaterial.createMany({
    data: [
      { id: 'MAT-ALU-6061', description: 'Aluminium 6061-T6 barre', unit: 'kg', currentStock: 2500, minimumStock: 500, reservedStock: 450, supplier: 'MetalSupply France', lastReplenishment: new Date('2026-02-06') },
      { id: 'MAT-ACIER-304', description: 'Acier inox 304L plaque', unit: 'kg', currentStock: 1800, minimumStock: 400, reservedStock: 320, supplier: 'ArcelorMittal', lastReplenishment: new Date('2026-02-02') },
      { id: 'MAT-TITAN-GR5', description: 'Titane Grade 5 billette', unit: 'kg', currentStock: 350, minimumStock: 100, reservedStock: 85, supplier: 'TIMET Europe', lastReplenishment: new Date('2026-02-15') },
      { id: 'MAT-VITON-75', description: 'Viton dureté 75 Shore', unit: 'kg', currentStock: 180, minimumStock: 50, reservedStock: 25, supplier: 'DuPont Polymers', lastReplenishment: new Date('2026-01-20') },
      { id: 'MAT-ELECT-PCB', description: 'Circuit imprimé multicouche', unit: 'unité', currentStock: 850, minimumStock: 200, reservedStock: 180, supplier: 'Eurocircuits', lastReplenishment: new Date('2026-02-10') },
      { id: 'MAT-COMPO-RES', description: 'Résistances SMD kit', unit: 'lot', currentStock: 120, minimumStock: 30, reservedStock: 15, supplier: 'RS Components', lastReplenishment: new Date('2026-01-25') },
      { id: 'MAT-VIS-M8', description: 'Vis titane M8 aéro', unit: 'unité', currentStock: 15000, minimumStock: 3000, reservedStock: 2500, supplier: 'Lisi Aerospace', lastReplenishment: new Date('2026-02-13') },
      { id: 'MAT-HUILE-HYD', description: 'Huile hydraulique Skydrol', unit: 'L', currentStock: 450, minimumStock: 100, reservedStock: 60, supplier: 'Shell Aviation', lastReplenishment: new Date('2026-01-30') },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Matières premières importées');

  console.log('🎉 Toutes les données ont été importées avec succès !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());