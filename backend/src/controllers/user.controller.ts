import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../services/user.service';

// ================================
// VALIDATION
// ================================
const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  role: z.enum([
    'ADMIN',
    'DIRECTOR',
    'PRODUCTION_MANAGER',
    'LOGISTICS_MANAGER',
    'SALES_MANAGER',
    'OPERATOR',
  ]).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum([
    'ADMIN',
    'DIRECTOR',
    'PRODUCTION_MANAGER',
    'LOGISTICS_MANAGER',
    'SALES_MANAGER',
    'OPERATOR',
  ]).optional(),
  isActive: z.boolean().optional(),
});

// ================================
// LISTE TOUS LES UTILISATEURS
// ================================
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// VOIR UN UTILISATEUR
// ================================
export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const user = await getUserById(id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// CRÉER UN UTILISATEUR
// ================================
export const createUserHandler = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const user = await createUser(validatedData);
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: user,
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
// MODIFIER UN UTILISATEUR
// ================================
export const updateUserHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const validatedData = updateUserSchema.parse(req.body);
    const user = await updateUser(id, validatedData);
    res.status(200).json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      data: user,
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
// SUPPRIMER UN UTILISATEUR
// ================================
export const deleteUserHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);

    // Empêcher de se supprimer soi-même
    if (req.user!.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
      });
    }

    const result = await deleteUser(id);
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