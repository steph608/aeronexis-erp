import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  analyzeDelayedOrders,
  predictStockShortages,
  analyzeQualityIncidents,
  generateFullReport,
} from '../services/ai.service';

// ================================
// ANALYSE DES RETARDS
// ================================
export const getDelayAnalysis = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const analysis = await analyzeDelayedOrders();
    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// PRÉDICTION STOCK
// ================================
export const getStockPrediction = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const prediction = await predictStockShortages();
    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// ANALYSE QUALITÉ
// ================================
export const getQualityAnalysis = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const analysis = await analyzeQualityIncidents();
    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// RAPPORT COMPLET
// ================================
export const getFullReport = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const report = await generateFullReport();
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};