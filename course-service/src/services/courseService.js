const Course = require("../models/Course");
const logger = require("../config/logger");

class CourseService {
  async createCourse(courseData, instructorId) {
    try {
      courseData.instructor.teacherId = instructorId;
      const course = new Course(courseData);
      await course.save();

      logger.info(`New course created: ${course.courseCode}`);
      return course;
    } catch (error) {
      logger.error("Create course error:", error);
      throw error;
    }
  }

  async getAllCourses(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const query = {};

      if (filters.department)
        query.department = new RegExp(filters.department, "i");
      if (filters.level) query.level = filters.level;
      if (filters.status) query.status = filters.status;
      if (filters.semester) query["schedule.semester"] = filters.semester;
      if (filters.year) query["schedule.year"] = parseInt(filters.year);
      if (filters.search) {
        query.$or = [
          { courseCode: new RegExp(filters.search, "i") },
          { title: new RegExp(filters.search, "i") },
          { description: new RegExp(filters.search, "i") },
        ];
      }

      const courses = await Course.find(query)
        .populate("prerequisites.courseId", "courseCode title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Course.countDocuments(query);

      return {
        courses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      };
    } catch (error) {
      logger.error("Get all courses error:", error);
      throw error;
    }
  }

  async getCourseById(courseId) {
    try {
      const course = await Course.findById(courseId).populate(
        "prerequisites.courseId",
        "courseCode title"
      );

      if (!course) {
        throw new Error("Course not found");
      }

      return course;
    } catch (error) {
      logger.error("Get course error:", error);
      throw error;
    }
  }

  async updateCourse(courseId, updateData, userId, userRole) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error("Course not found");
      }

      // Check if user can update this course
      if (userRole !== "admin" && course.instructor.teacherId !== userId) {
        throw new Error("Not authorized to update this course");
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate("prerequisites.courseId", "courseCode title");

      logger.info(`Course updated: ${updatedCourse.courseCode}`);
      return updatedCourse;
    } catch (error) {
      logger.error("Update course error:", error);
      throw error;
    }
  }

  async deleteCourse(courseId, userId, userRole) {
    try {
      const course = await Course.findById(courseId);

      if (!course) {
        throw new Error("Course not found");
      }

      // Check if user can delete this course
      if (userRole !== "admin" && course.instructor.teacherId !== userId) {
        throw new Error("Not authorized to delete this course");
      }

      // Check if course has enrolled students
      if (course.capacity.enrolled > 0) {
        throw new Error("Cannot delete course with enrolled students");
      }

      await Course.findByIdAndDelete(courseId);

      logger.info(`Course deleted: ${course.courseCode}`);
      return { message: "Course deleted successfully" };
    } catch (error) {
      logger.error("Delete course error:", error);
      throw error;
    }
  }

  async getCoursesByInstructor(teacherId) {
    try {
      const courses = await Course.findByInstructor(teacherId)
        .populate("prerequisites.courseId", "courseCode title")
        .sort({ "schedule.year": -1, "schedule.semester": 1 });

      return courses;
    } catch (error) {
      logger.error("Get courses by instructor error:", error);
      throw error;
    }
  }

  async getAvailableCourses() {
    try {
      const courses = await Course.findAvailable()
        .populate("prerequisites.courseId", "courseCode title")
        .sort({ department: 1, courseCode: 1 });

      return courses;
    } catch (error) {
      logger.error("Get available courses error:", error);
      throw error;
    }
  }

  async getCourseStats() {
    try {
      const totalCourses = await Course.countDocuments();
      const publishedCourses = await Course.countDocuments({
        status: "published",
      });
      const ongoingCourses = await Course.countDocuments({ status: "ongoing" });

      const departmentStats = await Course.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const levelStats = await Course.aggregate([
        { $group: { _id: "$level", count: { $sum: 1 } } },
      ]);

      return {
        totalCourses,
        publishedCourses,
        ongoingCourses,
        departmentStats,
        levelStats,
      };
    } catch (error) {
      logger.error("Get course stats error:", error);
      throw error;
    }
  }
}

module.exports = new CourseService();
