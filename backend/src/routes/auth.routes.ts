import { Router } from 'express';
import { login, register, getMe, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Route publique — pas besoin d'être connecté
router.post('/register', register);
router.post('/login', login);

// Routes protégées — il faut être connecté
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;