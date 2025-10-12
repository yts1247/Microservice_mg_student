import { ApiService } from "./api";
import {
  User,
  LoginResponse as RBACLoginResponse,
  UserPermissionsResponse,
} from "../types/rbac.types";

export interface LoginRequest {
  username: string; // email hoặc username
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  studentInfo?: {
    studentId?: string;
    grade?: string;
    major?: string;
  };
  teacherInfo?: {
    teacherId?: string;
    department?: string;
    subjects?: string[];
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: "student" | "teacher" | "admin";
    profile: {
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      phone?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      };
    };
    studentInfo?: {
      studentId?: string;
      grade?: string;
      major?: string;
    };
    teacherInfo?: {
      teacherId?: string;
      department?: string;
      subjects?: string[];
    };
  };
}

export interface ProfileUpdateRequest {
  profile: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    return ApiService.post<LoginResponse>("/users/login", credentials);
  }

  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    return ApiService.post<LoginResponse>("/users/register", userData);
  }

  static async logout(): Promise<{ success: boolean; message: string }> {
    return ApiService.post<{ success: boolean; message: string }>(
      "/users/logout"
    );
  }

  static async getProfile(): Promise<LoginResponse["user"]> {
    return ApiService.get<LoginResponse["user"]>("/users/profile");
  }

  static async updateProfile(
    data: ProfileUpdateRequest
  ): Promise<LoginResponse["user"]> {
    return ApiService.put<LoginResponse["user"]>("/users/profile", data);
  }

  static async changePassword(
    data: ChangePasswordRequest
  ): Promise<{ success: boolean; message: string }> {
    return ApiService.put<{ success: boolean; message: string }>(
      "/users/change-password",
      data
    );
  }

  // RBAC Methods
  static getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem("userData");
      if (userData) {
        return JSON.parse(userData) as User;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("userData");
    }
    return null;
  }

  static getToken(): string | null {
    return localStorage.getItem("authToken");
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  static async getUserPermissions(userId?: string): Promise<string[]> {
    try {
      const endpoint = userId
        ? `/auth/permissions/${userId}`
        : "/auth/permissions";
      const response = await ApiService.get<UserPermissionsResponse>(endpoint);

      if (response.success) {
        return response.permissions || [];
      }
    } catch (error) {
      console.error("Failed to get user permissions:", error);
    }
    return [];
  }

  static async checkPermission(
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      const response = await ApiService.post<{ allowed: boolean }>(
        "/auth/check-permission",
        {
          resource,
          action,
        }
      );
      return response.allowed;
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  }

  static async assignRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const response = await ApiService.post<{ success: boolean }>(
        "/auth/assign-role",
        {
          userId,
          roleId,
        }
      );
      return response.success;
    } catch (error) {
      console.error("Role assignment error:", error);
      return false;
    }
  }

  static async removeRole(userId: string, roleId: string): Promise<boolean> {
    try {
      const response = await ApiService.delete<{ success: boolean }>(
        `/auth/remove-role/${userId}/${roleId}`
      );
      return response.success;
    } catch (error) {
      console.error("Role removal error:", error);
      return false;
    }
  }

  // Generic HTTP methods for admin operations
  static async get<T = any>(endpoint: string): Promise<T> {
    try {
      return await ApiService.get<T>(endpoint);
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  }

  static async post<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      return await ApiService.post<T>(endpoint, data);
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  }

  static async put<T = any>(endpoint: string, data?: any): Promise<T> {
    try {
      return await ApiService.put<T>(endpoint, data);
    } catch (error) {
      console.error(`PUT ${endpoint} error:`, error);
      throw error;
    }
  }

  static async delete<T = any>(endpoint: string): Promise<T> {
    try {
      return await ApiService.delete<T>(endpoint);
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  }
}


// Export singleton instance
export const authService = AuthService;
