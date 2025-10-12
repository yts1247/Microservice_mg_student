"use client";

import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Typography,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const { Title } = Typography;

// Sample data for student management system
const chartData = [
  { name: "Jan", students: 450, courses: 24, enrollments: 380 },
  { name: "Feb", students: 478, courses: 26, enrollments: 420 },
  { name: "Mar", students: 502, courses: 28, enrollments: 465 },
  { name: "Apr", students: 528, courses: 30, enrollments: 490 },
  { name: "May", students: 545, courses: 32, enrollments: 515 },
  { name: "Jun", students: 570, courses: 35, enrollments: 540 },
];

const pieData = [
  { name: "Active Students", value: 485, color: "#52c41a" },
  { name: "Inactive Students", value: 85, color: "#faad14" },
  { name: "Graduated", value: 120, color: "#1890ff" },
  { name: "Suspended", value: 15, color: "#ff4d4f" },
];

const recentActivities = [
  {
    key: "1",
    user: "Nguyễn Văn A",
    action: "Đăng ký khóa học React Native",
    time: "2 phút trước",
    status: "success",
  },
  {
    key: "2",
    user: "Trần Thị B",
    action: "Hoàn thành bài tập JavaScript",
    time: "5 phút trước",
    status: "success",
  },
  {
    key: "3",
    user: "Lê Văn C",
    action: "Cập nhật thông tin cá nhân",
    time: "10 phút trước",
    status: "info",
  },
  {
    key: "4",
    user: "Phạm Thị D",
    action: "Tạo tài khoản mới",
    time: "15 phút trước",
    status: "success",
  },
  {
    key: "5",
    user: "Võ Minh E",
    action: "Hủy đăng ký khóa học",
    time: "20 phút trước",
    status: "warning",
  },
];

const columns = [
  {
    title: "Người dùng",
    dataIndex: "user",
    key: "user",
  },
  {
    title: "Hành động",
    dataIndex: "action",
    key: "action",
  },
  {
    title: "Thời gian",
    dataIndex: "time",
    key: "time",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      const colorMap = {
        success: "green",
        info: "blue",
        warning: "orange",
        error: "red",
      };
      return (
        <Tag color={colorMap[status as keyof typeof colorMap]}>
          {status.toUpperCase()}
        </Tag>
      );
    },
  },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <Title level={2}>Dashboard</Title>

      {/* Statistics Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={705}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
              suffix={<ArrowUpOutlined />}
            />
            <div className="mt-2 text-sm text-gray-500">
              +8% so với tháng trước
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Khóa học"
              value={35}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
              suffix={<ArrowUpOutlined />}
            />
            <div className="mt-2 text-sm text-gray-500">+5 khóa học mới</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lượt đăng ký"
              value={540}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#3f8600" }}
              suffix={<ArrowUpOutlined />}
            />
            <div className="mt-2 text-sm text-gray-500">
              +15% so với tháng trước
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lịch học"
              value={128}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#fa8c16" }}
              suffix={<ArrowUpOutlined />}
            />
            <div className="mt-2 text-sm text-gray-500">
              +12 lịch mới tuần này
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Thống kê theo tháng" className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  name="Users"
                />
                <Line
                  type="monotone"
                  dataKey="posts"
                  stroke="#82ca9d"
                  name="Posts"
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#ffc658"
                  name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Thiết bị truy cập" className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Progress and Recent Activities */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Hiệu suất hệ thống">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>CPU Usage</span>
                  <span>45%</span>
                </div>
                <Progress percent={45} status="active" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Memory Usage</span>
                  <span>67%</span>
                </div>
                <Progress percent={67} status="active" strokeColor="#52c41a" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Disk Usage</span>
                  <span>83%</span>
                </div>
                <Progress percent={83} status="active" strokeColor="#faad14" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Network Usage</span>
                  <span>28%</span>
                </div>
                <Progress percent={28} status="active" strokeColor="#1890ff" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Hoạt động gần đây" extra={<a href="#">Xem tất cả</a>}>
            <Table
              dataSource={recentActivities}
              columns={columns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
