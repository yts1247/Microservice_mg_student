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

        {/* Enhanced Statistics Cards with Glassmorphism */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden group hover:scale-105 float-animation"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <div className="relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full blur-xl"></div>
                <Statistic
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-blue-500/10 backdrop-blur-sm">
                        <FileTextOutlined className="text-blue-600 text-lg" />
                      </div>
                      <span className="text-blue-700 font-bold text-sm">
                        Total Files
                      </span>
                    </div>
                  }
                  value={data.totals.totalFiles}
                  valueStyle={{
                    color: "#1E40AF",
                    fontSize: "32px",
                    fontWeight: "900",
                    fontFamily: "Inter",
                  }}
                />
                <div className="mt-4 text-xs text-blue-600/70 font-medium">
                  ↑ All log files monitored
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden group hover:scale-105 float-animation"
              style={{
                background:
                  "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(252, 165, 165, 0.1) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                animationDelay: "0.1s",
              }}
            >
              <div className="relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-full blur-xl"></div>
                <Statistic
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-red-500/10 backdrop-blur-sm">
                        <ExclamationCircleOutlined className="text-red-600 text-lg" />
                      </div>
                      <span className="text-red-700 font-bold text-sm">
                        Critical Errors
                      </span>
                    </div>
                  }
                  value={data.totals.totalErrors}
                  valueStyle={{
                    color: "#DC2626",
                    fontSize: "32px",
                    fontWeight: "900",
                    fontFamily: "Inter",
                  }}
                />
                <div className="mt-4 text-xs text-red-600/70 font-medium">
                  {data.totals.totalErrors > 0
                    ? "⚠ Requires attention"
                    : "✓ All clear"}
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden group hover:scale-105 float-animation"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(253, 230, 138, 0.1) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                animationDelay: "0.2s",
              }}
            >
              <div className="relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full blur-xl"></div>
                <Statistic
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-yellow-500/10 backdrop-blur-sm">
                        <WarningOutlined className="text-yellow-600 text-lg" />
                      </div>
                      <span className="text-yellow-700 font-bold text-sm">
                        Warnings
                      </span>
                    </div>
                  }
                  value={data.totals.totalWarnings}
                  valueStyle={{
                    color: "#D97706",
                    fontSize: "32px",
                    fontWeight: "900",
                    fontFamily: "Inter",
                  }}
                />
                <div className="mt-4 text-xs text-yellow-600/70 font-medium">
                  ⚡ Monitor closely
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden group hover:scale-105 float-animation"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(167, 243, 208, 0.1) 100%)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                animationDelay: "0.3s",
              }}
            >
              <div className="relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full blur-xl"></div>
                <Statistic
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-green-500/10 backdrop-blur-sm">
                        <InfoCircleOutlined className="text-green-600 text-lg" />
                      </div>
                      <span className="text-green-700 font-bold text-sm">
                        Info Messages
                      </span>
                    </div>
                  }
                  value={data.totals.totalInfo}
                  valueStyle={{
                    color: "#059669",
                    fontSize: "32px",
                    fontWeight: "900",
                    fontFamily: "Inter",
                  }}
                />
                <div className="mt-4 text-xs text-green-600/70 font-medium">
                  ℹ System running smoothly
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Enhanced Services Overview */}
        <Card
          title={
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <FileTextOutlined className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Services Overview
              </span>
            </div>
          }
          className="border-0 shadow-2xl rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <Row gutter={[24, 24]}>
            {data.services.map((service, index) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={service.service_name}>
                <Card
                  size="small"
                  className="text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden hover:scale-105 group"
                  style={{
                    background: `linear-gradient(135deg, ${
                      index % 4 === 0
                        ? "rgba(99, 102, 241, 0.1)"
                        : index % 4 === 1
                        ? "rgba(236, 72, 153, 0.1)"
                        : index % 4 === 2
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(16, 185, 129, 0.1)"
                    } 0%, rgba(255, 255, 255, 0.1) 100%)`,
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${
                      index % 4 === 0
                        ? "rgba(99, 102, 241, 0.2)"
                        : index % 4 === 1
                        ? "rgba(236, 72, 153, 0.2)"
                        : index % 4 === 2
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(16, 185, 129, 0.2)"
                    }`,
                  }}
                >
                  {/* Service Header */}
                  <div className="relative mb-4">
                    <div
                      className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl ${
                        index % 4 === 0
                          ? "bg-gradient-to-br from-indigo-400/30 to-purple-600/30"
                          : index % 4 === 1
                          ? "bg-gradient-to-br from-pink-400/30 to-rose-600/30"
                          : index % 4 === 2
                          ? "bg-gradient-to-br from-blue-400/30 to-cyan-600/30"
                          : "bg-gradient-to-br from-emerald-400/30 to-teal-600/30"
                      }`}
                    ></div>

                    <div
                      className={`inline-flex p-3 rounded-full mb-3 ${
                        index % 4 === 0
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                          : index % 4 === 1
                          ? "bg-gradient-to-r from-pink-500 to-rose-600"
                          : index % 4 === 2
                          ? "bg-gradient-to-r from-blue-500 to-cyan-600"
                          : "bg-gradient-to-r from-emerald-500 to-teal-600"
                      } shadow-lg group-hover:scale-110 transition-all duration-300`}
                    >
                      <FileTextOutlined className="text-white text-xl" />
                    </div>

                    <Title
                      level={4}
                      className="mb-0 font-bold text-slate-800 group-hover:scale-105 transition-all duration-300"
                    >
                      {service.service_name}
                    </Title>
                  </div>

                  {/* Service Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50 backdrop-blur-sm">
                      <span className="text-gray-600 font-medium">Files</span>
                      <span className="font-black text-lg text-blue-600">
                        {service.total_files}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-white/50 backdrop-blur-sm">
                      <span className="text-gray-600 font-medium">Size</span>
                      <span className="font-black text-lg text-purple-600">
                        {formatFileSize(service.total_size)}
                      </span>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex justify-around pt-3 border-t border-white/30">
                      <div className="text-center group-hover:scale-110 transition-all duration-300">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 font-black text-sm">
                            {service.error_count}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Errors
                        </div>
                      </div>
                      <div className="text-center group-hover:scale-110 transition-all duration-300">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-yellow-100 flex items-center justify-center">
                          <span className="text-yellow-600 font-black text-sm">
                            {service.warn_count}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Warns
                        </div>
                      </div>
                      <div className="text-center group-hover:scale-110 transition-all duration-300">
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600 font-black text-sm">
                            {service.info_count}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Info
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Enhanced Recent Files */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
                  <FileTextOutlined className="text-white text-lg" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Recent Log Files
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Updates</span>
              </div>
            </div>
          }
          className="border-0 shadow-2xl rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <Table<LogFileWithStats>
            columns={[
              {
                title: (
                  <span className="font-bold text-gray-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Service
                  </span>
                ),
                dataIndex: "service_name",
                key: "service_name",
                render: (text: string) => (
                  <Tag
                    className="px-3 py-1 rounded-full border-0 font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                    }}
                  >
                    {text}
                  </Tag>
                ),
              },
              {
                title: (
                  <span className="font-bold text-gray-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    File Name
                  </span>
                ),
                dataIndex: "file_name",
                key: "file_name",
                ellipsis: true,
                render: (text: string) => (
                  <span className="font-medium text-gray-800 hover:text-purple-600 transition-colors duration-300 cursor-pointer">
                    {text}
                  </span>
                ),
              },
              {
                title: (
                  <span className="font-bold text-gray-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Size
                  </span>
                ),
                dataIndex: "file_size",
                key: "file_size",
                render: (size: number) => (
                  <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 font-semibold text-sm">
                    {formatFileSize(size)}
                  </span>
                ),
              },
              {
                title: (
                  <span className="font-bold text-gray-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Errors
                  </span>
                ),
                dataIndex: "error_count",
                key: "error_count",
                render: (count: number) =>
                  count > 0 ? (
                    <Tag
                      className="px-3 py-1 rounded-full border-0 font-bold animate-pulse"
                      style={{
                        background:
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        color: "white",
                      }}
                    >
                      {count}
                    </Tag>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-medium text-sm">
                      0
                    </span>
                  ),
              },
            ]}
            dataSource={data.recentFiles}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
              className: "px-6 py-4",
              showTotal: (total, range) => (
                <span className="text-gray-600 font-medium">
                  Showing {range[0]}-{range[1]} of {total} files
                </span>
              ),
            }}
            scroll={{ x: 800 }}
            className="rounded-xl overflow-hidden"
            rowClassName={(record, index) =>
              `hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 ${
                index % 2 === 0 ? "bg-gray-50/50" : "bg-white"
              }`
            }
          />
        </Card>
      </div>
    </AppLayout>
  );
}
