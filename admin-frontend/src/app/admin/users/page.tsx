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
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  useUsers,
  useUserStats,
  useActivateUser,
  useDeactivateUser,
} from "@/hooks/useUsers";
import { User } from "@/services/userService";
import Link from "next/link";

const { Title } = Typography;
const { Option } = Select;

const UsersPage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "student" | "teacher" | "admin" | undefined
  >();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch users with filters
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useUsers({
    page,
    limit: pageSize,
    search: searchText,
    role: roleFilter,
  });

  // Fetch user stats
  const { data: statsData } = useUserStats();

  // Mutations
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  const handleActivate = async (id: string) => {
    try {
      await activateMutation.mutateAsync(id);
      message.success("Kích hoạt người dùng thành công!");
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Kích hoạt thất bại!";
      message.error(errorMessage);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateMutation.mutateAsync(id);
      message.success("Vô hiệu hóa người dùng thành công!");
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Vô hiệu hóa thất bại!";
      message.error(errorMessage);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "red",
      teacher: "blue",
      student: "green",
    };
    return colors[role as keyof typeof colors] || "default";
  };

  const getRoleText = (role: string) => {
    const texts = {
      admin: "Quản trị viên",
      teacher: "Giáo viên",
      student: "Học sinh",
    };
    return texts[role as keyof typeof texts] || role;
  };

  const columns: ColumnsType<User> = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: true,
      render: (username: string, record: User) => (
        <Link
          href={`/admin/users/${record.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          {username}
        </Link>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
    },
    {
      title: "Họ và tên",
      key: "fullName",
      render: (_, record: User) => (
        <span>
          {record.profile?.firstName} {record.profile?.lastName}
        </span>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag
          color={getRoleColor(role)}
          icon={
            role === "admin" ? (
              <CrownOutlined />
            ) : role === "teacher" ? (
              <TeamOutlined />
            ) : (
              <UserOutlined />
            )
          }
        >
          {getRoleText(role)}
        </Tag>
      ),
      filters: [
        { text: "Quản trị viên", value: "admin" },
        { text: "Giáo viên", value: "teacher" },
        { text: "Học sinh", value: "student" },
      ],
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "error"}>
          {isActive ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
      filters: [
        { text: "Hoạt động", value: true },
        { text: "Không hoạt động", value: false },
      ],
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_, record: User) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Link href={`/admin/users/${record.id}`}>
              <Button type="text" size="small" icon={<EyeOutlined />} />
            </Link>
          </Tooltip>
          {record.isActive ? (
            <Popconfirm
              title="Vô hiệu hóa người dùng"
              description="Bạn có chắc chắn muốn vô hiệu hóa người dùng này?"
              onConfirm={() => handleDeactivate(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Tooltip title="Vô hiệu hóa">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  loading={deactivateMutation.isPending}
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Kích hoạt người dùng"
              description="Bạn có chắc chắn muốn kích hoạt người dùng này?"
              onConfirm={() => handleActivate(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Tooltip title="Kích hoạt">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={activateMutation.isPending}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Quản lý người dùng</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Làm mới
          </Button>
          <Link href="/register">
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm người dùng
            </Button>
          </Link>
        </Space>
      </div>

      {/* Statistics Cards */}
      {statsData?.data && (
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tổng người dùng"
                value={statsData.data.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Học sinh"
                value={statsData.data.totalStudents}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Giáo viên"
                value={statsData.data.totalTeachers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Quản trị viên"
                value={statsData.data.totalAdmins}
                prefix={<CrownOutlined />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Space className="mb-4" size="middle">
          <Input
            placeholder="Tìm kiếm theo tên, email, username..."
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
            placeholder="Lọc theo vai trò"
            style={{ width: 200 }}
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            allowClear
          >
            <Option value="student">Học sinh</Option>
            <Option value="teacher">Giáo viên</Option>
            <Option value="admin">Quản trị viên</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={usersData?.data?.users || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: usersData?.data?.pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default UsersPage;
