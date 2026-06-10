import { Router } from 'express';
import {
  getNotifications,
  getUnread,
  markRead,
  markAllRead,
  updateNote,
  checkStockAlerts,
  getStockAlerts,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/',           getNotifications);
router.get('/unread',     getUnread);
router.get('/stock',      getStockAlerts);
router.post('/check-stock', checkStockAlerts);
router.put('/read-all',   markAllRead);
router.put('/:id/read',   markRead);
router.patch('/:id/note', updateNote);

export default router;
