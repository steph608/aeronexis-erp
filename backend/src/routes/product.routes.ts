import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  getStats,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// Statistiques
router.get('/stats', getStats);

// Liste tous les produits
router.get('/', getProducts);

// Voir un produit
router.get('/:id', getProduct);

// Créer un produit — Production Manager et Admin
router.post('/',
  authorize('ADMIN', 'PRODUCTION_MANAGER'),
  createProductHandler
);

// Modifier un produit — Production Manager et Admin
router.put('/:id',
  authorize('ADMIN', 'PRODUCTION_MANAGER'),
  updateProductHandler
);

// Supprimer un produit — Admin seulement
router.delete('/:id',
  authorize('ADMIN'),
  deleteProductHandler
);

export default router;