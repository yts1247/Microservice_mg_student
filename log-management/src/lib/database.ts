import Database from "better-sqlite3";
import path from "path";
import fs from "fs-extra";

const DB_PATH = process.env.DATABASE_URL || "./data/logs.db";

class DatabaseManager {
  private db: any | null = null;

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    try {
      // Ensure data directory exists
      const dbDir = path.dirname(DB_PATH);
      fs.ensureDirSync(dbDir);

      this.db = new Database(DB_PATH);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");

      this.createTables();
      this.createIndexes();
      this.insertDefaultUser();

      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  private createTables() {
    if (!this.db) throw new Error("Database not initialized");

    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'viewer')) DEFAULT 'viewer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );
    `);

    // Log files table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS log_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT NOT NULL,
        file_path TEXT UNIQUE NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        created_date DATE NOT NULL,
        last_modified DATETIME NOT NULL,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Log entries table (for indexing and fast search)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS log_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER REFERENCES log_files(id) ON DELETE CASCADE,
        timestamp DATETIME NOT NULL,
        level TEXT CHECK(level IN ('error', 'warn', 'info', 'debug')) NOT NULL,
        message TEXT NOT NULL,
        meta TEXT, -- JSON string
        stack TEXT,
        line_number INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Cronjob config table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cronjob_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        enabled BOOLEAN DEFAULT TRUE,
        retention_days INTEGER DEFAULT 7,
        schedule TEXT DEFAULT '0 2 * * *', -- Daily at 2 AM
        last_run DATETIME,
        next_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default cronjob config
    this.db.exec(`
      INSERT OR IGNORE INTO cronjob_config (id, enabled, retention_days, schedule)
      VALUES (1, TRUE, 7, '0 2 * * *');
    `);
  }

  private createIndexes() {
    if (!this.db) throw new Error("Database not initialized");

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_log_files_service ON log_files(service_name);
      CREATE INDEX IF NOT EXISTS idx_log_files_date ON log_files(created_date);
      CREATE INDEX IF NOT EXISTS idx_log_files_archived ON log_files(is_archived);
      
      CREATE INDEX IF NOT EXISTS idx_log_entries_file_id ON log_entries(file_id);
      CREATE INDEX IF NOT EXISTS idx_log_entries_timestamp ON log_entries(timestamp);
      CREATE INDEX IF NOT EXISTS idx_log_entries_level ON log_entries(level);
      CREATE INDEX IF NOT EXISTS idx_log_entries_message ON log_entries(message);
      
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
  }

  private insertDefaultUser() {
    if (!this.db) throw new Error("Database not initialized");

    const bcrypt = require("bcryptjs");
    const defaultPassword = bcrypt.hashSync("admin123", 10);

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run("admin", "admin@example.com", defaultPassword, "admin");
  }

  getDatabase(): any {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
const dbManager = new DatabaseManager();

export default dbManager;
export { DatabaseManager };
