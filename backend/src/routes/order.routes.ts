import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrderHandler,
  updateOrderHandler,
  deleteOrderHandler,
  getStats,
} from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// Statistiques
router.get('/stats', getStats);

// Voir toutes les commandes
router.get('/', getOrders);

// Voir une commande
router.get('/:id', getOrder);

// Créer une commande — Sales Manager et Admin
router.post('/',
  authorize('ADMIN', 'SALES_MANAGER'),
  createOrderHandler
);

// Modifier une commande — Sales Manager et Admin
router.put('/:id',
  authorize('ADMIN', 'SALES_MANAGER'),
  updateOrderHandler
);

// Supprimer une commande — Admin seulement
router.delete('/:id',
  authorize('ADMIN'),
  deleteOrderHandler
);

export default router;