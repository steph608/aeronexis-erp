import { Router } from 'express';
import {
  getMaterials,
  getMaterial,
  getAlerts,
  updateMaterialHandler,
  reserveStockHandler,
  getStats,
} from '../controllers/material.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// Statistiques stock
router.get('/stats', getStats);

// Alertes rupture de stock
router.get('/alerts', getAlerts);

// Liste tout le stock
router.get('/', getMaterials);

// Voir une matière
router.get('/:id', getMaterial);

// Mettre à jour le stock — Logistics Manager et Admin
router.put('/:id',
  authorize('ADMIN', 'LOGISTICS_MANAGER'),
  updateMaterialHandler
);

// Réserver du stock — Logistics Manager et Admin
router.post('/:id/reserve',
  authorize('ADMIN', 'LOGISTICS_MANAGER'),
  reserveStockHandler
);

export default router;