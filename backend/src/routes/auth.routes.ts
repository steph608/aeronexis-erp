import { Router } from 'express';
import { login, register, getMe, logout, updateProfile, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.patch('/profile', authenticate, updateProfile);
router.patch('/password', authenticate, changePassword);

export default router;