import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export interface AuthResult {
  success: boolean;
  user?: {
    userId: number;
    username: string;
    role: string;
  };
  error?: string;
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, error: "No token provided" };
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as any;

      return {
        success: true,
        user: {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
        },
      };
    } catch (jwtError) {
      return { success: false, error: "Invalid token" };
    }
  } catch (error) {
    return { success: false, error: "Authentication failed" };
  }
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await verifyToken(request);

    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 });
    }

    // Add user to request context
    (request as any).user = authResult.user;

    return handler(request, context);
  };
}

export function requireAdmin(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await verifyToken(request);

    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 });
    }

    if (authResult.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Add user to request context
    (request as any).user = authResult.user;

    return handler(request, context);
  };
}
