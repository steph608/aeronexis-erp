import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllMaterials,
  getMaterialById,
  getLowStockAlerts,
  updateMaterial,
  reserveStock,
  getStockStats,
} from '../services/material.service';
import { logAction } from '../services/audit.service';

// ================================
// VALIDATION
// ================================
const updateMaterialSchema = z.object({
  currentStock: z.coerce.number().min(0).optional(),
  reservedStock: z.coerce.number().min(0).optional(),
  minimumStock: z.coerce.number().min(0).optional(),
  supplier: z.string().optional(),
}).passthrough();

const reserveStockSchema = z.object({
  quantity: z.number().min(1, 'Quantité minimum 1'),
});

// ================================
// LISTE TOUT LE STOCK
// ================================
export const getMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const materials = await getAllMaterials();
    res.status(200).json({
      success: true,
      data: materials,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// VOIR UNE MATIÈRE
// ================================
export const getMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const material = await getMaterialById(req.params['id'] as string);
    res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// ALERTES RUPTURE
// ================================
export const getAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await getLowStockAlerts();
    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// METTRE À JOUR LE STOCK
// ================================
export const updateMaterialHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateMaterialSchema.parse(req.body);
    const material = await updateMaterial(id, validatedData);

    // Enregistrer l'action
    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'UPDATE',
      module: 'materials',
      description: `Mise a jour stock ${id} — ${material.description} — Nouveau stock: ${material.currentStock} ${material.unit}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Stock mis à jour avec succès',
      data: material,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
        body: req.body,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// RÉSERVER DU STOCK
// ================================
export const reserveStockHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = reserveStockSchema.parse(req.body);
    const material = await reserveStock(id, validatedData.quantity);

    // Enregistrer l'action
    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'RESERVE',
      module: 'materials',
      description: `Reservation stock ${id} — ${material.description} — Quantite: ${validatedData.quantity} ${material.unit} — Stock reserve total: ${material.reservedStock} ${material.unit}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Stock réservé avec succès',
      data: material,
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
    const stats = await getStockStats();
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