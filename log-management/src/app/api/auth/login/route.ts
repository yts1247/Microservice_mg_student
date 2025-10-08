import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbManager from "@/lib/database";
import { LoginCredentials, AuthResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const db = dbManager.getDatabase();
    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login
    db.prepare(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        last_login: user.last_login,
      },
      token,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
