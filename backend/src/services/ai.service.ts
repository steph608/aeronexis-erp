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