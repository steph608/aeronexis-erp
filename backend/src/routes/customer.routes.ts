import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomerHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
  getStats,
} from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// Statistiques
router.get('/stats', getStats);

// Liste tous les clients
router.get('/', getCustomers);

// Voir un client
router.get('/:id', getCustomer);

// Créer un client — Sales Manager et Admin
router.post('/',
  authorize('ADMIN', 'SALES_MANAGER'),
  createCustomerHandler
);

// Modifier un client — Sales Manager et Admin
router.put('/:id',
  authorize('ADMIN', 'SALES_MANAGER'),
  updateCustomerHandler
);

// Supprimer un client — Admin seulement
router.delete('/:id',
  authorize('ADMIN'),
  deleteCustomerHandler
);

export default router;