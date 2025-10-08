const courseService = require("../services/courseService");
const logger = require("../config/logger");

class CourseController {
  async createCourse(req, res) {
    try {
      const course = await courseService.createCourse(req.body, req.user._id);

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: { course },
      });
    } catch (error) {
      logger.error("Create course controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Course creation failed",
      });
    }
  }

  async getAllCourses(req, res) {
    try {
      const filters = {
        department: req.query.department,
        level: req.query.level,
        status: req.query.status,
        semester: req.query.semester,
        year: req.query.year,
        search: req.query.search,
      };

      const pagination = {
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await courseService.getAllCourses(filters, pagination);

      res.status(200).json({
        success: true,
        message: "Courses retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Get all courses controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve courses",
      });
    }
  }

  async getCourseById(req, res) {
    try {
      const course = await courseService.getCourseById(req.params.id);

      res.status(200).json({
        success: true,
        message: "Course retrieved successfully",
        data: { course },
      });
    } catch (error) {
      logger.error("Get course controller error:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Course not found",
      });
    }
  }

  async updateCourse(req, res) {
    try {
      const course = await courseService.updateCourse(
        req.params.id,
        req.body,
        req.user._id,
        req.user.role
      );

      res.status(200).json({
        success: true,
        message: "Course updated successfully",
        data: { course },
      });
    } catch (error) {
      logger.error("Update course controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Course update failed",
      });
    }
  }

  async deleteCourse(req, res) {
    try {
      const result = await courseService.deleteCourse(
        req.params.id,
        req.user._id,
        req.user.role
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error("Delete course controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Course deletion failed",
      });
    }
  }

  async getMyCourses(req, res) {
    try {
      const courses = await courseService.getCoursesByInstructor(req.user._id);

      res.status(200).json({
        success: true,
        message: "Your courses retrieved successfully",
        data: { courses },
      });
    } catch (error) {
      logger.error("Get my courses controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve your courses",
      });
    }
  }

  async getAvailableCourses(req, res) {
    try {
      const courses = await courseService.getAvailableCourses();

      res.status(200).json({
        success: true,
        message: "Available courses retrieved successfully",
        data: { courses },
      });
    } catch (error) {
      logger.error("Get available courses controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve available courses",
      });
    }
  }

  async getCourseStats(req, res) {
    try {
      const stats = await courseService.getCourseStats();

      res.status(200).json({
        success: true,
        message: "Course statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      logger.error("Get course stats controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve course statistics",
      });
    }
  }
}

module.exports = new CourseController();
