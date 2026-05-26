import { Router } from 'express';
import {
  getIncidents,
  getIncident,
  createIncidentHandler,
  updateIncidentHandler,
  getStats,
} from '../controllers/incident.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// Statistiques
router.get('/stats', getStats);

// Liste tous les incidents
router.get('/', getIncidents);

// Voir un incident
router.get('/:id', getIncident);

// Créer un incident — tous les rôles connectés peuvent signaler
router.post('/', createIncidentHandler);

// Modifier un incident — Production Manager et Admin
router.put('/:id',
  authorize('ADMIN', 'PRODUCTION_MANAGER'),
  updateIncidentHandler
);

export default router;