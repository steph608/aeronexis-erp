import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ================================
// LISTE TOUS LES UTILISATEURS
// ================================
export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ================================
// VOIR UN UTILISATEUR
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

  if (!user) throw new Error('Utilisateur non trouvé');
  return user;
};

// ================================
// CRÉER UN UTILISATEUR
// ================================
export const createUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: any;
}) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) throw new Error('Cet email est déjà utilisé');

  const hashedPassword = await bcrypt.hash(data.password, 12);

  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || 'OPERATOR',
    },
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
};

// ================================
// MODIFIER UN UTILISATEUR
// ================================
export const updateUser = async (id: number, data: {
  firstName?: string;
  lastName?: string;
  role?: any;
  isActive?: boolean;
}) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Utilisateur non trouvé');

  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });
};

// ================================
// SUPPRIMER UN UTILISATEUR
// ================================
export const deleteUser = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Utilisateur non trouvé');

  await prisma.user.delete({ where: { id } });
  return { message: 'Utilisateur supprimé avec succès' };
};