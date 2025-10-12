import express from "express";
import { Request, Response } from "express";
import { authenticateUser, requirePermission } from "../middleware/rbac";
import { PermissionResource, PermissionAction } from "../types/rbac.types";
import { PermissionModel } from "../models/Permission";
import { RoleModel } from "../models/Role";
import User from "../models/User";

const router = express.Router();

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     summary: Admin health check
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Admin service health status
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Admin API is healthy",
    timestamp: new Date().toISOString(),
    service: "user-service-admin",
    version: "1.0.0",
  });
});

/**
 * @swagger
 * /api/admin/logs/scan:
 *   get:
 *     summary: Scan system logs
 *     tags: [Admin, Logs]
 *     responses:
 *       200:
 *         description: System logs retrieved successfully
 */
router.get(
  "/logs/scan",
  authenticateUser,
  requirePermission(PermissionResource.SYSTEM, PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      const { service, level, limit = 100 } = req.query;

      // Mock logs for now - will be implemented with actual message broker
      const mockLogs = [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          level: "info",
          service: service || "user-service",
          message: "User logged in successfully",
          metadata: { userId: "123", action: "login" },
        },
        {
          id: "2",
          timestamp: new Date().toISOString(),
          level: "warn",
          service: service || "user-service",
          message: "Failed login attempt",
          metadata: { email: "test@example.com", reason: "invalid_password" },
        },
      ];

      res.json({
        success: true,
        data: {
          logs: mockLogs,
          total: mockLogs.length,
          service,
          level,
          scannedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error scanning logs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to scan logs",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get paginated logs
 *     tags: [Admin, Logs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated logs retrieved successfully
 */
router.get(
  "/logs",
  authenticateUser,
  requirePermission(PermissionResource.LOGS, PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, service, level } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // Mock logs with pagination
      const allLogs = Array.from({ length: 200 }, (_, i) => ({
        _id: `log_${i + 1}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        level: ["info", "warn", "error", "debug"][i % 4],
        service: [
          "user-service",
          "course-service",
          "schedule-service",
          "enrollment-service",
          "api-gateway",
        ][i % 5],
        message: `Log message ${i + 1} - ${
          ["User action", "System event", "API call", "Database operation"][
            i % 4
          ]
        }`,
        module: ["auth", "database", "api", "scheduler"][i % 4],
        userId: i % 3 === 0 ? `user_${Math.floor(i / 3)}` : undefined,
        requestId: `req_${i + 1}`,
        metadata: { action: "system_operation", details: `Operation ${i + 1}` },
      }));

      // Filter logs
      let filteredLogs = allLogs;
      if (service) {
        filteredLogs = filteredLogs.filter((log) => log.service === service);
      }
      if (level) {
        filteredLogs = filteredLogs.filter((log) => log.level === level);
      }

      // Paginate
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredLogs.length,
          pages: Math.ceil(filteredLogs.length / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch logs",
      });
    }
  }
);

/**
 * @swagger
 * /api/logs/dashboard:
 *   get:
 *     summary: Get logs dashboard data
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get(
  "/logs/dashboard",
  authenticateUser,
  requirePermission(PermissionResource.LOGS, PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      // Mock dashboard statistics
      const stats = {
        totalLogs: 1250,
        errorLogs: 45,
        warnLogs: 120,
        infoLogs: 985,
        debugLogs: 100,
        services: {
          "user-service": { total: 350, errors: 12, warnings: 28 },
          "course-service": { total: 280, errors: 8, warnings: 22 },
          "schedule-service": { total: 220, errors: 15, warnings: 18 },
          "enrollment-service": { total: 200, errors: 6, warnings: 25 },
          "api-gateway": { total: 200, errors: 4, warnings: 27 },
        },
        recentErrors: [
          {
            id: "1",
            timestamp: new Date().toISOString(),
            service: "user-service",
            message: "Database connection failed",
            level: "error",
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 300000).toISOString(),
            service: "course-service",
            message: "Course validation error",
            level: "error",
          },
        ],
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/logs/services:
 *   get:
 *     summary: Get available services for logging
 *     tags: [Admin, Logs]
 *     responses:
 *       200:
 *         description: List of available services
 */
router.get(
  "/logs/services",
  authenticateUser,
  requirePermission(PermissionResource.SYSTEM, PermissionAction.READ),
  (req: Request, res: Response) => {
    const services = [
      {
        key: "user-service",
        name: "User Service",
        description: "Authentication and user management",
      },
      {
        key: "course-service",
        name: "Course Service",
        description: "Course and curriculum management",
      },
      {
        key: "schedule-service",
        name: "Schedule Service",
        description: "Schedule and timetable management",
      },
      {
        key: "enrollment-service",
        name: "Enrollment Service",
        description: "Student enrollment management",
      },
      {
        key: "api-gateway",
        name: "API Gateway",
        description: "Request routing and authentication",
      },
    ];

    res.json({
      success: true,
      data: services,
    });
  }
);

/**
 * @swagger
 * /api/admin/permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [Admin, RBAC]
 *     responses:
 *       200:
 *         description: List of all permissions
 */
router.get(
  "/permissions",
  authenticateUser,
  requirePermission(PermissionResource.SYSTEM, PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      const permissions = await PermissionModel.find().sort({
        resource: 1,
        action: 1,
      });

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch permissions",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Admin, RBAC]
 *     responses:
 *       200:
 *         description: List of all roles
 */
router.get(
  "/roles",
  authenticateUser,
  requirePermission(PermissionResource.SYSTEM, PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      const roles = await RoleModel.find()
        .populate("permissions")
        .sort({ name: 1 });

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch roles",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get system statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: System statistics
 */
router.get(
  "/stats",
  authenticateUser,
  requirePermission(PermissionResource.SYSTEM, PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      // Get database stats
      const usersCount = await User.countDocuments();
      const rolesCount = await RoleModel.countDocuments();
      const permissionsCount = await PermissionModel.countDocuments();
      const activeUsersCount = await User.countDocuments({ isActive: true });

      res.json({
        success: true,
        data: {
          database: {
            users: usersCount,
            activeUsers: activeUsersCount,
            roles: rolesCount,
            permissions: permissionsCount,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Admin, Courses]
 *     responses:
 *       200:
 *         description: List of courses
 *   post:
 *     summary: Create a new course
 *     tags: [Admin, Courses]
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.get(
  "/courses",
  authenticateUser,
  requirePermission(PermissionResource.COURSES, PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      // Mock courses data - replace with actual course service call
      const mockCourses = [
        {
          _id: "course_1",
          title: "Introduction to Computer Science",
          description: "Fundamentals of programming and computer science",
          instructor: "Dr. John Smith",
          capacity: 30,
          duration: 40,
          status: "active",
          createdAt: new Date("2024-01-15").toISOString(),
          updatedAt: new Date("2024-01-15").toISOString(),
        },
        {
          _id: "course_2",
          title: "Advanced JavaScript",
          description: "Deep dive into JavaScript and modern frameworks",
          instructor: "Prof. Jane Doe",
          capacity: 25,
          duration: 35,
          status: "active",
          createdAt: new Date("2024-02-01").toISOString(),
          updatedAt: new Date("2024-02-01").toISOString(),
        },
      ];

      res.json({
        success: true,
        data: mockCourses,
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch courses",
      });
    }
  }
);

router.post(
  "/courses",
  authenticateUser,
  requirePermission(PermissionResource.COURSES, PermissionAction.CREATE),
  async (req: Request, res: Response) => {
    try {
      const courseData = req.body;

      // Mock course creation - replace with actual course service call
      const newCourse = {
        _id: `course_${Date.now()}`,
        ...courseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        data: newCourse,
        message: "Course created successfully",
      });
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create course",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Admin, Courses]
 *     responses:
 *       200:
 *         description: Course updated successfully
 *   delete:
 *     summary: Delete a course
 *     tags: [Admin, Courses]
 *     responses:
 *       200:
 *         description: Course deleted successfully
 */
router.put(
  "/courses/:id",
  authenticateUser,
  requirePermission(PermissionResource.COURSES, PermissionAction.UPDATE),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Mock course update - replace with actual course service call
      const updatedCourse = {
        _id: id,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: updatedCourse,
        message: "Course updated successfully",
      });
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update course",
      });
    }
  }
);

router.delete(
  "/courses/:id",
  authenticateUser,
  requirePermission(PermissionResource.COURSES, PermissionAction.DELETE),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock course deletion - replace with actual course service call
      res.json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete course",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Admin, Schedules]
 *     responses:
 *       200:
 *         description: List of schedules
 *   post:
 *     summary: Create a new schedule
 *     tags: [Admin, Schedules]
 *     responses:
 *       201:
 *         description: Schedule created successfully
 */
router.get(
  "/schedules",
  authenticateUser,
  requirePermission(PermissionResource.SCHEDULES, PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      // Mock schedules data - replace with actual schedule service call
      const mockSchedules = [
        {
          _id: "schedule_1",
          courseId: "course_1",
          courseName: "Introduction to Computer Science",
          instructor: "Dr. John Smith",
          room: "A101",
          dayOfWeek: "Monday",
          startTime: "09:00",
          endTime: "10:30",
          startDate: "2024-03-01",
          endDate: "2024-06-15",
          status: "active",
          createdAt: new Date("2024-02-15").toISOString(),
          updatedAt: new Date("2024-02-15").toISOString(),
        },
        {
          _id: "schedule_2",
          courseId: "course_2",
          courseName: "Advanced JavaScript",
          instructor: "Prof. Jane Doe",
          room: "B205",
          dayOfWeek: "Wednesday",
          startTime: "14:00",
          endTime: "15:30",
          startDate: "2024-03-01",
          endDate: "2024-06-15",
          status: "active",
          createdAt: new Date("2024-02-20").toISOString(),
          updatedAt: new Date("2024-02-20").toISOString(),
        },
      ];

      res.json({
        success: true,
        data: mockSchedules,
      });
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch schedules",
      });
    }
  }
);

router.post(
  "/schedules",
  authenticateUser,
  requirePermission(PermissionResource.SCHEDULES, PermissionAction.CREATE),
  async (req: Request, res: Response) => {
    try {
      const scheduleData = req.body;

      // Mock schedule creation - replace with actual schedule service call
      const newSchedule = {
        _id: `schedule_${Date.now()}`,
        ...scheduleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        data: newSchedule,
        message: "Schedule created successfully",
      });
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create schedule",
      });
    }
  }
);

router.put(
  "/schedules/:id",
  authenticateUser,
  requirePermission(PermissionResource.SCHEDULES, PermissionAction.UPDATE),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Mock schedule update - replace with actual schedule service call
      const updatedSchedule = {
        _id: id,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: updatedSchedule,
        message: "Schedule updated successfully",
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update schedule",
      });
    }
  }
);

router.delete(
  "/schedules/:id",
  authenticateUser,
  requirePermission(PermissionResource.SCHEDULES, PermissionAction.DELETE),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock schedule deletion - replace with actual schedule service call
      res.json({
        success: true,
        message: "Schedule deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete schedule",
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/enrollments:
 *   get:
 *     summary: Get all enrollments
 *     tags: [Admin, Enrollments]
 *     responses:
 *       200:
 *         description: List of enrollments
 *   post:
 *     summary: Create a new enrollment
 *     tags: [Admin, Enrollments]
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 */
router.get(
  "/enrollments",
  authenticateUser,
  requirePermission(PermissionResource.ENROLLMENTS, PermissionAction.READ),
  async (req: Request, res: Response) => {
    try {
      // Mock enrollments data - replace with actual enrollment service call
      const mockEnrollments = [
        {
          _id: "enrollment_1",
          userId: "user_1",
          userName: "Alice Johnson",
          userEmail: "alice@example.com",
          courseId: "course_1",
          courseName: "Introduction to Computer Science",
          enrollmentDate: "2024-02-01",
          status: "active",
          grade: "85",
          createdAt: new Date("2024-02-01").toISOString(),
          updatedAt: new Date("2024-02-01").toISOString(),
        },
        {
          _id: "enrollment_2",
          userId: "user_2",
          userName: "Bob Smith",
          userEmail: "bob@example.com",
          courseId: "course_2",
          courseName: "Advanced JavaScript",
          enrollmentDate: "2024-02-05",
          status: "active",
          grade: null,
          createdAt: new Date("2024-02-05").toISOString(),
          updatedAt: new Date("2024-02-05").toISOString(),
        },
      ];

      res.json({
        success: true,
        data: mockEnrollments,
      });
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch enrollments",
      });
    }
  }
);

router.post(
  "/enrollments",
  authenticateUser,
  requirePermission(PermissionResource.ENROLLMENTS, PermissionAction.CREATE),
  async (req: Request, res: Response) => {
    try {
      const enrollmentData = req.body;

      // Mock enrollment creation - replace with actual enrollment service call
      const newEnrollment = {
        _id: `enrollment_${Date.now()}`,
        ...enrollmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        data: newEnrollment,
        message: "Enrollment created successfully",
      });
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create enrollment",
      });
    }
  }
);

router.put(
  "/enrollments/:id",
  authenticateUser,
  requirePermission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Mock enrollment update - replace with actual enrollment service call
      const updatedEnrollment = {
        _id: id,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: updatedEnrollment,
        message: "Enrollment updated successfully",
      });
    } catch (error) {
      console.error("Error updating enrollment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update enrollment",
      });
    }
  }
);

router.delete(
  "/enrollments/:id",
  authenticateUser,
  requirePermission(PermissionResource.ENROLLMENTS, PermissionAction.DELETE),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock enrollment deletion - replace with actual enrollment service call
      res.json({
        success: true,
        message: "Enrollment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete enrollment",
      });
    }
  }
);

export default router;
