import { ApiService } from "./api";

export interface User {
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
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
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

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: "student" | "teacher" | "admin";
  profile?: {
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

export interface UsersListResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface UserStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsersThisMonth: number;
  };
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "student" | "teacher" | "admin";
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class UserService {
  static async getUsers(params?: UsersQueryParams): Promise<UsersListResponse> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString());
        }
      });
    }
    return ApiService.get<UsersListResponse>(`/users?${query.toString()}`);
  }

  static async getUserStats(): Promise<UserStatsResponse> {
    return ApiService.get<UserStatsResponse>("/users/stats");
  }

  static async getUserById(
    id: string
  ): Promise<{ success: boolean; data: User }> {
    return ApiService.get<{ success: boolean; data: User }>(`/users/${id}`);
  }

  static async createUser(
    userData: CreateUserRequest
  ): Promise<{ success: boolean; data: User; message: string }> {
    return ApiService.post<{ success: boolean; data: User; message: string }>(
      "/users/register",
      userData
    );
  }

  static async updateUser(
    id: string,
    userData: UpdateUserRequest
  ): Promise<{ success: boolean; data: User; message: string }> {
    return ApiService.put<{ success: boolean; data: User; message: string }>(
      `/users/${id}`,
      userData
    );
  }

  static async activateUser(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return ApiService.put<{ success: boolean; message: string }>(
      `/users/${id}/activate`
    );
  }

  static async deactivateUser(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return ApiService.put<{ success: boolean; message: string }>(
      `/users/${id}/deactivate`
    );
  }
}
