import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: "student" | "teacher" | "admin";
}

export interface AuthRequest extends NextRequest {
  user?: AuthUser;
}

// Middleware to check if user is authenticated
export function authenticateToken(request: NextRequest): AuthUser | null {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return null;
    }

    // In a real application, you would verify the token with the same secret used by user-service
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Middleware to check if user has admin role
export function requireAdminRole(user: AuthUser | null): boolean {
  return user !== null && user.role === "admin";
}

// Combined middleware for admin-only endpoints
export function withAdminAuth(
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = authenticateToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!requireAdminRole(user)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Admin privileges required for log management.",
        },
        { status: 403 }
      );
    }

    return handler(request, user);
  };
}

// Response helper functions
export const unauthorizedResponse = () => {
  return NextResponse.json(
    { success: false, message: "Authentication required" },
    { status: 401 }
  );
};

export const forbiddenResponse = (message?: string) => {
  return NextResponse.json(
    {
      success: false,
      message: message || "Access denied. Admin privileges required.",
    },
    { status: 403 }
  );
};

export const successResponse = (data: any, message?: string) => {
  return NextResponse.json({
    success: true,
    message: message || "Operation successful",
    data,
  });
};

export const errorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ success: false, message }, { status });
};
