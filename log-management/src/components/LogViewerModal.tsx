"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Input,
  Select,
  Space,
  Tag,
  Button,
  Typography,
  message,
  Spin,
} from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import { LogEntry, PaginatedResponse } from "@/types";

const { Text } = Typography;

interface LogViewerModalProps {
  visible: boolean;
  fileId: number | null;
  onClose: () => void;
}

export default function LogViewerModal({
  visible,
  fileId,
  onClose,
}: LogViewerModalProps) {
  const [data, setData] = useState<PaginatedResponse<LogEntry> | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    level: "",
    page: 1,
    pageSize: 50,
  });

  useEffect(() => {
    if (visible && fileId) {
      loadLogEntries();
    }
  }, [visible, fileId, filters]);

  const loadLogEntries = async () => {
    if (!fileId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `/api/logs/files/${fileId}/entries?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        message.error(result.error || "Failed to load log entries");
      }
    } catch (error) {
      message.error("Network error");
      console.error("Load log entries error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level?.toLowerCase()) {
      case "error":
        return "red";
      case "warn":
      case "warning":
        return "orange";
      case "info":
        return "blue";
      case "debug":
        return "green";
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const columns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      render: (timestamp: string) => (
        <Text className="text-xs font-mono">{formatTimestamp(timestamp)}</Text>
      ),
      sorter: (a: LogEntry, b: LogEntry) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "Level",
      dataIndex: "level",
      key: "level",
      width: 80,
      render: (level: string) => (
        <Tag color={getLevelColor(level)} className="text-xs">
          {level?.toUpperCase() || "INFO"}
        </Tag>
      ),
      filters: [
        { text: "ERROR", value: "error" },
        { text: "WARN", value: "warn" },
        { text: "INFO", value: "info" },
        { text: "DEBUG", value: "debug" },
      ],
      onFilter: (value: any, record: LogEntry) =>
        record.level?.toLowerCase() === value,
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (message: string) => (
        <Text className="text-sm font-mono" style={{ whiteSpace: "pre-wrap" }}>
          {message}
        </Text>
      ),
    },
  ];

  const handleReset = () => {
    setFilters({
      search: "",
      level: "",
      page: 1,
      pageSize: 50,
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">📄</span>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-800">
              Log Viewer
            </div>
            <div className="text-sm text-slate-500">File ID: {fileId}</div>
          </div>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      width="95%"
      style={{ top: 20 }}
      footer={[
        <Button key="reset" onClick={handleReset} className="rounded-lg">
          Reset Filters
        </Button>,
        <Button
          key="close"
          onClick={onClose}
          type="primary"
          className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600"
        >
          Close
        </Button>,
      ]}
      className="log-viewer-modal"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl shadow-inner">
          <h4 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            🔍 Filter Options
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Search in message
              </label>
              <Input
                placeholder="Search message content..."
                prefix={<SearchOutlined className="text-blue-500" />}
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                allowClear
                size="large"
                className="rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Log Level
              </label>
              <Select
                value={filters.level}
                onChange={(value) =>
                  setFilters({ ...filters, level: value, page: 1 })
                }
                placeholder="All Levels"
                className="w-full"
                allowClear
                size="large"
              >
                <Select.Option value="error">🔴 ERROR</Select.Option>
                <Select.Option value="warn">🟡 WARN</Select.Option>
                <Select.Option value="info">🔵 INFO</Select.Option>
                <Select.Option value="debug">⚪ DEBUG</Select.Option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Page Size
              </label>
              <Select
                value={filters.pageSize}
                onChange={(value) =>
                  setFilters({ ...filters, pageSize: value, page: 1 })
                }
                className="w-full"
                size="large"
              >
                <Select.Option value={25}>25 per page</Select.Option>
                <Select.Option value={50}>50 per page</Select.Option>
                <Select.Option value={100}>100 per page</Select.Option>
                <Select.Option value={200}>200 per page</Select.Option>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ height: "60vh" }}>
          <Table<LogEntry>
            columns={columns}
            dataSource={data?.data || []}
            rowKey="id"
            loading={loading}
            pagination={{
              current: filters.page,
              pageSize: filters.pageSize,
              total: data?.total || 0,
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} entries`,
              onChange: (page) => setFilters({ ...filters, page }),
              size: "small",
            }}
            scroll={{ y: 400, x: 800 }}
            size="small"
            expandable={{
              expandedRowRender: (record) => (
                <div className="p-4 bg-slate-50">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <strong>Line:</strong> {record.line_number}
                    </div>
                    <div>
                      <strong>Raw Content:</strong>
                    </div>
                    <pre className="text-xs bg-slate-100 p-2 rounded border overflow-auto max-h-40 font-mono">
                      {record.raw_content}
                    </pre>
                  </div>
                </div>
              ),
              rowExpandable: (record) => !!record.raw_content,
            }}
          />
        </div>
      </div>
    </Modal>
  );
}
