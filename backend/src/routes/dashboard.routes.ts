import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Dashboard — connecté seulement
router.use(authenticate);

// Dashboard principal
router.get('/',
  authorize('ADMIN', 'DIRECTOR', 'PRODUCTION_MANAGER', 'LOGISTICS_MANAGER', 'SALES_MANAGER'),
  getDashboard
);

export default router;