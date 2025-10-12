"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  KeyOutlined,
  SecurityScanOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { RBACGuard } from "../../../../components/RBACGuard";
import {
  PermissionResource,
  PermissionAction,
} from "../../../../types/rbac.types";
import { adminService } from "../../../../services/adminService";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Permission {
  _id: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalPermissions: 0,
    resourceCount: 0,
    actionCount: 0,
  });

  // Available resources and actions
  const availableResources = Object.values(PermissionResource);
  const availableActions = Object.values(PermissionAction);

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPermissions();
      if (response.success) {
        setPermissions(response.data);

        // Calculate stats
        const uniqueResources = new Set(
          response.data.map((p: Permission) => p.resource)
        );
        const uniqueActions = new Set(
          response.data.map((p: Permission) => p.action)
        );

        setStats({
          totalPermissions: response.data.length,
          resourceCount: uniqueResources.size,
          actionCount: uniqueActions.size,
        });
      }
    } catch (error) {
      message.error("Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Handle create/edit permission
  const handleSubmit = async (values: {
    resource: string;
    action: string;
    description?: string;
  }) => {
    try {
      setLoading(true);
      const response = editingPermission
        ? await adminService.updatePermission(editingPermission._id, values)
        : await adminService.createPermission(values);

      if (response.success) {
        message.success(
          `Permission ${editingPermission ? "updated" : "created"} successfully`
        );
        setModalVisible(false);
        setEditingPermission(null);
        form.resetFields();
        fetchPermissions();
      }
    } catch (error: any) {
      message.error(
        `Failed to ${editingPermission ? "update" : "create"} permission`
      );
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    form.setFieldsValue({
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    });
    setModalVisible(true);
  };

  // Open create modal
  const handleCreate = () => {
    setEditingPermission(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Get resource color
  const getResourceColor = (resource: string) => {
    const colors: Record<string, string> = {
      USERS: "blue",
      COURSES: "green",
      SCHEDULES: "orange",
      ENROLLMENTS: "purple",
      SYSTEM: "red",
      LOGS: "cyan",
      DASHBOARD: "magenta",
      ROLES: "gold",
      PERMISSIONS: "lime",
    };
    return colors[resource] || "default";
  };

  // Get action color
  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "success",
      READ: "processing",
      UPDATE: "warning",
      DELETE: "error",
      MANAGE: "default",
    };
    return colors[action] || "default";
  };

  const columns = [
    {
      title: "Resource",
      dataIndex: "resource",
      key: "resource",
      render: (resource: string) => (
        <Tag color={getResourceColor(resource)} icon={<ApiOutlined />}>
          {resource}
        </Tag>
      ),
      filters: availableResources.map((resource) => ({
        text: resource,
        value: resource,
      })),
      onFilter: (value: unknown, record: Permission) =>
        record.resource === value,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action: string) => (
        <Tag color={getActionColor(action)}>{action}</Tag>
      ),
      filters: availableActions.map((action) => ({
        text: action,
        value: action,
      })),
      onFilter: (value: unknown, record: Permission) => record.action === value,
    },
    {
      title: "Permission",
      key: "permission",
      render: (_: unknown, record: Permission) => (
        <Space>
          <SecurityScanOutlined />
          <Text strong>
            {record.resource}.{record.action}
          </Text>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => text || "-",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: Permission) => (
        <RBACGuard
          resource={PermissionResource.PERMISSIONS}
          action={PermissionAction.UPDATE}
        >
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
        </RBACGuard>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>
          <KeyOutlined className="mr-2" />
          Permission Management
        </Title>
        <Text type="secondary">
          Manage system permissions and access controls
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Permissions"
              value={stats.totalPermissions}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Resources"
              value={stats.resourceCount}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Actions"
              value={stats.actionCount}
              prefix={<SecurityScanOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Permissions</Title>
          <RBACGuard
            resource={PermissionResource.PERMISSIONS}
            action={PermissionAction.CREATE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Permission
            </Button>
          </RBACGuard>
        </div>

        <Table
          columns={columns}
          dataSource={permissions}
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
        title={editingPermission ? "Edit Permission" : "Create Permission"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPermission(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Resource"
            name="resource"
            rules={[{ required: true, message: "Please select a resource" }]}
          >
            <Select
              placeholder="Select resource"
              disabled={!!editingPermission} // Can't change resource for existing permission
            >
              {availableResources.map((resource) => (
                <Select.Option key={resource} value={resource}>
                  {resource}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Action"
            name="action"
            rules={[{ required: true, message: "Please select an action" }]}
          >
            <Select
              placeholder="Select action"
              disabled={!!editingPermission} // Can't change action for existing permission
            >
              {availableActions.map((action) => (
                <Select.Option key={action} value={action}>
                  {action}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Enter permission description" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingPermission ? "Update" : "Create"} Permission
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionsPage;
