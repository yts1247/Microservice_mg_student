import mongoose, { Schema, Model, Document } from "mongoose";
import {
  ICourse,
  ICourseMethods,
  ICourseDocument,
} from "../types/course.types";

interface ICourseModel extends Model<ICourseDocument> {
  findByInstructor(teacherId: string): Promise<ICourseDocument[]>;
  findAvailable(): Promise<ICourseDocument[]>;
}

const courseSchema = new Schema<ICourseDocument>(
  {
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
    prerequisites: [String],
    syllabus: [String],
    materials: [String],
    instructor: {
      userId: {
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
      current: {
        type: Number,
        default: 0,
        min: [0, "Current enrollment cannot be negative"],
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
      startDate: Date,
      endDate: Date,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
courseSchema.index({ courseCode: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ "instructor.userId": 1 });
courseSchema.index({ "schedule.semester": 1, "schedule.year": 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ level: 1 });

// Pre-save middleware
courseSchema.pre<ICourseDocument>(
  "save",
  function (this: ICourseDocument, next: any) {
    this.updatedAt = new Date();
    next();
  }
);

// Validate that current enrollment doesn't exceed capacity
courseSchema.pre<ICourseDocument>(
  "save",
  function (this: ICourseDocument, next: any) {
    if (this.capacity.current > this.capacity.max) {
      next(new Error("Current enrollment cannot exceed maximum capacity"));
      return;
    }
    next();
  }
);

// Virtual for availability
courseSchema.virtual("availability").get(function (this: ICourseDocument) {
  return this.capacity.max - this.capacity.current;
});

// Virtual for full course name
courseSchema.virtual("fullName").get(function (this: ICourseDocument) {
  return `${this.courseCode} - ${this.title}`;
});

// Instance method to check if enrollment is open
courseSchema.methods.isEnrollmentOpen = function (
  this: ICourseDocument
): boolean {
  return (
    this.status === "published" &&
    this.isActive &&
    this.capacity.current < this.capacity.max
  );
};

// Instance method to get available spots
courseSchema.methods.getAvailableSpots = function (
  this: ICourseDocument
): number {
  return Math.max(0, this.capacity.max - this.capacity.current);
};

// Instance method to get JSON representation
courseSchema.methods.toJSON = function (
  this: ICourseDocument
): Partial<ICourse> {
  const courseObject = this.toObject();
  delete courseObject.__v;
  return courseObject;
};

// Static method to find courses by instructor
courseSchema.statics.findByInstructor = function (teacherId: string) {
  return this.find({ "instructor.userId": teacherId });
};

// Static method to find available courses
courseSchema.statics.findAvailable = function () {
  return this.find({
    status: "published",
    isActive: true,
    $expr: { $lt: ["$capacity.current", "$capacity.max"] },
  });
};

const Course = mongoose.model<ICourseDocument, ICourseModel>(
  "Course",
  courseSchema
);

export default Course;
