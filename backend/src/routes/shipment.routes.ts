import { Router } from 'express';
import {
  getShipments,
  getShipment,
  createShipmentHandler,
  updateShipmentHandler,
  getStats,
} from '../controllers/shipment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/', getShipments);
router.get('/:id', getShipment);

router.post('/',
  authorize('ADMIN', 'LOGISTICS_MANAGER'),
  createShipmentHandler
);

router.put('/:id',
  authorize('ADMIN', 'LOGISTICS_MANAGER'),
  updateShipmentHandler
);

export default router;
