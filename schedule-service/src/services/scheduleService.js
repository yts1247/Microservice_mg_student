const Schedule = require("../models/Schedule");
const axios = require("axios");
const moment = require("moment-timezone");
const logger = require("../config/logger");

class ScheduleService {
  async createSchedule(scheduleData, userId, userRole) {
    try {
      // Validate course exists if courseId provided
      if (scheduleData.course && scheduleData.course.courseId) {
        await this.validateCourse(scheduleData.course.courseId);
      }

      // Check for conflicts
      const conflicts = await this.checkConflicts(scheduleData);
      if (conflicts.length > 0) {
        throw new Error(
          `Schedule conflicts detected: ${conflicts
            .map((c) => c.title)
            .join(", ")}`
        );
      }

      // Set creator
      scheduleData.metadata = {
        ...scheduleData.metadata,
        createdBy: userId,
      };

      const schedule = new Schedule(scheduleData);
      await schedule.save();

      logger.info(`New schedule created: ${schedule.title}`);
      return schedule;
    } catch (error) {
      logger.error("Create schedule error:", error);
      throw error;
    }
  }

  async getAllSchedules(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const query = {};

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
        .limit(parseInt(limit))
        .populate("course.courseId", "courseCode title department");

      const total = await Schedule.countDocuments(query);

      return {
        schedules,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      };
    } catch (error) {
      logger.error("Get all schedules error:", error);
      throw error;
    }
  }

  async getScheduleById(scheduleId) {
    try {
      const schedule = await Schedule.findById(scheduleId).populate(
        "course.courseId",
        "courseCode title department credits"
      );

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      return schedule;
    } catch (error) {
      logger.error("Get schedule error:", error);
      throw error;
    }
  }

  async updateSchedule(scheduleId, updateData, userId, userRole) {
    try {
      const schedule = await Schedule.findById(scheduleId);

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Check permissions
      if (
        userRole !== "admin" &&
        schedule.instructor.teacherId !== userId &&
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

      updateData.metadata = {
        ...updateData.metadata,
        updatedBy: userId,
      };

      const updatedSchedule = await Schedule.findByIdAndUpdate(
        scheduleId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate("course.courseId", "courseCode title department");

      logger.info(`Schedule updated: ${updatedSchedule.title}`);
      return updatedSchedule;
    } catch (error) {
      logger.error("Update schedule error:", error);
      throw error;
    }
  }

  async deleteSchedule(scheduleId, userId, userRole) {
    try {
      const schedule = await Schedule.findById(scheduleId);

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Check permissions
      if (
        userRole !== "admin" &&
        schedule.instructor.teacherId !== userId &&
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
    } catch (error) {
      logger.error("Delete schedule error:", error);
      throw error;
    }
  }

  async getSchedulesByTeacher(teacherId, filters = {}) {
    try {
      const query = { "instructor.teacherId": teacherId };

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
    } catch (error) {
      logger.error("Get schedules by teacher error:", error);
      throw error;
    }
  }

  async getSchedulesByStudent(studentId, filters = {}) {
    try {
      const query = { "participants.students.studentId": studentId };

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
    } catch (error) {
      logger.error("Get schedules by student error:", error);
      throw error;
    }
  }

  async getRoomSchedules(room, date) {
    try {
      const schedules = await Schedule.findByRoom(room, date)
        .sort({ "timeSlot.startTime": 1 })
        .populate("course.courseId", "courseCode title");

      return schedules;
    } catch (error) {
      logger.error("Get room schedules error:", error);
      throw error;
    }
  }

  async checkConflicts(scheduleData, excludeId = null) {
    try {
      const query = {
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
    } catch (error) {
      logger.error("Check conflicts error:", error);
      throw error;
    }
  }

  async validateCourse(courseId) {
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
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error("Course not found");
      }
      throw new Error("Unable to validate course");
    }
  }

  async recordAttendance(scheduleId, attendanceData, userId) {
    try {
      const schedule = await Schedule.findById(scheduleId);

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Update attendance records
      schedule.attendance.attendanceRecords = attendanceData.records;
      schedule.attendance.checkInTime = new Date();

      await schedule.save();

      logger.info(`Attendance recorded for schedule: ${schedule.title}`);
      return schedule;
    } catch (error) {
      logger.error("Record attendance error:", error);
      throw error;
    }
  }

  async getScheduleStats(filters = {}) {
    try {
      const matchConditions = {};

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
    } catch (error) {
      logger.error("Get schedule stats error:", error);
      throw error;
    }
  }
}

module.exports = new ScheduleService();
