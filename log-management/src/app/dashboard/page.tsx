"use client";

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Button,
  Select,
  DatePicker,
  Space,
  Typography,
} from "antd";
import {
  FileTextOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import AppLayout from "@/components/AppLayout";
import { ServiceStats, LogFileWithStats } from "@/types";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface DashboardData {
  services: ServiceStats[];
  recentFiles: LogFileWithStats[];
  totals: {
    totalFiles: number;
    totalErrors: number;
    totalWarnings: number;
    totalInfo: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>("all");

  useEffect(() => {
    loadDashboardData();
  }, [selectedService]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/dashboard?service=${selectedService}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Service",
      dataIndex: "service_name",
      key: "service_name",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "File",
      dataIndex: "file_name",
      key: "file_name",
      ellipsis: true,
    },
    {
      title: "Size",
      dataIndex: "file_size",
      key: "file_size",
      render: (size: number) => formatFileSize(size),
    },
    {
      title: "Errors",
      dataIndex: "error_count",
      key: "error_count",
      render: (count: number) =>
        count > 0 ? <Tag color="red">{count}</Tag> : <span>0</span>,
    },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!data) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="loading-pulse">Loading dashboard...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <Title
              level={2}
              className="m-0 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Dashboard Overview
            </Title>
            <p className="text-slate-600 mt-1">
              Monitor your log files and system performance
            </p>
          </div>
          <Space className="flex-wrap">
            <Select
              value={selectedService}
              onChange={setSelectedService}
              style={{ width: 200 }}
              className="rounded-lg"
              options={[
                { value: "all", label: "All Services" },
                ...data.services.map((s) => ({
                  value: s.service_name,
                  label: s.service_name,
                })),
              ]}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadDashboardData}
              loading={loading}
              className="rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Statistic
                title={
                  <span className="text-blue-700 font-semibold">
                    Total Files
                  </span>
                }
                value={data.totals.totalFiles}
                prefix={<FileTextOutlined className="text-blue-600" />}
                valueStyle={{
                  color: "#1E40AF",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
              <Statistic
                title={
                  <span className="text-red-700 font-semibold">Errors</span>
                }
                value={data.totals.totalErrors}
                prefix={<ExclamationCircleOutlined className="text-red-600" />}
                valueStyle={{
                  color: "#DC2626",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <Statistic
                title={
                  <span className="text-yellow-700 font-semibold">
                    Warnings
                  </span>
                }
                value={data.totals.totalWarnings}
                prefix={<WarningOutlined className="text-yellow-600" />}
                valueStyle={{
                  color: "#D97706",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <Statistic
                title={
                  <span className="text-green-700 font-semibold">
                    Info Messages
                  </span>
                }
                value={data.totals.totalInfo}
                prefix={<InfoCircleOutlined className="text-green-600" />}
                valueStyle={{
                  color: "#059669",
                  fontSize: "28px",
                  fontWeight: "bold",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Services Overview */}
        <Card
          title={
            <span className="text-lg font-semibold text-slate-800">
              Services Overview
            </span>
          }
          className="border-0 shadow-lg rounded-xl"
        >
          <Row gutter={[20, 20]}>
            {data.services.map((service) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={service.service_name}>
                <Card
                  size="small"
                  className="text-center border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg hover:scale-105"
                >
                  <Title
                    level={4}
                    className="mb-3 text-slate-800 font-semibold"
                  >
                    {service.service_name}
                  </Title>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Files:</span>
                      <span className="font-bold text-blue-600">
                        {service.total_files}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-bold text-purple-600">
                        {formatFileSize(service.total_size)}
                      </span>
                    </div>
                    <div className="flex justify-around pt-2 border-t">
                      <div className="text-center">
                        <div className="text-red-500 font-bold text-lg">
                          {service.error_count}
                        </div>
                        <div className="text-xs text-gray-500">Errors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-500 font-bold text-lg">
                          {service.warn_count}
                        </div>
                        <div className="text-xs text-gray-500">Warnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-500 font-bold text-lg">
                          {service.info_count}
                        </div>
                        <div className="text-xs text-gray-500">Info</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Recent Files */}
        <Card
          title={
            <span className="text-lg font-semibold text-slate-800">
              Recent Log Files
            </span>
          }
          className="border-0 shadow-lg rounded-xl"
        >
          <Table<LogFileWithStats>
            columns={columns}
            dataSource={data.recentFiles}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
              className: "px-4 py-3",
            }}
            scroll={{ x: 800 }}
            className="rounded-lg overflow-hidden"
          />
        </Card>
      </div>
    </AppLayout>
  );
}
