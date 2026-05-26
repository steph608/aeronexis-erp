import { Router } from 'express';
import {
  getDelayAnalysis,
  getStockPrediction,
  getQualityAnalysis,
  getFullReport,
} from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// Analyse des retards
router.get('/delays',
  authorize('ADMIN', 'DIRECTOR', 'SALES_MANAGER'),
  getDelayAnalysis
);

// Prédiction stock
router.get('/stock',
  authorize('ADMIN', 'DIRECTOR', 'LOGISTICS_MANAGER'),
  getStockPrediction
);

// Analyse qualité
router.get('/quality',
  authorize('ADMIN', 'DIRECTOR', 'PRODUCTION_MANAGER'),
  getQualityAnalysis
);

// Rapport complet
router.get('/report',
  authorize('ADMIN', 'DIRECTOR'),
  getFullReport
);

export default router;