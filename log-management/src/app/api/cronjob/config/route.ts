import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Database from "better-sqlite3";
import { CronJob } from "cron";
import fs from "fs";
import path from "path";

const db = new Database("./logs.db");

// Initialize cronjob config table
db.exec(`
  CREATE TABLE IF NOT EXISTS cronjob_config (
    id INTEGER PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    retention_days INTEGER DEFAULT 30,
    schedule TEXT DEFAULT '0 2 * * *',
    last_run TEXT,
    next_run TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Ensure default config exists
const defaultConfig = db.prepare(`
  INSERT OR IGNORE INTO cronjob_config (id, enabled, retention_days, schedule) 
  VALUES (1, 0, 30, '0 2 * * *')
`);
defaultConfig.run();

let currentCronJob: CronJob | null = null;

function calculateNextRun(cronSchedule: string): string | null {
  try {
    const job = new CronJob(cronSchedule, () => {}, null, false);
    const nextDate = job.nextDates(1)[0];
    return nextDate ? new Date(nextDate.toString()).toISOString() : null;
  } catch (error) {
    return null;
  }
}

function setupCronJob(config: any) {
  // Stop existing job
  if (currentCronJob) {
    currentCronJob.stop();
    currentCronJob = null;
  }

  if (!config.enabled) return;

  try {
    currentCronJob = new CronJob(
      config.schedule,
      async () => {
        console.log("Running scheduled cleanup...");
        await performCleanup(config.retention_days);

        // Update last run time
        const updateStmt = db.prepare(`
          UPDATE cronjob_config 
          SET last_run = CURRENT_TIMESTAMP 
          WHERE id = 1
        `);
        updateStmt.run();
      },
      null,
      true
    );

    console.log(`Cron job scheduled: ${config.schedule}`);
  } catch (error) {
    console.error("Failed to setup cron job:", error);
  }
}

async function performCleanup(
  retentionDays: number
): Promise<{ deleted: number }> {
  const logDir = path.join(process.cwd(), "logs");
  let deletedCount = 0;

  try {
    if (!fs.existsSync(logDir)) {
      return { deleted: 0 };
    }

    const files = fs.readdirSync(logDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted old log file: ${file}`);
      }
    }

    // Also clean up database entries
    const deleteStmt = db.prepare(`
      DELETE FROM logs 
      WHERE created_at < datetime('now', '-${retentionDays} days')
    `);
    const result = deleteStmt.run();

    console.log(
      `Cleanup completed: ${deletedCount} files deleted, ${result.changes} DB entries removed`
    );
    return { deleted: deletedCount + Number(result.changes) };
  } catch (error) {
    console.error("Cleanup failed:", error);
    throw error;
  }
}

// Initialize cron job on startup
const initConfig = db
  .prepare("SELECT * FROM cronjob_config WHERE id = 1")
  .get();
if (initConfig) {
  setupCronJob(initConfig);
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const config = db
      .prepare("SELECT * FROM cronjob_config WHERE id = 1")
      .get();

    if (config) {
      // Calculate next run time
      const nextRun = calculateNextRun(config.schedule);

      return NextResponse.json({
        success: true,
        data: {
          enabled: Boolean(config.enabled),
          retention_days: config.retention_days,
          schedule: config.schedule,
          last_run: config.last_run,
          next_run: nextRun,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: "Configuration not found",
    });
  } catch (error) {
    console.error("Error getting cronjob config:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enabled, retention_days, schedule } = body;

    // Validate inputs
    if (
      typeof enabled !== "boolean" ||
      typeof retention_days !== "number" ||
      retention_days < 1 ||
      retention_days > 365 ||
      typeof schedule !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid configuration parameters",
        },
        { status: 400 }
      );
    }

    // Validate cron schedule
    try {
      new CronJob(schedule, () => {}, null, false);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cron schedule format",
        },
        { status: 400 }
      );
    }

    // Calculate next run time
    const nextRun = calculateNextRun(schedule);

    // Update database
    const updateStmt = db.prepare(`
      UPDATE cronjob_config 
      SET enabled = ?, retention_days = ?, schedule = ?, next_run = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `);

    updateStmt.run(enabled ? 1 : 0, retention_days, schedule, nextRun);

    // Setup new cron job
    const newConfig = { enabled, retention_days, schedule };
    setupCronJob(newConfig);

    return NextResponse.json({
      success: true,
      message: "Configuration updated successfully",
      data: {
        enabled,
        retention_days,
        schedule,
        next_run: nextRun,
      },
    });
  } catch (error) {
    console.error("Error updating cronjob config:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
