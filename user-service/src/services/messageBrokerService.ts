import Redis from "ioredis";
const amqp = require("amqplib/callback_api");

/**
 * Message Broker Configuration
 * Supports both Redis and RabbitMQ for different use cases
 */
export interface MessageBrokerConfig {
  // Redis configuration
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };

  // RabbitMQ configuration
  rabbitmq: {
    url: string;
    queues: {
      logs: string;
      audit: string;
      notifications: string;
    };
    exchanges: {
      logs: string;
      system: string;
    };
  };
}

/**
 * Log Message Interface
 */
export interface LogMessage {
  id?: string;
  service: string;
  level: "error" | "warn" | "info" | "debug";
  message: string;
  timestamp: string;
  metadata?: {
    userId?: string;
    requestId?: string;
    sessionId?: string;
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
    error?: {
      name: string;
      stack: string;
      code?: string;
    };
    [key: string]: any;
  };
  source?: {
    file?: string;
    function?: string;
    line?: number;
  };
}

/**
 * Message Broker Service
 * Handles async logging and messaging between microservices
 */
export class MessageBrokerService {
  private redis: Redis;
  private rabbitmqConnection?: any;
  private rabbitmqChannel?: any;
  private config: MessageBrokerConfig;
  private isConnected: boolean = false;

  constructor(config: MessageBrokerConfig) {
    this.config = config;

    // Initialize Redis
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.setupRedisEventHandlers();
  }

  /**
   * Initialize connections to message brokers
   */
  async initialize(): Promise<void> {
    try {
      // Connect to Redis
      await this.redis.connect();
      console.log("✅ Connected to Redis");

      // Connect to RabbitMQ
      await this.initializeRabbitMQ();
      console.log("✅ Connected to RabbitMQ");

      this.isConnected = true;
      console.log("🚀 Message Broker Service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Message Broker Service:", error);
      throw error;
    }
  }

  /**
   * Initialize RabbitMQ connection and setup queues/exchanges
   */
  private async initializeRabbitMQ(): Promise<void> {
    try {
      this.rabbitmqConnection = await amqp.connect(this.config.rabbitmq.url);
      this.rabbitmqChannel = await this.rabbitmqConnection!.createChannel();

      // Setup exchanges
      await this.rabbitmqChannel.assertExchange(
        this.config.rabbitmq.exchanges.logs,
        "topic",
        { durable: true }
      );

      await this.rabbitmqChannel.assertExchange(
        this.config.rabbitmq.exchanges.system,
        "direct",
        { durable: true }
      );

      // Setup queues
      await this.rabbitmqChannel.assertQueue(this.config.rabbitmq.queues.logs, {
        durable: true,
      });

      await this.rabbitmqChannel.assertQueue(
        this.config.rabbitmq.queues.audit,
        { durable: true }
      );

      await this.rabbitmqChannel.assertQueue(
        this.config.rabbitmq.queues.notifications,
        { durable: true }
      );

      // Bind queues to exchanges
      await this.rabbitmqChannel.bindQueue(
        this.config.rabbitmq.queues.logs,
        this.config.rabbitmq.exchanges.logs,
        "logs.*"
      );

      await this.rabbitmqChannel.bindQueue(
        this.config.rabbitmq.queues.audit,
        this.config.rabbitmq.exchanges.system,
        "audit"
      );

      await this.rabbitmqChannel.bindQueue(
        this.config.rabbitmq.queues.notifications,
        this.config.rabbitmq.exchanges.system,
        "notification"
      );
    } catch (error) {
      console.error("Failed to initialize RabbitMQ:", error);
      throw error;
    }
  }

  /**
   * Setup Redis event handlers
   */
  private setupRedisEventHandlers(): void {
    this.redis.on("connect", () => {
      console.log("Redis connected");
    });

    this.redis.on("error", (error) => {
      console.error("Redis error:", error);
    });

    this.redis.on("close", () => {
      console.log("Redis connection closed");
    });
  }

  /**
   * Publish log message to RabbitMQ for async processing
   */
  async publishLog(logMessage: LogMessage): Promise<void> {
    if (!this.isConnected || !this.rabbitmqChannel) {
      console.warn(
        "Message broker not connected, falling back to console logging"
      );
      console.log(
        `[${logMessage.service}] ${logMessage.level.toUpperCase()}: ${
          logMessage.message
        }`
      );
      return;
    }

    try {
      const routingKey = `logs.${logMessage.service}.${logMessage.level}`;
      const messageBuffer = Buffer.from(JSON.stringify(logMessage));

      await this.rabbitmqChannel.publish(
        this.config.rabbitmq.exchanges.logs,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now(),
          headers: {
            service: logMessage.service,
            level: logMessage.level,
            messageId: logMessage.id || this.generateMessageId(),
          },
        }
      );

      // Also cache in Redis for quick access
      await this.cacheLogInRedis(logMessage);
    } catch (error) {
      console.error("Failed to publish log message:", error);
      // Fallback to console logging
      console.log(
        `[${logMessage.service}] ${logMessage.level.toUpperCase()}: ${
          logMessage.message
        }`
      );
    }
  }

  /**
   * Cache log in Redis for quick access and real-time features
   */
  private async cacheLogInRedis(logMessage: LogMessage): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      // Store in service-specific list (for recent logs)
      const serviceKey = `logs:service:${logMessage.service}`;
      pipeline.lpush(serviceKey, JSON.stringify(logMessage));
      pipeline.ltrim(serviceKey, 0, 999); // Keep only last 1000 logs
      pipeline.expire(serviceKey, 3600 * 24); // Expire after 24 hours

      // Store in level-specific list
      const levelKey = `logs:level:${logMessage.level}`;
      pipeline.lpush(levelKey, JSON.stringify(logMessage));
      pipeline.ltrim(levelKey, 0, 999);
      pipeline.expire(levelKey, 3600 * 24);

      // Store in time-based sorted set for time-range queries
      const timeKey = `logs:timeline`;
      const timestamp = new Date(logMessage.timestamp).getTime();
      pipeline.zadd(timeKey, timestamp, JSON.stringify(logMessage));
      pipeline.zremrangebyrank(timeKey, 0, -10001); // Keep only last 10000 logs
      pipeline.expire(timeKey, 3600 * 24 * 7); // Expire after 7 days

      // Update statistics
      await this.updateLogStats(logMessage);

      await pipeline.exec();
    } catch (error) {
      console.error("Failed to cache log in Redis:", error);
    }
  }

  /**
   * Update real-time log statistics in Redis
   */
  private async updateLogStats(logMessage: LogMessage): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const hour = new Date().getHours();

      const pipeline = this.redis.pipeline();

      // Daily stats
      pipeline.hincrby(`stats:daily:${today}`, "total", 1);
      pipeline.hincrby(`stats:daily:${today}`, logMessage.level, 1);
      pipeline.hincrby(
        `stats:daily:${today}`,
        `service:${logMessage.service}`,
        1
      );
      pipeline.expire(`stats:daily:${today}`, 3600 * 24 * 30); // Keep for 30 days

      // Hourly stats
      pipeline.hincrby(`stats:hourly:${today}:${hour}`, "total", 1);
      pipeline.hincrby(`stats:hourly:${today}:${hour}`, logMessage.level, 1);
      pipeline.expire(`stats:hourly:${today}:${hour}`, 3600 * 24 * 7); // Keep for 7 days

      // Service stats
      pipeline.hincrby(`stats:service:${logMessage.service}`, "total", 1);
      pipeline.hincrby(
        `stats:service:${logMessage.service}`,
        logMessage.level,
        1
      );
      pipeline.expire(`stats:service:${logMessage.service}`, 3600 * 24 * 30);

      await pipeline.exec();
    } catch (error) {
      console.error("Failed to update log stats:", error);
    }
  }

  /**
   * Setup log message consumer
   */
  async startLogConsumer(
    callback: (logMessage: LogMessage) => Promise<void>
  ): Promise<void> {
    if (!this.rabbitmqChannel) {
      throw new Error("RabbitMQ channel not initialized");
    }

    await this.rabbitmqChannel.consume(
      this.config.rabbitmq.queues.logs,
      async (message) => {
        if (!message) return;

        try {
          const logMessage: LogMessage = JSON.parse(message.content.toString());
          await callback(logMessage);
          this.rabbitmqChannel!.ack(message);
        } catch (error) {
          console.error("Failed to process log message:", error);
          // Reject and requeue the message
          this.rabbitmqChannel!.nack(message, false, true);
        }
      },
      {
        noAck: false,
      }
    );

    console.log("📨 Log consumer started, waiting for messages...");
  }

  /**
   * Get recent logs from Redis cache
   */
  async getRecentLogs(
    options: {
      service?: string;
      level?: string;
      limit?: number;
    } = {}
  ): Promise<LogMessage[]> {
    try {
      const { service, level, limit = 100 } = options;

      let key: string;
      if (service) {
        key = `logs:service:${service}`;
      } else if (level) {
        key = `logs:level:${level}`;
      } else {
        key = "logs:timeline";
      }

      let logs: string[];
      if (key === "logs:timeline") {
        // Get from sorted set (most recent first)
        logs = await this.redis.zrevrange(key, 0, limit - 1);
      } else {
        // Get from list (most recent first)
        logs = await this.redis.lrange(key, 0, limit - 1);
      }

      return logs.map((log) => JSON.parse(log));
    } catch (error) {
      console.error("Failed to get recent logs:", error);
      return [];
    }
  }

  /**
   * Get log statistics from Redis
   */
  async getLogStats(date?: string): Promise<any> {
    try {
      const targetDate = date || new Date().toISOString().split("T")[0];
      const stats = await this.redis.hgetall(`stats:daily:${targetDate}`);

      return {
        date: targetDate,
        total: parseInt(stats.total || "0"),
        error: parseInt(stats.error || "0"),
        warn: parseInt(stats.warn || "0"),
        info: parseInt(stats.info || "0"),
        debug: parseInt(stats.debug || "0"),
        services: Object.keys(stats)
          .filter((key) => key.startsWith("service:"))
          .reduce((acc, key) => {
            const serviceName = key.replace("service:", "");
            acc[serviceName] = parseInt(stats[key]);
            return acc;
          }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error("Failed to get log stats:", error);
      return null;
    }
  }

  /**
   * Publish system notification
   */
  async publishNotification(notification: {
    type: string;
    title: string;
    message: string;
    userId?: string;
    metadata?: any;
  }): Promise<void> {
    if (!this.rabbitmqChannel) return;

    try {
      const message = {
        ...notification,
        id: this.generateMessageId(),
        timestamp: new Date().toISOString(),
      };

      await this.rabbitmqChannel.publish(
        this.config.rabbitmq.exchanges.system,
        "notification",
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      console.error("Failed to publish notification:", error);
    }
  }

  /**
   * Publish audit log
   */
  async publishAuditLog(auditLog: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<void> {
    if (!this.rabbitmqChannel) return;

    try {
      const message = {
        ...auditLog,
        id: this.generateMessageId(),
        timestamp: new Date().toISOString(),
      };

      await this.rabbitmqChannel.publish(
        this.config.rabbitmq.exchanges.system,
        "audit",
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    } catch (error) {
      console.error("Failed to publish audit log:", error);
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      if (this.rabbitmqChannel) {
        await this.rabbitmqChannel.close();
      }
      if (this.rabbitmqConnection) {
        await this.rabbitmqConnection.close();
      }
      await this.redis.quit();

      this.isConnected = false;
      console.log("Message Broker Service closed");
    } catch (error) {
      console.error("Error closing Message Broker Service:", error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ redis: boolean; rabbitmq: boolean }> {
    const health = {
      redis: false,
      rabbitmq: false,
    };

    try {
      await this.redis.ping();
      health.redis = true;
    } catch (error) {
      console.error("Redis health check failed:", error);
    }

    try {
      if (
        this.rabbitmqConnection &&
        !this.rabbitmqConnection.connection.destroyed
      ) {
        health.rabbitmq = true;
      }
    } catch (error) {
      console.error("RabbitMQ health check failed:", error);
    }

    return health;
  }
}

// Default configuration
export const defaultMessageBrokerConfig: MessageBrokerConfig = {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || "0"),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    queues: {
      logs: "logs_queue",
      audit: "audit_queue",
      notifications: "notifications_queue",
    },
    exchanges: {
      logs: "logs_exchange",
      system: "system_exchange",
    },
  },
};

// Singleton instance
let messageBrokerService: MessageBrokerService | null = null;

export const getMessageBrokerService = (
  config?: MessageBrokerConfig
): MessageBrokerService => {
  if (!messageBrokerService) {
    messageBrokerService = new MessageBrokerService(
      config || defaultMessageBrokerConfig
    );
  }
  return messageBrokerService;
};

export default MessageBrokerService;
