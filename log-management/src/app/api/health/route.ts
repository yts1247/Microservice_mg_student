import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "log-management-system",
      version: "1.0.0",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Service check failed",
      },
      { status: 500 }
    );
  }
}
