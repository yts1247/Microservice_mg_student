export interface ICourse {
  _id?: string;
  courseCode: string;
  title: string;
  description: string;
  department: string;
  credits: number;
  level: "beginner" | "intermediate" | "advanced";
  instructor: {
    userId: string;
    name: string;
    email: string;
  };
  capacity: {
    max: number;
    current: number;
  };
  schedule: {
    semester: string;
    year: number;
    startDate?: Date;
    endDate?: Date;
  };
  syllabus?: string[];
  prerequisites?: string[];
  materials?: string[];
  status: "draft" | "published" | "archived";
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourseMethods {
  isEnrollmentOpen(): boolean;
  getAvailableSpots(): number;
  toJSON(): Partial<ICourse>;
}

export interface ICourseDocument extends ICourse, ICourseMethods {
  _id: string;
  save(): Promise<ICourseDocument>;
  toJSON(): Partial<ICourse>;
  isModified(path: string): boolean;
  toObject(): any;
}

export interface ICourseRequest {
  courseCode: string;
  title: string;
  description: string;
  department: string;
  credits: number;
  level?: "beginner" | "intermediate" | "advanced";
  instructor: {
    userId: string;
    name: string;
    email: string;
  };
  capacity: {
    max: number;
  };
  schedule: {
    semester: string;
    year: number;
    startDate?: Date;
    endDate?: Date;
  };
  syllabus?: string[];
  prerequisites?: string[];
  materials?: string[];
}

export interface ICourseQuery {
  page?: number;
  limit?: number;
  department?: string;
  level?: string;
  semester?: string;
  year?: number;
  search?: string;
  instructor?: string;
  status?: string;
}

export interface ICourseStats {
  totalCourses: number;
  activeCourses: number;
  draftCourses: number;
  publishedCourses: number;
  archivedCourses: number;
  averageEnrollment: number;
  departmentDistribution: Array<{ _id: string; count: number }>;
}
