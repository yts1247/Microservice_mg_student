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
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SecurityScanOutlined,
  UsergroupAddOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { RBACGuard } from "../../../../components/RBACGuard";
import {
  PermissionResource,
  PermissionAction,
} from "../../../../types/rbac.types";
import { adminService } from "../../../../services/adminService";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  _id: string;
  resource: string;
  action: string;
  description?: string;
}

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalRoles: 0,
    activeRoles: 0,
    totalPermissions: 0,
  });

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await adminService.getRoles();
      if (response.success) {
        setRoles(response.data);
        setStats((prev) => ({
          ...prev,
          totalRoles: response.data.length,
          activeRoles: response.data.filter((r: Role) => r.isActive).length,
        }));
      }
    } catch (error) {
      message.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      const response = await adminService.getPermissions();
      if (response.success) {
        setPermissions(response.data);
        setStats((prev) => ({
          ...prev,
          totalPermissions: response.data.length,
        }));
      }
    } catch (error) {
      message.error("Failed to fetch permissions");
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // Handle create/edit role
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const response = editingRole
        ? await adminService.updateRole(editingRole._id, values)
        : await adminService.createRole(values);

      if (response.success) {
        message.success(
          `Role ${editingRole ? "updated" : "created"} successfully`
        );
        setModalVisible(false);
        setEditingRole(null);
        form.resetFields();
        fetchRoles();
      }
    } catch (error: any) {
      message.error(`Failed to ${editingRole ? "update" : "create"} role`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete role
  const handleDelete = async (roleId: string) => {
    try {
      const response = await adminService.deleteRole(roleId);
      if (response.success) {
        message.success("Role deleted successfully");
        fetchRoles();
      }
    } catch (error: any) {
      message.error("Failed to delete role");
    }
  };

  // Open edit modal
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p) => p._id),
      isActive: role.isActive,
    });
    setModalVisible(true);
  };

  // Open create modal
  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Role) => (
        <Space>
          <SecurityScanOutlined />
          <Text strong>{text}</Text>
          {!record.isActive && <Tag color="red">Inactive</Tag>}
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
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions: Permission[]) => (
        <Space wrap>
          {permissions.slice(0, 3).map((permission) => (
            <Tag key={permission._id} color="blue">
              {permission.resource}.{permission.action}
            </Tag>
          ))}
          {permissions.length > 3 && <Tag>+{permissions.length - 3} more</Tag>}
        </Space>
      ),
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
      render: (_: unknown, record: Role) => (
        <Space>
          <RBACGuard
            resource={PermissionResource.ROLES}
            action={PermissionAction.UPDATE}
          >
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          </RBACGuard>
          <RBACGuard
            resource={PermissionResource.ROLES}
            action={PermissionAction.DELETE}
          >
            <Popconfirm
              title="Are you sure you want to delete this role?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record._id)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okType="danger"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </RBACGuard>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>
          <SecurityScanOutlined className="mr-2" />
          Role Management
        </Title>
        <Text type="secondary">Manage system roles and their permissions</Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Roles"
              value={stats.totalRoles}
              prefix={<UsergroupAddOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Roles"
              value={stats.activeRoles}
              prefix={<SecurityScanOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Permissions"
              value={stats.totalPermissions}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Roles</Title>
          <RBACGuard
            resource={PermissionResource.ROLES}
            action={PermissionAction.CREATE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create Role
            </Button>
          </RBACGuard>
        </div>

        <Table
          columns={columns}
          dataSource={roles}
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
        title={editingRole ? "Edit Role" : "Create Role"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRole(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            label="Role Name"
            name="name"
            rules={[
              { required: true, message: "Please enter role name" },
              { min: 3, message: "Role name must be at least 3 characters" },
            ]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Enter role description" />
          </Form.Item>

          <Form.Item
            label="Permissions"
            name="permissions"
            rules={[
              {
                required: true,
                message: "Please select at least one permission",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select permissions"
              optionFilterProp="children"
              showSearch
            >
              {permissions.map((permission) => (
                <Select.Option key={permission._id} value={permission._id}>
                  {permission.resource}.{permission.action}
                  {permission.description && ` - ${permission.description}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Status" name="isActive" valuePropName="checked">
            <Select>
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingRole ? "Update" : "Create"} Role
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RolesPage;
