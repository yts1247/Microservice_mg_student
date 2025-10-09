"use client";

import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Tag,
  Button,
  Space,
  Statistic,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

interface HealthStatus {
  status: "healthy" | "unhealthy" | "unknown";
  timestamp: string;
  responseTime?: number;
  version?: string;
  error?: string;
}

interface ServiceHealth {
  userService: HealthStatus;
  courseService: HealthStatus;
}

export default function HealthCheckPage() {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<ServiceHealth>({
    userService: { status: "unknown", timestamp: "" },
    courseService: { status: "unknown", timestamp: "" },
  });

  const checkHealth = async (
    url: string,
    _serviceName: string
  ): Promise<HealthStatus> => {
    const startTime = Date.now();
    try {
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;

      return {
        status: response.status === 200 ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        responseTime,
        version: response.data?.version || "N/A",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  };

  const fetchHealthStatus = async () => {
    setLoading(true);
    try {
      const userServiceUrl =
        process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001";
      const courseServiceUrl =
        process.env.NEXT_PUBLIC_COURSE_SERVICE_URL || "http://localhost:3002";

      const [userHealth, courseHealth] = await Promise.all([
        checkHealth(userServiceUrl, "User Service"),
        checkHealth(courseServiceUrl, "Course Service"),
      ]);

      setHealthData({
        userService: userHealth,
        courseService: courseHealth,
      });
    } catch (error) {
      console.error("Error fetching health status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAndRefresh = () => {
      fetchHealthStatus();
    };

    fetchAndRefresh();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchAndRefresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "success";
      case "unhealthy":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <CheckCircleOutlined style={{ fontSize: 48, color: "#52c41a" }} />
        );
      case "unhealthy":
        return (
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />
        );
      default:
        return (
          <CloudServerOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
        );
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "healthy":
        return "Hoạt động bình thường";
      case "unhealthy":
        return "Có lỗi xảy ra";
      default:
        return "Chưa kiểm tra";
    }
  };

  const renderServiceCard = (
    serviceName: string,
    icon: React.ReactNode,
    healthStatus: HealthStatus,
    url: string
  ) => (
    <Card className="text-center">
      <Space direction="vertical" size="large" className="w-full">
        <div>
          {icon}
          <Title level={4} className="mt-4 mb-0">
            {serviceName}
          </Title>
          <Text type="secondary">{url}</Text>
        </div>

        <div>
          {getStatusIcon(healthStatus.status)}
          <div className="mt-2">
            <Tag
              color={getStatusColor(healthStatus.status)}
              className="text-lg px-4 py-1"
            >
              {getStatusText(healthStatus.status)}
            </Tag>
          </div>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Thời gian phản hồi"
              value={healthStatus.responseTime || 0}
              suffix="ms"
              valueStyle={{ fontSize: 18 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Version"
              value={healthStatus.version || "N/A"}
              valueStyle={{ fontSize: 18 }}
            />
          </Col>
        </Row>

        {healthStatus.timestamp && (
          <Text type="secondary">
            Cập nhật lần cuối:{" "}
            {new Date(healthStatus.timestamp).toLocaleString("vi-VN")}
          </Text>
        )}

        {healthStatus.error && (
          <Card size="small" className="bg-red-50">
            <Text type="danger">Lỗi: {healthStatus.error}</Text>
          </Card>
        )}
      </Space>
    </Card>
  );

  const allServicesHealthy =
    healthData.userService.status === "healthy" &&
    healthData.courseService.status === "healthy";

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <Title level={2}>
          <DatabaseOutlined className="mr-2" />
          Health Check Services
        </Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={fetchHealthStatus}
        >
          Làm mới
        </Button>
      </div>

      {/* Overall Status */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col flex="none">
            {allServicesHealthy ? (
              <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a" }} />
            ) : (
              <CloseCircleOutlined style={{ fontSize: 64, color: "#ff4d4f" }} />
            )}
          </Col>
          <Col flex="auto">
            <Title level={3} className="mb-0">
              {allServicesHealthy
                ? "Tất cả dịch vụ đang hoạt động bình thường"
                : "Một hoặc nhiều dịch vụ đang gặp sự cố"}
            </Title>
            <Text type="secondary">
              Kiểm tra lần cuối: {new Date().toLocaleString("vi-VN")}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Service Status Cards */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            {renderServiceCard(
              "User Service",
              <CloudServerOutlined
                style={{ fontSize: 48, color: "#1890ff" }}
              />,
              healthData.userService,
              process.env.NEXT_PUBLIC_USER_SERVICE_URL ||
                "http://localhost:3001"
            )}
          </Col>
          <Col xs={24} lg={12}>
            {renderServiceCard(
              "Course Service",
              <CloudServerOutlined
                style={{ fontSize: 48, color: "#52c41a" }}
              />,
              healthData.courseService,
              process.env.NEXT_PUBLIC_COURSE_SERVICE_URL ||
                "http://localhost:3002"
            )}
          </Col>
        </Row>
      </Spin>

      {/* Information */}
      <Card className="mt-6" title="Thông tin">
        <Text>
          Trang này giám sát trạng thái hoạt động của các microservices. Dữ liệu
          được tự động cập nhật mỗi 30 giây.
        </Text>
        <ul className="mt-4">
          <li>
            <Text strong>User Service:</Text> Quản lý người dùng, xác thực và
            phân quyền
          </li>
          <li>
            <Text strong>Course Service:</Text> Quản lý khóa học và đăng ký
          </li>
        </ul>
      </Card>
    </div>
  );
}
