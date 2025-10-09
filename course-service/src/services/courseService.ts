import Course from "../models/Course";
import logger from "../config/logger";
import {
  ICourse,
  ICourseDocument,
  ICourseRequest,
  ICourseStats,
} from "../types/course.types";

interface CourseFilters {
  department?: string;
  level?: string;
  status?: string;
  semester?: string;
  year?: number;
  search?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

class CourseService {
  async createCourse(
    courseData: ICourseRequest,
    instructorId: string
  ): Promise<ICourseDocument> {
    try {
      if (!courseData.instructor) courseData.instructor = {};
      courseData.instructor.userId = instructorId;
      const course = new Course(courseData);
      await course.save();

      logger.info(`New course created: ${course.courseCode}`);
      return course;
    } catch (error: any) {
      logger.error("Create course error:", error);
      throw error;
    }
  }

  async getAllCourses(
    filters: CourseFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{
    courses: ICourseDocument[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const query: any = {};

      if (filters.department) {
        query.department = new RegExp(filters.department, "i");
      }
      if (filters.level) query.level = filters.level;
      if (filters.status) query.status = filters.status;
      if (filters.semester) query["schedule.semester"] = filters.semester;
      if (filters.year) query["schedule.year"] = Number(filters.year);
      if (filters.search) {
        query.$or = [
          { courseCode: new RegExp(filters.search, "i") },
          { title: new RegExp(filters.search, "i") },
          { description: new RegExp(filters.search, "i") },
        ];
      }

      const courses = await Course.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Course.countDocuments(query);

      return {
        courses,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit),
        },
      };
    } catch (error: any) {
      logger.error("Get all courses error:", error);
      throw error;
    }
  }

  async getCourseById(courseId: string): Promise<ICourseDocument> {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error("Course not found");
      }

      return course;
    } catch (error: any) {
      logger.error("Get course error:", error);
      throw error;
    }
  }

  async updateCourse(
    courseId: string,
    updateData: Partial<ICourse>,
    userId: string,
    userRole: string
  ): Promise<ICourseDocument> {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error("Course not found");
      }

      // Check if user can update this course
      if (userRole !== "admin" && course.instructor.userId !== userId) {
        throw new Error("Not authorized to update this course");
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedCourse) {
        throw new Error("Failed to update course");
      }

      logger.info(`Course updated: ${updatedCourse.courseCode}`);
      return updatedCourse;
    } catch (error: any) {
      logger.error("Update course error:", error);
      throw error;
    }
  }

  async deleteCourse(
    courseId: string,
    userId: string,
    userRole: string
  ): Promise<{ message: string }> {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error("Course not found");
      }

      // Check if user can delete this course
      if (userRole !== "admin" && course.instructor.userId !== userId) {
        throw new Error("Not authorized to delete this course");
      }

      // Check if course has enrolled students
      if (course.capacity.current > 0) {
        throw new Error("Cannot delete course with enrolled students");
      }

      await Course.findByIdAndDelete(courseId);

      logger.info(`Course deleted: ${course.courseCode}`);
      return { message: "Course deleted successfully" };
    } catch (error: any) {
      logger.error("Delete course error:", error);
      throw error;
    }
  }

  async getCoursesByInstructor(teacherId: string): Promise<ICourseDocument[]> {
    try {
      const courses = await Course.find({
        "instructor.userId": teacherId,
      }).sort({ "schedule.year": -1, "schedule.semester": 1 });

      return courses;
    } catch (error: any) {
      logger.error("Get courses by instructor error:", error);
      throw error;
    }
  }

  async getAvailableCourses(): Promise<ICourseDocument[]> {
    try {
      const courses = await Course.find({ isActive: true }).sort({
        department: 1,
        courseCode: 1,
      });

      return courses;
    } catch (error: any) {
      logger.error("Get available courses error:", error);
      throw error;
    }
  }

  async getCourseStats(): Promise<ICourseStats> {
    try {
      const totalCourses = await Course.countDocuments();
      const activeCourses = await Course.countDocuments({ isActive: true });
      const draftCourses = await Course.countDocuments({ status: "draft" });
      const publishedCourses = await Course.countDocuments({
        status: "published",
      });
      const archivedCourses = await Course.countDocuments({
        status: "archived",
      });

      const departmentDistribution = await Course.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Calculate average enrollment
      const enrollmentStats = await Course.aggregate([
        { $group: { _id: null, avgEnrollment: { $avg: "$capacity.current" } } },
      ]);

      const averageEnrollment =
        enrollmentStats.length > 0 ? enrollmentStats[0].avgEnrollment : 0;

      return {
        totalCourses,
        activeCourses,
        draftCourses,
        publishedCourses,
        archivedCourses,
        averageEnrollment,
        departmentDistribution,
      };
    } catch (error: any) {
      logger.error("Get course stats error:", error);
      throw error;
    }
  }
}

export default new CourseService();
