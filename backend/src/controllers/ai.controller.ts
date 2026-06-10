import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  analyzeDelayedOrders,
  predictStockShortages,
  analyzeQualityIncidents,
  analyzeMargins,
  getQuickSummary,
  generateFullReport,
} from '../services/ai.service';
import { chatWithAI, getAISuggestions, analyzeWithAI } from '../services/openai.service';

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
// MARGES PAR PRODUIT
// ================================
export const getMarginsAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    res.status(200).json({ success: true, data: await analyzeMargins() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// RÉSUMÉ RAPIDE
// ================================
export const getQuickSummaryHandler = async (req: AuthRequest, res: Response) => {
  try {
    res.status(200).json({ success: true, data: await getQuickSummary() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// RAPPORT COMPLET
// ================================
export const getFullReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await generateFullReport();
    res.status(200).json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// CHAT IA (OpenAI)
// ================================
export const chatHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages requis' });
    }
    const reply = await chatWithAI(messages);
    res.status(200).json({ success: true, data: { reply } });
  } catch (error: any) {
    const isLimit = error?.status === 429 || error?.message?.includes('rate_limit') || error?.message?.includes('quota');
    const msg = isLimit
      ? 'Limite Groq atteinte — réessayez dans quelques secondes (limite gratuite : 30 req/min)'
      : error.message;
    res.status(500).json({ success: false, message: msg });
  }
};

// ================================
// SUGGESTIONS PROACTIVES (OpenAI)
// ================================
export const suggestionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const suggestions = await getAISuggestions();
    res.status(200).json({ success: true, data: suggestions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================================
// ANALYSE IA PAR TYPE (OpenAI)
// ================================
export const aiAnalyzeHandler = async (req: AuthRequest, res: Response) => {
  try {
    const type = req.params['type'] as 'delays' | 'quality' | 'stock' | 'margins' | 'report';
    const allowed = ['delays', 'quality', 'stock', 'margins', 'report'];
    if (!allowed.includes(type)) {
      return res.status(400).json({ success: false, message: 'Type invalide' });
    }
    const result = await analyzeWithAI(type);
    res.status(200).json({ success: true, data: { analysis: result } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};