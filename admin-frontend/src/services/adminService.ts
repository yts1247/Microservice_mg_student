import { ApiService } from "./api";

export class AdminService {
  // Generic HTTP methods for admin operations
  static async get<T = unknown>(endpoint: string): Promise<T> {
    try {
      return await ApiService.get<T>(endpoint);
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  }

  static async post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    try {
      return await ApiService.post<T>(endpoint, data);
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  }

  static async put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    try {
      return await ApiService.put<T>(endpoint, data);
    } catch (error) {
      console.error(`PUT ${endpoint} error:`, error);
      throw error;
    }
  }

  static async delete<T = unknown>(endpoint: string): Promise<T> {
    try {
      return await ApiService.delete<T>(endpoint);
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  }

  // Admin specific methods
  static async getRoles() {
    return this.get("/api/admin/roles");
  }

  static async getPermissions() {
    return this.get("/api/admin/permissions");
  }

  static async createPermission(data: {
    resource: string;
    action: string;
    description?: string;
  }) {
    return this.post("/api/admin/permissions", data);
  }

  static async updatePermission(
    id: string,
    data: { resource: string; action: string; description?: string }
  ) {
    return this.put(`/api/admin/permissions/${id}`, data);
  }

  static async deletePermission(id: string) {
    return this.delete(`/api/admin/permissions/${id}`);
  }

  // Schedule operations
  static async getSchedules() {
    return this.get("/api/admin/schedules");
  }

  static async createSchedule(data: unknown) {
    return this.post("/api/admin/schedules", data);
  }

  static async updateSchedule(id: string, data: unknown) {
    return this.put(`/api/admin/schedules/${id}`, data);
  }

  static async deleteSchedule(id: string) {
    return this.delete(`/api/admin/schedules/${id}`);
  }

  // Course operations
  static async getCourses() {
    return this.get("/api/admin/courses");
  }

  static async createCourse(data: unknown) {
    return this.post("/api/admin/courses", data);
  }

  static async updateCourse(id: string, data: unknown) {
    return this.put(`/api/admin/courses/${id}`, data);
  }

  static async deleteCourse(id: string) {
    return this.delete(`/api/admin/courses/${id}`);
  }

  // Enrollment operations
  static async getEnrollments() {
    return this.get("/api/admin/enrollments");
  }

  static async createEnrollment(data: unknown) {
    return this.post("/api/admin/enrollments", data);
  }

  static async updateEnrollment(id: string, data: unknown) {
    return this.put(`/api/admin/enrollments/${id}`, data);
  }

  static async deleteEnrollment(id: string) {
    return this.delete(`/api/admin/enrollments/${id}`);
  }

  static async createRole(data: unknown) {
    return this.post("/api/admin/roles", data);
  }

  static async updateRole(id: string, data: unknown) {
    return this.put(`/api/admin/roles/${id}`, data);
  }

  static async deleteRole(id: string) {
    return this.delete(`/api/admin/roles/${id}`);
  }

  static async updateUserRoles(userId: string, roles: string[]) {
    return this.put(`/api/admin/users/${userId}/roles`, { roles });
  }

  static async getSystemStats() {
    return this.get("/api/admin/stats");
  }

  static async scanLogs(params?: Record<string, string | number>) {
    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
        ).toString()}`
      : "";
    return this.get(`/api/admin/logs/scan${query}`);
  }

  static async getLogServices() {
    return this.get("/api/admin/logs/services");
  }
}

// Export singleton instance
export const adminService = AdminService;
