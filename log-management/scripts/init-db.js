const path = require("path");
const fs = require("fs-extra");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "..", "data", "logs.db");

async function initDatabase() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    await fs.ensureDir(dataDir);

    console.log("Initializing database...");

    const db = new Database(DB_PATH);

    // Create tables
    console.log("Creating tables...");

    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'viewer')) DEFAULT 'viewer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Log files table
    db.exec(`
      CREATE TABLE IF NOT EXISTS log_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT NOT NULL,
        file_path TEXT UNIQUE NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        created_date TEXT NOT NULL,
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Log entries table
    db.exec(`
      CREATE TABLE IF NOT EXISTS log_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        level TEXT CHECK(level IN ('error', 'warn', 'info', 'debug')) DEFAULT 'info',
        message TEXT NOT NULL,
        meta TEXT, -- JSON string
        stack TEXT,
        line_number INTEGER,
        raw_content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES log_files (id) ON DELETE CASCADE
      )
    `);

    // Cronjob configuration table
    db.exec(`
      CREATE TABLE IF NOT EXISTS cronjob_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled BOOLEAN DEFAULT TRUE,
        retention_days INTEGER DEFAULT 7,
        schedule TEXT DEFAULT '0 2 * * *', -- Daily at 2 AM
        last_run DATETIME,
        next_run DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    console.log("Creating indexes...");

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_log_files_service ON log_files(service_name);
      CREATE INDEX IF NOT EXISTS idx_log_files_date ON log_files(created_date);
      CREATE INDEX IF NOT EXISTS idx_log_files_archived ON log_files(is_archived);
      CREATE INDEX IF NOT EXISTS idx_log_entries_file_id ON log_entries(file_id);
      CREATE INDEX IF NOT EXISTS idx_log_entries_timestamp ON log_entries(timestamp);
      CREATE INDEX IF NOT EXISTS idx_log_entries_level ON log_entries(level);
      CREATE INDEX IF NOT EXISTS idx_log_entries_composite ON log_entries(file_id, timestamp, level);
    `);

    // Check if admin user exists
    const adminExists = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
      .get();

    if (adminExists.count === 0) {
      console.log("Creating default admin user...");
      const passwordHash = await bcrypt.hash("admin123", 10);

      db.prepare(
        `
        INSERT INTO users (username, email, password_hash, role) 
        VALUES (?, ?, ?, ?)
      `
      ).run("admin", "admin@logmanagement.com", passwordHash, "admin");

      console.log("Default admin user created:");
      console.log("  Username: admin");
      console.log("  Password: admin123");
      console.log("  Email: admin@logmanagement.com");
    }

    // Initialize cronjob config if not exists
    const cronjobExists = db
      .prepare("SELECT COUNT(*) as count FROM cronjob_config")
      .get();
    if (cronjobExists.count === 0) {
      console.log("Creating default cronjob configuration...");
      db.prepare(
        `
        INSERT INTO cronjob_config (enabled, retention_days, schedule) 
        VALUES (?, ?, ?)
      `
      ).run(1, 7, "0 2 * * *");
    }

    db.close();
    console.log("Database initialized successfully!");
    console.log(`Database location: ${DB_PATH}`);
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
