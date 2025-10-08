import { Document } from "mongoose";

export type EnrollmentStatus =
  | "pending"
  | "enrolled"
  | "waitlisted"
  | "dropped"
  | "completed"
  | "failed";
export type SemesterType = "spring" | "summer" | "fall" | "winter";
export type EnrollmentType = "regular" | "audit" | "credit" | "pass-fail";
export type LetterGrade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "F"
  | "I"
  | "W"
  | "P"
  | "NP";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface IStudent {
  studentId: string;
  name: string;
  email: string;
}

export interface ICourse {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  credits: number;
  instructor: string;
}

export interface IEnrollmentInfo {
  enrollmentDate: Date;
  status: EnrollmentStatus;
  semester: SemesterType;
  year: number;
  enrollmentType: EnrollmentType;
}

export interface IAssignment {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  submittedAt?: Date;
  gradedAt?: Date;
  feedback?: string;
}

export interface IExam {
  score: number;
  maxScore: number;
  weight: number;
  date?: Date;
}

export interface IOverallGrade {
  percentage: number;
  letterGrade: LetterGrade;
  gpa: number;
}

export interface IGrades {
  assignments: IAssignment[];
  midterm?: IExam;
  final?: IExam;
  overall: IOverallGrade;
}

export interface IAttendanceRecord {
  date: Date;
  status: AttendanceStatus;
  notes?: string;
}

export interface IAttendance {
  totalClasses: number;
  attendedClasses: number;
  attendanceRate: number;
  records: IAttendanceRecord[];
}

export interface IMilestone {
  name: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface IProgress {
  completedAssignments: number;
  totalAssignments: number;
  completionRate: number;
  currentWeek: number;
  milestones: IMilestone[];
}

export interface ITuitionFee {
  amount: number;
  currency: string;
  paid: boolean;
  paidAt?: Date;
  paymentMethod?: string;
}

export interface IAdditionalFee {
  type: string;
  amount: number;
  description: string;
  paid: boolean;
  paidAt?: Date;
}

export interface IPayments {
  tuitionFee: ITuitionFee;
  additionalFees: IAdditionalFee[];
  totalAmount: number;
  totalPaid: number;
  balance: number;
}

export interface IPrerequisiteCourse {
  courseId: string;
  courseCode: string;
  completed: boolean;
  grade?: string;
}

export interface IPrerequisites {
  met: boolean;
  required: IPrerequisiteCourse[];
  waived: boolean;
  waivedBy?: string;
  waiverReason?: string;
}

export interface IScheduleConflict {
  conflictWith: string;
  description: string;
  resolved: boolean;
}

export interface ITimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  building: string;
}

export interface ISchedule {
  conflicts: IScheduleConflict[];
  timeSlots: ITimeSlot[];
}

export interface INotificationSettings {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface IMessage {
  from: string;
  to: string;
  subject: string;
  content: string;
  sentAt: Date;
  read: boolean;
}

export interface ICommunication {
  notifications: INotificationSettings;
  lastNotificationSent?: Date;
  messages: IMessage[];
}

export interface IMetadata {
  enrolledBy: string; // admin, self, or system
  priority: number; // higher number = higher priority for waitlist
  tags: string[];
  notes?: string;
  lastUpdated: Date;
  version: number;
}

export interface IEnrollment {
  _id?: string;
  student: IStudent;
  course: ICourse;
  enrollment: IEnrollmentInfo;
  grades: IGrades;
  attendance: IAttendance;
  progress: IProgress;
  payments: IPayments;
  prerequisites: IPrerequisites;
  schedule: ISchedule;
  communication: ICommunication;
  metadata: IMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEnrollmentDocument extends IEnrollment, Document {
  _id: string;
  calculatedGPA: number;
  isActive(): boolean;
  calculateFinalGrade(): IOverallGrade;
  getLetterGrade(percentage: number): LetterGrade;
}

export interface IEnrollmentRequest {
  studentId: string;
  courseId: string;
  semester: SemesterType;
  year: number;
  enrollmentType?: EnrollmentType;
  metadata?: Partial<IMetadata>;
}

export interface IEnrollmentQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  studentId?: string;
  courseId?: string;
  status?: EnrollmentStatus;
  semester?: SemesterType;
  year?: string;
  enrollmentType?: EnrollmentType;
}

export interface IEnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  completedEnrollments: number;
  droppedEnrollments: number;
  waitlistedEnrollments: number;
  averageGPA: number;
  statusDistribution: Array<{ _id: EnrollmentStatus; count: number }>;
  semesterDistribution: Array<{ _id: string; count: number }>;
  gradeDistribution: Array<{ _id: LetterGrade; count: number }>;
}

export interface IGradeUpdate {
  type: "assignment" | "midterm" | "final";
  assignmentIndex?: number;
  score: number;
  maxScore: number;
  weight?: number;
  feedback?: string;
  date?: Date;
}

export interface IAttendanceUpdate {
  date: Date;
  status: AttendanceStatus;
  notes?: string;
}
