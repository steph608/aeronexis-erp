import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
} from '../services/product.service';

// ================================
// VALIDATION
// ================================
const createSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1, 'Description requise'),
  category: z.string().min(1, 'Catégorie requise'),
  unitPrice: z.coerce.number().min(0),
  manufacturingTimeH: z.coerce.number().min(0),
  weightKg: z.coerce.number().min(0),
  certification: z.string().min(1, 'Certification requise'),
});

const updateSchema = z.object({
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  manufacturingTimeH: z.coerce.number().min(0).optional(),
  weightKg: z.coerce.number().min(0).optional(),
  certification: z.string().min(1).optional(),
});

// ================================
// LISTE TOUS LES PRODUITS
// ================================
export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await getAllProducts();
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// VOIR UN PRODUIT
// ================================
export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await getProductById(
      req.params['id'] as string
    );
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// CRÉER UN PRODUIT
// ================================
export const createProductHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const validatedData = createSchema.parse(req.body);
    const product = await createProduct(validatedData);
    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: product,
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
// MODIFIER UN PRODUIT
// ================================
export const updateProductHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = req.params['id'] as string;
    const validatedData = updateSchema.parse(req.body);
    const product = await updateProduct(id, validatedData);
    res.status(200).json({
      success: true,
      message: 'Produit modifié avec succès',
      data: product,
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
// SUPPRIMER UN PRODUIT
// ================================
export const deleteProductHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const id = req.params['id'] as string;
    const result = await deleteProduct(id);
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
    const stats = await getProductStats();
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