import { ApiService } from "./api";

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
}
