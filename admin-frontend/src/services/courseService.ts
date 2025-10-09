import { ApiService } from "./api";

export interface Course {
  id: string;
  courseCode: string;
  title: string;
  description: string;
  department: string;
  credits: number;
  level: "beginner" | "intermediate" | "advanced";
  instructor: {
    teacherId: string;
    name: string;
    email: string;
  };
  capacity: {
    max: number;
    enrolled: number;
    waitlist: number;
  };
  schedule: {
    semester: "spring" | "summer" | "fall" | "winter";
    year: number;
    timeSlots: TimeSlot[];
  };
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

export interface TimeSlot {
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  startTime: string;
  endTime: string;
  room: string;
  building: string;
}

export interface CreateCourseRequest {
  courseCode: string;
  title: string;
  description: string;
  department: string;
  credits: number;
  level: "beginner" | "intermediate" | "advanced";
  capacity: {
    max: number;
  };
  schedule: {
    semester: "spring" | "summer" | "fall" | "winter";
    year: number;
    timeSlots: TimeSlot[];
  };
}

export interface UpdateCourseRequest {
  courseCode?: string;
  title?: string;
  description?: string;
  department?: string;
  credits?: number;
  level?: "beginner" | "intermediate" | "advanced";
  capacity?: {
    max?: number;
  };
  schedule?: {
    semester?: "spring" | "summer" | "fall" | "winter";
    year?: number;
    timeSlots?: TimeSlot[];
  };
  status?: "draft" | "published" | "ongoing" | "completed" | "cancelled";
}

export interface CoursesListResponse {
  success: boolean;
  data: {
    courses: Course[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface CourseStatsResponse {
  success: boolean;
  data: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    ongoingCourses: number;
    completedCourses: number;
    cancelledCourses: number;
    totalStudentsEnrolled: number;
    averageEnrollmentRate: number;
  };
}

export interface CoursesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  level?: "beginner" | "intermediate" | "advanced";
  status?: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  semester?: "spring" | "summer" | "fall" | "winter";
  year?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class CourseService {
  static async getCourses(
    params?: CoursesQueryParams
  ): Promise<CoursesListResponse> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString());
        }
      });
    }
    return ApiService.get<CoursesListResponse>(`/courses?${query.toString()}`);
  }

  static async getAvailableCourses(
    params?: CoursesQueryParams
  ): Promise<CoursesListResponse> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString());
        }
      });
    }
    return ApiService.get<CoursesListResponse>(
      `/courses/available?${query.toString()}`
    );
  }

  static async getCourseStats(): Promise<CourseStatsResponse> {
    return ApiService.get<CourseStatsResponse>("/courses/stats");
  }

  static async getCourseById(
    id: string
  ): Promise<{ success: boolean; data: Course }> {
    return ApiService.get<{ success: boolean; data: Course }>(`/courses/${id}`);
  }

  static async getMyCourses(): Promise<CoursesListResponse> {
    return ApiService.get<CoursesListResponse>("/courses/my/courses");
  }

  static async createCourse(
    courseData: CreateCourseRequest
  ): Promise<{ success: boolean; data: Course; message: string }> {
    return ApiService.post<{ success: boolean; data: Course; message: string }>(
      "/courses",
      courseData
    );
  }

  static async updateCourse(
    id: string,
    courseData: UpdateCourseRequest
  ): Promise<{ success: boolean; data: Course; message: string }> {
    return ApiService.put<{ success: boolean; data: Course; message: string }>(
      `/courses/${id}`,
      courseData
    );
  }

  static async deleteCourse(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return ApiService.delete<{ success: boolean; message: string }>(
      `/courses/${id}`
    );
  }
}
