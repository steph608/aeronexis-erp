/**
 * Seed historique KPI — 12 mois de données de production aérospatiale
 * Run: npx ts-node --require dotenv/config prisma/seed-history.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CUSTOMERS = ['CLI001','CLI002','CLI003','CLI004','CLI005','CLI006','CLI007','CLI008','CLI009','CLI010'];
const PRODUCTS = [
  { id: 'PROD-EL-3301', unitPrice: 4200 },
  { id: 'PROD-MT-1105', unitPrice: 2890 },
  { id: 'PROD-AX-2401', unitPrice: 1250 },
  { id: 'PROD-EL-3302', unitPrice: 890  },
  { id: 'PROD-MT-1106', unitPrice: 1670 },
];
const SITES          = ['Toulouse', 'Bordeaux', 'Nantes'];
const CARRIERS       = ['DHL Aviation', 'FedEx Cargo', 'Air France Cargo', 'UPS Supply Chain'];
const DESTINATIONS   = ['Paris, France', 'Berlin, Allemagne', 'Madrid, Espagne', 'Munich, Allemagne', 'Amsterdam, Pays-Bas'];
const ANOMALY_TYPES  = ['Défaut dimensionnel', 'Non-conformité matière', 'Défaut de surface', 'Écart de tolérance'];
const CORRECTIVE     = ['Retour fournisseur et réapprovisionnement', 'Ajustement paramètres machine', 'Révision procédure contrôle qualité', 'Rebut et refabrication lot'];
const SALES_MANAGERS = ['Marie Dupont', 'Pierre Martin', 'Sophie Bernard', 'Jean-Luc Moreau'];

function pick<T>(a: T[]) { return a[Math.floor(Math.random() * a.length)]; }
function dt(year: number, month: number, day: number) {
  const d = new Date(year, month, Math.min(day, 28));
  return d;
}
function mm(month: number) { return String(month + 1).padStart(2, '0'); }

// ─── Counters for unique IDs ───────────────────────────────────────────────
let cOrder = 0, cLine = 0;

// ─── Create orders with order lines for one month ─────────────────────────
async function addOrders(year: number, month: number, nOrders: number, targetRevenue: number): Promise<string[]> {
  const perOrder   = Math.round(targetRevenue / nOrders);
  const ids: string[] = [];

  for (let i = 0; i < nOrders; i++) {
    const prod      = PRODUCTS[i % PRODUCTS.length];
    const qty       = Math.max(1, Math.round(perOrder / prod.unitPrice));
    const lineAmt   = qty * prod.unitPrice;
    const orderId   = `CMD-H-${year}${mm(month)}-${String(++cOrder).padStart(4, '0')}`;
    const lineId    = `LN-H-${year}${mm(month)}-${String(++cLine).padStart(4, '0')}`;
    const orderDate = dt(year, month, 2 + i * 3);
    const delivery  = new Date(orderDate);
    delivery.setDate(delivery.getDate() + 60);

    await prisma.order.create({
      data: {
        id: orderId,
        customerId:           CUSTOMERS[i % CUSTOMERS.length],
        orderDate,
        expectedDeliveryDate: delivery,
        status:               'Terminée',
        totalAmount:          lineAmt,
        priority:             i % 3 === 0 ? 'Haute' : 'Standard',
        salesManager:         pick(SALES_MANAGERS),
        orderLines: {
          create: [{ id: lineId, productId: prod.id, quantity: qty, unitPrice: prod.unitPrice, lineAmount: lineAmt, lineStatus: 'Terminée' }],
        },
      },
    });
    ids.push(orderId);
  }
  return ids;
}

// ─── Create manufacturing orders for one month ────────────────────────────
async function addOFs(year: number, month: number, nTotal: number, nTermine: number): Promise<string[]> {
  const batches: string[] = [];

  for (let i = 0; i < nTotal; i++) {
    const isTermine = i < nTermine;
    const batchNum  = `LOT-H-${year}${mm(month)}-${String(i + 1).padStart(3, '0')}`;
    const ofId      = `OF-H-${year}${mm(month)}-${String(i + 1).padStart(3, '0')}`;
    const launch    = dt(year, month, 3 + i);
    const endDate   = new Date(launch);
    endDate.setDate(endDate.getDate() + 20);

    await prisma.manufacturingOrder.create({
      data: {
        id:             ofId,
        productId:      PRODUCTS[i % PRODUCTS.length].id,
        batchNumber:    batchNum,
        quantity:       10 + (i % 40),
        launchDate:     launch,
        expectedEndDate: endDate,
        status:         isTermine ? 'Terminé' : 'En cours',
        operatorId:     3,
        site:           pick(SITES),
        createdAt:      launch,
      },
    });
    batches.push(batchNum);
  }
  return batches;
}

// ─── Create quality incidents for one month ───────────────────────────────
async function addIncidents(year: number, month: number, batchNumbers: string[], severities: string[]): Promise<void> {
  for (let i = 0; i < severities.length; i++) {
    const incId = `INC-H-${year}${mm(month)}-${String(i + 1).padStart(3, '0')}`;
    const detectionDate = dt(year, month, 8 + i * 5);

    await prisma.qualityIncident.create({
      data: {
        id:               incId,
        detectionDate,
        batchNumber:      batchNumbers[i % batchNumbers.length],
        anomalyType:      pick(ANOMALY_TYPES),
        severity:         severities[i],
        status:           severities[i] === 'Critique' ? 'En cours' : 'Résolu',
        responsibleId:    3,
        correctiveAction: pick(CORRECTIVE),
        createdAt:        detectionDate,
      },
    });
  }
}

// ─── Create shipments for one month (nLate shipments are delivered late) ──
async function addShipments(year: number, month: number, orderIds: string[], nShips: number, nLate: number): Promise<void> {
  const count = Math.min(nShips, orderIds.length);

  for (let i = 0; i < count; i++) {
    const shipId      = `SHIP-H-${year}${mm(month)}-${String(i + 1).padStart(3, '0')}`;
    const isLate      = i < nLate;
    const sched       = dt(year, month, 10 + i * 2);
    const actual      = new Date(sched);
    actual.setDate(actual.getDate() + (isLate ? 5 : -1));

    await prisma.shipment.create({
      data: {
        id:            shipId,
        orderId:       orderIds[i],
        destination:   pick(DESTINATIONS),
        carrier:       pick(CARRIERS),
        trackingNumber: `TRK-H-${year}${mm(month)}${String(i + 1).padStart(3, '0')}`,
        status:        'Livrée',
        scheduledDate: sched,
        actualDate:    actual,
        createdAt:     sched,
        updatedAt:     actual,
      },
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('🌱  AERONEXIS — Seed historique KPI (12 mois)\n');

  // ── 1. Mois complets (aucune donnée) ──────────────────────────────────
  const fullMonths: Array<[number, number, number, number, number, string[], number, number]> = [
    // year, month(0-idx), revenue, nOFs, nTermine, severities,              nShips, nLate
    [2025,  6, 1320000, 13, 12, ['Critique', 'Majeur'],                         9, 2],
    [2025,  7, 1280000, 12, 11, ['Critique', 'Majeur'],                         9, 2],
    [2025,  8, 1200000, 14, 12, ['Critique', 'Critique', 'Majeur', 'Mineur'],   8, 4],
    [2025,  9, 1350000, 13, 12, ['Majeur'],                                      9, 1],
    [2025, 10, 1290000, 12, 11, ['Critique', 'Majeur', 'Mineur'],               9, 3],  // Nov: 91.7%
    [2025, 11, 1340000, 17, 16, ['Majeur', 'Mineur'],                            9, 1],  // Dec: 94.1%
    [2026,  2, 1150000, 13, 12, ['Critique', 'Majeur'],                          8, 2],
    [2026,  3, 1220000, 12, 11, ['Majeur'],                                       8, 2],
  ];

  for (const [year, month, revenue, nOFs, nTerm, severities, nShips, nLate] of fullMonths) {
    const label = dt(year, month, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    console.log(`  [${label.toUpperCase()}]`);

    const nOrders  = Math.max(9, nShips);
    const orderIds = await addOrders(year, month, nOrders, revenue);
    const batches  = await addOFs(year, month, nOFs, nTerm);
    await addIncidents(year, month, batches, severities as string[]);
    await addShipments(year, month, orderIds, nShips, nLate);

    const yieldPct = Math.round((nTerm / nOFs) * 1000) / 10;
    console.log(`    ✓  Rev: ${(revenue / 1e6).toFixed(2)}M€  |  Yield: ${yieldPct}%  |  Inc: ${severities.length} (${severities.filter(s => s === 'Critique').length} crit)  |  Retards: ${nLate}`);
  }

  // ── 2. Janvier 2026 — supplément (existing: 7 orders ~814k → cible 1.25M) ──
  console.log('\n  [JAN-26] Supplément...');
  const jan26OFs     = await addOFs(2026, 0, 13, 12);                  // yield 12/13 = 92.3%
  const jan26Orders  = await addOrders(2026, 0, 3, 436000);            // +436k → total ~1.25M
  await addIncidents(2026, 0, jan26OFs, ['Critique']);                  // 1 critical incident
  await addShipments(2026, 0, jan26Orders, 3, 2);                      // 2 retards livraison
  console.log('         ✓  +3 commandes, 13 OFs (12 term = 92.3%), 1 incident Critique, 3 ships (2 retards)');

  // ── 3. Février 2026 — supplément (existing: 5 orders ~552k + 5 incidents) ──
  console.log('  [FEV-26] Supplément...');
  const feb26OFs    = await addOFs(2026, 1, 17, 15);                   // yield 15/17 = 88.2%
  const feb26Orders = await addOrders(2026, 1, 4, 628000);             // +628k → total ~1.18M
  // Pas de nouveaux incidents (2 Critique déjà présents)
  await addShipments(2026, 1, feb26Orders, 4, 4);                      // 4 retards livraison
  console.log('         ✓  +4 commandes, 17 OFs (15 term = 88.2%), 0 incidents, 4 ships (4 retards)');

  // ── 4. Mai 2026 — supplément (existing: 12 OFs, 2 term → ajouter commandes + OFs) ──
  console.log('  [MAI-26] Supplément...');
  const may26OFs    = await addOFs(2026, 4, 50, 48);                   // +50 OFs terminés (total 62, 50 term = 80.6%)
  const may26Orders = await addOrders(2026, 4, 9, 1100000);            // 1.1M CA
  await addIncidents(2026, 4, may26OFs, ['Critique', 'Majeur']);
  await addShipments(2026, 4, may26Orders, 8, 1);
  console.log('         ✓  9 commandes, +50 OFs (total 62, ~50 term ≈80%), 2 incidents, 8 ships (1 retard)');

  console.log('\n✅  Seed terminé !');
  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('\n❌  Erreur seed:', (e as Error).message);
  await prisma.$disconnect();
});
