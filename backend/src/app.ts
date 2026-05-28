import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { globalErrorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import scholarshipRoutes from './modules/scholarship/scholarship.routes';
import applicationRoutes from './modules/application/application.routes';
import documentRoutes from './modules/document/document.routes';
import workflowRoutes from './modules/workflow/workflow.routes';
import reportRoutes from './modules/report/report.routes';

// Worker imports
import { startEmailWorker } from './jobs/workers/emailWorker';
import { startReportWorker } from './jobs/workers/reportWorker';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── GLOBAL MIDDLEWARE ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(generalLimiter);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ─── HEALTH CHECK ───────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API ROUTES ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/reports', reportRoutes);

// ─── 404 HANDLER ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// ─── GLOBAL ERROR HANDLER ───────────────────────────────────
app.use(globalErrorHandler);

// ─── START SERVER ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API docs: http://localhost:${PORT}/api/health\n`);

  // Start background workers (non-blocking)
  startEmailWorker();
  startReportWorker();
});

export default app;
