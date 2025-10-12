"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Tag,
  Select,
  DatePicker,
  TimePicker,
} from "antd";
import {
  PlusOutlined,
  ScheduleOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { RBACGuard } from "../../../components/RBACGuard";
import {
  PermissionResource,
  PermissionAction,
} from "../../../types/rbac.types";
import { adminService } from "../../../services/adminService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Schedule {
  _id: string;
  courseId: string;
  courseName: string;
  instructor: string;
  room: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalSchedules: 0,
    activeSchedules: 0,
    inactiveSchedules: 0,
    cancelledSchedules: 0,
  });

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = (await adminService.getSchedules()) as ApiResponse<
        Schedule[]
      >;
      if (response.success) {
        setSchedules(response.data);

        // Calculate stats
        const active = response.data.filter(
          (s: Schedule) => s.status === "active"
        ).length;
        const inactive = response.data.filter(
          (s: Schedule) => s.status === "inactive"
        ).length;
        const cancelled = response.data.filter(
          (s: Schedule) => s.status === "cancelled"
        ).length;

        setStats({
          totalSchedules: response.data.length,
          activeSchedules: active,
          inactiveSchedules: inactive,
          cancelledSchedules: cancelled,
        });
      }
    } catch (error: unknown) {
      console.error("Failed to fetch schedules:", error);
      message.error("Failed to fetch schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Handle create/edit schedule
  const handleSubmit = async (values: {
    courseId: string;
    courseName: string;
    instructor: string;
    room: string;
    dayOfWeek: string;
    timeRange: [dayjs.Dayjs, dayjs.Dayjs];
    dateRange: [dayjs.Dayjs, dayjs.Dayjs];
    status: string;
  }) => {
    try {
      setLoading(true);

      // Format the data
      const scheduleData = {
        courseId: values.courseId,
        courseName: values.courseName,
        instructor: values.instructor,
        room: values.room,
        dayOfWeek: values.dayOfWeek,
        startTime: values.timeRange[0].format("HH:mm"),
        endTime: values.timeRange[1].format("HH:mm"),
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
        status: values.status,
      };

      const response = (
        editingSchedule
          ? await adminService.updateSchedule(editingSchedule._id, scheduleData)
          : await adminService.createSchedule(scheduleData)
      ) as ApiResponse<Schedule>;

      if (response.success) {
        message.success(
          `Schedule ${editingSchedule ? "updated" : "created"} successfully`
        );
        setModalVisible(false);
        setEditingSchedule(null);
        form.resetFields();
        fetchSchedules();
      }
    } catch (error: unknown) {
      console.error("Failed to save schedule:", error);
      message.error(
        `Failed to ${editingSchedule ? "update" : "create"} schedule`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle delete schedule
  const handleDelete = async (scheduleId: string) => {
    try {
      const response = (await adminService.deleteSchedule(
        scheduleId
      )) as ApiResponse;
      if (response.success) {
        message.success("Schedule deleted successfully");
        fetchSchedules();
      }
    } catch (error: unknown) {
      console.error("Failed to delete schedule:", error);
      message.error("Failed to delete schedule");
    }
  };

  // Open edit modal
  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    form.setFieldsValue({
      courseId: schedule.courseId,
      courseName: schedule.courseName,
      instructor: schedule.instructor,
      room: schedule.room,
      dayOfWeek: schedule.dayOfWeek,
      timeRange: [
        dayjs(schedule.startTime, "HH:mm"),
        dayjs(schedule.endTime, "HH:mm"),
      ],
      dateRange: [dayjs(schedule.startDate), dayjs(schedule.endDate)],
      status: schedule.status,
    });
    setModalVisible(true);
  };

  // Open create modal
  const handleCreate = () => {
    setEditingSchedule(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "success",
      inactive: "default",
      cancelled: "error",
    };
    return colors[status] || "default";
  };

  // Get day color
  const getDayColor = (day: string) => {
    const colors: Record<string, string> = {
      Monday: "blue",
      Tuesday: "green",
      Wednesday: "orange",
      Thursday: "purple",
      Friday: "red",
      Saturday: "cyan",
      Sunday: "magenta",
    };
    return colors[day] || "default";
  };

  const columns = [
    {
      title: "Course",
      dataIndex: "courseName",
      key: "courseName",
      render: (text: string) => (
        <Space>
          <ScheduleOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Instructor",
      dataIndex: "instructor",
      key: "instructor",
    },
    {
      title: "Room",
      dataIndex: "room",
      key: "room",
      render: (room: string) => <Tag color="blue">{room}</Tag>,
    },
    {
      title: "Day",
      dataIndex: "dayOfWeek",
      key: "dayOfWeek",
      render: (day: string) => <Tag color={getDayColor(day)}>{day}</Tag>,
      filters: [
        { text: "Monday", value: "Monday" },
        { text: "Tuesday", value: "Tuesday" },
        { text: "Wednesday", value: "Wednesday" },
        { text: "Thursday", value: "Thursday" },
        { text: "Friday", value: "Friday" },
        { text: "Saturday", value: "Saturday" },
        { text: "Sunday", value: "Sunday" },
      ],
      onFilter: (value: unknown, record: Schedule) =>
        record.dayOfWeek === value,
    },
    {
      title: "Time",
      key: "time",
      render: (_: unknown, record: Schedule) => (
        <Text>
          {record.startTime} - {record.endTime}
        </Text>
      ),
    },
    {
      title: "Period",
      key: "period",
      render: (_: unknown, record: Schedule) => (
        <Text>
          {dayjs(record.startDate).format("MMM DD")} -{" "}
          {dayjs(record.endDate).format("MMM DD, YYYY")}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
        { text: "Cancelled", value: "cancelled" },
      ],
      onFilter: (value: unknown, record: Schedule) => record.status === value,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Schedule) => (
        <Space>
          <RBACGuard
            resource={PermissionResource.SCHEDULES}
            action={PermissionAction.UPDATE}
          >
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          </RBACGuard>
          <RBACGuard
            resource={PermissionResource.SCHEDULES}
            action={PermissionAction.DELETE}
          >
            <Popconfirm
              title="Delete Schedule"
              description="Are you sure you want to delete this schedule?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </RBACGuard>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>
          <CalendarOutlined className="mr-2" />
          Schedule Management
        </Title>
        <Text type="secondary">Manage course schedules and timetables</Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Schedules"
              value={stats.totalSchedules}
              prefix={<ScheduleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats.activeSchedules}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Inactive"
              value={stats.inactiveSchedules}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cancelled"
              value={stats.cancelledSchedules}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Schedules</Title>
          <RBACGuard
            resource={PermissionResource.SCHEDULES}
            action={PermissionAction.CREATE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Schedule
            </Button>
          </RBACGuard>
        </div>

        <Table
          columns={columns}
          dataSource={schedules}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSchedule ? "Edit Schedule" : "Create Schedule"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingSchedule(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Course ID"
                name="courseId"
                rules={[{ required: true, message: "Please enter course ID" }]}
              >
                <Input placeholder="Enter course ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Course Name"
                name="courseName"
                rules={[
                  { required: true, message: "Please enter course name" },
                ]}
              >
                <Input placeholder="Enter course name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Instructor"
                name="instructor"
                rules={[
                  { required: true, message: "Please enter instructor name" },
                ]}
              >
                <Input placeholder="Enter instructor name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Room"
                name="room"
                rules={[{ required: true, message: "Please enter room" }]}
              >
                <Input placeholder="Enter room number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Day of Week"
            name="dayOfWeek"
            rules={[{ required: true, message: "Please select day of week" }]}
          >
            <Select placeholder="Select day of week">
              <Select.Option value="Monday">Monday</Select.Option>
              <Select.Option value="Tuesday">Tuesday</Select.Option>
              <Select.Option value="Wednesday">Wednesday</Select.Option>
              <Select.Option value="Thursday">Thursday</Select.Option>
              <Select.Option value="Friday">Friday</Select.Option>
              <Select.Option value="Saturday">Saturday</Select.Option>
              <Select.Option value="Sunday">Sunday</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Time Range"
            name="timeRange"
            rules={[{ required: true, message: "Please select time range" }]}
          >
            <TimePicker.RangePicker
              format="HH:mm"
              placeholder={["Start time", "End time"]}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Date Range"
            name="dateRange"
            rules={[{ required: true, message: "Please select date range" }]}
          >
            <RangePicker
              placeholder={["Start date", "End date"]}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[
              { required: true, message: "Please select schedule status" },
            ]}
          >
            <Select placeholder="Select schedule status">
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingSchedule ? "Update" : "Create"} Schedule
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchedulesPage;
