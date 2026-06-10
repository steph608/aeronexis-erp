import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllManufacturingOrders,
  getManufacturingOrderById,
  getLotTraceability,
  createManufacturingOrder,
  updateManufacturingOrder,
  getManufacturingStats,
} from '../services/manufacturing.service';
import { logAction } from '../services/audit.service';

// ================================
// VALIDATION
// ================================
const createSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  batchNumber: z.string().min(1),
  quantity: z.coerce.number().min(1),
  launchDate: z.string().transform(str => new Date(str)),
  expectedEndDate: z.string().transform(str => new Date(str)),
  status: z.string().default('Planifié'),
  operatorId: z.number().int().positive().nullable().optional(),
  site: z.string().min(1),
  orderId: z.string().nullable().optional(),
});

const updateSchema = z.object({
  status: z.string().optional(),
  operatorId: z.number().int().positive().nullable().optional(),
  expectedEndDate: z.string().transform(str => new Date(str)).optional(),
  site: z.string().optional(),
});

// ================================
// LISTE TOUS LES OFs
// ================================
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await getAllManufacturingOrders();
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// VOIR UN OF
// ================================
export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await getManufacturingOrderById(
      req.params['id'] as string
    );
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// TRAÇABILITÉ D'UN LOT
// ================================
export const getTraceability = async (req: AuthRequest, res: Response) => {
  try {
    const batchNumber = req.params['batchNumber'] as string;

    // Enregistrer la consultation de traçabilité
    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'VIEW',
      module: 'manufacturing',
      description: `Consultation tracabilite lot ${batchNumber}`,
      ipAddress: req.ip,
    });

    const trace = await getLotTraceability(batchNumber);
    res.status(200).json({
      success: true,
      data: trace,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// CRÉER UN OF
// ================================
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createSchema.parse(req.body);
    const order = await createManufacturingOrder(validatedData);

    // Enregistrer l'action
    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'CREATE',
      module: 'manufacturing',
      description: `Création OF ${order.id} — Lot: ${order.batchNumber} — Produit: ${order.productId} — Site: ${order.site}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Ordre de fabrication créé avec succès',
      data: order,
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
// MODIFIER UN OF
// ================================
export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateSchema.parse(req.body);

    // Lire l'état avant modification
    const before = await getManufacturingOrderById(id);
    const order = await updateManufacturingOrder(id, validatedData);

    // Construire les changements avec avant → après
    const changes: string[] = [];
    if (validatedData.status && validatedData.status !== before.status)
      changes.push(`Statut : ${before.status} → ${validatedData.status}`);
    if (validatedData.operatorId !== undefined) {
      const beforeOp = (before as any).operator
        ? `${(before as any).operator.firstName} ${(before as any).operator.lastName}`
        : 'Non assigné';
      const afterOp = (order as any).operator
        ? `${(order as any).operator.firstName} ${(order as any).operator.lastName}`
        : 'Non assigné';
      if (beforeOp !== afterOp) changes.push(`Opérateur : ${beforeOp} → ${afterOp}`);
    }
    if (validatedData.site && validatedData.site !== before.site)
      changes.push(`Site : ${before.site} → ${validatedData.site}`);

    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'UPDATE',
      module: 'manufacturing',
      description: `Modification OF ${id} — Lot: ${order.batchNumber} — ${changes.join(' | ') || 'mise à jour'}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Ordre de fabrication modifié avec succès',
      data: order,
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
    const stats = await getManufacturingStats();
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