import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  getIncidentStats,
} from '../services/incident.service';
import { logAction } from '../services/audit.service';

// ================================
// VALIDATION
// ================================
const createSchema = z.object({
  id: z.string().min(1),
  detectionDate: z.string().transform(str => new Date(str)),
  batchNumber: z.string().min(1),
  anomalyType: z.string().min(1),
  severity: z.enum(['Critique', 'Moyenne', 'Faible']),
  status: z.string().default('En cours'),
  responsibleId: z.coerce.number().optional(),
  correctiveAction: z.string().min(1),
});

const updateSchema = z.object({
  status: z.string().optional(),
  correctiveAction: z.string().optional(),
  responsibleId: z.coerce.number().optional(),
  severity: z.enum(['Critique', 'Moyenne', 'Faible']).optional(),
});

// ================================
// LISTE TOUS LES INCIDENTS
// ================================
export const getIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const incidents = await getAllIncidents();
    res.status(200).json({
      success: true,
      data: incidents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// VOIR UN INCIDENT
// ================================
export const getIncident = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await getIncidentById(
      req.params['id'] as string
    );
    res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// CRÉER UN INCIDENT
// ================================
export const createIncidentHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const validatedData = createSchema.parse(req.body);
    const incident = await createIncident(validatedData);

    // Enregistrer l'action — critique car signalement d'anomalie
    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'CREATE',
      module: 'incidents',
      description: `Signalement incident ${incident.id} — Lot: ${incident.batchNumber} — Type: ${incident.anomalyType} — Severite: ${incident.severity}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Incident créé avec succès',
      data: incident,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// MODIFIER UN INCIDENT
// ================================
export const updateIncidentHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateSchema.parse(req.body);
    const incident = await updateIncident(id, validatedData);

    // Enregistrer l'action
    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'UPDATE',
      module: 'incidents',
      description: `Modification incident ${id} — Nouveau statut: ${validatedData.status || 'modifié'} — Action corrective: ${validatedData.correctiveAction || 'inchangée'}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Incident modifié avec succès',
      data: incident,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// STATISTIQUES
// ================================
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getIncidentStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};