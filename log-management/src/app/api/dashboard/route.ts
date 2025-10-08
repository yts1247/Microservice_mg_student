import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbManager from "@/lib/database";
import { logScanner } from "@/lib/logScanner";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service") || "all";

    const db = dbManager.getDatabase();

    // Get service statistics
    let servicesQuery = `
      SELECT 
        lf.service_name,
        COUNT(lf.id) as total_files,
        COALESCE(SUM(lf.file_size), 0) as total_size,
        COUNT(CASE WHEN le.level = 'error' THEN 1 END) as error_count,
        COUNT(CASE WHEN le.level = 'warn' THEN 1 END) as warn_count,
        COUNT(CASE WHEN le.level = 'info' THEN 1 END) as info_count,
        MAX(lf.last_modified) as last_activity
      FROM log_files lf
      LEFT JOIN log_entries le ON lf.id = le.file_id
      WHERE lf.is_archived = FALSE
    `;

    if (service !== "all") {
      servicesQuery += ` AND lf.service_name = ?`;
    }

    servicesQuery += ` GROUP BY lf.service_name ORDER BY lf.service_name`;

    const services =
      service !== "all"
        ? db.prepare(servicesQuery).all(service)
        : db.prepare(servicesQuery).all();

    // Get recent files
    let recentFilesQuery = `
      SELECT 
        lf.*,
        COUNT(CASE WHEN le.level = 'error' THEN 1 END) as error_count,
        COUNT(CASE WHEN le.level = 'warn' THEN 1 END) as warn_count,
        COUNT(CASE WHEN le.level = 'info' THEN 1 END) as info_count,
        COUNT(le.id) as total_entries
      FROM log_files lf
      LEFT JOIN log_entries le ON lf.id = le.file_id
      WHERE lf.is_archived = FALSE
    `;

    if (service !== "all") {
      recentFilesQuery += ` AND lf.service_name = ?`;
    }

    recentFilesQuery += `
      GROUP BY lf.id 
      ORDER BY lf.last_modified DESC 
      LIMIT 10
    `;

    const recentFiles =
      service !== "all"
        ? db.prepare(recentFilesQuery).all(service)
        : db.prepare(recentFilesQuery).all();

    // Calculate totals
    const totals = services.reduce(
      (acc: any, curr: any) => ({
        totalFiles: acc.totalFiles + curr.total_files,
        totalErrors: acc.totalErrors + curr.error_count,
        totalWarnings: acc.totalWarnings + curr.warn_count,
        totalInfo: acc.totalInfo + curr.info_count,
      }),
      {
        totalFiles: 0,
        totalErrors: 0,
        totalWarnings: 0,
        totalInfo: 0,
      }
    );

    const dashboardData = {
      services,
      recentFiles,
      totals,
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
