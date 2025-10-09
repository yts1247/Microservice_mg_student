"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  message,
  Typography,
  Divider,
  Space,
  Alert,
  Tag,
} from "antd";
import {
  SettingOutlined,
  SaveOutlined,
  ClearOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import AppLayout from "@/components/AppLayout";

const { Title, Text } = Typography;

interface CronjobConfig {
  enabled: boolean;
  retention_days: number;
  schedule: string;
  last_run?: string;
  next_run?: string;
}

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<CronjobConfig | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/cronjob/config", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setConfig(result.data);
        form.setFieldsValue(result.data);
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const handleSave = async (values: CronjobConfig) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/cronjob/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (result.success) {
        message.success("Settings saved successfully");
        loadConfig(); // Reload to get updated next_run time
      } else {
        message.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      message.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCleanup = async () => {
    setCleanupLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/cronjob/cleanup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.error || "Cleanup failed");
      }
    } catch (error) {
      message.error("Cleanup failed");
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleString();
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <Title
              level={2}
              className="m-0 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3 font-black"
            >
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <SettingOutlined className="text-white text-xl" />
              </div>
              System Settings
            </Title>
            <p className="text-slate-600 mt-2 text-lg font-medium">
              Configure log management and cleanup policies for optimal
              performance
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-3"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Configuration Form */}
          <div className="xl:col-span-2">
            <Card
              title={
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <ClockCircleOutlined className="text-white text-lg" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Automated Cleanup Configuration
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
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                className="space-y-4"
              >
                <Form.Item
                  name="enabled"
                  label={
                    <span className="font-semibold text-slate-700">
                      Enable Automated Cleanup
                    </span>
                  }
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Enabled"
                    unCheckedChildren="Disabled"
                    className="bg-slate-300"
                  />
                </Form.Item>

                <Form.Item
                  name="retention_days"
                  label={
                    <span className="font-semibold text-slate-700">
                      Log Retention (Days)
                    </span>
                  }
                  rules={[
                    { required: true, message: "Please input retention days!" },
                    {
                      type: "number",
                      min: 1,
                      max: 365,
                      message: "Must be between 1-365 days",
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={365}
                    className="w-full"
                    size="large"
                    addonAfter="days"
                  />
                </Form.Item>

                <Form.Item
                  name="schedule"
                  label={
                    <span className="font-semibold text-slate-700">
                      Cron Schedule
                    </span>
                  }
                  rules={[
                    { required: true, message: "Please input cron schedule!" },
                  ]}
                >
                  <Input
                    placeholder="0 2 * * *"
                    size="large"
                    className="font-mono"
                  />
                </Form.Item>

                <Alert
                  message="Cron Schedule Format"
                  description={
                    <div className="text-sm">
                      <p className="mb-2">
                        Format: minute hour day month weekday
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          • <code>0 2 * * *</code> - Daily at 2:00 AM
                        </div>
                        <div>
                          • <code>0 0 * * 0</code> - Weekly on Sunday
                        </div>
                        <div>
                          • <code>0 1 1 * *</code> - Monthly on 1st day
                        </div>
                        <div>
                          • <code>*/30 * * * *</code> - Every 30 minutes
                        </div>
                      </div>
                    </div>
                  }
                  type="info"
                  className="mb-4"
                />

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    size="large"
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Save Configuration
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>

          {/* Status & Actions */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card
              title={
                <span className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <DatabaseOutlined className="text-green-500" />
                  Current Status
                </span>
              }
              className="border-0 shadow-lg rounded-xl"
            >
              {config && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Text className="text-slate-600">Status:</Text>
                    <Tag
                      color={config.enabled ? "green" : "red"}
                      className="px-3 py-1 rounded-full"
                    >
                      {config.enabled ? "Active" : "Disabled"}
                    </Tag>
                  </div>

                  <div className="flex justify-between items-center">
                    <Text className="text-slate-600">Retention:</Text>
                    <Tag color="blue" className="px-3 py-1 rounded-full">
                      {config.retention_days} days
                    </Tag>
                  </div>

                  <div className="flex justify-between items-center">
                    <Text className="text-slate-600">Schedule:</Text>
                    <Tag
                      color="purple"
                      className="px-2 py-1 font-mono text-xs rounded-full"
                    >
                      {config.schedule}
                    </Tag>
                  </div>

                  <Divider className="my-4" />

                  <div className="space-y-2">
                    <div>
                      <Text strong className="text-slate-700">
                        Last Run:
                      </Text>
                      <div className="text-sm text-slate-500 mt-1">
                        {formatDate(config.last_run)}
                      </div>
                    </div>

                    <div>
                      <Text strong className="text-slate-700">
                        Next Run:
                      </Text>
                      <div className="text-sm text-slate-500 mt-1">
                        {formatDate(config.next_run)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Manual Actions */}
            <Card
              title={
                <span className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <ClearOutlined className="text-orange-500" />
                  Manual Actions
                </span>
              }
              className="border-0 shadow-lg rounded-xl"
            >
              <div className="space-y-4">
                <Alert
                  message="Manual Cleanup"
                  description="Run cleanup immediately using current retention settings"
                  type="warning"
                  className="rounded-lg"
                />

                <Button
                  type="default"
                  danger
                  onClick={handleManualCleanup}
                  loading={cleanupLoading}
                  icon={<ClearOutlined />}
                  size="large"
                  className="w-full rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Run Cleanup Now
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
