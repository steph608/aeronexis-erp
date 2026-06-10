import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  getIncidentStats,
  getComments,
  addComment,
} from '../services/incident.service';
import { logAction } from '../services/audit.service';
import { createNotification, notifyAllUsersExcept } from '../services/notification.service';

// ================================
// VALIDATION
// ================================
const createSchema = z.object({
  id: z.string().min(1),
  detectionDate: z.string().transform(str => new Date(str)),
  batchNumber: z.string().min(1),
  anomalyType: z.string().min(1),
  severity: z.enum(['Critique', 'Majeur', 'Mineur', 'Observation']),
  status: z.string().default('En cours'),
  responsibleId: z.number().int().positive().nullable().optional(),
  correctiveAction: z.string().min(1),
  orderId: z.string().nullable().optional(),
});

const updateSchema = z.object({
  status: z.string().optional(),
  correctiveAction: z.string().optional(),
  responsibleId: z.number().int().positive().nullable().optional(),
  severity: z.enum(['Critique', 'Majeur', 'Mineur', 'Observation']).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1),
});

// ================================
// LISTE TOUS LES INCIDENTS
// ================================
export const getIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const incidents = await getAllIncidents();
    res.status(200).json({ success: true, data: incidents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// VOIR UN INCIDENT
// ================================
export const getIncident = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await getIncidentById(req.params['id'] as string);
    res.status(200).json({ success: true, data: incident });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// ================================
// CRÉER UN INCIDENT
// ================================
export const createIncidentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createSchema.parse(req.body);
    const incident = await createIncident(validatedData);

    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'CREATE',
      module: 'incidents',
      description: `Signalement incident ${incident.id} — Lot: ${incident.batchNumber} — Type: ${incident.anomalyType} — Severite: ${incident.severity}${validatedData.orderId ? ` — Commande: ${validatedData.orderId}` : ''}`,
      ipAddress: req.ip,
    });

    // Notification automatique à tous les utilisateurs selon la sévérité
    const severityConfig: Record<string, { title: string; type: string }> = {
      Critique:    { title: '🚨 Incident CRITIQUE détecté',  type: 'incident-critique' },
      Majeur:      { title: '⚠️ Incident Majeur détecté',    type: 'incident-majeur' },
      Mineur:      { title: 'ℹ️ Incident Mineur signalé',    type: 'incident-mineur' },
      Observation: { title: 'ℹ️ Observation signalée',       type: 'incident-observation' },
    };
    const cfg = severityConfig[validatedData.severity] ?? { title: 'Incident qualité signalé', type: 'incident-alert' };
    await createNotification({
      title: cfg.title,
      message: `Lot ${incident.batchNumber} — ${incident.anomalyType}${validatedData.orderId ? ` — Commande : ${validatedData.orderId}` : ''} — Action corrective : ${incident.correctiveAction}`,
      type: cfg.type,
    });

    res.status(201).json({ success: true, message: 'Incident créé avec succès', data: incident });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Données invalides', errors: error.errors });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================================
// MODIFIER UN INCIDENT
// ================================
export const updateIncidentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateSchema.parse(req.body);

    // Lire l'état avant modification
    const before = await getIncidentById(id);
    const incident = await updateIncident(id, validatedData);

    // Construire les changements avec avant → après
    const changes: string[] = [];
    if (validatedData.status && validatedData.status !== before.status)
      changes.push(`Statut : ${before.status} → ${validatedData.status}`);
    if (validatedData.severity && validatedData.severity !== before.severity)
      changes.push(`Sévérité : ${before.severity} → ${validatedData.severity}`);
    if (validatedData.correctiveAction && validatedData.correctiveAction !== before.correctiveAction)
      changes.push(`Action corrective mise à jour`);

    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'UPDATE',
      module: 'incidents',
      description: `Modification incident ${id} — ${changes.join(' | ') || 'mise à jour'}`,
      ipAddress: req.ip,
    });

    // Notification si l'incident passe à Résolu
    if (validatedData.status === 'Résolu' && before.status !== 'Résolu') {
      await createNotification({
        title: '✅ Incident résolu',
        message: `Incident ${id} — Lot ${before.batchNumber} — ${before.anomalyType} — marqué comme résolu.`,
        type: 'incident-resolu',
      });
    }

    res.status(200).json({ success: true, message: 'Incident modifié avec succès', data: incident });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Données invalides', errors: error.errors });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================================
// COMMENTAIRES
// ================================
export const getIncidentComments = async (req: AuthRequest, res: Response) => {
  try {
    const comments = await getComments(req.params['id'] as string);
    res.status(200).json({ success: true, data: comments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addIncidentComment = async (req: AuthRequest, res: Response) => {
  try {
    const incidentId = req.params['id'] as string;
    const { content } = commentSchema.parse(req.body);
    const authorName = `${req.user!.firstName} ${req.user!.lastName}`.trim() || req.user!.email;

    const comment = await addComment({
      incidentId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: authorName,
      content,
    });

    // Notifier tous les autres utilisateurs
    await notifyAllUsersExcept(req.user!.id, {
      title: `💬 Commentaire — Incident ${incidentId}`,
      message: `${authorName} : "${content.length > 100 ? content.substring(0, 97) + '...' : content}"`,
      type: 'incident-comment',
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Données invalides', errors: error.errors });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================================
// STATISTIQUES
// ================================
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getIncidentStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
