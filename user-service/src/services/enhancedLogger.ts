import { getMessageBrokerService, LogMessage } from "./messageBrokerService";

/**
 * Enhanced Logger with Message Broker Integration
 * Combines traditional file/console logging with async message broker
 */
export class EnhancedLogger {
  private serviceName: string;
  private messageBroker = getMessageBrokerService();

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Log error message
   */
  async error(message: string, error?: Error, metadata?: any): Promise<void> {
    const logMessage = this.createLogMessage("error", message, metadata, error);

    // Console logging for immediate feedback
    console.error(`[${this.serviceName}] ERROR:`, message, error);

    // Async message broker logging
    await this.messageBroker.publishLog(logMessage);
  }

  /**
   * Log warning message
   */
  async warn(message: string, metadata?: any): Promise<void> {
    const logMessage = this.createLogMessage("warn", message, metadata);

    console.warn(`[${this.serviceName}] WARN:`, message);
    await this.messageBroker.publishLog(logMessage);
  }

  /**
   * Log info message
   */
  async info(message: string, metadata?: any): Promise<void> {
    const logMessage = this.createLogMessage("info", message, metadata);

    console.info(`[${this.serviceName}] INFO:`, message);
    await this.messageBroker.publishLog(logMessage);
  }

  /**
   * Log debug message
   */
  async debug(message: string, metadata?: any): Promise<void> {
    // Only log debug in development
    if (process.env.NODE_ENV === "development") {
      const logMessage = this.createLogMessage("debug", message, metadata);

      console.debug(`[${this.serviceName}] DEBUG:`, message);
      await this.messageBroker.publishLog(logMessage);
    }
  }

  /**
   * Log HTTP request
   */
  async logRequest(req: any, res?: any, responseTime?: number): Promise<void> {
    const metadata = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
      sessionId: req.sessionID,
      requestId: req.requestId,
      statusCode: res?.statusCode,
      responseTime,
    };

    const message = `${req.method} ${req.url} - ${
      res?.statusCode || "Processing"
    }`;
    const level = this.getLogLevelFromStatusCode(res?.statusCode);

    const logMessage = this.createLogMessage(level, message, metadata);

    console.log(`[${this.serviceName}] ${level.toUpperCase()}: ${message}`);
    await this.messageBroker.publishLog(logMessage);
  }

  /**
   * Log database operation
   */
  async logDatabase(
    operation: string,
    collection: string,
    metadata?: any
  ): Promise<void> {
    const message = `Database ${operation} on ${collection}`;
    const logMetadata = {
      operation,
      collection,
      ...metadata,
    };

    const logMessage = this.createLogMessage("info", message, logMetadata);

    console.log(`[${this.serviceName}] DB:`, message);
    await this.messageBroker.publishLog(logMessage);
  }

  /**
   * Log authentication event
   */
  async logAuth(
    event: string,
    userId?: string,
    ip?: string,
    metadata?: any
  ): Promise<void> {
    const message = `Auth event: ${event}`;
    const logMetadata = {
      event,
      userId,
      ip,
      ...metadata,
    };

    const logMessage = this.createLogMessage("info", message, logMetadata);

    console.log(`[${this.serviceName}] AUTH:`, message);
    await this.messageBroker.publishLog(logMessage);

    // Also publish as audit log
    if (userId) {
      await this.messageBroker.publishAuditLog({
        userId,
        action: event,
        resource: "authentication",
        ip,
        metadata,
      });
    }
  }

  /**
   * Log business event
   */
  async logBusinessEvent(
    event: string,
    userId?: string,
    metadata?: any
  ): Promise<void> {
    const message = `Business event: ${event}`;
    const logMetadata = {
      event,
      userId,
      ...metadata,
    };

    const logMessage = this.createLogMessage("info", message, logMetadata);

    console.log(`[${this.serviceName}] BUSINESS:`, message);
    await this.messageBroker.publishLog(logMessage);
  }

  /**
   * Create log message object
   */
  private createLogMessage(
    level: "error" | "warn" | "info" | "debug",
    message: string,
    metadata?: any,
    error?: Error
  ): LogMessage {
    const stack = new Error().stack;
    const caller = this.extractCallerInfo(stack);

    const logMessage: LogMessage = {
      id: this.generateLogId(),
      service: this.serviceName,
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        ...(error && {
          error: {
            name: error.name,
            stack: error.stack || "",
            code: (error as any).code,
          },
        }),
      },
      source: caller,
    };

    return logMessage;
  }

  /**
   * Extract caller information from stack trace
   */
  private extractCallerInfo(stack?: string): {
    file?: string;
    function?: string;
    line?: number;
  } {
    if (!stack) return {};

    try {
      const lines = stack.split("\n");
      // Skip the first few lines to get to the actual caller
      const callerLine = lines[4] || lines[3] || lines[2];

      const match = callerLine.match(/at (.+?) \((.+?):(\d+):\d+\)/);
      if (match) {
        return {
          function: match[1],
          file: match[2],
          line: parseInt(match[3]),
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return {};
  }

  /**
   * Get log level from HTTP status code
   */
  private getLogLevelFromStatusCode(
    statusCode?: number
  ): "error" | "warn" | "info" | "debug" {
    if (!statusCode) return "info";

    if (statusCode >= 500) return "error";
    if (statusCode >= 400) return "warn";
    return "info";
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
}

// Service-specific logger instances
export const userLogger = new EnhancedLogger("user-service");
export const courseLogger = new EnhancedLogger("course-service");
export const enrollmentLogger = new EnhancedLogger("enrollment-service");
export const scheduleLogger = new EnhancedLogger("schedule-service");
export const apiGatewayLogger = new EnhancedLogger("api-gateway");

// Express middleware for request logging
export const requestLoggerMiddleware = (serviceName: string) => {
  const logger = new EnhancedLogger(serviceName);

  return (req: any, res: any, next: any) => {
    const startTime = Date.now();

    // Add request ID for tracing
    req.requestId = `${serviceName}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Log request start
    logger.info(`Incoming request: ${req.method} ${req.url}`, {
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id,
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk: any, encoding: any) {
      const responseTime = Date.now() - startTime;

      logger.logRequest(req, res, responseTime);

      // Call original end function
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

export default EnhancedLogger;
