import { Router } from 'express';
import {
  getOrders,
  getOrder,
  getTraceability,
  createOrder,
  updateOrder,
  getStats,
} from '../controllers/manufacturing.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// Statistiques
router.get('/stats', getStats);

// Traçabilité d'un lot — très important pour AERONEXIS !
router.get('/traceability/:batchNumber', getTraceability);

// Liste tous les OFs
router.get('/', getOrders);

// Voir un OF
router.get('/:id', getOrder);

// Créer un OF — Production Manager et Admin
router.post('/',
  authorize('ADMIN', 'PRODUCTION_MANAGER'),
  createOrder
);

// Modifier un OF — Production Manager et Admin
router.put('/:id',
  authorize('ADMIN', 'PRODUCTION_MANAGER'),
  updateOrder
);

export default router;