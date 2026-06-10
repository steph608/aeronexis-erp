import { Router } from 'express';
import {
  getDelayAnalysis,
  getStockPrediction,
  getQualityAnalysis,
  getMarginsAnalysis,
  getQuickSummaryHandler,
  getFullReport,
  chatHandler,
  suggestionsHandler,
  aiAnalyzeHandler,
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

// Marges par produit
router.get('/margins',
  authorize('ADMIN', 'DIRECTOR', 'SALES_MANAGER'),
  getMarginsAnalysis
);

// Résumé rapide (KPIs)
router.get('/summary',
  getQuickSummaryHandler
);

// Rapport complet
router.get('/report',
  authorize('ADMIN', 'DIRECTOR'),
  getFullReport
);

// Chat IA conversationnel
router.post('/chat', chatHandler);

// Suggestions proactives
router.get('/suggestions', suggestionsHandler);

// Analyse IA par type (GPT)
router.get('/analyze/:type', aiAnalyzeHandler);

export default router;