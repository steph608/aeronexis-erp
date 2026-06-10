import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// DASHBOARD PRINCIPAL
// ================================
export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {

    const today = new Date();

    // ── Commandes ──
    const totalCommandes = await prisma.order.count();
    const commandesEnProduction = await prisma.order.count({ where: { status: 'En production' } });
    const commandesPlanifiees   = await prisma.order.count({ where: { status: 'Planifiée' } });
    const commandesTerminees    = await prisma.order.count({ where: { status: 'Terminée' } });
    const commandesEnRetard     = await prisma.order.count({
      where: { status: { in: ['En production', 'Planifiée'] }, expectedDeliveryDate: { lt: today } },
    });
    const chiffreAffaires = await prisma.order.aggregate({ _sum: { totalAmount: true } });

    // ── Production ──
    const totalOFs = await prisma.manufacturingOrder.count();
    const ofsEnCours = await prisma.manufacturingOrder.count({
      where: { status: 'En cours' },
    });
    const ofsTermines = await prisma.manufacturingOrder.count({
      where: { status: 'Terminé' },
    });
    const tauxRendement = totalOFs > 0
      ? Math.round((ofsTermines / totalOFs) * 100)
      : 0;

    // ── Incidents ──
    const totalIncidents = await prisma.qualityIncident.count();
    const incidentsCritiques = await prisma.qualityIncident.count({
      where: { severity: 'Critique', status: 'En cours' },
    });
    const incidentsEnCours = await prisma.qualityIncident.count({
      where: { status: 'En cours' },
    });
    const incidentsResolus = await prisma.qualityIncident.count({
      where: { status: 'Résolu' },
    });

    // ── Stock ──
    const materials = await prisma.rawMaterial.findMany();
    const alertesStock = materials.filter(m =>
      (m.currentStock - m.reservedStock) <= m.minimumStock
    ).length;

    // ── Expéditions ──
    const expAEnvoyer  = await prisma.shipment.count({ where: { status: { in: ['À envoyer', 'Planifiée'] } } });
    const expEnTransit = await prisma.shipment.count({ where: { status: { in: ['En transit', 'En cours', 'Envoyé'] } } });
    const expLivrees   = await prisma.shipment.count({ where: { status: 'Livrée' } });

    // ── Clients ──
    const totalClients  = await prisma.customer.count();
    const clientsActifs = await prisma.customer.count({ where: { status: 'Actif' } });

    // ── Dernières commandes ──
    const dernieresCommandes = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { name: true, country: true },
        },
      },
    });

    // ── Derniers incidents ──
    const derniersIncidents = await prisma.qualityIncident.findMany({
      take: 5,
      orderBy: { detectionDate: 'desc' },
      include: {
        manufacturingOrder: {
          select: {
            batchNumber: true,
            product: {
              select: { description: true },
            },
          },
        },
      },
    });

    // ── OFs récents ──
    const derniersOFs = await prisma.manufacturingOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { description: true, category: true },
        },
      },
    });

    // ── Statistiques mensuelles (12 derniers mois) ──
    const now = new Date();
    const historyStart = new Date(now.getFullYear(), now.getMonth() - 13, 1);

    const [histOrders, histOFs, histIncidents, histShipments] = await Promise.all([
      prisma.order.findMany({
        where: { orderDate: { gte: historyStart } },
        select: { orderDate: true, totalAmount: true },
      }),
      prisma.manufacturingOrder.findMany({
        where: { launchDate: { gte: historyStart } },
        select: { launchDate: true, status: true },
      }),
      prisma.qualityIncident.findMany({
        where: { detectionDate: { gte: historyStart } },
        select: { detectionDate: true, severity: true },
      }),
      prisma.shipment.findMany({
        where: { scheduledDate: { gte: historyStart } },
        select: { scheduledDate: true, actualDate: true },
      }),
    ]);

    const FR_MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
    const mkKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const monthMap: Record<string, {
      name: string; year: number; month: number;
      ca: number; commandes: number; ofs: number; ofsTermines: number;
      incidents: number; criticalIncidents: number;
      deliveryDelays: number;
    }> = {};

    for (let i = 12; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = mkKey(d);
      monthMap[key] = {
        name: FR_MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1,
        ca: 0, commandes: 0, ofs: 0, ofsTermines: 0,
        incidents: 0, criticalIncidents: 0, deliveryDelays: 0,
      };
    }

    for (const o of histOrders) {
      const key = mkKey(new Date(o.orderDate));
      if (monthMap[key]) {
        monthMap[key].commandes++;
        monthMap[key].ca += o.totalAmount;
      }
    }
    for (const of_ of histOFs) {
      const key = mkKey(new Date(of_.launchDate));
      if (monthMap[key]) {
        monthMap[key].ofs++;
        if (of_.status === 'Terminé') monthMap[key].ofsTermines++;
      }
    }
    for (const inc of histIncidents) {
      const key = mkKey(new Date(inc.detectionDate));
      if (monthMap[key]) {
        monthMap[key].incidents++;
        if (inc.severity === 'Critique') monthMap[key].criticalIncidents++;
      }
    }
    for (const ship of histShipments) {
      if (ship.actualDate && ship.scheduledDate) {
        const key = mkKey(new Date(ship.scheduledDate));
        if (monthMap[key] && new Date(ship.actualDate) > new Date(ship.scheduledDate)) {
          monthMap[key].deliveryDelays++;
        }
      }
    }

    const monthlyStats = Object.values(monthMap).map(m => {
      const yieldRate = m.ofs > 0 ? Math.round((m.ofsTermines / m.ofs) * 1000) / 10 : null;
      const revenue = m.ca;
      const grossMarginPct = yieldRate != null && revenue > 0
        ? Math.round((-2.03 + 0.4379 * yieldRate) * 10) / 10
        : null;
      return {
        name: m.name, year: m.year, month: m.month,
        ca: m.ca, commandes: m.commandes, ofs: m.ofs, ofsTermines: m.ofsTermines,
        incidents: m.incidents, criticalIncidents: m.criticalIncidents,
        clients: 0, expeditions: 0,
        deliveryDelays: m.deliveryDelays,
        revenueRaw: revenue, costRaw: Math.round(revenue * 0.62), revenue,
        yieldRate, grossMarginPct,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          commandes: {
            total: totalCommandes,
            enProduction: commandesEnProduction,
            planifiees: commandesPlanifiees,
            terminees: commandesTerminees,
            enRetard: commandesEnRetard,
            chiffreAffaires: chiffreAffaires._sum.totalAmount || 0,
          },
          expeditions: {
            aEnvoyer: expAEnvoyer,
            enTransit: expEnTransit,
            livrees: expLivrees,
          },
          production: {
            total: totalOFs,
            enCours: ofsEnCours,
            termines: ofsTermines,
            tauxRendement,
          },
          incidents: {
            total: totalIncidents,
            critiques: incidentsCritiques,
            enCours: incidentsEnCours,
            resolus: incidentsResolus,
            tauxResolution: totalIncidents > 0
              ? Math.round((incidentsResolus / totalIncidents) * 100)
              : 0,
          },
          stock: {
            totalMatieres: materials.length,
            alertesRupture: alertesStock,
          },
          clients: {
            total: totalClients,
            actifs: clientsActifs,
          },
        },
        dernieresCommandes,
        derniersIncidents,
        derniersOFs,
        monthlyStats,
      },
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};