import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  getShipmentStats,
} from '../services/shipment.service';
import { logAction } from '../services/audit.service';

const createShipmentSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  orderId: z.string().min(1, 'Commande requise'),
  destination: z.string().min(1, 'Destination requise'),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  scheduledDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
});

const updateShipmentSchema = z.object({
  status: z.enum(['Ã€ envoyer', 'PlanifiÃ©e', 'En transit', 'En cours', 'EnvoyÃ©', 'ReÃ§u', 'LivrÃ©e', 'AnnulÃ©e']).optional(),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  actualDate: z.string().transform(str => new Date(str)).optional(),
  notes: z.string().optional(),
});

export const getShipments = async (req: AuthRequest, res: Response) => {
  try {
    const shipments = await getAllShipments();
    res.status(200).json({ success: true, data: shipments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getShipment = async (req: AuthRequest, res: Response) => {
  try {
    const shipment = await getShipmentById(req.params['id'] as string);
    res.status(200).json({ success: true, data: shipment });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createShipmentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createShipmentSchema.parse(req.body);
    const shipment = await createShipment({ ...validatedData, createdById: req.user!.id });

    const fmt = (d: Date) => new Date(d).toLocaleDateString('fr-FR');
    await logAction({
      userId:    req.user!.id,
      userEmail: req.user!.email,
      action:    'CREATE',
      module:    'shipments',
      description: `Nouvelle expÃ©dition ${shipment.id} â€” Commande : ${shipment.orderId} â€” Destination : ${shipment.destination}${shipment.carrier ? ` â€” Transporteur : ${shipment.carrier}` : ''} â€” PrÃ©vu le ${fmt(shipment.scheduledDate)}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'ExpÃ©dition crÃ©Ã©e avec succÃ¨s', data: shipment });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'DonnÃ©es invalides', errors: error.errors });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateShipmentHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateShipmentSchema.parse(req.body);

    // Charger l'Ã©tat AVANT modification
    const before   = await getShipmentById(id);
    const shipment = await updateShipment(id, validatedData);

    const changes: string[] = [];
    if (validatedData.status && validatedData.status !== before.status)
      changes.push(`Statut : ${before.status} â†’ ${validatedData.status}`);
    if (validatedData.carrier && validatedData.carrier !== before.carrier)
      changes.push(`Transporteur : ${before.carrier ?? 'â€”'} â†’ ${validatedData.carrier}`);
    if (validatedData.trackingNumber && validatedData.trackingNumber !== before.trackingNumber)
      changes.push(`NÂ° suivi : ${validatedData.trackingNumber}`);
    if (validatedData.actualDate)
      changes.push(`Date livraison effective enregistrÃ©e`);

    await logAction({
      userId:    req.user!.id,
      userEmail: req.user!.email,
      action:    'UPDATE',
      module:    'shipments',
      description: `ExpÃ©dition ${id} (Commande : ${before.orderId} â†’ ${before.destination}) â€” ${changes.length ? changes.join(' | ') : 'ModifiÃ©e'}`,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'ExpÃ©dition modifiÃ©e avec succÃ¨s', data: shipment });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'DonnÃ©es invalides', errors: error.errors });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getShipmentStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
