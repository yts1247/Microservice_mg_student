const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

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

module.exports = router;
