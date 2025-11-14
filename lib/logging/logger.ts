/**
 * Centralized Logging System
 *
 * Production-ready logging with structured logs
 */

/**
 * Log level
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
  batchSize: number;
  flushInterval: number;
}

/**
 * Logger instance
 */
export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private userId: string | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: "info",
      enableConsole: true,
      enableRemote: false,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, any>, context?: string) {
    this.log("debug", message, data, context);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, any>, context?: string) {
    this.log("info", message, data, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, any>, context?: string) {
    this.log("warn", message, data, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | Record<string, any>, context?: string) {
    const data: Record<string, any> = {};
    let errorObj: LogEntry["error"] = undefined;

    if (error instanceof Error) {
      errorObj = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (typeof error === "object") {
      Object.assign(data, error);
    }

    this.log("error", message, data, context);

    if (errorObj) {
      this.logBuffer[this.logBuffer.length - 1].error = errorObj;
    }
  }

  /**
   * Log fatal error
   */
  fatal(message: string, error?: Error | Record<string, any>, context?: string) {
    this.error(message, error, context);
    const lastLog = this.logBuffer[this.logBuffer.length - 1];
    if (lastLog) {
      lastLog.level = "fatal";
    }
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    context?: string
  ) {
    const levelOrder = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
    if (levelOrder[level] < levelOrder[this.config.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    };

    this.logBuffer.push(entry);

    // Log to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Flush if buffer is full
    if (this.logBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    const args: any[] = [prefix, entry.message];

    if (entry.context) {
      args.push(`(${entry.context})`);
    }

    if (entry.data && Object.keys(entry.data).length > 0) {
      args.push(entry.data);
    }

    if (entry.error) {
      args.push(entry.error);
    }

    switch (entry.level) {
      case "debug":
        console.debug(...args);
        break;
      case "info":
        console.log(...args);
        break;
      case "warn":
        console.warn(...args);
        break;
      case "error":
      case "fatal":
        console.error(...args);
        break;
    }
  }

  /**
   * Flush logs to remote server
   */
  private async flush() {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = this.logBuffer.splice(0, this.config.batchSize);

    if (this.config.enableRemote && this.config.remoteUrl) {
      try {
        await fetch(this.config.remoteUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logs: logsToSend,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("Failed to send logs to remote server:", error);
        // Re-add logs to buffer on failure
        this.logBuffer.unshift(...logsToSend);
      }
    }
  }

  /**
   * Flush all pending logs
   */
  async flushAll() {
    while (this.logBuffer.length > 0) {
      await this.flush();
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer() {
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  /**
   * Stop automatic flush timer
   */
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Set user ID for log context
   */
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy logger
   */
  destroy() {
    this.stopFlushTimer();
  }
}

/**
 * Global logger instance
 */
let globalLogger: Logger | null = null;

/**
 * Get global logger instance
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger({
      minLevel: process.env.LOG_LEVEL as LogLevel || "info",
      enableConsole: process.env.NODE_ENV !== "production",
      enableRemote: process.env.ENABLE_REMOTE_LOGGING === "true",
      remoteUrl: process.env.LOG_REMOTE_URL,
    });
  }
  return globalLogger;
}

/**
 * Initialize global logger
 */
export function initializeLogger(config: Partial<LoggerConfig>) {
  globalLogger = new Logger(config);
  return globalLogger;
}

/**
 * Log shortcuts
 */
export const log = {
  debug: (message: string, data?: Record<string, any>, context?: string) =>
    getLogger().debug(message, data, context),
  info: (message: string, data?: Record<string, any>, context?: string) =>
    getLogger().info(message, data, context),
  warn: (message: string, data?: Record<string, any>, context?: string) =>
    getLogger().warn(message, data, context),
  error: (message: string, error?: Error | Record<string, any>, context?: string) =>
    getLogger().error(message, error, context),
  fatal: (message: string, error?: Error | Record<string, any>, context?: string) =>
    getLogger().fatal(message, error, context),
};
