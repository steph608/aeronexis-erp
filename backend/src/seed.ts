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
  // ================================
  // ORDRES DE FABRICATION
  // ================================
  await prisma.manufacturingOrder.createMany({
    data: [
      { id: 'OF-2026-0045', productId: 'PROD-AX-2401', batchNumber: 'LOT-AX-2401-001', quantity: 50, launchDate: new Date('2026-02-06'), expectedEndDate: new Date('2026-02-20'), status: 'En cours', site: 'Site Lyon' },
      { id: 'OF-2026-0046', productId: 'PROD-AX-2402', batchNumber: 'LOT-AX-2402-001', quantity: 150, launchDate: new Date('2026-02-07'), expectedEndDate: new Date('2026-02-17'), status: 'En cours', site: 'Site Lyon' },
      { id: 'OF-2026-0047', productId: 'PROD-MT-1105', batchNumber: 'LOT-MT-1105-001', quantity: 20, launchDate: new Date('2026-02-08'), expectedEndDate: new Date('2026-02-25'), status: 'En cours', site: 'Site Toulouse' },
      { id: 'OF-2026-0048', productId: 'PROD-EL-3301', batchNumber: 'LOT-EL-3301-001', quantity: 5, launchDate: new Date('2026-02-10'), expectedEndDate: new Date('2026-02-23'), status: 'Planifié', site: 'Site Lyon' },
      { id: 'OF-2026-0049', productId: 'PROD-MT-1106', batchNumber: 'LOT-MT-1106-001', quantity: 80, launchDate: new Date('2026-02-15'), expectedEndDate: new Date('2026-03-03'), status: 'Planifié', site: 'Site Toulouse' },
      { id: 'OF-2026-0050', productId: 'PROD-DR-5501', batchNumber: 'LOT-DR-5501-001', quantity: 80, launchDate: new Date('2026-02-06'), expectedEndDate: new Date('2026-02-19'), status: 'En cours', site: 'Site Lyon' },
      { id: 'OF-2026-0051', productId: 'PROD-DR-5502', batchNumber: 'LOT-DR-5502-001', quantity: 50, launchDate: new Date('2026-02-07'), expectedEndDate: new Date('2026-02-18'), status: 'En cours', site: 'Site Lyon' },
      { id: 'OF-2026-0052', productId: 'PROD-ST-7801', batchNumber: 'LOT-ST-7801-001', quantity: 500, launchDate: new Date('2026-01-30'), expectedEndDate: new Date('2026-02-10'), status: 'Terminé', site: 'Site Lyon' },
      { id: 'OF-2026-0053', productId: 'PROD-ST-7802', batchNumber: 'LOT-ST-7802-001', quantity: 1000, launchDate: new Date('2026-01-30'), expectedEndDate: new Date('2026-02-08'), status: 'Terminé', site: 'Site Lyon' },
      { id: 'OF-2026-0054', productId: 'PROD-AX-2401', batchNumber: 'LOT-AX-2401-002', quantity: 60, launchDate: new Date('2026-02-13'), expectedEndDate: new Date('2026-02-27'), status: 'En cours', site: 'Site Lyon' },
      { id: 'OF-2026-0055', productId: 'PROD-MT-1105', batchNumber: 'LOT-MT-1105-002', quantity: 25, launchDate: new Date('2026-02-14'), expectedEndDate: new Date('2026-03-01'), status: 'En cours', site: 'Site Toulouse' },
      { id: 'OF-2026-0056', productId: 'PROD-EL-3301', batchNumber: 'LOT-EL-3301-002', quantity: 15, launchDate: new Date('2026-02-16'), expectedEndDate: new Date('2026-03-01'), status: 'En cours', site: 'Site Lyon' },
    ],
    skipDuplicates: true,
  });
  // ================================
  // INCIDENTS QUALITÉ
  // ================================
  await prisma.qualityIncident.createMany({
    data: [
      { id: 'INC-2026-001', detectionDate: new Date('2026-02-02'), batchNumber: 'LOT-AX-2401-001', anomalyType: 'Dimension hors tolérance', severity: 'Moyenne', status: 'Résolu', correctiveAction: 'Recalibrage machine CNC' },
      { id: 'INC-2026-002', detectionDate: new Date('2026-02-07'), batchNumber: 'LOT-MT-1105-001', anomalyType: 'Rugosité surface', severity: 'Faible', status: 'En cours', correctiveAction: 'Révision process polissage' },
      { id: 'INC-2026-003', detectionDate: new Date('2026-02-10'), batchNumber: 'LOT-EL-3301-001', anomalyType: 'Défaut soudure', severity: 'Critique', status: 'En cours', correctiveAction: 'Remplacement composant' },
      { id: 'INC-2026-004', detectionDate: new Date('2026-02-13'), batchNumber: 'LOT-DR-5501-001', anomalyType: 'Rayure cosmétique', severity: 'Faible', status: 'Résolu', correctiveAction: 'Amélioration emballage' },
      { id: 'INC-2026-005', detectionDate: new Date('2026-02-15'), batchNumber: 'LOT-AX-2401-002', anomalyType: 'Fuite hydraulique test', severity: 'Critique', status: 'En cours', correctiveAction: 'Changement joint' },
    ],
    skipDuplicates: true,
  });
  // ================================
  // LIGNES DE COMMANDES
  // ================================
  await prisma.orderLine.createMany({
    data: [
      { id: 'LG-001', orderId: 'CMD-2026-001', productId: 'PROD-AX-2401', quantity: 50, unitPrice: 1250, lineAmount: 62500, lineStatus: 'En cours' },
      { id: 'LG-002', orderId: 'CMD-2026-001', productId: 'PROD-AX-2402', quantity: 150, unitPrice: 340, lineAmount: 51000, lineStatus: 'En cours' },
      { id: 'LG-003', orderId: 'CMD-2026-002', productId: 'PROD-MT-1105', quantity: 20, unitPrice: 2890, lineAmount: 57800, lineStatus: 'En cours' },
      { id: 'LG-004', orderId: 'CMD-2026-002', productId: 'PROD-EL-3301', quantity: 5, unitPrice: 4200, lineAmount: 21000, lineStatus: 'Planifiée' },
      { id: 'LG-005', orderId: 'CMD-2026-003', productId: 'PROD-MT-1106', quantity: 80, unitPrice: 1670, lineAmount: 133600, lineStatus: 'Planifiée' },
      { id: 'LG-006', orderId: 'CMD-2026-003', productId: 'PROD-EL-3302', quantity: 100, unitPrice: 890, lineAmount: 89000, lineStatus: 'Planifiée' },
      { id: 'LG-007', orderId: 'CMD-2026-004', productId: 'PROD-DR-5501', quantity: 80, unitPrice: 560, lineAmount: 44800, lineStatus: 'En cours' },
      { id: 'LG-008', orderId: 'CMD-2026-004', productId: 'PROD-DR-5502', quantity: 50, unitPrice: 420, lineAmount: 21000, lineStatus: 'En cours' },
      { id: 'LG-009', orderId: 'CMD-2026-005', productId: 'PROD-ST-7801', quantity: 500, unitPrice: 45, lineAmount: 22500, lineStatus: 'Terminée' },
      { id: 'LG-010', orderId: 'CMD-2026-005', productId: 'PROD-ST-7802', quantity: 1000, unitPrice: 12, lineAmount: 12000, lineStatus: 'Terminée' },
      { id: 'LG-011', orderId: 'CMD-2026-006', productId: 'PROD-AX-2401', quantity: 60, unitPrice: 1250, lineAmount: 75000, lineStatus: 'En cours' },
      { id: 'LG-012', orderId: 'CMD-2026-006', productId: 'PROD-MT-1105', quantity: 25, unitPrice: 2890, lineAmount: 72250, lineStatus: 'En cours' },
      { id: 'LG-013', orderId: 'CMD-2026-007', productId: 'PROD-EL-3301', quantity: 15, unitPrice: 4200, lineAmount: 63000, lineStatus: 'En cours' },
      { id: 'LG-014', orderId: 'CMD-2026-007', productId: 'PROD-AX-2402', quantity: 100, unitPrice: 340, lineAmount: 34000, lineStatus: 'En cours' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Lignes de commandes importées');
  console.log('✅ Incidents qualité importés');
  console.log('✅ Ordres de fabrication importés');
  console.log('✅ Matières premières importées');

  console.log('🎉 Toutes les données ont été importées avec succès !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());