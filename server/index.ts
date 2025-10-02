import express, { type Request, Response, NextFunction } from "express";
import pinoHttp from "pino-http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger, createLogger } from "./logger";
import { startResourceMonitoring } from "./monitoring";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use pino-http for automatic request logging
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => {
      // Only log API routes, skip static assets and websocket upgrades
      return !req.url?.startsWith('/api');
    }
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent']
      }
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
}));

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error with pino
    logger.error({
      err,
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers
      },
      statusCode: status
    }, `Error handling request: ${message}`);

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // WebSocket removed - using polling instead

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3005', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);

    // Start resource monitoring (every 5 minutes in production, 15 in dev)
    const monitoringInterval = process.env.NODE_ENV === 'production' ? 5 : 15;
    startResourceMonitoring(monitoringInterval);
  });
})();
