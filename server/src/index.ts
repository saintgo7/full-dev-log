import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import routes from './routes/index.js';
import healthRoutes, { metricsRouter } from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorLogger, setupGlobalErrorHandlers } from './middleware/errorLogger.js';
import { socketManager } from './websocket/socketManager.js';
import { reportScheduler } from './services/scheduler.service.js';
import { logger } from './lib/logger.js';
import { healthChecker } from './services/health.service.js';

// Setup global error handlers early
setupGlobalErrorHandlers();

const app = express();
const PORT = process.env.PORT || 3001;
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3020',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (replaces morgan)
app.use(requestLogger);

// Health check routes (outside /api/v1 for k8s probes)
app.use('/health', healthRoutes);
app.use('/metrics', metricsRouter);

// API routes
app.use('/api/v1', routes);

// Error logging middleware
app.use(errorLogger);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// Initialize WebSocket server
socketManager.initialize(httpServer);

// Start server
httpServer.listen(PORT, async () => {
  logger.info('Server started', {
    port: PORT,
    version: healthChecker.getVersion(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
  logger.info(`API available at http://localhost:${PORT}/api/v1`);
  logger.info('WebSocket server ready');
  logger.info('Health endpoints: /health, /health/ready, /health/live');
  logger.info('Metrics endpoint: /metrics');

  // Initialize report scheduler
  await reportScheduler.initialize();
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  // Stop the inactive agent checker interval
  socketManager.stopInactiveAgentChecker();

  // Stop the report scheduler
  reportScheduler.shutdown();

  // Close HTTP server (stops accepting new connections)
  httpServer.close((err) => {
    if (err) {
      logger.error('Error during server close', err);
      process.exit(1);
    }

    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
export { httpServer, socketManager };
