import express from "express";
import scheduleController from "../controllers/scheduleController";
import { authenticateToken, authorizeRoles } from "../middleware/auth";

const router = express.Router();

// Public routes
router.get("/stats", scheduleController.getScheduleStats);
router.get("/", scheduleController.getAllSchedules);
router.get("/:id", scheduleController.getScheduleById);
router.get("/room/:room", scheduleController.getRoomSchedules);

// Protected routes
router.post(
  "/check-conflicts",
  authenticateToken,
  scheduleController.checkConflicts
);

// Teacher and Admin can create/update schedules
router.post(
  "/",
  authenticateToken,
  authorizeRoles("teacher", "admin"),
  scheduleController.createSchedule
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("teacher", "admin"),
  scheduleController.updateSchedule
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("teacher", "admin"),
  scheduleController.deleteSchedule
);

// User specific routes
router.get(
  "/my/schedules",
  authenticateToken,
  scheduleController.getMySchedules
);

// Attendance routes (Teachers only)
router.post(
  "/:id/attendance",
  authenticateToken,
  authorizeRoles("teacher", "admin"),
  scheduleController.recordAttendance
);

export default router;
