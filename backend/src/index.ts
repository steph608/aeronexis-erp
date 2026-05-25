import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';

// Créer l'application Express
const app = express();

// ==================
// MIDDLEWARE DE BASE
// ==================

// Sécurité des en-têtes HTTP
app.use(helmet());

// Autoriser le frontend à communiquer avec le backend
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Lire le JSON dans les requêtes
app.use(express.json());

// Logs des requêtes dans le terminal
app.use(morgan('dev'));

// ==================
// ROUTES DE BASE
// ==================

// Route de test — pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AERONEXIS ERP API',
    version: '1.0.0',
    status: 'running',
  });
});

// Route de santé — utilisée par Docker et les outils de monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ==================
// DÉMARRER LE SERVEUR
// ==================
app.listen(env.PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${env.PORT}`);
  console.log(`🌍 Environnement : ${env.NODE_ENV}`);
});

export default app;