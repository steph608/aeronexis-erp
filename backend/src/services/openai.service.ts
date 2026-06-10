import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// ─── Contexte ERP (snapshot des données actuelles) ───────────────────────────
async function buildERPContext(): Promise<string> {
  const today = new Date();

  const [orders, incidents, shipments, materials, manufacturing] = await Promise.all([
    prisma.order.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true, country: true } } },
    }),
    (prisma.qualityIncident as any).findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { responsible: { select: { firstName: true, lastName: true } } },
    }) as Promise<any[]>,
    prisma.shipment.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.rawMaterial.findMany({ take: 50, orderBy: { updatedAt: 'desc' } }),
    prisma.manufacturingOrder.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { description: true, category: true } } },
    }),
  ]);

  // Résumé commandes
  const orderStats = {
    total: orders.length,
    enProduction: orders.filter((o: any) => o.status === 'En production').length,
    planifiees: orders.filter((o: any) => o.status === 'Planifiée').length,
    terminees: orders.filter((o: any) => o.status === 'Terminée').length,
    enRetard: orders.filter((o: any) =>
      ['En production', 'Planifiée'].includes(o.status) &&
      new Date(o.expectedDeliveryDate) < today
    ).length,
    caTotal: orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0),
  };

  // Résumé incidents
  const incidentStats = {
    total: incidents.length,
    critiques: incidents.filter((i: any) => i.severity === 'Critique').length,
    critiquesEnCours: incidents.filter((i: any) => i.severity === 'Critique' && i.status === 'En cours').length,
    enCours: incidents.filter((i: any) => i.status === 'En cours').length,
    resolus: incidents.filter((i: any) => i.status === 'Résolu').length,
  };

  // Résumé stock
  const stockAlerts = materials.filter((m: any) => m.currentStock <= m.minStock);

  // Résumé expéditions
  const shipStats = {
    total: shipments.length,
    aEnvoyer: shipments.filter((s: any) => ['À envoyer', 'Planifiée'].includes(s.status)).length,
    enTransit: shipments.filter((s: any) => ['En transit', 'En cours', 'Envoyé'].includes(s.status)).length,
    livrees: shipments.filter((s: any) => s.status === 'Livrée').length,
  };

  // OF résumé
  const ofStats = {
    total: manufacturing.length,
    enCours: manufacturing.filter((of: any) => of.status === 'En cours').length,
    termines: manufacturing.filter((of: any) => of.status === 'Terminé').length,
  };

  // Incidents récents détaillés
  const recentIncidents = incidents.slice(0, 10).map((i: any) => ({
    id: i.id,
    lot: i.batchNumber,
    anomalie: i.anomalyType,
    severite: i.severity,
    statut: i.status,
    actionCorrective: i.correctiveAction,
  }));

  // Commandes en retard
  const lateOrders = orders
    .filter((o: any) => ['En production', 'Planifiée'].includes(o.status) && new Date(o.expectedDeliveryDate) < today)
    .slice(0, 10)
    .map((o: any) => ({
      id: o.id,
      client: o.customer?.name,
      joursRetard: Math.ceil((today.getTime() - new Date(o.expectedDeliveryDate).getTime()) / 86400000),
      montant: o.totalAmount,
      priorite: o.priority,
    }));

  // Alertes stock
  const stockAlertDetails = stockAlerts.slice(0, 10).map((m: any) => ({
    nom: m.name,
    stock: m.currentStock,
    minimum: m.minStock,
    unite: m.unit,
  }));

  return `
=== DONNÉES ERP AERONEXIS (${today.toLocaleDateString('fr-FR')}) ===

COMMANDES:
- Total: ${orderStats.total} | En production: ${orderStats.enProduction} | Planifiées: ${orderStats.planifiees} | Terminées: ${orderStats.terminees}
- En retard: ${orderStats.enRetard} commandes
- CA total: ${orderStats.caTotal.toLocaleString('fr-FR')} €
${lateOrders.length > 0 ? `- Commandes en retard: ${JSON.stringify(lateOrders)}` : ''}

INCIDENTS QUALITÉ:
- Total: ${incidentStats.total} | Critiques: ${incidentStats.critiques} | Critiques en cours: ${incidentStats.critiquesEnCours}
- En cours: ${incidentStats.enCours} | Résolus: ${incidentStats.resolus}
${recentIncidents.length > 0 ? `- Récents: ${JSON.stringify(recentIncidents)}` : ''}

STOCK:
- Total matériaux: ${materials.length} | Alertes stock: ${stockAlerts.length}
${stockAlertDetails.length > 0 ? `- Alertes: ${JSON.stringify(stockAlertDetails)}` : ''}

EXPÉDITIONS:
- Total: ${shipStats.total} | À envoyer: ${shipStats.aEnvoyer} | En transit: ${shipStats.enTransit} | Livrées: ${shipStats.livrees}

ORDRES DE FABRICATION:
- Total: ${ofStats.total} | En cours: ${ofStats.enCours} | Terminés: ${ofStats.termines}
`.trim();
}

const SYSTEM_PROMPT = `Tu es l'assistant IA intégré de l'ERP AERONEXIS, spécialisé dans la gestion industrielle et la chaîne de production.
Tu réponds uniquement en français, de façon concise et professionnelle.
Tu as accès aux données en temps réel de l'ERP : commandes, incidents qualité, stock, expéditions, ordres de fabrication.
Tu analyses les données et fournis des recommandations concrètes et actionnables.
Ne dépasse pas 300 mots par réponse sauf si on te demande un rapport complet.
Utilise des listes à puces pour la clarté.`;

// ─── Chat conversationnel ─────────────────────────────────────────────────────
export const chatWithAI = async (
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> => {
  const context = await buildERPContext();

  const completion = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `Contexte ERP actuel :\n${context}` },
      ...messages,
    ],
    max_tokens: 600,
    temperature: 0.4,
  });

  return completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer une réponse.';
};

// ─── Suggestions proactives ───────────────────────────────────────────────────
export const getAISuggestions = async (): Promise<{
  type: string; priority: 'haute' | 'moyenne' | 'info'; title: string; detail: string;
}[]> => {
  const context = await buildERPContext();

  const completion = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Voici les données ERP actuelles :\n${context}\n\nGénère exactement 4 à 6 suggestions proactives et prioritaires basées sur ces données.
Réponds UNIQUEMENT avec un JSON valide de ce format (rien d'autre) :
[
  {"type":"incidents|stock|retards|qualite|expedition", "priority":"haute|moyenne|info", "title":"Titre court", "detail":"Explication en 1-2 phrases avec des chiffres précis."}
]`,
      },
    ],
    max_tokens: 800,
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content || '[]';
  try {
    const json = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(json);
  } catch {
    return [];
  }
};

// ─── Analyse IA complète par type ────────────────────────────────────────────
export const analyzeWithAI = async (type: 'delays' | 'quality' | 'stock' | 'margins' | 'report'): Promise<string> => {
  const context = await buildERPContext();

  const prompts: Record<string, string> = {
    delays: 'Analyse les retards de livraison. Identifie les causes probables, les commandes prioritaires à traiter et propose 3 actions concrètes.',
    quality: 'Analyse les incidents qualité. Identifie les lots/produits/opérateurs problématiques, les tendances et propose un plan d\'amélioration.',
    stock: 'Analyse l\'état des stocks. Identifie les ruptures imminentes, les sur-stocks et recommande des actions d\'approvisionnement.',
    margins: 'Analyse les performances commerciales. Identifie les commandes/clients/produits les plus rentables et les axes d\'amélioration.',
    report: 'Génère un rapport de gestion complet couvrant : performance globale, points critiques, risques, et recommandations stratégiques pour les 30 prochains jours.',
  };

  const completion = await openai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `Données ERP :\n${context}` },
      { role: 'user', content: prompts[type] },
    ],
    max_tokens: type === 'report' ? 1200 : 700,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || 'Analyse indisponible.';
};
