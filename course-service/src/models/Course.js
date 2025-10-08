const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, "Course code is required"],
    unique: true,
    uppercase: true,
    trim: true,
    match: [
      /^[A-Z]{2,4}\d{3,4}$/,
      "Course code must be in format like MATH101 or CS1001",
    ],
  },
  title: {
    type: String,
    required: [true, "Course title is required"],
    trim: true,
    maxlength: [200, "Course title cannot exceed 200 characters"],
  },
  description: {
    type: String,
    required: [true, "Course description is required"],
    maxlength: [2000, "Course description cannot exceed 2000 characters"],
  },
  department: {
    type: String,
    required: [true, "Department is required"],
    trim: true,
    maxlength: [100, "Department name cannot exceed 100 characters"],
  },
  credits: {
    type: Number,
    required: [true, "Credits are required"],
    min: [1, "Credits must be at least 1"],
    max: [10, "Credits cannot exceed 10"],
  },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  prerequisites: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      courseCode: String,
      title: String,
    },
  ],
  syllabus: {
    objectives: [String],
    topics: [
      {
        week: Number,
        topic: String,
        description: String,
      },
    ],
    textbooks: [
      {
        title: String,
        author: String,
        isbn: String,
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],
    assessmentMethods: [
      {
        type: {
          type: String,
          enum: ["exam", "quiz", "assignment", "project", "presentation"],
        },
        weight: {
          type: Number,
          min: 0,
          max: 100,
        },
        description: String,
      },
    ],
  },
  instructor: {
    teacherId: {
      type: String,
      required: [true, "Instructor ID is required"],
    },
    name: String,
    email: String,
  },
  capacity: {
    max: {
      type: Number,
      required: [true, "Maximum capacity is required"],
      min: [1, "Maximum capacity must be at least 1"],
    },
    enrolled: {
      type: Number,
      default: 0,
      min: [0, "Enrolled count cannot be negative"],
    },
    waitlist: {
      type: Number,
      default: 0,
      min: [0, "Waitlist count cannot be negative"],
    },
  },
  schedule: {
    semester: {
      type: String,
      required: [true, "Semester is required"],
      enum: ["spring", "summer", "fall", "winter"],
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [2020, "Year must be 2020 or later"],
    },
    timeSlots: [
      {
        day: {
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
        startTime: String, // Format: "09:00"
        endTime: String, // Format: "10:30"
        room: String,
        building: String,
      },
    ],
  },
  status: {
    type: String,
    enum: ["draft", "published", "ongoing", "completed", "cancelled"],
    default: "draft",
  },
  settings: {
    isVisible: {
      type: Boolean,
      default: true,
    },
    allowWaitlist: {
      type: Boolean,
      default: true,
    },
    autoEnroll: {
      type: Boolean,
      default: false,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
  },
  statistics: {
    totalEnrolled: {
      type: Number,
      default: 0,
    },
    averageGrade: Number,
    completionRate: Number,
    satisfactionRating: Number,
  },
  resources: [
    {
      type: {
        type: String,
        enum: ["document", "video", "link", "assignment"],
      },
      title: String,
      url: String,
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
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
courseSchema.index({ courseCode: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ "instructor.teacherId": 1 });
courseSchema.index({ "schedule.semester": 1, "schedule.year": 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ level: 1 });

// Pre-save middleware
courseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Validate that enrolled count doesn't exceed capacity
courseSchema.pre("save", function (next) {
  if (this.capacity.enrolled > this.capacity.max) {
    next(new Error("Enrolled count cannot exceed maximum capacity"));
  }
  next();
});

// Virtual for availability
courseSchema.virtual("availability").get(function () {
  return this.capacity.max - this.capacity.enrolled;
});

// Virtual for full course name
courseSchema.virtual("fullName").get(function () {
  return `${this.courseCode} - ${this.title}`;
});

// Method to check if course is full
courseSchema.methods.isFull = function () {
  return this.capacity.enrolled >= this.capacity.max;
};

// Method to check if prerequisites are met
courseSchema.methods.checkPrerequisites = function (completedCourses) {
  if (!this.prerequisites || this.prerequisites.length === 0) {
    return true;
  }

  const completedCourseIds = completedCourses.map((course) =>
    course._id.toString()
  );
  return this.prerequisites.every((prereq) =>
    completedCourseIds.includes(prereq.courseId.toString())
  );
};

// Static method to find courses by instructor
courseSchema.statics.findByInstructor = function (teacherId) {
  return this.find({ "instructor.teacherId": teacherId });
};

// Static method to find available courses
courseSchema.statics.findAvailable = function () {
  return this.find({
    status: "published",
    "settings.isVisible": true,
    $expr: { $lt: ["$capacity.enrolled", "$capacity.max"] },
  });
};

// Ensure virtual fields are serialized
courseSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Course", courseSchema);
