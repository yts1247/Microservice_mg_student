import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import dbManager from "./database";
import { LogFile, LogEntry } from "@/types";

export class LogScannerService {
  private logPaths: { [serviceName: string]: string } = {
    "api-gateway": "./logs/api-gateway",
    "user-service": "./logs/user-service",
    "course-service": "./logs/course-service",
    "schedule-service": "./logs/schedule-service",
    "enrollment-service": "./logs/enrollment-service",
  };

  async scanAllServices(): Promise<void> {
    console.log("Starting log scan for all services...");

    for (const [serviceName, logPath] of Object.entries(this.logPaths)) {
      await this.scanService(serviceName, logPath);
    }

    console.log("Log scan completed");
  }

  async scanService(serviceName: string, logPath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(logPath);

      if (!(await fs.pathExists(absolutePath))) {
        console.warn(`Log path does not exist: ${absolutePath}`);
        return;
      }

      // Find all log files
      const logFiles = await glob("**/*.log", {
        cwd: absolutePath,
        absolute: true,
      });

      for (const filePath of logFiles) {
        await this.processLogFile(serviceName, filePath);
      }
    } catch (error) {
      console.error(`Error scanning service ${serviceName}:`, error);
    }
  }

  private async processLogFile(
    serviceName: string,
    filePath: string
  ): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const createdDate =
        this.extractDateFromFilename(fileName) ||
        stats.birthtime.toISOString().split("T")[0];

      const db = dbManager.getDatabase();

      // Check if file already exists and is up to date
      const existingFile = db
        .prepare(
          "SELECT id, last_modified, file_size FROM log_files WHERE file_path = ?"
        )
        .get(filePath) as LogFile | undefined;

      const shouldUpdate =
        !existingFile ||
        new Date(existingFile.last_modified) < stats.mtime ||
        existingFile.file_size !== stats.size;

      if (!shouldUpdate) {
        return; // File hasn't changed
      }

      // Insert or update file record
      let fileId: number;

      if (existingFile) {
        db.prepare(
          `
          UPDATE log_files 
          SET file_size = ?, last_modified = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
        ).run(stats.size, stats.mtime.toISOString(), existingFile.id);
        fileId = existingFile.id;

        // Delete old log entries
        db.prepare("DELETE FROM log_entries WHERE file_id = ?").run(fileId);
      } else {
        const result = db
          .prepare(
            `
          INSERT INTO log_files 
          (service_name, file_path, file_name, file_size, created_date, last_modified)
          VALUES (?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            serviceName,
            filePath,
            fileName,
            stats.size,
            createdDate,
            stats.mtime.toISOString()
          );

        fileId = result.lastInsertRowid as number;
      }

      // Parse and insert log entries (chunked for memory efficiency)
      await this.parseLogFileInChunks(filePath, fileId);

      console.log(`Processed log file: ${fileName} (${stats.size} bytes)`);
    } catch (error) {
      console.error(`Error processing log file ${filePath}:`, error);
    }
  }

  private async parseLogFileInChunks(
    filePath: string,
    fileId: number
  ): Promise<void> {
    const CHUNK_SIZE = 1000; // Process 1000 lines at a time
    const db = dbManager.getDatabase();

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n").filter((line) => line.trim());

      // Prepare batch insert statement
      const insertStmt = db.prepare(`
        INSERT INTO log_entries 
        (file_id, timestamp, level, message, meta, stack, line_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // Process in chunks
      for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
        const chunk = lines.slice(i, i + CHUNK_SIZE);

        const transaction = db.transaction(() => {
          chunk.forEach((line, index) => {
            const logEntry = this.parseLogLine(line, i + index + 1);
            if (logEntry) {
              insertStmt.run(
                fileId,
                logEntry.timestamp,
                logEntry.level,
                logEntry.message,
                logEntry.meta ? JSON.stringify(logEntry.meta) : null,
                logEntry.stack || null,
                logEntry.line_number
              );
            }
          });
        });

        transaction();
      }
    } catch (error) {
      console.error(`Error parsing log file ${filePath}:`, error);
    }
  }

  private parseLogLine(
    line: string,
    lineNumber: number
  ): Partial<LogEntry> | null {
    try {
      // Try to parse as JSON (Winston format)
      const parsed = JSON.parse(line);

      return {
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: this.normalizeLogLevel(parsed.level || "info"),
        message: parsed.message || line,
        meta: parsed.meta || parsed,
        stack: parsed.stack,
        line_number: lineNumber,
      };
    } catch {
      // Parse plain text log (simple format)
      const match = line.match(
        /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[.\d]*Z?)\s*\[?(\w+)\]?\s*:?\s*(.+)$/
      );

      if (match) {
        return {
          timestamp: new Date(match[1]).toISOString(),
          level: this.normalizeLogLevel(match[2] || "info"),
          message: match[3] || line,
          line_number: lineNumber,
        };
      }

      // Fallback for unstructured logs
      return {
        timestamp: new Date().toISOString(),
        level: "info",
        message: line,
        line_number: lineNumber,
      };
    }
  }

  private normalizeLogLevel(
    level: string
  ): "error" | "warn" | "info" | "debug" {
    const normalized = level.toLowerCase();
    if (["error", "err"].includes(normalized)) return "error";
    if (["warn", "warning"].includes(normalized)) return "warn";
    if (["debug", "verbose"].includes(normalized)) return "debug";
    return "info";
  }

  private extractDateFromFilename(filename: string): string | null {
    // Extract date from filenames like "app-2024-01-15.log" or "combined-2024-01-15.log"
    const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  }

  // Manual trigger for specific service
  async scanServiceManually(
    serviceName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const logPath = this.logPaths[serviceName];
      if (!logPath) {
        return { success: false, message: `Unknown service: ${serviceName}` };
      }

      await this.scanService(serviceName, logPath);
      return { success: true, message: `Successfully scanned ${serviceName}` };
    } catch (error) {
      return {
        success: false,
        message: `Error scanning ${serviceName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}

// Singleton instance
export const logScanner = new LogScannerService();
