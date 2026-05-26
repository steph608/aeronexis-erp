import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// DASHBOARD PRINCIPAL
// ================================
export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {

    // ── Commandes ──
    const totalCommandes = await prisma.order.count();
    const commandesEnProduction = await prisma.order.count({
      where: { status: 'En production' },
    });
    const commandesPlanifiees = await prisma.order.count({
      where: { status: 'Planifiée' },
    });
    const commandesTerminees = await prisma.order.count({
      where: { status: 'Terminée' },
    });
    const chiffreAffaires = await prisma.order.aggregate({
      _sum: { totalAmount: true },
    });

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

    // ── Clients ──
    const totalClients = await prisma.customer.count();
    const clientsActifs = await prisma.customer.count({
      where: { status: 'Actif' },
    });

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

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          commandes: {
            total: totalCommandes,
            enProduction: commandesEnProduction,
            planifiees: commandesPlanifiees,
            terminees: commandesTerminees,
            chiffreAffaires: chiffreAffaires._sum.totalAmount || 0,
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
      },
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};