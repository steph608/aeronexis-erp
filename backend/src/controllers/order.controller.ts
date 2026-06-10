import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderStats,
  getManufacturingOrdersForOrder,
} from '../services/order.service';
import { logAction } from '../services/audit.service';

// ================================
// VALIDATION
// ================================
const createOrderSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  customerId: z.string().min(1, 'Client requis'),
  orderDate: z.string().transform(str => new Date(str)),
  expectedDeliveryDate: z.string().transform(str => new Date(str)),
  status: z.string().default('Planifiée'),
  totalAmount: z.number().min(0),
  priority: z.enum(['Normale', 'Haute', 'Urgente', 'Standard', 'Basse']),
  salesManager: z.string().min(1),
  orderLines: z.array(z.object({
    id: z.string(),
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    lineAmount: z.number().min(0),
    lineStatus: z.string().default('Planifiée'),
  })).optional(),
});

const updateOrderSchema = z.object({
  status: z.string().optional(),
  priority: z.enum(['Normale', 'Haute', 'Urgente', 'Standard', 'Basse']).optional(),
  expectedDeliveryDate: z.string().transform(str => new Date(str)).optional(),
  totalAmount: z.number().min(0).optional(),
});

// ================================
// LISTE TOUTES LES COMMANDES
// ================================
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await getAllOrders();
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
// VOIR UNE COMMANDE
// ================================
export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await getOrderById(req.params['id'] as string);
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
// CRÉER UNE COMMANDE
// ================================
export const createOrderHandler = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const order = await createOrder(validatedData);

    // Enregistrer l'action
    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'CREATE',
      module: 'orders',
      description: `Création commande ${order.id} — Client: ${order.customerId} — Montant: ${order.totalAmount}€`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
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
// MODIFIER UNE COMMANDE
// ================================
export const updateOrderHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateOrderSchema.parse(req.body);
    const order = await updateOrder(id, validatedData);

    // Enregistrer l'action
    const changes: string[] = [];
    if (validatedData.status)   changes.push(`Statut → ${validatedData.status}`);
    if (validatedData.priority) changes.push(`Priorité → ${validatedData.priority}`);
    if (validatedData.totalAmount !== undefined) changes.push(`Montant → ${validatedData.totalAmount.toLocaleString('fr-FR')} €`);
    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'UPDATE',
      module: 'orders',
      description: `Modification commande ${id} — ${changes.join(' | ') || 'mise à jour'}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Commande modifiée avec succès',
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
// SUPPRIMER UNE COMMANDE
// ================================
export const deleteOrderHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const result = await deleteOrder(id);

    // Enregistrer l'action
    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'DELETE',
      module: 'orders',
      description: `Suppression commande ${id}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// OFs LIÉS À UNE COMMANDE
// ================================
export const getOrderManufacturing = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const ofs = await getManufacturingOrdersForOrder(id);
    res.status(200).json({ success: true, data: ofs });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// ================================
// STATISTIQUES
// ================================
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getOrderStats();
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