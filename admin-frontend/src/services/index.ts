// Export all services from a single entry point
export { ApiService } from "./api";
export { AuthService } from "./authService";
export { UserService } from "./userService";
export { CourseService } from "./courseService";
export { DashboardService } from "./dashboardService";

// Export types
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ProfileUpdateRequest,
  ChangePasswordRequest,
} from "./authService";

export type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UsersListResponse,
  UserStatsResponse,
  UsersQueryParams,
} from "./userService";

export type {
  Course,
  TimeSlot,
  CreateCourseRequest,
  UpdateCourseRequest,
  CoursesListResponse,
  CourseStatsResponse,
  CoursesQueryParams,
} from "./courseService";

export type {
  DashboardStats,
  ChartData,
  RecentActivity,
  SystemMetrics,
  DeviceStats,
  DashboardData,
} from "./dashboardService";
