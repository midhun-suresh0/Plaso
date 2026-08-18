/**
 * Simple logging utility for consistent console output.
 * Wraps console methods with timestamps and labels.
 */
const logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, ...args);
  },

  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]): void => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, ...args);
  },

  success: (message: string, ...args: unknown[]): void => {
    console.log(`[${new Date().toISOString()}] [OK] ${message}`, ...args);
  },
};

export default logger;
