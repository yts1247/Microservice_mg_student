import mongoose, { Schema, Model } from "mongoose";
import moment from "moment-timezone";
import {
  ISchedule,
  IScheduleDocument,
  ScheduleType,
  StudentStatus,
  RecurrencePattern,
  DayOfWeek,
  SemesterName,
  ScheduleStatus,
  AttendanceStatus,
  MaterialType,
  SubmissionType,
  Priority,
} from "../types/schedule.types";

const scheduleSchema = new Schema<IScheduleDocument>(
  {
    title: {
      type: String,
      required: [true, "Schedule title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    type: {
      type: String,
      enum: ["class", "exam", "event", "meeting", "holiday"] as ScheduleType[],
      required: [true, "Schedule type is required"],
    },
    course: {
      courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
      courseCode: String,
      courseTitle: String,
    },
    instructor: {
      teacherId: String,
      name: String,
      email: String,
    },
    participants: {
      students: [
        {
          studentId: String,
          name: String,
          email: String,
          status: {
            type: String,
            enum: [
              "enrolled",
              "attending",
              "absent",
              "excused",
            ] as StudentStatus[],
            default: "enrolled" as StudentStatus,
          },
        },
      ],
      totalStudents: {
        type: Number,
        default: 0,
      },
    },
    timeSlot: {
      startTime: {
        type: Date,
        required: [true, "Start time is required"],
      },
      endTime: {
        type: Date,
        required: [true, "End time is required"],
      },
      timezone: {
        type: String,
        default: "Asia/Ho_Chi_Minh",
      },
      duration: Number, // in minutes
    },
    recurrence: {
      pattern: {
        type: String,
        enum: [
          "none",
          "daily",
          "weekly",
          "biweekly",
          "monthly",
        ] as RecurrencePattern[],
        default: "none" as RecurrencePattern,
      },
      daysOfWeek: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ] as DayOfWeek[],
        },
      ],
      endDate: Date,
      exceptions: [Date], // dates to skip
    },
    location: {
      room: {
        type: String,
        required: [true, "Room is required"],
      },
      building: String,
      floor: String,
      capacity: Number,
      facilities: [String], // projector, whiteboard, computers, etc.
    },
    semester: {
      name: {
        type: String,
        enum: ["spring", "summer", "fall", "winter"] as SemesterName[],
        required: [true, "Semester is required"],
      },
      year: {
        type: Number,
        required: [true, "Year is required"],
        min: [2020, "Year must be 2020 or later"],
      },
      week: {
        type: Number,
        min: 1,
        max: 52,
      },
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "ongoing",
        "completed",
        "cancelled",
        "postponed",
      ] as ScheduleStatus[],
      default: "scheduled" as ScheduleStatus,
    },
    attendance: {
      required: {
        type: Boolean,
        default: true,
      },
      checkInTime: Date,
      checkOutTime: Date,
      attendanceRecords: [
        {
          studentId: String,
          checkInTime: Date,
          checkOutTime: Date,
          status: {
            type: String,
            enum: [
              "present",
              "absent",
              "late",
              "excused",
            ] as AttendanceStatus[],
            default: "absent" as AttendanceStatus,
          },
          notes: String,
        },
      ],
    },
    materials: [
      {
        title: String,
        type: {
          type: String,
          enum: [
            "document",
            "presentation",
            "video",
            "link",
            "assignment",
          ] as MaterialType[],
        },
        url: String,
        description: String,
        required: {
          type: Boolean,
          default: false,
        },
      },
    ],
    assignments: [
      {
        title: String,
        description: String,
        dueDate: Date,
        points: Number,
        submissionType: {
          type: String,
          enum: ["online", "physical", "both"] as SubmissionType[],
        },
      },
    ],
    notifications: {
      emailReminder: {
        enabled: {
          type: Boolean,
          default: true,
        },
        minutesBefore: {
          type: Number,
          default: 30,
        },
      },
      smsReminder: {
        enabled: {
          type: Boolean,
          default: false,
        },
        minutesBefore: {
          type: Number,
          default: 15,
        },
      },
    },
    metadata: {
      createdBy: String,
      updatedBy: String,
      tags: [String],
      priority: {
        type: String,
        enum: ["low", "medium", "high", "urgent"] as Priority[],
        default: "medium" as Priority,
      },
      isPublic: {
        type: Boolean,
        default: true,
      },
      color: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
scheduleSchema.index({ "timeSlot.startTime": 1, "timeSlot.endTime": 1 });
scheduleSchema.index({ "course.courseId": 1 });
scheduleSchema.index({ "instructor.teacherId": 1 });
scheduleSchema.index({ "semester.year": 1, "semester.name": 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ type: 1 });
scheduleSchema.index({ "location.room": 1 });

// Pre-save middleware
scheduleSchema.pre("save", function (next) {
  // Calculate duration
  if (this.timeSlot.startTime && this.timeSlot.endTime) {
    const start = moment(this.timeSlot.startTime);
    const end = moment(this.timeSlot.endTime);
    this.timeSlot.duration = end.diff(start, "minutes");
  }

  // Calculate week number
  if (this.timeSlot.startTime && this.semester.year) {
    const startMoment = moment(this.timeSlot.startTime);
    this.semester.week = startMoment.week();
  }

  next();
});

// Validate that end time is after start time
scheduleSchema.pre("save", function (next) {
  if (this.timeSlot.startTime && this.timeSlot.endTime) {
    if (this.timeSlot.endTime <= this.timeSlot.startTime) {
      next(new Error("End time must be after start time"));
      return;
    }
  }
  next();
});

// Virtual for formatted time
scheduleSchema.virtual("formattedTime").get(function () {
  const timezone = this.timeSlot.timezone || "Asia/Ho_Chi_Minh";
  const start = moment(this.timeSlot.startTime).tz(timezone);
  const end = moment(this.timeSlot.endTime).tz(timezone);

  return {
    start: start.format("YYYY-MM-DD HH:mm"),
    end: end.format("YYYY-MM-DD HH:mm"),
    date: start.format("YYYY-MM-DD"),
    day: start.format("dddd"),
    timeRange: `${start.format("HH:mm")} - ${end.format("HH:mm")}`,
  };
});

// Virtual for attendance rate
scheduleSchema.virtual("attendanceRate").get(function () {
  if (
    !this.attendance.attendanceRecords ||
    this.attendance.attendanceRecords.length === 0
  ) {
    return 0;
  }

  const presentCount = this.attendance.attendanceRecords.filter(
    (record) => record.status === "present" || record.status === "late"
  ).length;

  return Math.round(
    (presentCount / this.attendance.attendanceRecords.length) * 100
  );
});

// Instance methods
scheduleSchema.methods.calculateDuration = function (): number {
  const start = moment(this.timeSlot.startTime);
  const end = moment(this.timeSlot.endTime);
  return end.diff(start, "minutes");
};

scheduleSchema.methods.isConflictWith = function (
  otherSchedule: IScheduleDocument
): boolean {
  // Check if same room
  if (this.location.room === otherSchedule.location.room) {
    const thisStart = moment(this.timeSlot.startTime);
    const thisEnd = moment(this.timeSlot.endTime);
    const otherStart = moment(otherSchedule.timeSlot.startTime);
    const otherEnd = moment(otherSchedule.timeSlot.endTime);

    // Check for time overlap
    return thisStart.isBefore(otherEnd) && thisEnd.isAfter(otherStart);
  }

  return false;
};

scheduleSchema.methods.getNextOccurrence = function (): Date | null {
  if (this.recurrence.pattern === "none") {
    return null;
  }

  // Implementation for recurring schedules
  const now = moment();
  const start = moment(this.timeSlot.startTime);

  if (this.recurrence.endDate && now.isAfter(this.recurrence.endDate)) {
    return null;
  }

  // Simple implementation - can be enhanced
  switch (this.recurrence.pattern) {
    case "daily":
      return start.add(1, "day").toDate();
    case "weekly":
      return start.add(1, "week").toDate();
    case "biweekly":
      return start.add(2, "weeks").toDate();
    case "monthly":
      return start.add(1, "month").toDate();
    default:
      return null;
  }
};

scheduleSchema.methods.getAllOccurrences = function (endDate?: Date): Date[] {
  const occurrences: Date[] = [];
  // Implementation for getting all occurrences - simplified
  occurrences.push(this.timeSlot.startTime);
  return occurrences;
};

scheduleSchema.methods.markAttendance = function (
  studentId: string,
  status: AttendanceStatus,
  notes?: string
): void {
  const existingRecord = this.attendance.attendanceRecords.find(
    (record: any) => record.studentId === studentId
  );

  if (existingRecord) {
    existingRecord.status = status;
    existingRecord.notes = notes;
    existingRecord.checkInTime = new Date();
  } else {
    this.attendance.attendanceRecords.push({
      studentId,
      status,
      notes,
      checkInTime: new Date(),
    });
  }
};

scheduleSchema.methods.getAttendanceStats = function () {
  const records = this.attendance.attendanceRecords;
  const total = records.length;

  if (total === 0) {
    return {
      totalStudents: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      attendanceRate: 0,
    };
  }

  const presentCount = records.filter(
    (r: any) => r.status === "present"
  ).length;
  const absentCount = records.filter((r: any) => r.status === "absent").length;
  const lateCount = records.filter((r: any) => r.status === "late").length;
  const excusedCount = records.filter(
    (r: any) => r.status === "excused"
  ).length;

  return {
    totalStudents: total,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    attendanceRate: Math.round(((presentCount + lateCount) / total) * 100),
  };
};

// Static methods
interface IScheduleModel extends Model<IScheduleDocument> {
  findByTimeRange(startDate: Date, endDate: Date): Promise<IScheduleDocument[]>;
  findByRoom(room: string, date: Date): Promise<IScheduleDocument[]>;
  findConflicts(scheduleData: Partial<ISchedule>): Promise<IScheduleDocument[]>;
}

scheduleSchema.statics.findByTimeRange = function (
  startDate: Date,
  endDate: Date
) {
  return this.find({
    "timeSlot.startTime": { $gte: startDate },
    "timeSlot.endTime": { $lte: endDate },
  });
};

scheduleSchema.statics.findByRoom = function (room: string, date: Date) {
  const startOfDay = moment(date).startOf("day").toDate();
  const endOfDay = moment(date).endOf("day").toDate();

  return this.find({
    "location.room": room,
    "timeSlot.startTime": { $gte: startOfDay, $lte: endOfDay },
  });
};

scheduleSchema.statics.findConflicts = function (
  scheduleData: Partial<ISchedule>
) {
  return this.find({
    "location.room": scheduleData.location?.room,
    "timeSlot.startTime": { $lt: scheduleData.timeSlot?.endTime },
    "timeSlot.endTime": { $gt: scheduleData.timeSlot?.startTime },
    status: { $nin: ["cancelled", "completed"] },
  });
};

// Ensure virtual fields are serialized
scheduleSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Schedule = mongoose.model<IScheduleDocument, IScheduleModel>(
  "Schedule",
  scheduleSchema
);

export default Schedule;
