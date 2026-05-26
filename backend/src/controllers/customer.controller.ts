import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
} from '../services/customer.service';

// ================================
// VALIDATION
// ================================
const createSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nom requis'),
  country: z.string().min(1, 'Pays requis'),
  type: z.enum(['Grand Compte', 'Moyen', 'PME']),
  annualRevenue: z.coerce.number().min(0),
  firstContractDate: z.string().transform(str => new Date(str)),
  status: z.string().default('Actif'),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  type: z.enum(['Grand Compte', 'Moyen', 'PME']).optional(),
  annualRevenue: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
});

// ================================
// LISTE TOUS LES CLIENTS
// ================================
export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const customers = await getAllCustomers();
    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// VOIR UN CLIENT
// ================================
export const getCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const customer = await getCustomerById(
      req.params['id'] as string
    );
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// CRÉER UN CLIENT
// ================================
export const createCustomerHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const validatedData = createSchema.parse(req.body);
    const customer = await createCustomer(validatedData);
    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: customer,
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
// MODIFIER UN CLIENT
// ================================
export const updateCustomerHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateSchema.parse(req.body);
    const customer = await updateCustomer(id, validatedData);
    res.status(200).json({
      success: true,
      message: 'Client modifié avec succès',
      data: customer,
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
// SUPPRIMER UN CLIENT
// ================================
export const deleteCustomerHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = req.params['id'] as string;
    const result = await deleteCustomer(id);
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
// STATISTIQUES
// ================================
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getCustomerStats();
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