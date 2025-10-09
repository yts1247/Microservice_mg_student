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

// Sample data
const chartData = [
  { name: "Jan", users: 400, posts: 240, views: 2400 },
  { name: "Feb", users: 300, posts: 139, views: 2210 },
  { name: "Mar", users: 200, posts: 980, views: 2290 },
  { name: "Apr", users: 278, posts: 390, views: 2000 },
  { name: "May", users: 189, posts: 480, views: 2181 },
  { name: "Jun", users: 239, posts: 380, views: 2500 },
];

const pieData = [
  { name: "Desktop", value: 400, color: "#0088FE" },
  { name: "Mobile", value: 300, color: "#00C49F" },
  { name: "Tablet", value: 200, color: "#FFBB28" },
  { name: "Other", value: 100, color: "#FF8042" },
];

const recentActivities = [
  {
    key: "1",
    user: "Nguyễn Văn A",
    action: "Đăng bài viết mới",
    time: "2 phút trước",
    status: "success",
  },
  {
    key: "2",
    user: "Trần Thị B",
    action: "Cập nhật hồ sơ",
    time: "5 phút trước",
    status: "info",
  },
  {
    key: "3",
    user: "Lê Văn C",
    action: "Xóa bình luận",
    time: "10 phút trước",
    status: "warning",
  },
  {
    key: "4",
    user: "Phạm Thị D",
    action: "Đăng ký tài khoản",
    time: "15 phút trước",
    status: "success",
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
              title="Tổng Users"
              value={1128}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
              suffix={<ArrowUpOutlined />}
            />
            <div className="mt-2 text-sm text-gray-500">
              +12% so với tháng trước
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Bài viết"
              value={93}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#cf1322" }}
              suffix={<ArrowDownOutlined />}
            />
            <div className="mt-2 text-sm text-gray-500">
              -3% so với tháng trước
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Lượt xem"
              value={112893}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#3f8600" }}
              suffix={<ArrowUpOutlined />}
            />
            <div className="mt-2 text-sm text-gray-500">
              +25% so với tháng trước
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={11280000}
              prefix="₫"
              valueStyle={{ color: "#3f8600" }}
              suffix={<ArrowUpOutlined />}
            />
            <div className="mt-2 text-sm text-gray-500">
              +18% so với tháng trước
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
