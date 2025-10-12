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
} from "antd";
import {
  PlusOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { RBACGuard } from "../../../components/RBACGuard";
import {
  PermissionResource,
  PermissionAction,
} from "../../../types/rbac.types";
import { adminService } from "../../../services/adminService";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Enrollment {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  enrollmentDate: string;
  status: "active" | "inactive" | "completed" | "cancelled";
  grade?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

const EnrollmentsPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(
    null
  );
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    cancelledEnrollments: 0,
  });

  // Fetch enrollments
  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = (await adminService.getEnrollments()) as ApiResponse<
        Enrollment[]
      >;
      if (response.success) {
        setEnrollments(response.data);

        // Calculate stats
        const active = response.data.filter(
          (e: Enrollment) => e.status === "active"
        ).length;
        const completed = response.data.filter(
          (e: Enrollment) => e.status === "completed"
        ).length;
        const cancelled = response.data.filter(
          (e: Enrollment) => e.status === "cancelled"
        ).length;

        setStats({
          totalEnrollments: response.data.length,
          activeEnrollments: active,
          completedEnrollments: completed,
          cancelledEnrollments: cancelled,
        });
      }
    } catch (error: unknown) {
      console.error("Failed to fetch enrollments:", error);
      message.error("Failed to fetch enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  // Handle create/edit enrollment
  const handleSubmit = async (values: {
    userId: string;
    userName: string;
    userEmail: string;
    courseId: string;
    courseName: string;
    enrollmentDate: dayjs.Dayjs;
    status: string;
    grade?: string;
  }) => {
    try {
      setLoading(true);

      // Format the data
      const enrollmentData = {
        ...values,
        enrollmentDate: values.enrollmentDate.format("YYYY-MM-DD"),
      };

      const response = (
        editingEnrollment
          ? await adminService.updateEnrollment(
              editingEnrollment._id,
              enrollmentData
            )
          : await adminService.createEnrollment(enrollmentData)
      ) as ApiResponse<Enrollment>;

      if (response.success) {
        message.success(
          `Enrollment ${editingEnrollment ? "updated" : "created"} successfully`
        );
        setModalVisible(false);
        setEditingEnrollment(null);
        form.resetFields();
        fetchEnrollments();
      }
    } catch (error: unknown) {
      message.error(
        `Failed to ${editingEnrollment ? "update" : "create"} enrollment`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle delete enrollment
  const handleDelete = async (enrollmentId: string) => {
    try {
      const response = (await adminService.deleteEnrollment(
        enrollmentId
      )) as ApiResponse;
      if (response.success) {
        message.success("Enrollment deleted successfully");
        fetchEnrollments();
      }
    } catch (error: unknown) {
      console.error("Failed to delete enrollment:", error);
      message.error("Failed to delete enrollment");
    }
  };

  // Open edit modal
  const handleEdit = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    form.setFieldsValue({
      userId: enrollment.userId,
      userName: enrollment.userName,
      userEmail: enrollment.userEmail,
      courseId: enrollment.courseId,
      courseName: enrollment.courseName,
      enrollmentDate: dayjs(enrollment.enrollmentDate),
      status: enrollment.status,
      grade: enrollment.grade,
    });
    setModalVisible(true);
  };

  // Open create modal
  const handleCreate = () => {
    setEditingEnrollment(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "processing",
      inactive: "default",
      completed: "success",
      cancelled: "error",
    };
    return colors[status] || "default";
  };

  // Get grade color
  const getGradeColor = (grade: string) => {
    if (!grade) return "default";
    const gradeValue = parseFloat(grade);
    if (gradeValue >= 85) return "success";
    if (gradeValue >= 70) return "processing";
    if (gradeValue >= 60) return "warning";
    return "error";
  };

  const columns = [
    {
      title: "Student",
      key: "student",
      render: (_: unknown, record: Enrollment) => (
        <Space direction="vertical" size="small">
          <Space>
            <UserOutlined />
            <Text strong>{record.userName}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.userEmail}
          </Text>
        </Space>
      ),
    },
    {
      title: "Course",
      dataIndex: "courseName",
      key: "courseName",
      render: (text: string) => (
        <Space>
          <TeamOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Enrollment Date",
      dataIndex: "enrollmentDate",
      key: "enrollmentDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      sorter: (a: Enrollment, b: Enrollment) =>
        dayjs(a.enrollmentDate).unix() - dayjs(b.enrollmentDate).unix(),
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
        { text: "Completed", value: "completed" },
        { text: "Cancelled", value: "cancelled" },
      ],
      onFilter: (value: unknown, record: Enrollment) => record.status === value,
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      render: (grade: string) =>
        grade ? (
          <Tag color={getGradeColor(grade)}>{grade}%</Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Enrollment) => (
        <Space>
          <RBACGuard
            resource={PermissionResource.ENROLLMENTS}
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
            resource={PermissionResource.ENROLLMENTS}
            action={PermissionAction.DELETE}
          >
            <Popconfirm
              title="Delete Enrollment"
              description="Are you sure you want to delete this enrollment?"
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
          <TeamOutlined className="mr-2" />
          Enrollment Management
        </Title>
        <Text type="secondary">
          Manage student enrollments and course registrations
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Enrollments"
              value={stats.totalEnrollments}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats.activeEnrollments}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completedEnrollments}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Cancelled"
              value={stats.cancelledEnrollments}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Enrollments</Title>
          <RBACGuard
            resource={PermissionResource.ENROLLMENTS}
            action={PermissionAction.CREATE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Enrollment
            </Button>
          </RBACGuard>
        </div>

        <Table
          columns={columns}
          dataSource={enrollments}
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
        title={editingEnrollment ? "Edit Enrollment" : "Create Enrollment"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingEnrollment(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="User ID"
                name="userId"
                rules={[{ required: true, message: "Please enter user ID" }]}
              >
                <Input placeholder="Enter user ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="User Name"
                name="userName"
                rules={[{ required: true, message: "Please enter user name" }]}
              >
                <Input placeholder="Enter user name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="User Email"
            name="userEmail"
            rules={[
              { required: true, message: "Please enter user email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter user email" />
          </Form.Item>

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
                label="Enrollment Date"
                name="enrollmentDate"
                rules={[
                  { required: true, message: "Please select enrollment date" },
                ]}
              >
                <DatePicker
                  placeholder="Select enrollment date"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[
                  {
                    required: true,
                    message: "Please select enrollment status",
                  },
                ]}
              >
                <Select placeholder="Select enrollment status">
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                  <Select.Option value="completed">Completed</Select.Option>
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Grade (%)" name="grade">
            <Input
              placeholder="Enter grade (optional)"
              type="number"
              min="0"
              max="100"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingEnrollment ? "Update" : "Create"} Enrollment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnrollmentsPage;
