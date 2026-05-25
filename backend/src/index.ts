import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';  // ← ajouter

const app = express();

// ==================
// MIDDLEWARE DE BASE
// ==================
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// ==================
// ROUTES
// ==================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);  // ← ajouter

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AERONEXIS ERP API',
    version: '1.0.0',
    status: 'running',
  });
});

// Route de santé
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