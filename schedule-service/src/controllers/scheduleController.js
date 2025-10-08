const scheduleService = require("../services/scheduleService");
const logger = require("../config/logger");

class ScheduleController {
  async createSchedule(req, res) {
    try {
      const schedule = await scheduleService.createSchedule(
        req.body,
        req.user._id,
        req.user.role
      );

      res.status(201).json({
        success: true,
        message: "Schedule created successfully",
        data: { schedule },
      });
    } catch (error) {
      logger.error("Create schedule controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Schedule creation failed",
      });
    }
  }

  async getAllSchedules(req, res) {
    try {
      const filters = {
        type: req.query.type,
        status: req.query.status,
        courseId: req.query.courseId,
        teacherId: req.query.teacherId,
        room: req.query.room,
        semester: req.query.semester,
        year: req.query.year,
        date: req.query.date,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
      };

      const pagination = {
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await scheduleService.getAllSchedules(filters, pagination);

      res.status(200).json({
        success: true,
        message: "Schedules retrieved successfully",
        data: result,
      });
    } catch (error) {
      logger.error("Get all schedules controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve schedules",
      });
    }
  }

  async getScheduleById(req, res) {
    try {
      const schedule = await scheduleService.getScheduleById(req.params.id);

      res.status(200).json({
        success: true,
        message: "Schedule retrieved successfully",
        data: { schedule },
      });
    } catch (error) {
      logger.error("Get schedule controller error:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Schedule not found",
      });
    }
  }

  async updateSchedule(req, res) {
    try {
      const schedule = await scheduleService.updateSchedule(
        req.params.id,
        req.body,
        req.user._id,
        req.user.role
      );

      res.status(200).json({
        success: true,
        message: "Schedule updated successfully",
        data: { schedule },
      });
    } catch (error) {
      logger.error("Update schedule controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Schedule update failed",
      });
    }
  }

  async deleteSchedule(req, res) {
    try {
      const result = await scheduleService.deleteSchedule(
        req.params.id,
        req.user._id,
        req.user.role
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error("Delete schedule controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Schedule deletion failed",
      });
    }
  }

  async getMySchedules(req, res) {
    try {
      let schedules;
      const filters = {
        status: req.query.status,
        type: req.query.type,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      if (req.user.role === "teacher") {
        schedules = await scheduleService.getSchedulesByTeacher(
          req.user._id,
          filters
        );
      } else if (req.user.role === "student") {
        schedules = await scheduleService.getSchedulesByStudent(
          req.user._id,
          filters
        );
      } else {
        // Admin can see all schedules
        const result = await scheduleService.getAllSchedules(filters, {
          page: 1,
          limit: 100,
        });
        schedules = result.schedules;
      }

      res.status(200).json({
        success: true,
        message: "Your schedules retrieved successfully",
        data: { schedules },
      });
    } catch (error) {
      logger.error("Get my schedules controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve your schedules",
      });
    }
  }

  async getRoomSchedules(req, res) {
    try {
      const { room } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date parameter is required",
        });
      }

      const schedules = await scheduleService.getRoomSchedules(room, date);

      res.status(200).json({
        success: true,
        message: "Room schedules retrieved successfully",
        data: { schedules, room, date },
      });
    } catch (error) {
      logger.error("Get room schedules controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve room schedules",
      });
    }
  }

  async checkConflicts(req, res) {
    try {
      const conflicts = await scheduleService.checkConflicts(req.body);

      res.status(200).json({
        success: true,
        message: "Conflict check completed",
        data: {
          hasConflicts: conflicts.length > 0,
          conflicts,
        },
      });
    } catch (error) {
      logger.error("Check conflicts controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check conflicts",
      });
    }
  }

  async recordAttendance(req, res) {
    try {
      const schedule = await scheduleService.recordAttendance(
        req.params.id,
        req.body,
        req.user._id
      );

      res.status(200).json({
        success: true,
        message: "Attendance recorded successfully",
        data: { schedule },
      });
    } catch (error) {
      logger.error("Record attendance controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to record attendance",
      });
    }
  }

  async getScheduleStats(req, res) {
    try {
      const filters = {
        semester: req.query.semester,
        year: req.query.year,
        teacherId: req.query.teacherId,
      };

      const stats = await scheduleService.getScheduleStats(filters);

      res.status(200).json({
        success: true,
        message: "Schedule statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      logger.error("Get schedule stats controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve schedule statistics",
      });
    }
  }
}

module.exports = new ScheduleController();
