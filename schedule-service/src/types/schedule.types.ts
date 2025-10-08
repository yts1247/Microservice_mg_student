import { Document } from "mongoose";

export type ScheduleType = "class" | "exam" | "event" | "meeting" | "holiday";
export type StudentStatus = "enrolled" | "attending" | "absent" | "excused";
export type RecurrencePattern =
  | "none"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly";
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
export type SemesterName = "spring" | "summer" | "fall" | "winter";
export type ScheduleStatus =
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "postponed";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type MaterialType =
  | "document"
  | "presentation"
  | "video"
  | "link"
  | "assignment";
export type SubmissionType = "online" | "physical" | "both";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface ICourse {
  courseId?: string;
  courseCode: string;
  courseTitle: string;
}

export interface IInstructor {
  teacherId: string;
  name: string;
  email: string;
}

export interface IStudent {
  studentId: string;
  name: string;
  email: string;
  status: StudentStatus;
}

export interface IParticipants {
  students: IStudent[];
  totalStudents: number;
}

export interface ITimeSlot {
  startTime: Date;
  endTime: Date;
  timezone: string;
  duration?: number; // in minutes
}

export interface IRecurrence {
  pattern: RecurrencePattern;
  daysOfWeek: DayOfWeek[];
  endDate?: Date;
  exceptions: Date[]; // dates to skip
}

export interface ILocation {
  room: string;
  building?: string;
  floor?: string;
  capacity?: number;
  facilities: string[]; // projector, whiteboard, computers, etc.
}

export interface ISemester {
  name: SemesterName;
  year: number;
  week?: number;
}

export interface IAttendanceRecord {
  studentId: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: AttendanceStatus;
  notes?: string;
}

export interface IAttendance {
  required: boolean;
  checkInTime?: Date;
  checkOutTime?: Date;
  attendanceRecords: IAttendanceRecord[];
}

export interface IMaterial {
  title: string;
  type: MaterialType;
  url?: string;
  description?: string;
  required: boolean;
}

export interface IAssignment {
  title: string;
  description?: string;
  dueDate: Date;
  points?: number;
  submissionType: SubmissionType;
}

export interface IEmailReminder {
  enabled: boolean;
  minutesBefore: number;
}

export interface ISmsReminder {
  enabled: boolean;
  minutesBefore: number;
}

export interface INotifications {
  emailReminder: IEmailReminder;
  smsReminder: ISmsReminder;
}

export interface IMetadata {
  createdBy: string;
  updatedBy?: string;
  tags: string[];
  priority: Priority;
  isPublic: boolean;
  color?: string;
}

export interface ISchedule {
  _id?: string;
  title: string;
  description?: string;
  type: ScheduleType;
  course?: ICourse;
  instructor?: IInstructor;
  participants: IParticipants;
  timeSlot: ITimeSlot;
  recurrence: IRecurrence;
  location: ILocation;
  semester: ISemester;
  status: ScheduleStatus;
  attendance: IAttendance;
  materials: IMaterial[];
  assignments: IAssignment[];
  notifications: INotifications;
  metadata: IMetadata;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IScheduleDocument extends ISchedule, Document {
  _id: string;
  calculateDuration(): number;
  isConflictWith(otherSchedule: IScheduleDocument): boolean;
  getNextOccurrence(): Date | null;
  getAllOccurrences(endDate?: Date): Date[];
  markAttendance(
    studentId: string,
    status: AttendanceStatus,
    notes?: string
  ): void;
  getAttendanceStats(): {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendanceRate: number;
  };
}

export interface IScheduleRequest {
  title: string;
  description?: string;
  type: ScheduleType;
  course?: ICourse;
  instructor?: IInstructor;
  timeSlot: ITimeSlot;
  recurrence?: Partial<IRecurrence>;
  location: ILocation;
  semester: ISemester;
  materials?: IMaterial[];
  assignments?: IAssignment[];
  notifications?: Partial<INotifications>;
  metadata?: Partial<IMetadata>;
}

export interface IScheduleQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  semester?: string;
  year?: string;
  week?: string;
  teacherId?: string;
  studentId?: string;
  room?: string;
  building?: string;
  startDate?: string;
  endDate?: string;
}

export interface IScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  scheduledCount: number;
  ongoingCount: number;
  completedCount: number;
  cancelledCount: number;
  postponedCount: number;
  averageAttendance: number;
  typeDistribution: Array<{ _id: ScheduleType; count: number }>;
  semesterDistribution: Array<{ _id: string; count: number }>;
  roomUtilization: Array<{ _id: string; count: number; utilization: number }>;
}
