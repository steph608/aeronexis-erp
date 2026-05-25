import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient();

// ================================
// INSCRIPTION D'UN NOUVEL EMPLOYÉ
// ================================
export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: any;
}) => {
  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('Cet email est déjà utilisé');
  }

  // Chiffrer le mot de passe
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Créer l'utilisateur dans la base de données
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || 'OPERATOR',
    },
  });

  return user;
};

// ================================
// CONNEXION D'UN EMPLOYÉ
// ================================
export const loginUser = async (email: string, password: string) => {
  // Chercher l'utilisateur par email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Si l'utilisateur n'existe pas
  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // Si le compte est désactivé
  if (!user.isActive) {
    throw new Error('Ce compte est désactivé');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // Générer le token JWT
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );

  // Retourner le token et les infos de l'utilisateur
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
};

// ================================
// RÉCUPÉRER UN UTILISATEUR PAR ID
// ================================
export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return user;
};