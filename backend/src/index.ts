import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';  // ← ajouter
import orderRoutes from './routes/order.routes';
import materialRoutes from './routes/material.routes';
import manufacturingRoutes from './routes/manufacturing.routes';
import incidentRoutes from './routes/incident.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import dashboardRoutes from './routes/dashboard.routes';
import aiRoutes from './routes/ai.routes';
import auditRoutes from './routes/audit.routes';
import shipmentRoutes from './routes/shipment.routes';
import notificationRoutes from './routes/notification.routes';
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
app.use('/api/audit', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/notifications', notificationRoutes);
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