// Import thư viện Redis và RabbitMQ
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
      logs: string; // Hàng đợi log
      audit: string; // Hàng đợi audit
      notifications: string; // Hàng đợi thông báo
    };
    exchanges: {
      logs: string; // Exchange cho log
      system: string; // Exchange cho hệ thống
    };
  };
}

/**
 * Log Message Interface
 */
export interface LogMessage {
  id?: string; // ID log
  service: string; // Tên service sinh ra log
  level: "error" | "warn" | "info" | "debug"; // Mức độ log
  message: string; // Nội dung log
  timestamp: string; // Thời gian log
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
 * Service trung gian xử lý log và message giữa các microservice
 * - Gửi log bất đồng bộ qua RabbitMQ
 * - Lưu cache log, thống kê, truy xuất nhanh qua Redis
 */
export class MessageBrokerService {
  private redis: Redis; // Kết nối Redis
  private rabbitmqConnection?: any; // Kết nối RabbitMQ
  private rabbitmqChannel?: any; // Channel RabbitMQ
  private config: MessageBrokerConfig; // Cấu hình
  private isConnected: boolean = false; // Trạng thái kết nối

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

    this.setupRedisEventHandlers(); // Đăng ký event cho Redis
  }

  /**
   * Khởi tạo kết nối tới Redis và RabbitMQ
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

      // Tạo exchange cho hệ thống (direct)
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

      // Bind queue với exchange
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
   * Đăng ký các event cho Redis (kết nối, lỗi, đóng)
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
   * Gửi log lên RabbitMQ để xử lý bất đồng bộ
   * Đồng thời lưu cache log vào Redis để truy xuất nhanh
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
      // Tạo routing key cho log
      const routingKey = `logs.${logMessage.service}.${logMessage.level}`;
      const messageBuffer = Buffer.from(JSON.stringify(logMessage));

      // Gửi log lên exchange logs
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

      // Lưu cache log vào Redis
      await this.cacheLogInRedis(logMessage);
    } catch (error) {
      console.error("Failed to publish log message:", error);
      // Fallback: log ra console nếu lỗi
      console.log(
        `[${logMessage.service}] ${logMessage.level.toUpperCase()}: ${
          logMessage.message
        }`
      );
    }
  }

  /**
   * Lưu log vào Redis để truy xuất nhanh, phục vụ dashboard, thống kê
   */
  private async cacheLogInRedis(logMessage: LogMessage): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      // Lưu log theo service (danh sách log gần nhất của từng service)
      const serviceKey = `logs:service:${logMessage.service}`;
      pipeline.lpush(serviceKey, JSON.stringify(logMessage));
      pipeline.ltrim(serviceKey, 0, 999); // Giữ tối đa 1000 log gần nhất
      pipeline.expire(serviceKey, 3600 * 24); // Hết hạn sau 24h

      // Lưu log theo level (error, warn, info, debug)
      const levelKey = `logs:level:${logMessage.level}`;
      pipeline.lpush(levelKey, JSON.stringify(logMessage));
      pipeline.ltrim(levelKey, 0, 999);
      pipeline.expire(levelKey, 3600 * 24);

      // Lưu log theo thời gian (sorted set, phục vụ truy vấn theo khoảng thời gian)
      const timeKey = `logs:timeline`;
      const timestamp = new Date(logMessage.timestamp).getTime();
      pipeline.zadd(timeKey, timestamp, JSON.stringify(logMessage));
      pipeline.zremrangebyrank(timeKey, 0, -10001); // Giữ tối đa 10000 log
      pipeline.expire(timeKey, 3600 * 24 * 7); // Hết hạn sau 7 ngày

      // Update statistics
      await this.updateLogStats(logMessage);

      await pipeline.exec();
    } catch (error) {
      console.error("Failed to cache log in Redis:", error);
    }
  }

  /**
   * Cập nhật thống kê log (theo ngày, giờ, service) trong Redis
   */
  private async updateLogStats(logMessage: LogMessage): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const hour = new Date().getHours();

      const pipeline = this.redis.pipeline();

      // Thống kê theo ngày
      pipeline.hincrby(`stats:daily:${today}`, "total", 1);
      pipeline.hincrby(`stats:daily:${today}`, logMessage.level, 1);
      pipeline.hincrby(
        `stats:daily:${today}`,
        `service:${logMessage.service}`,
        1
      );
      pipeline.expire(`stats:daily:${today}`, 3600 * 24 * 30); // Keep for 30 days

      // Thống kê theo giờ
      pipeline.hincrby(`stats:hourly:${today}:${hour}`, "total", 1);
      pipeline.hincrby(`stats:hourly:${today}:${hour}`, logMessage.level, 1);
      pipeline.expire(`stats:hourly:${today}:${hour}`, 3600 * 24 * 7); // Lưu 7 ngày

      // Thống kê theo service
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
   * Khởi động consumer nhận log từ RabbitMQ
   * Khi có log mới, gọi callback để xử lý
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
          // Nếu lỗi, requeue lại message
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
   * Lấy danh sách log gần nhất từ Redis (phục vụ dashboard, truy xuất nhanh)
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
        // Lấy từ sorted set (mới nhất trước)
        logs = await this.redis.zrevrange(key, 0, limit - 1);
      } else {
        // Lấy từ list (mới nhất trước)
        logs = await this.redis.lrange(key, 0, limit - 1);
      }

      return logs.map((log) => JSON.parse(log));
    } catch (error) {
      console.error("Failed to get recent logs:", error);
      return [];
    }
  }

  /**
   * statistics: thống kê
   * Lấy thống kê log từ Redis (phục vụ dashboard, báo cáo)
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
   * Gửi thông báo hệ thống lên RabbitMQ
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
   * Gửi log audit lên RabbitMQ
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
   * Tạo ID duy nhất cho message/log
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
   * Kiểm tra sức khỏe kết nối Redis và RabbitMQ
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

// Cấu hình mặc định cho Message Broker (Redis & RabbitMQ)
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

// Singleton instance cho MessageBrokerService
let messageBrokerService: MessageBrokerService | null = null;

/**
 * Hàm lấy instance duy nhất của MessageBrokerService
 * Dùng để đảm bảo chỉ có một kết nối tới broker trong toàn bộ app
 */
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
