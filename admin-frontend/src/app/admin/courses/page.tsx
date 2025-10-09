"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Tooltip,
  Input,
  Select,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  BookOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  useCourses,
  useCourseStats,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "@/hooks/useCourses";
import { Course, CreateCourseRequest } from "@/services/courseService";
import Link from "next/link";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function CoursesPage() {
  const [searchText, setSearchText] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<
    string | undefined
  >();
  const [levelFilter, setLevelFilter] = useState<
    "beginner" | "intermediate" | "advanced" | undefined
  >();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();

  // Fetch courses with filters
  const {
    data: coursesData,
    isLoading,
    refetch,
  } = useCourses({
    page,
    limit: pageSize,
    search: searchText,
    department: departmentFilter,
    level: levelFilter,
  });

  // Fetch course stats
  const { data: statsData } = useCourseStats();

  // Mutations
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  const handleCreate = () => {
    setEditingCourse(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    form.setFieldsValue({
      ...course,
      year: course.schedule?.year,
      semester: course.schedule?.semester,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success("Xóa khóa học thành công!");
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Xóa thất bại!";
      message.error(errorMessage);
    }
  };

  const handleSubmit = async (
    values: CreateCourseRequest & { year: number; semester: string }
  ) => {
    try {
      const courseData: CreateCourseRequest = {
        courseCode: values.courseCode,
        title: values.title,
        description: values.description,
        department: values.department,
        credits: values.credits,
        level: values.level,
        capacity: {
          max: values.capacity.max,
        },
        schedule: {
          semester: values.semester as "spring" | "summer" | "fall" | "winter",
          year: values.year,
          timeSlots: [],
        },
      };

      if (editingCourse) {
        await updateMutation.mutateAsync({
          id: editingCourse.id,
          data: courseData,
        });
        message.success("Cập nhật khóa học thành công!");
      } else {
        await createMutation.mutateAsync(courseData);
        message.success("Tạo khóa học mới thành công!");
      }

      setIsModalVisible(false);
      form.resetFields();
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Lưu thất bại!";
      message.error(errorMessage);
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      beginner: "green",
      intermediate: "blue",
      advanced: "red",
    };
    return colors[level as keyof typeof colors] || "default";
  };

  const getLevelText = (level: string) => {
    const texts = {
      beginner: "Cơ bản",
      intermediate: "Trung cấp",
      advanced: "Nâng cao",
    };
    return texts[level as keyof typeof texts] || level;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "default",
      published: "blue",
      ongoing: "green",
      completed: "purple",
      cancelled: "red",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: "Nháp",
      published: "Đã xuất bản",
      ongoing: "Đang diễn ra",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return texts[status as keyof typeof texts] || status;
  };

  const columns: ColumnsType<Course> = [
    {
      title: "Mã khóa học",
      dataIndex: "courseCode",
      key: "courseCode",
      sorter: true,
      render: (courseCode: string, record: Course) => (
        <Link
          href={`/admin/courses/${record.id ?? record._id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {courseCode}
        </Link>
      ),
    },
    {
      title: "Tên khóa học",
      dataIndex: "title",
      key: "title",
      sorter: true,
    },
    {
      title: "Khoa",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Tín chỉ",
      dataIndex: "credits",
      key: "credits",
      width: 80,
    },
    {
      title: "Cấp độ",
      dataIndex: "level",
      key: "level",
      render: (level: string) => (
        <Tag color={getLevelColor(level)}>{getLevelText(level)}</Tag>
      ),
      filters: [
        { text: "Cơ bản", value: "beginner" },
        { text: "Trung cấp", value: "intermediate" },
        { text: "Nâng cao", value: "advanced" },
      ],
    },
    {
      title: "Sức chứa",
      key: "capacity",
      render: (_, record: Course) => (
        <span>
          {record.capacity.enrolled || 0}/{record.capacity.max}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record: Course) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Link href={`/admin/courses/${record.id ?? record._id}`}>
              <Button type="text" size="small" icon={<EyeOutlined />} />
            </Link>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa khóa học"
            description="Bạn có chắc chắn muốn xóa khóa học này?"
            onConfirm={() => handleDelete(record.id ?? record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Quản lý khóa học</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo khóa học
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      {statsData?.data && (
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Tổng khóa học"
                value={statsData.data.totalCourses}
                prefix={<BookOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Đang diễn ra"
                value={statsData.data.ongoingCourses}
                prefix={<BookOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="Tổng sinh viên"
                value={statsData.data.totalStudentsEnrolled}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Space className="mb-4" size="middle">
          <Input
            placeholder="Tìm kiếm khóa học..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Lọc theo khoa"
            style={{ width: 200 }}
            value={departmentFilter}
            onChange={(value) => {
              setDepartmentFilter(value);
              setPage(1);
            }}
            allowClear
          >
            <Option value="Toán học">Toán học</Option>
            <Option value="Vật lý">Vật lý</Option>
            <Option value="Hóa học">Hóa học</Option>
            <Option value="Sinh học">Sinh học</Option>
            <Option value="Khoa học máy tính">Khoa học máy tính</Option>
          </Select>
          <Select
            placeholder="Lọc theo cấp độ"
            style={{ width: 200 }}
            value={levelFilter}
            onChange={(value) => {
              setLevelFilter(value);
              setPage(1);
            }}
            allowClear
          >
            <Option value="beginner">Cơ bản</Option>
            <Option value="intermediate">Trung cấp</Option>
            <Option value="advanced">Nâng cao</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={coursesData?.data?.courses || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: coursesData?.data?.pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} khóa học`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            level: "beginner",
            credits: 3,
            capacity: { max: 50 },
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="courseCode"
                label="Mã khóa học"
                rules={[
                  { required: true, message: "Vui lòng nhập mã khóa học!" },
                ]}
              >
                <Input placeholder="VD: MATH101" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label="Tên khóa học"
                rules={[
                  { required: true, message: "Vui lòng nhập tên khóa học!" },
                ]}
              >
                <Input placeholder="Nhập tên khóa học" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <TextArea rows={4} placeholder="Nhập mô tả khóa học" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="department"
                label="Khoa"
                rules={[{ required: true, message: "Vui lòng chọn khoa!" }]}
              >
                <Select placeholder="Chọn khoa">
                  <Option value="Toán học">Toán học</Option>
                  <Option value="Vật lý">Vật lý</Option>
                  <Option value="Hóa học">Hóa học</Option>
                  <Option value="Sinh học">Sinh học</Option>
                  <Option value="Khoa học máy tính">Khoa học máy tính</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="level"
                label="Cấp độ"
                rules={[{ required: true, message: "Vui lòng chọn cấp độ!" }]}
              >
                <Select placeholder="Chọn cấp độ">
                  <Option value="beginner">Cơ bản</Option>
                  <Option value="intermediate">Trung cấp</Option>
                  <Option value="advanced">Nâng cao</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="credits"
                label="Tín chỉ"
                rules={[{ required: true, message: "Vui lòng nhập tín chỉ!" }]}
              >
                <InputNumber min={1} max={10} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={["capacity", "max"]}
                label="Sức chứa tối đa"
                rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}
              >
                <InputNumber min={1} max={500} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="semester"
                label="Học kỳ"
                rules={[{ required: true, message: "Vui lòng chọn học kỳ!" }]}
              >
                <Select placeholder="Chọn học kỳ">
                  <Option value="spring">Xuân</Option>
                  <Option value="summer">Hè</Option>
                  <Option value="fall">Thu</Option>
                  <Option value="winter">Đông</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="year"
                label="Năm"
                rules={[{ required: true, message: "Vui lòng nhập năm!" }]}
              >
                <InputNumber min={2020} max={2030} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCourse ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
