import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllNotifications,
  getUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  updateNotificationNote,
  checkAndCreateStockAlertNotifications,
  getStockAlertNotifications,
} from '../services/notification.service';
import { logAction } from '../services/audit.service';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await getAllNotifications(req.user!.id);
    res.status(200).json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnread = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await getUnreadNotifications(req.user!.id);
    res.status(200).json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    await markNotificationRead(Number(req.params['id']), req.user!.id);
    res.status(200).json({ success: true, message: 'Notification marquÃ©e comme lue' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await markAllNotificationsRead(req.user!.id);
    res.status(200).json({ success: true, message: 'Toutes les notifications marquÃ©es comme lues' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// â”€â”€ Note sur une alerte â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const id   = Number(req.params['id']);
    const note = req.body?.note ?? '';
    const notif = await updateNotificationNote(id, note);

    await logAction({
      userId:    req.user!.id,
      userEmail: req.user!.email,
      action:    'UPDATE',
      module:    'materials',
      description: `Commentaire alerte stock â€” ${(notif as any).title ?? `#${id}`} : "${note.substring(0, 120)}"`,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, data: notif });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// â”€â”€ DÃ©clenche la vÃ©rification des ruptures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const checkStockAlerts = async (_req: AuthRequest, res: Response) => {
  try {
    const count = await checkAndCreateStockAlertNotifications();
    res.status(200).json({ success: true, alertsCreated: count });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// â”€â”€ Liste des alertes stock actives â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getStockAlerts = async (_req: AuthRequest, res: Response) => {
  try {
    const alerts = await getStockAlertNotifications();
    res.status(200).json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
