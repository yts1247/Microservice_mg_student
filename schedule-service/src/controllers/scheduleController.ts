import { Response } from "express";
import scheduleService from "../services/scheduleService";
import logger from "../config/logger";
import { AuthenticatedRequest, ApiResponse } from "../types/common.types";
import { IScheduleQuery, IScheduleRequest } from "../types/schedule.types";

class ScheduleController {
  async createSchedule(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      if (!req.user?._id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const schedule = await scheduleService.createSchedule(
        req.body as IScheduleRequest,
        req.user._id,
        req.user.role
      );

      res.status(201).json({
        success: true,
        message: "Schedule created successfully",
        data: { schedule },
      });
    } catch (error: any) {
      logger.error("Create schedule controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Schedule creation failed",
      });
    }
  }

  async getAllSchedules(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const filters = {
        type: req.query.type as string,
        status: req.query.status as string,
        courseId: req.query.courseId as string,
        teacherId: req.query.teacherId as string,
        room: req.query.room as string,
        semester: req.query.semester as string,
        year: req.query.year as string,
        date: req.query.date as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
      };

      const pagination = {
        page: req.query.page as string,
        limit: req.query.limit as string,
      };

      const result = await scheduleService.getAllSchedules(filters, pagination);

      res.status(200).json({
        success: true,
        message: "Schedules retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      logger.error("Get all schedules controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve schedules",
      });
    }
  }

  async getScheduleById(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const schedule = await scheduleService.getScheduleById(req.params.id);

      res.status(200).json({
        success: true,
        message: "Schedule retrieved successfully",
        data: { schedule },
      });
    } catch (error: any) {
      logger.error("Get schedule controller error:", error);
      res.status(404).json({
        success: false,
        message: error.message || "Schedule not found",
      });
    }
  }

  async updateSchedule(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      if (!req.user?._id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

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
    } catch (error: any) {
      logger.error("Update schedule controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Schedule update failed",
      });
    }
  }

  async deleteSchedule(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      if (!req.user?._id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await scheduleService.deleteSchedule(
        req.params.id,
        req.user._id,
        req.user.role
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error("Delete schedule controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Schedule deletion failed",
      });
    }
  }

  async getMySchedules(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      if (!req.user?._id || !req.user?.role) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      let schedules;
      const filters = {
        status: req.query.status as string,
        type: req.query.type as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
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
          page: "1",
          limit: "100",
        });
        schedules = result.schedules;
      }

      res.status(200).json({
        success: true,
        message: "Your schedules retrieved successfully",
        data: { schedules },
      });
    } catch (error: any) {
      logger.error("Get my schedules controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve your schedules",
      });
    }
  }

  async getRoomSchedules(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { room } = req.params;
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          message: "Date parameter is required",
        });
        return;
      }

      const schedules = await scheduleService.getRoomSchedules(
        room,
        date as string
      );

      res.status(200).json({
        success: true,
        message: "Room schedules retrieved successfully",
        data: { schedules, room, date },
      });
    } catch (error: any) {
      logger.error("Get room schedules controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve room schedules",
      });
    }
  }

  async checkConflicts(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
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
    } catch (error: any) {
      logger.error("Check conflicts controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check conflicts",
      });
    }
  }

  async recordAttendance(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      if (!req.user?._id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

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
    } catch (error: any) {
      logger.error("Record attendance controller error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to record attendance",
      });
    }
  }

  async getScheduleStats(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const filters = {
        semester: req.query.semester as string,
        year: req.query.year as string,
        teacherId: req.query.teacherId as string,
      };

      const stats = await scheduleService.getScheduleStats(filters);

      res.status(200).json({
        success: true,
        message: "Schedule statistics retrieved successfully",
        data: stats,
      });
    } catch (error: any) {
      logger.error("Get schedule stats controller error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve schedule statistics",
      });
    }
  }
}

export default new ScheduleController();
