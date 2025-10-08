import express from "express";
import courseController from "../controllers/courseController";
import { authenticateToken, authorizeRoles } from "../middleware/auth";

const router = express.Router();

// Public routes
router.get("/available", courseController.getAvailableCourses);
router.get("/stats", courseController.getCourseStats);
router.get("/", courseController.getAllCourses);
router.get("/:id", courseController.getCourseById);

// Protected routes - Teacher and Admin can create/update courses
router.post(
  "/",
  authenticateToken,
  authorizeRoles("teacher", "admin"),
  courseController.createCourse
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("teacher", "admin"),
  courseController.updateCourse
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("teacher", "admin"),
  courseController.deleteCourse
);

// Teacher specific routes
router.get(
  "/my/courses",
  authenticateToken,
  authorizeRoles("teacher"),
  courseController.getMyCourses
);

export default router;
