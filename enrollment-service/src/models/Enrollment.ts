import mongoose, { Schema, Model } from "mongoose";
import {
  IEnrollment,
  IEnrollmentDocument,
  EnrollmentStatus,
  SemesterType,
  EnrollmentType,
  LetterGrade,
  AttendanceStatus,
  IOverallGrade,
} from "../types/enrollment.types";

const enrollmentSchema = new Schema<IEnrollmentDocument>(
  {
    student: {
      studentId: {
        type: String,
        required: [true, "Student ID is required"],
      },
      name: String,
      email: String,
    },
    course: {
      courseId: {
        type: Schema.Types.ObjectId,
        required: [true, "Course ID is required"],
      },
      courseCode: String,
      courseTitle: String,
      credits: Number,
      instructor: String,
    },
    enrollment: {
      enrollmentDate: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: [
          "pending",
          "enrolled",
          "waitlisted",
          "dropped",
          "completed",
          "failed",
        ] as EnrollmentStatus[],
        default: "pending" as EnrollmentStatus,
      },
      semester: {
        type: String,
        enum: ["spring", "summer", "fall", "winter"] as SemesterType[],
        required: [true, "Semester is required"],
      },
      year: {
        type: Number,
        required: [true, "Year is required"],
        min: [2020, "Year must be 2020 or later"],
      },
      enrollmentType: {
        type: String,
        enum: ["regular", "audit", "credit", "pass-fail"] as EnrollmentType[],
        default: "regular" as EnrollmentType,
      },
    },
    grades: {
      assignments: [
        {
          name: String,
          score: Number,
          maxScore: Number,
          weight: Number,
          submittedAt: Date,
          gradedAt: Date,
          feedback: String,
        },
      ],
      midterm: {
        score: Number,
        maxScore: Number,
        weight: Number,
        date: Date,
      },
      final: {
        score: Number,
        maxScore: Number,
        weight: Number,
        date: Date,
      },
      overall: {
        percentage: Number,
        letterGrade: {
          type: String,
          enum: [
            "A+",
            "A",
            "A-",
            "B+",
            "B",
            "B-",
            "C+",
            "C",
            "C-",
            "D+",
            "D",
            "F",
            "I",
            "W",
            "P",
            "NP",
          ] as LetterGrade[],
        },
        gpa: Number,
      },
    },
    attendance: {
      totalClasses: {
        type: Number,
        default: 0,
      },
      attendedClasses: {
        type: Number,
        default: 0,
      },
      attendanceRate: {
        type: Number,
        default: 0,
      },
      records: [
        {
          date: Date,
          status: {
            type: String,
            enum: [
              "present",
              "absent",
              "late",
              "excused",
            ] as AttendanceStatus[],
          },
          notes: String,
        },
      ],
    },
    progress: {
      completedAssignments: {
        type: Number,
        default: 0,
      },
      totalAssignments: {
        type: Number,
        default: 0,
      },
      completionRate: {
        type: Number,
        default: 0,
      },
      currentWeek: {
        type: Number,
        default: 1,
      },
      milestones: [
        {
          name: String,
          description: String,
          dueDate: Date,
          completed: {
            type: Boolean,
            default: false,
          },
          completedAt: Date,
        },
      ],
    },
    payments: {
      tuitionFee: {
        amount: Number,
        currency: {
          type: String,
          default: "VND",
        },
        paid: {
          type: Boolean,
          default: false,
        },
        paidAt: Date,
        paymentMethod: String,
      },
      additionalFees: [
        {
          type: String,
          amount: Number,
          description: String,
          paid: {
            type: Boolean,
            default: false,
          },
          paidAt: Date,
        },
      ],
      totalAmount: Number,
      totalPaid: Number,
      balance: Number,
    },
    prerequisites: {
      met: {
        type: Boolean,
        default: false,
      },
      required: [
        {
          courseId: Schema.Types.ObjectId,
          courseCode: String,
          completed: {
            type: Boolean,
            default: false,
          },
          grade: String,
        },
      ],
      waived: {
        type: Boolean,
        default: false,
      },
      waivedBy: String,
      waiverReason: String,
    },
    schedule: {
      conflicts: [
        {
          conflictWith: String,
          description: String,
          resolved: {
            type: Boolean,
            default: false,
          },
        },
      ],
      timeSlots: [
        {
          day: String,
          startTime: String,
          endTime: String,
          room: String,
          building: String,
        },
      ],
    },
    communication: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
        inApp: {
          type: Boolean,
          default: true,
        },
      },
      lastNotificationSent: Date,
      messages: [
        {
          from: String,
          to: String,
          subject: String,
          content: String,
          sentAt: Date,
          read: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    metadata: {
      enrolledBy: String, // admin, self, or system
      priority: {
        type: Number,
        default: 0, // higher number = higher priority for waitlist
      },
      tags: [String],
      notes: String,
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      version: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
enrollmentSchema.index(
  { "student.studentId": 1, "course.courseId": 1 },
  { unique: true }
);
enrollmentSchema.index({ "student.studentId": 1 });
enrollmentSchema.index({ "course.courseId": 1 });
enrollmentSchema.index({ "enrollment.status": 1 });
enrollmentSchema.index({ "enrollment.semester": 1, "enrollment.year": 1 });
enrollmentSchema.index({ "enrollment.enrollmentDate": 1 });

// Pre-save middleware
enrollmentSchema.pre("save", function (next) {
  // Calculate attendance rate
  if (this.attendance.totalClasses > 0) {
    this.attendance.attendanceRate = Math.round(
      (this.attendance.attendedClasses / this.attendance.totalClasses) * 100
    );
  }

  // Calculate completion rate
  if (this.progress.totalAssignments > 0) {
    this.progress.completionRate = Math.round(
      (this.progress.completedAssignments / this.progress.totalAssignments) *
        100
    );
  }

  // Calculate payment balance
  if (this.payments.tuitionFee && this.payments.totalPaid !== undefined) {
    this.payments.balance = this.payments.totalAmount - this.payments.totalPaid;
  }

  // Update last updated timestamp
  this.metadata.lastUpdated = new Date();

  next();
});

// Virtual for GPA calculation
enrollmentSchema.virtual("calculatedGPA").get(function () {
  const gradePoints: Record<LetterGrade, number> = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    F: 0.0,
    I: 0.0,
    W: 0.0,
    P: 0.0,
    NP: 0.0,
  };

  if (this.grades.overall.letterGrade) {
    return gradePoints[this.grades.overall.letterGrade] || 0.0;
  }

  return 0.0;
});

// Instance methods
enrollmentSchema.methods.isActive = function (): boolean {
  return ["enrolled", "waitlisted"].includes(this.enrollment.status);
};

enrollmentSchema.methods.calculateFinalGrade = function (): IOverallGrade {
  let totalScore = 0;
  let totalWeight = 0;

  // Add assignments
  if (this.grades.assignments && this.grades.assignments.length > 0) {
    this.grades.assignments.forEach((assignment: any) => {
      if (assignment.score !== undefined && assignment.maxScore > 0) {
        const percentage = (assignment.score / assignment.maxScore) * 100;
        const weight = assignment.weight || 1;
        totalScore += percentage * weight;
        totalWeight += weight;
      }
    });
  }

  // Add midterm
  if (this.grades.midterm && this.grades.midterm.score !== undefined) {
    const percentage =
      (this.grades.midterm.score / this.grades.midterm.maxScore) * 100;
    const weight = this.grades.midterm.weight || 1;
    totalScore += percentage * weight;
    totalWeight += weight;
  }

  // Add final
  if (this.grades.final && this.grades.final.score !== undefined) {
    const percentage =
      (this.grades.final.score / this.grades.final.maxScore) * 100;
    const weight = this.grades.final.weight || 1;
    totalScore += percentage * weight;
    totalWeight += weight;
  }

  if (totalWeight > 0) {
    this.grades.overall.percentage = Math.round(totalScore / totalWeight);
    this.grades.overall.letterGrade = this.getLetterGrade(
      this.grades.overall.percentage
    );
    this.grades.overall.gpa = this.calculatedGPA;
  }

  return this.grades.overall;
};

enrollmentSchema.methods.getLetterGrade = function (
  percentage: number
): LetterGrade {
  if (percentage >= 97) return "A+";
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 65) return "D";
  return "F";
};

// Static methods
interface IEnrollmentModel extends Model<IEnrollmentDocument> {
  findByStudent(studentId: string): Promise<IEnrollmentDocument[]>;
  findByCourse(courseId: string): Promise<IEnrollmentDocument[]>;
}

enrollmentSchema.statics.findByStudent = function (studentId: string) {
  return this.find({ "student.studentId": studentId });
};

enrollmentSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ "course.courseId": courseId });
};

// Ensure virtual fields are serialized
enrollmentSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Enrollment = mongoose.model<IEnrollmentDocument, IEnrollmentModel>(
  "Enrollment",
  enrollmentSchema
);

export default Enrollment;
