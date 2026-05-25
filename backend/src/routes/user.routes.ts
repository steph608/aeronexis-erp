import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes utilisateurs nécessitent d'être connecté
router.use(authenticate);

// Voir tous les utilisateurs — tous les rôles connectés
router.get('/', getUsers);

// Voir un utilisateur — tous les rôles connectés
router.get('/:id', getUser);

// Créer un utilisateur — ADMIN seulement
router.post('/', authorize('ADMIN'), createUserHandler);

// Modifier un utilisateur — ADMIN seulement
router.put('/:id', authorize('ADMIN'), updateUserHandler);

// Supprimer un utilisateur — ADMIN seulement
router.delete('/:id', authorize('ADMIN'), deleteUserHandler);

export default router;