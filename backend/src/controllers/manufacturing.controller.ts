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
  operatorId: z.coerce.number().optional(),
  site: z.string().min(1),
});

const updateSchema = z.object({
  status: z.string().optional(),
  operatorId: z.coerce.number().optional(),
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
    const order = await updateManufacturingOrder(id, validatedData);
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