import cron from "cron";
import fs from "fs-extra";
import path from "path";
import dbManager from "./database";
import { logScanner } from "./logScanner";

export class CronjobService {
  private jobs: Map<string, cron.CronJob> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const db = dbManager.getDatabase();
      const config = db
        .prepare("SELECT * FROM cronjob_config WHERE id = 1")
        .get() as any;

      if (config && config.enabled) {
        await this.setupLogCleanupJob(config.schedule, config.retention_days);
        await this.setupLogScanJob(); // Scan logs every 5 minutes
      }

      this.isInitialized = true;
      console.log("Cronjob service initialized");
    } catch (error) {
      console.error("Failed to initialize cronjob service:", error);
    }
  }

  private async setupLogCleanupJob(
    schedule: string,
    retentionDays: number
  ): Promise<void> {
    const job = new cron.CronJob(
      schedule,
      async () => {
        console.log("Starting log cleanup job...");
        await this.cleanupOldLogs(retentionDays);
        await this.updateLastRun();
        console.log("Log cleanup job completed");
      },
      null,
      true,
      "UTC"
    );

    this.jobs.set("cleanup", job);
    console.log(
      `Log cleanup job scheduled: ${schedule} (retain ${retentionDays} days)`
    );
  }

  private async setupLogScanJob(): Promise<void> {
    // Scan logs every 5 minutes
    const job = new cron.CronJob(
      "*/5 * * * *",
      async () => {
        console.log("Starting periodic log scan...");
        await logScanner.scanAllServices();
        console.log("Periodic log scan completed");
      },
      null,
      true,
      "UTC"
    );

    this.jobs.set("scan", job);
    console.log("Log scanning job scheduled: every 5 minutes");
  }

  private async cleanupOldLogs(retentionDays: number): Promise<void> {
    try {
      const db = dbManager.getDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

      // Get old log files
      const oldFiles = db
        .prepare(
          `
        SELECT file_path, service_name, file_name
        FROM log_files 
        WHERE created_date < ? AND is_archived = FALSE
      `
        )
        .all(cutoffDateStr);

      let deletedCount = 0;
      let archivedCount = 0;

      for (const file of oldFiles) {
        try {
          // Archive or delete the physical file
          if (await fs.pathExists(file.file_path)) {
            const shouldArchive = process.env.ARCHIVE_OLD_LOGS === "true";

            if (shouldArchive) {
              await this.archiveLogFile(file.file_path, file.service_name);
              archivedCount++;
            } else {
              await fs.remove(file.file_path);
              deletedCount++;
            }
          }

          // Mark as archived in database
          db.prepare(
            `
            UPDATE log_files 
            SET is_archived = TRUE, updated_at = CURRENT_TIMESTAMP 
            WHERE file_path = ?
          `
          ).run(file.file_path);

          // Delete log entries older than retention period
          db.prepare(
            `
            DELETE FROM log_entries 
            WHERE file_id IN (
              SELECT id FROM log_files 
              WHERE file_path = ? AND created_date < ?
            )
          `
          ).run(file.file_path, cutoffDateStr);
        } catch (error) {
          console.error(`Error processing file ${file.file_path}:`, error);
        }
      }

      console.log(
        `Cleanup completed: ${deletedCount} deleted, ${archivedCount} archived`
      );
    } catch (error) {
      console.error("Error during log cleanup:", error);
    }
  }

  private async archiveLogFile(
    filePath: string,
    serviceName: string
  ): Promise<void> {
    try {
      const archiveDir = path.join(path.dirname(filePath), "archived");
      await fs.ensureDir(archiveDir);

      const fileName = path.basename(filePath);
      const archivePath = path.join(archiveDir, `${Date.now()}-${fileName}.gz`);

      // Compress and move file
      const zlib = require("zlib");
      const gzip = zlib.createGzip();
      const fs_node = require("fs");

      const source = fs_node.createReadStream(filePath);
      const destination = fs_node.createWriteStream(archivePath);

      await new Promise((resolve, reject) => {
        source
          .pipe(gzip)
          .pipe(destination)
          .on("finish", resolve)
          .on("error", reject);
      });

      // Remove original file
      await fs.remove(filePath);

      console.log(`Archived: ${fileName} -> ${archivePath}`);
    } catch (error) {
      console.error(`Error archiving file ${filePath}:`, error);
      throw error;
    }
  }

  private async updateLastRun(): Promise<void> {
    try {
      const db = dbManager.getDatabase();
      const nextRun = this.getNextRunTime();

      db.prepare(
        `
        UPDATE cronjob_config 
        SET last_run = CURRENT_TIMESTAMP, next_run = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `
      ).run(nextRun);
    } catch (error) {
      console.error("Error updating last run:", error);
    }
  }

  private getNextRunTime(): string {
    const cleanupJob = this.jobs.get("cleanup");
    if (cleanupJob) {
      const next = cleanupJob.nextDate();
      try {
        // Some cron implementations return Luxon DateTime or other objects
        if (next && typeof (next as any).toJSDate === "function") {
          return (next as any).toJSDate().toISOString();
        }
        if (next && typeof (next as any).toDate === "function") {
          return (next as any).toDate().toISOString();
        }
        if (next instanceof Date) {
          return (next as Date).toISOString();
        }
        if (next && typeof (next as any).toISOString === "function") {
          return (next as any).toISOString();
        }
        return String(next);
      } catch (err) {
        return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default: 24 hours
  }

  async updateConfig(
    enabled: boolean,
    retentionDays: number,
    schedule: string
  ): Promise<void> {
    try {
      const db = dbManager.getDatabase();

      // Update database
      db.prepare(
        `
        UPDATE cronjob_config 
        SET enabled = ?, retention_days = ?, schedule = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `
      ).run(enabled, retentionDays, schedule);

      // Restart jobs with new config
      this.stopAllJobs();

      if (enabled) {
        await this.setupLogCleanupJob(schedule, retentionDays);
        await this.setupLogScanJob();
      }

      console.log(
        `Cronjob config updated: enabled=${enabled}, retention=${retentionDays}days, schedule=${schedule}`
      );
    } catch (error) {
      console.error("Error updating cronjob config:", error);
      throw error;
    }
  }

  async getConfig(): Promise<any> {
    const db = dbManager.getDatabase();
    return db.prepare("SELECT * FROM cronjob_config WHERE id = 1").get();
  }

  private stopAllJobs(): void {
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped job: ${name}`);
    }
    this.jobs.clear();
  }

  async manualCleanup(
    retentionDays?: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const db = dbManager.getDatabase();
      const config = db
        .prepare("SELECT retention_days FROM cronjob_config WHERE id = 1")
        .get() as any;
      const days = retentionDays || config?.retention_days || 7;

      await this.cleanupOldLogs(days);
      await this.updateLastRun();

      return {
        success: true,
        message: `Manual cleanup completed (${days} days retention)`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Cleanup failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  destroy(): void {
    this.stopAllJobs();
    this.isInitialized = false;
    console.log("Cronjob service destroyed");
  }
}

// Singleton instance
export const cronjobService = new CronjobService();
