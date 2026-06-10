import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { loginUser, registerUser, getUserById } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { logAction } from '../services/audit.service';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ================================
// VALIDATION DES DONNÉES
// ================================
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

const registerSchema = z.object({
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

// ================================
// CONNEXION
// ================================
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await loginUser(
      validatedData.email,
      validatedData.password
    );

    // Enregistrer la connexion
    await logAction({
      userId: result.user.id,
      userEmail: result.user.email,
      action: 'LOGIN',
      module: 'auth',
      description: `Connexion de ${result.user.firstName} ${result.user.lastName}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
        received: req.body,
      });
    }
    res.status(401).json({
      success: false,
      message: error.message || 'Erreur de connexion',
    });
  }
};

// ================================
// INSCRIPTION
// ================================
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await registerUser(validatedData);

    // Enregistrer la création du compte
    await logAction({
      userEmail: user.email,
      action: 'REGISTER',
      module: 'auth',
      description: `Nouveau compte créé : ${user.firstName} ${user.lastName} (${user.role})`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
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
      message: error.message || 'Erreur lors de la création du compte',
    });
  }
};

// ================================
// MON PROFIL
// ================================
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.user!.id);
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
// MODIFIER PROFIL
// ================================
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName } = z.object({
      firstName: z.string().min(1),
      lastName:  z.string(),
    }).parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { firstName, lastName },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    await logAction({
      userId: req.user!.id, userEmail: req.user!.email,
      action: 'UPDATE', module: 'auth',
      description: `Profil mis à jour : ${firstName} ${lastName}`,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, data: { ...updated, site: (req.user as any).site ?? 'Site Toulouse' } });
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ success: false, message: 'Données invalides' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// CHANGER MOT DE PASSE
// ================================
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword:     z.string().min(6, 'Minimum 6 caractères'),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashed } });

    await logAction({
      userId: req.user!.id, userEmail: req.user!.email,
      action: 'UPDATE', module: 'auth',
      description: 'Mot de passe modifié',
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ success: false, message: error.errors[0]?.message || 'Données invalides' });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// DÉCONNEXION
// ================================
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // Enregistrer la déconnexion
    await logAction({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'LOGOUT',
      module: 'auth',
      description: `Déconnexion de ${req.user?.email}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};