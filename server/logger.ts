import pino from 'pino';
import { join } from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';

// Configure Pino logger with rotation
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // In production, write JSON logs
  // In development, use pretty printing via transport
  ...(isDevelopment ? {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
      }
    }
  } : {
    // Production: JSON logs to stdout (journald will capture)
    // OR to file with rotation if LOG_FILE env var is set
    ...(process.env.LOG_FILE ? {
      transport: {
        targets: [
          {
            target: 'pino/file',
            options: {
              destination: process.env.LOG_FILE,
              mkdir: true,
            },
            level: 'info'
          },
          // Also log errors to stderr for journald
          {
            target: 'pino/file',
            options: { destination: 2 }, // stderr
            level: 'error'
          }
        ]
      }
    } : {})
  })
});

// Child loggers for different parts of the app
export const createLogger = (name: string) => {
  return logger.child({ module: name });
};

// Resource monitoring logger
export const resourceLogger = createLogger('resources');
