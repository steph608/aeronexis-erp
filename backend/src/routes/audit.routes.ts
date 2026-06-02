import { Router } from 'express';
import { getLogs, getMyLogs } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Mes actions — tous les utilisateurs connectés
router.get('/my', getMyLogs);

// Tous les logs — Admin seulement
router.get('/', authorize('ADMIN'), getLogs);

export default router;