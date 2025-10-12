import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

interface LogEntry {
  id?: number;
  service: string;
  level: string;
  message: string;
  timestamp: string;
  details?: string;
  source_file?: string;
  created_at?: string;
}

interface LogStats {
  total: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
}

interface ServiceStats {
  service: string;
  total: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
}

class LogDatabase {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    this.dbPath =
      process.env.DATABASE_URL || path.join(process.cwd(), "logs.db");
    this.initDatabase();
  }

  private initDatabase() {
    try {
      // Create database directory if it doesn't exist
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(this.dbPath);

      // Enable WAL mode for better performance
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("synchronous = NORMAL");
      this.db.pragma("cache_size = 1000");

      this.createTables();
      this.createIndexes();

      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  private createTables() {
    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        details TEXT,
        source_file TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      this.db.exec(createLogsTable);
    } catch (error) {
      console.error("Error creating tables:", error);
      throw error;
    }
  }

  private createIndexes() {
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service)",
      "CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level)",
      "CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp)",
      "CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at)",
      "CREATE INDEX IF NOT EXISTS idx_logs_service_level ON logs(service, level)",
      "CREATE INDEX IF NOT EXISTS idx_logs_service_timestamp ON logs(service, timestamp)",
    ];

    try {
      indexes.forEach((index) => this.db.exec(index));
    } catch (error) {
      console.error("Error creating indexes:", error);
      throw error;
    }
  }

  // Insert a new log entry
  insertLog(log: Omit<LogEntry, "id" | "created_at">): void {
    const stmt = this.db.prepare(`
      INSERT INTO logs (service, level, message, timestamp, details, source_file)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(
        log.service,
        log.level,
        log.message,
        log.timestamp,
        log.details || null,
        log.source_file || null
      );
    } catch (error) {
      console.error("Error inserting log:", error);
      throw error;
    }
  }

  // Get logs with pagination and filters
  getLogs(
    options: {
      page?: number;
      limit?: number;
      service?: string;
      level?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    } = {}
  ): { logs: LogEntry[]; total: number } {
    const {
      page = 1,
      limit = 50,
      service,
      level,
      startDate,
      endDate,
      search,
    } = options;

    let query = "SELECT * FROM logs WHERE 1=1";
    let countQuery = "SELECT COUNT(*) as total FROM logs WHERE 1=1";
    const params: any[] = [];

    // Add filters
    if (service) {
      query += " AND service = ?";
      countQuery += " AND service = ?";
      params.push(service);
    }

    if (level) {
      query += " AND level = ?";
      countQuery += " AND level = ?";
      params.push(level);
    }

    if (startDate) {
      query += " AND DATE(timestamp) >= ?";
      countQuery += " AND DATE(timestamp) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND DATE(timestamp) <= ?";
      countQuery += " AND DATE(timestamp) <= ?";
      params.push(endDate);
    }

    if (search) {
      query += " AND (message LIKE ? OR details LIKE ?)";
      countQuery += " AND (message LIKE ? OR details LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Add ordering and pagination
    query += " ORDER BY timestamp DESC, id DESC";
    query += " LIMIT ? OFFSET ?";

    const offset = (page - 1) * limit;

    try {
      // Get total count
      const countStmt = this.db.prepare(countQuery);
      const countResult = countStmt.get(...params) as { total: number };
      const total = countResult.total;

      // Get logs
      const stmt = this.db.prepare(query);
      const logs = stmt.all(...params, limit, offset) as LogEntry[];

      return { logs, total };
    } catch (error) {
      console.error("Error getting logs:", error);
      throw error;
    }
  }

  // Get log statistics
  getLogStats(
    service?: string,
    startDate?: string,
    endDate?: string
  ): LogStats {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) as error,
        SUM(CASE WHEN level = 'warn' THEN 1 ELSE 0 END) as warn,
        SUM(CASE WHEN level = 'info' THEN 1 ELSE 0 END) as info,
        SUM(CASE WHEN level = 'debug' THEN 1 ELSE 0 END) as debug
      FROM logs WHERE 1=1
    `;

    const params: any[] = [];

    if (service) {
      query += " AND service = ?";
      params.push(service);
    }

    if (startDate) {
      query += " AND DATE(timestamp) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND DATE(timestamp) <= ?";
      params.push(endDate);
    }

    try {
      const stmt = this.db.prepare(query);
      return stmt.get(...params) as LogStats;
    } catch (error) {
      console.error("Error getting log stats:", error);
      throw error;
    }
  }

  // Get service statistics
  getServiceStats(startDate?: string, endDate?: string): ServiceStats[] {
    let query = `
      SELECT 
        service,
        COUNT(*) as total,
        SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END) as error,
        SUM(CASE WHEN level = 'warn' THEN 1 ELSE 0 END) as warn,
        SUM(CASE WHEN level = 'info' THEN 1 ELSE 0 END) as info,
        SUM(CASE WHEN level = 'debug' THEN 1 ELSE 0 END) as debug
      FROM logs WHERE 1=1
    `;

    const params: any[] = [];

    if (startDate) {
      query += " AND DATE(timestamp) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND DATE(timestamp) <= ?";
      params.push(endDate);
    }

    query += " GROUP BY service ORDER BY total DESC";

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(...params) as ServiceStats[];
    } catch (error) {
      console.error("Error getting service stats:", error);
      throw error;
    }
  }

  // Get available services
  getServices(): string[] {
    const query = "SELECT DISTINCT service FROM logs ORDER BY service";

    try {
      const stmt = this.db.prepare(query);
      const results = stmt.all() as { service: string }[];
      return results.map((r) => r.service);
    } catch (error) {
      console.error("Error getting services:", error);
      throw error;
    }
  }

  // Delete old logs
  deleteOldLogs(days: number): number {
    const query =
      "DELETE FROM logs WHERE DATE(timestamp) < DATE('now', '-' || ? || ' days')";

    try {
      const stmt = this.db.prepare(query);
      const result = stmt.run(days);
      return result.changes;
    } catch (error) {
      console.error("Error deleting old logs:", error);
      throw error;
    }
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

// Singleton instance
let logDatabase: LogDatabase | null = null;

export const getLogDatabase = (): LogDatabase => {
  if (!logDatabase) {
    logDatabase = new LogDatabase();
  }
  return logDatabase;
};

export type { LogEntry, LogStats, ServiceStats };
