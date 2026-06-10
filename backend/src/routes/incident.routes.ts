import { Router } from 'express';
import {
  getIncidents,
  getIncident,
  createIncidentHandler,
  updateIncidentHandler,
  getStats,
  getIncidentComments,
  addIncidentComment,
} from '../controllers/incident.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/', getIncidents);
router.get('/:id', getIncident);
router.post('/', createIncidentHandler);
router.put('/:id', authorize('ADMIN', 'PRODUCTION_MANAGER'), updateIncidentHandler);

// Commentaires
router.get('/:id/comments', getIncidentComments);
router.post('/:id/comments', addIncidentComment);

export default router;
