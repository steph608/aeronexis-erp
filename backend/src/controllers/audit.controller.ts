import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getAllLogs, getUserLogs } from '../services/audit.service';

// ================================
// LISTE TOUS LES LOGS
// ================================
export const getLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await getAllLogs();
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// LOGS D'UN UTILISATEUR
// ================================
export const getMyLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await getUserLogs(req.user!.id);
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};