const mongoose = require("mongoose");
const moment = require("moment-timezone");

const scheduleSchema = new mongoose.Schema({
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
    enum: ["class", "exam", "event", "meeting", "holiday"],
    required: [true, "Schedule type is required"],
  },
  course: {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
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
          enum: ["enrolled", "attending", "absent", "excused"],
          default: "enrolled",
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
      enum: ["none", "daily", "weekly", "biweekly", "monthly"],
      default: "none",
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
        ],
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
      enum: ["spring", "summer", "fall", "winter"],
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
    enum: ["scheduled", "ongoing", "completed", "cancelled", "postponed"],
    default: "scheduled",
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
          enum: ["present", "absent", "late", "excused"],
          default: "absent",
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
        enum: ["document", "presentation", "video", "link", "assignment"],
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
        enum: ["online", "physical", "both"],
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
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

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
  this.updatedAt = Date.now();

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

// Method to check for time conflicts
scheduleSchema.methods.hasConflictWith = function (otherSchedule) {
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

// Method to check if student has conflict
scheduleSchema.methods.hasStudentConflict = function (
  studentId,
  otherSchedules
) {
  const studentInThis = this.participants.students.some(
    (s) => s.studentId === studentId
  );

  if (!studentInThis) return false;

  return otherSchedules.some((schedule) => {
    const studentInOther = schedule.participants.students.some(
      (s) => s.studentId === studentId
    );
    return studentInOther && this.hasConflictWith(schedule);
  });
};

// Static method to find by time range
scheduleSchema.statics.findByTimeRange = function (startDate, endDate) {
  return this.find({
    "timeSlot.startTime": { $gte: startDate },
    "timeSlot.endTime": { $lte: endDate },
  });
};

// Static method to find by room
scheduleSchema.statics.findByRoom = function (room, date) {
  const startOfDay = moment(date).startOf("day").toDate();
  const endOfDay = moment(date).endOf("day").toDate();

  return this.find({
    "location.room": room,
    "timeSlot.startTime": { $gte: startOfDay, $lte: endOfDay },
  });
};

// Static method to find conflicts
scheduleSchema.statics.findConflicts = function (scheduleData) {
  return this.find({
    "location.room": scheduleData.location.room,
    "timeSlot.startTime": { $lt: scheduleData.timeSlot.endTime },
    "timeSlot.endTime": { $gt: scheduleData.timeSlot.startTime },
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

module.exports = mongoose.model("Schedule", scheduleSchema);
