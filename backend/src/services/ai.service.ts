import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// ANALYSE DES COMMANDES EN RETARD
// ================================
export const analyzeDelayedOrders = async () => {
  const today = new Date();

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['En production', 'Planifiée'] },
    },
    include: {
      customer: {
        select: { name: true, country: true },
      },
    },
  });

  const delayed = orders.filter(o =>
    new Date(o.expectedDeliveryDate) < today
  );

  const atRisk = orders.filter(o => {
    const daysLeft = Math.ceil(
      (new Date(o.expectedDeliveryDate).getTime() - today.getTime())
      / (1000 * 60 * 60 * 24)
    );
    return daysLeft >= 0 && daysLeft <= 7;
  });

  return {
    analyse: 'Retards et risques de livraison',
    commandesEnRetard: delayed.map(o => ({
      id: o.id,
      client: o.customer.name,
      montant: o.totalAmount,
      priorite: o.priority,
      dateAttendue: o.expectedDeliveryDate,
      joursRetard: Math.ceil(
        (today.getTime() - new Date(o.expectedDeliveryDate).getTime())
        / (1000 * 60 * 60 * 24)
      ),
    })),
    commandesArisque: atRisk.map(o => ({
      id: o.id,
      client: o.customer.name,
      joursRestants: Math.ceil(
        (new Date(o.expectedDeliveryDate).getTime() - today.getTime())
        / (1000 * 60 * 60 * 24)
      ),
    })),
    recommandations: delayed.length > 0
      ? [
          `⚠️ ${delayed.length} commande(s) en retard — contacter les clients concernés`,
          `📋 Prioriser les commandes urgentes en production`,
          `🔄 Réviser le planning de production pour rattraper les retards`,
        ]
      : ['✅ Aucun retard détecté — planification dans les délais'],
  };
};

// ================================
// PRÉDICTION RUPTURES DE STOCK
// ================================
export const predictStockShortages = async () => {
  const materials = await prisma.rawMaterial.findMany();
  const activeOFs = await prisma.manufacturingOrder.count({
    where: { status: 'En cours' },
  });

  const alertes = materials.map(m => {
    const disponible = m.currentStock - m.reservedStock;
    const ratio = disponible / m.minimumStock;
    let risque = 'Faible';
    let joursEstimes = 90;

    if (ratio <= 0.5) {
      risque = 'Critique';
      joursEstimes = 7;
    } else if (ratio <= 1) {
      risque = 'Élevé';
      joursEstimes = 14;
    } else if (ratio <= 1.5) {
      risque = 'Moyen';
      joursEstimes = 30;
    }

    return {
      materiau: m.description,
      id: m.id,
      stockDisponible: disponible,
      stockMinimum: m.minimumStock,
      unite: m.unit,
      fournisseur: m.supplier,
      risqueRupture: risque,
      joursAvantRupture: joursEstimes,
    };
  });

  const critique = alertes.filter(a => a.risqueRupture === 'Critique');
  const eleve = alertes.filter(a => a.risqueRupture === 'Élevé');

  return {
    analyse: 'Prédiction des ruptures de stock',
    alertes: alertes.sort((a, b) =>
      a.joursAvantRupture - b.joursAvantRupture
    ),
    resume: {
      critique: critique.length,
      eleve: eleve.length,
      ofsEnCours: activeOFs,
    },
    recommandations: [
      ...critique.map(a =>
        `🚨 Commander ${a.materiau} immédiatement chez ${a.fournisseur}`
      ),
      ...eleve.map(a =>
        `⚠️ Planifier réapprovisionnement ${a.materiau} dans les 14 jours`
      ),
      critique.length === 0 && eleve.length === 0
        ? '✅ Stocks suffisants pour les 30 prochains jours'
        : '',
    ].filter(Boolean),
  };
};

// ================================
// ANALYSE DES INCIDENTS QUALITÉ
// ================================
export const analyzeQualityIncidents = async () => {
  const incidents = await prisma.qualityIncident.findMany({
    include: {
      manufacturingOrder: {
        include: {
          product: {
            select: { description: true, category: true },
          },
        },
      },
    },
  });

  // Grouper par type d'anomalie
  const parType: Record<string, number> = {};
  incidents.forEach(i => {
    parType[i.anomalyType] = (parType[i.anomalyType] || 0) + 1;
  });

  // Grouper par sévérité
  const parSeverite: Record<string, number> = {};
  incidents.forEach(i => {
    parSeverite[i.severity] = (parSeverite[i.severity] || 0) + 1;
  });

  // Incidents critiques non résolus
  const critiqueNonResolus = incidents.filter(
    i => i.severity === 'Critique' && i.status === 'En cours'
  );

  const tauxResolution = incidents.length > 0
    ? Math.round(
        (incidents.filter(i => i.status === 'Résolu').length
        / incidents.length) * 100
      )
    : 0;

  return {
    analyse: 'Analyse qualité et incidents',
    statistiques: {
      total: incidents.length,
      parType,
      parSeverite,
      tauxResolution,
    },
    critiqueNonResolus: critiqueNonResolus.map(i => ({
      id: i.id,
      anomalie: i.anomalyType,
      lot: i.batchNumber,
      produit: i.manufacturingOrder.product.description,
      actionCorrective: i.correctiveAction,
    })),
    recommandations: [
      ...critiqueNonResolus.map(i =>
        `🚨 Résoudre en urgence: ${i.anomalyType} sur lot ${i.batchNumber}`
      ),
      tauxResolution < 50
        ? '⚠️ Taux de résolution faible — renforcer les équipes qualité'
        : `✅ Taux de résolution acceptable: ${tauxResolution}%`,
    ],
  };
};

// ================================
// ANALYSE DES MARGES PAR PRODUIT
// ================================
export const analyzeMargins = async () => {
  const orderLines = await prisma.orderLine.findMany({
    include: {
      product: { select: { id: true, description: true, category: true, unitPrice: true, manufacturingTimeH: true } },
      order:   { select: { status: true, createdAt: true } },
    },
  });

  // Grouper par produit
  const byProduct: Record<string, { description: string; category: string; unitPrice: number; totalRevenue: number; totalQty: number; nbCommandes: number }> = {};
  for (const line of orderLines) {
    const pid = line.productId;
    if (!byProduct[pid]) {
      byProduct[pid] = {
        description: line.product.description,
        category: line.product.category,
        unitPrice: line.product.unitPrice,
        totalRevenue: 0, totalQty: 0, nbCommandes: 0,
      };
    }
    byProduct[pid].totalRevenue += line.lineAmount;
    byProduct[pid].totalQty    += line.quantity;
    byProduct[pid].nbCommandes += 1;
  }

  const produits = Object.entries(byProduct).map(([id, p]) => ({
    id, ...p,
    revenuMoyen: p.nbCommandes > 0 ? Math.round(p.totalRevenue / p.nbCommandes) : 0,
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenu = produits.reduce((s, p) => s + p.totalRevenue, 0);
  const top3 = produits.slice(0, 3);

  return {
    analyse: 'Répartition du chiffre d\'affaires par produit',
    produits,
    totalRevenu,
    top3,
    recommandations: [
      top3[0] ? `⭐ Produit phare : ${top3[0].description} (${((top3[0].totalRevenue / totalRevenu) * 100).toFixed(0)}% du CA)` : '',
      top3.length > 1 ? `📈 Top 3 produits représentent ${((top3.reduce((s, p) => s + p.totalRevenue, 0) / totalRevenu) * 100).toFixed(0)}% du chiffre d'affaires` : '',
      produits.length > 3 ? `🔍 ${produits.length - 3} autres produit(s) à valoriser davantage` : '',
    ].filter(Boolean),
  };
};

// ================================
// RÉSUMÉ RAPIDE (KPIs instantanés)
// ================================
export const getQuickSummary = async () => {
  const today = new Date();

  const [totalOrders, lateOrders, ofEnCours, incidents, critiques, materials, totalRevenu] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ['En production', 'Planifiée'] }, expectedDeliveryDate: { lt: today } } }),
      prisma.manufacturingOrder.count({ where: { status: 'En cours' } }),
      prisma.qualityIncident.count(),
      prisma.qualityIncident.count({ where: { severity: 'Critique', status: { not: 'Résolu' } } }),
      prisma.rawMaterial.findMany({ select: { currentStock: true, minimumStock: true, reservedStock: true } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
    ]);

  const stockAlertes = materials.filter(m => (m.currentStock - m.reservedStock) <= m.minimumStock).length;

  // Score de santé — formule proportionnelle (chaque indicateur contribue au max)
  let healthScore = 100;

  // Taux de retard (max -40 pts) : 0% late = 0, 100% late = -40
  const retardRate = totalOrders > 0 ? lateOrders / totalOrders : 0;
  healthScore -= Math.round(retardRate * 40);

  // Incidents critiques ouverts (max -30 pts : 3 pts chacun, plafonné)
  healthScore -= Math.min(critiques * 3, 30);

  // Alertes stock (max -20 pts : 2 pts chacune, plafonnée)
  healthScore -= Math.min(stockAlertes * 2, 20);

  // Taux résolution incidents (max -10 pts)
  const totalIncidents = await prisma.qualityIncident.count();
  const resolus = await prisma.qualityIncident.count({ where: { status: 'Résolu' } });
  const tauxResolution = totalIncidents > 0 ? resolus / totalIncidents : 1;
  if (tauxResolution < 0.5) healthScore -= Math.round((0.5 - tauxResolution) * 20);

  healthScore = Math.max(5, Math.min(100, healthScore));

  return {
    totalOrders, lateOrders, ofEnCours, incidents, critiques, stockAlertes,
    totalRevenu: totalRevenu._sum.totalAmount || 0,
    healthScore,
    healthLevel: healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Acceptable' : healthScore >= 40 ? 'Préoccupant' : 'Critique',
  };
};

// ================================
// RAPPORT COMPLET IA
// ================================
export const generateFullReport = async () => {
  const delays = await analyzeDelayedOrders();
  const stock = await predictStockShortages();
  const quality = await analyzeQualityIncidents();

  const score = calculateHealthScore(delays, stock, quality);

  return {
    rapport: 'Analyse complète AERONEXIS Dynamics',
    date: new Date().toISOString(),
    scoreGlobal: score,
    modules: {
      livraisons: delays,
      stock,
      qualite: quality,
    },
    alertesPrioritaires: [
      ...delays.recommandations.filter(r => r.includes('⚠️') || r.includes('🚨')),
      ...stock.recommandations.filter(r => r.includes('⚠️') || r.includes('🚨')),
      ...quality.recommandations.filter(r => r.includes('⚠️') || r.includes('🚨')),
    ],
  };
};

// ================================
// CALCUL DU SCORE DE SANTÉ
// ================================
const calculateHealthScore = (delays: any, stock: any, quality: any) => {
  let score = 100;

  // Pénalités retards
  score -= delays.commandesEnRetard.length * 5;
  score -= delays.commandesArisque.length * 2;

  // Pénalités stock
  score -= stock.resume.critique * 10;
  score -= stock.resume.eleve * 5;

  // Pénalités qualité
  score -= quality.critiqueNonResolus.length * 8;

  score = Math.max(0, Math.min(100, score));

  let niveau = 'Excellent';
  if (score < 40) niveau = 'Critique';
  else if (score < 60) niveau = 'Préoccupant';
  else if (score < 80) niveau = 'Acceptable';

  return { score, niveau };
};