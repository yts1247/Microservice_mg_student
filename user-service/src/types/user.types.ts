export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
  isActive: boolean;
  lastLogin?: Date;
  profile: IProfile;
  studentInfo?: IStudentInfo;
  teacherInfo?: ITeacherInfo;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

export interface IProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: IAddress;
  dateOfBirth?: Date;
  avatar?: string;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface IStudentInfo {
  studentId: string;
  major?: string;
  year?: number;
  gpa?: number;
  enrollmentDate?: Date;
  status: "active" | "inactive" | "graduated" | "suspended";
}

export interface ITeacherInfo {
  teacherId: string;
  department?: string;
  position?: string;
  specialization?: string[];
  hireDate?: Date;
  office?: string;
  phoneExtension?: string;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
  role: "student" | "teacher" | "admin";
  profile: IProfile;
  studentInfo?: Partial<IStudentInfo>;
  teacherInfo?: Partial<ITeacherInfo>;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Partial<IUser>;
    token: string;
  };
}

export interface IUserQuery {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: {
      current: number;
      total: number;
      pages: number;
      limit: number;
    };
  };
}

export interface IUserStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
}

// Mongoose Document interface
export interface IUserDocument extends IUser, IUserMethods {
  _id: string;
  save(): Promise<IUserDocument>;
  toJSON(): Partial<IUser>;
  isModified(path: string): boolean;
  toObject(): any;
}
