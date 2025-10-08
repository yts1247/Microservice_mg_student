import Schedule from "../models/Schedule";
import axios from "axios";
import moment from "moment-timezone";
import logger from "../config/logger";
import {
  ISchedule,
  IScheduleDocument,
  IScheduleRequest,
  IScheduleQuery,
  IScheduleStats,
} from "../types/schedule.types";

interface ScheduleFilters {
  type?: string;
  status?: string;
  courseId?: string;
  teacherId?: string;
  room?: string;
  semester?: string;
  year?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface PaginationOptions {
  page?: string;
  limit?: string;
}

interface AttendanceData {
  records: Array<{
    studentId: string;
    status: string;
    checkInTime?: Date;
    notes?: string;
  }>;
}

class ScheduleService {
  async createSchedule(
    scheduleData: IScheduleRequest,
    userId: string,
    userRole: string
  ): Promise<IScheduleDocument> {
    try {
      // Validate course exists if courseId provided
      if (scheduleData.course && scheduleData.course.courseId) {
        await this.validateCourse(scheduleData.course.courseId);
      }

      // Check for conflicts
      const conflicts = await this.checkConflicts(
        scheduleData as Partial<ISchedule>
      );
      if (conflicts.length > 0) {
        throw new Error(
          `Schedule conflicts detected: ${conflicts
            .map((c) => c.title)
            .join(", ")}`
        );
      }

      // Set creator
      const scheduleWithMetadata = {
        ...scheduleData,
        metadata: {
          ...scheduleData.metadata,
          createdBy: userId,
          updatedBy: userId,
          tags: scheduleData.metadata?.tags || [],
          priority: scheduleData.metadata?.priority || "medium",
          isPublic: scheduleData.metadata?.isPublic !== false,
        },
        participants: {
          students: [],
          totalStudents: 0,
        },
        attendance: {
          required: true,
          attendanceRecords: [],
        },
        materials: scheduleData.materials || [],
        assignments: scheduleData.assignments || [],
        notifications: {
          emailReminder: {
            enabled: true,
            minutesBefore: 30,
          },
          smsReminder: {
            enabled: false,
            minutesBefore: 15,
          },
          ...scheduleData.notifications,
        },
        recurrence: {
          pattern: "none",
          daysOfWeek: [],
          exceptions: [],
          ...scheduleData.recurrence,
        },
        status: "scheduled",
        isActive: true,
      };

      const schedule = new Schedule(scheduleWithMetadata);
      await schedule.save();

      logger.info(`New schedule created: ${schedule.title}`);
      return schedule;
    } catch (error: any) {
      logger.error("Create schedule error:", error);
      throw error;
    }
  }

  async getAllSchedules(
    filters: ScheduleFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{
    schedules: IScheduleDocument[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }> {
    try {
      const { page = "1", limit = "10" } = pagination;
      const skip = (Number(page) - 1) * Number(limit);

      const query: any = {};

      // Apply filters
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.courseId) query["course.courseId"] = filters.courseId;
      if (filters.teacherId) query["instructor.teacherId"] = filters.teacherId;
      if (filters.room) query["location.room"] = new RegExp(filters.room, "i");
      if (filters.semester) query["semester.name"] = filters.semester;
      if (filters.year) query["semester.year"] = parseInt(filters.year);

      // Date range filter
      if (filters.startDate && filters.endDate) {
        query["timeSlot.startTime"] = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      } else if (filters.date) {
        const startOfDay = moment(filters.date).startOf("day").toDate();
        const endOfDay = moment(filters.date).endOf("day").toDate();
        query["timeSlot.startTime"] = { $gte: startOfDay, $lte: endOfDay };
      }

      if (filters.search) {
        query.$or = [
          { title: new RegExp(filters.search, "i") },
          { description: new RegExp(filters.search, "i") },
          { "course.courseCode": new RegExp(filters.search, "i") },
          { "course.courseTitle": new RegExp(filters.search, "i") },
        ];
      }

      const schedules = await Schedule.find(query)
        .sort({ "timeSlot.startTime": 1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("course.courseId", "courseCode title department");

      const total = await Schedule.countDocuments(query);

      return {
        schedules,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit),
        },
      };
    } catch (error: any) {
      logger.error("Get all schedules error:", error);
      throw error;
    }
  }

  async getScheduleById(scheduleId: string): Promise<IScheduleDocument> {
    try {
      const schedule = await Schedule.findById(scheduleId).populate(
        "course.courseId",
        "courseCode title department credits"
      );

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      return schedule;
    } catch (error: any) {
      logger.error("Get schedule error:", error);
      throw error;
    }
  }

  async updateSchedule(
    scheduleId: string,
    updateData: Partial<ISchedule>,
    userId: string,
    userRole: string
  ): Promise<IScheduleDocument> {
    try {
      const schedule = await Schedule.findById(scheduleId);

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Check permissions
      if (
        userRole !== "admin" &&
        schedule.instructor?.teacherId !== userId &&
        schedule.metadata.createdBy !== userId
      ) {
        throw new Error("Not authorized to update this schedule");
      }

      // Check for conflicts if time or location changed
      if (updateData.timeSlot || updateData.location) {
        const testData = { ...schedule.toObject(), ...updateData };
        const conflicts = await this.checkConflicts(testData, scheduleId);
        if (conflicts.length > 0) {
          throw new Error(
            `Update would create conflicts: ${conflicts
              .map((c) => c.title)
              .join(", ")}`
          );
        }
      }

      const updateDataWithMetadata = {
        ...updateData,
        metadata: {
          ...schedule.metadata,
          ...updateData.metadata,
          updatedBy: userId,
        },
      };

      const updatedSchedule = await Schedule.findByIdAndUpdate(
        scheduleId,
        { $set: updateDataWithMetadata },
        { new: true, runValidators: true }
      ).populate("course.courseId", "courseCode title department");

      if (!updatedSchedule) {
        throw new Error("Failed to update schedule");
      }

      logger.info(`Schedule updated: ${updatedSchedule.title}`);
      return updatedSchedule;
    } catch (error: any) {
      logger.error("Update schedule error:", error);
      throw error;
    }
  }

  async deleteSchedule(
    scheduleId: string,
    userId: string,
    userRole: string
  ): Promise<{ message: string }> {
    try {
      const schedule = await Schedule.findById(scheduleId);

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Check permissions
      if (
        userRole !== "admin" &&
        schedule.instructor?.teacherId !== userId &&
        schedule.metadata.createdBy !== userId
      ) {
        throw new Error("Not authorized to delete this schedule");
      }

      // Don't allow deletion of ongoing or completed classes
      if (schedule.status === "ongoing") {
        throw new Error("Cannot delete ongoing schedule");
      }

      await Schedule.findByIdAndDelete(scheduleId);

      logger.info(`Schedule deleted: ${schedule.title}`);
      return { message: "Schedule deleted successfully" };
    } catch (error: any) {
      logger.error("Delete schedule error:", error);
      throw error;
    }
  }

  async getSchedulesByTeacher(
    teacherId: string,
    filters: ScheduleFilters = {}
  ): Promise<IScheduleDocument[]> {
    try {
      const query: any = { "instructor.teacherId": teacherId };

      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
      if (filters.startDate && filters.endDate) {
        query["timeSlot.startTime"] = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const schedules = await Schedule.find(query)
        .sort({ "timeSlot.startTime": 1 })
        .populate("course.courseId", "courseCode title department");

      return schedules;
    } catch (error: any) {
      logger.error("Get schedules by teacher error:", error);
      throw error;
    }
  }

  async getSchedulesByStudent(
    studentId: string,
    filters: ScheduleFilters = {}
  ): Promise<IScheduleDocument[]> {
    try {
      const query: any = { "participants.students.studentId": studentId };

      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
      if (filters.startDate && filters.endDate) {
        query["timeSlot.startTime"] = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const schedules = await Schedule.find(query)
        .sort({ "timeSlot.startTime": 1 })
        .populate("course.courseId", "courseCode title department");

      return schedules;
    } catch (error: any) {
      logger.error("Get schedules by student error:", error);
      throw error;
    }
  }

  async getRoomSchedules(
    room: string,
    date: string
  ): Promise<IScheduleDocument[]> {
    try {
      const startOfDay = moment(date).startOf("day").toDate();
      const endOfDay = moment(date).endOf("day").toDate();

      const schedules = await Schedule.find({
        "location.room": room,
        "timeSlot.startTime": { $gte: startOfDay, $lte: endOfDay },
      })
        .sort({ "timeSlot.startTime": 1 })
        .populate("course.courseId", "courseCode title");

      return schedules;
    } catch (error: any) {
      logger.error("Get room schedules error:", error);
      throw error;
    }
  }

  async checkConflicts(
    scheduleData: Partial<ISchedule>,
    excludeId?: string
  ): Promise<IScheduleDocument[]> {
    try {
      if (!scheduleData.location?.room || !scheduleData.timeSlot) {
        return [];
      }

      const query: any = {
        "location.room": scheduleData.location.room,
        "timeSlot.startTime": { $lt: scheduleData.timeSlot.endTime },
        "timeSlot.endTime": { $gt: scheduleData.timeSlot.startTime },
        status: { $nin: ["cancelled", "completed"] },
      };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const conflicts = await Schedule.find(query);
      return conflicts;
    } catch (error: any) {
      logger.error("Check conflicts error:", error);
      throw error;
    }
  }

  async validateCourse(courseId: string): Promise<any> {
    try {
      const courseServiceUrl =
        process.env.COURSE_SERVICE_URL || "http://localhost:3002";
      const response = await axios.get(
        `${courseServiceUrl}/api/courses/${courseId}`
      );

      if (!response.data.success) {
        throw new Error("Course not found");
      }

      return response.data.data.course;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        throw new Error("Course not found");
      }
      throw new Error("Unable to validate course");
    }
  }

  async recordAttendance(
    scheduleId: string,
    attendanceData: AttendanceData,
    userId: string
  ): Promise<IScheduleDocument> {
    try {
      const schedule = await Schedule.findById(scheduleId);

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Update attendance records
      schedule.attendance.attendanceRecords = attendanceData.records as any;
      schedule.attendance.checkInTime = new Date();

      await schedule.save();

      logger.info(`Attendance recorded for schedule: ${schedule.title}`);
      return schedule;
    } catch (error: any) {
      logger.error("Record attendance error:", error);
      throw error;
    }
  }

  async getScheduleStats(filters: ScheduleFilters = {}): Promise<any> {
    try {
      const matchConditions: any = {};

      if (filters.semester) matchConditions["semester.name"] = filters.semester;
      if (filters.year)
        matchConditions["semester.year"] = parseInt(filters.year);
      if (filters.teacherId)
        matchConditions["instructor.teacherId"] = filters.teacherId;

      const stats = await Schedule.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalSchedules: { $sum: 1 },
            byType: {
              $push: {
                type: "$type",
                status: "$status",
              },
            },
            totalStudents: { $sum: "$participants.totalStudents" },
            averageAttendance: { $avg: "$attendanceRate" },
          },
        },
      ]);

      const typeStats = await Schedule.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]);

      const statusStats = await Schedule.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      return {
        overview: stats[0] || {},
        byType: typeStats,
        byStatus: statusStats,
      };
    } catch (error: any) {
      logger.error("Get schedule stats error:", error);
      throw error;
    }
  }
}

export default new ScheduleService();
