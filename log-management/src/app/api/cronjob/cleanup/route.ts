import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const db = new Database("./logs.db");

async function performCleanup(
  retentionDays: number
): Promise<{ filesDeleted: number; entriesDeleted: number }> {
  const logDir = path.join(process.cwd(), "logs");
  let filesDeleted = 0;
  let entriesDeleted = 0;

  try {
    // Clean up log files
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      for (const file of files) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          filesDeleted++;
          console.log(`Deleted old log file: ${file}`);
        }
      }
    }

    // Clean up database entries
    const deleteStmt = db.prepare(`
      DELETE FROM logs 
      WHERE created_at < datetime('now', '-${retentionDays} days')
    `);
    const result = deleteStmt.run();
    entriesDeleted = Number(result.changes);

    console.log(
      `Manual cleanup completed: ${filesDeleted} files deleted, ${entriesDeleted} DB entries removed`
    );

    return { filesDeleted, entriesDeleted };
  } catch (error) {
    console.error("Manual cleanup failed:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current retention days from config
    const config = db
      .prepare("SELECT retention_days FROM cronjob_config WHERE id = 1")
      .get() as any;
    const retentionDays = config?.retention_days || 30;

    const result = await performCleanup(retentionDays);

    // Update last run time in config
    const updateStmt = db.prepare(`
      UPDATE cronjob_config 
      SET last_run = CURRENT_TIMESTAMP 
      WHERE id = 1
    `);
    updateStmt.run();

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${result.filesDeleted} files and ${result.entriesDeleted} database entries removed`,
      data: result,
    });
  } catch (error) {
    console.error("Error running manual cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cleanup operation failed",
      },
      { status: 500 }
    );
  }
}
