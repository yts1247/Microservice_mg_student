"use client";

import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  Upload,
  message,
  Tabs,
  Typography,
  Divider,
  Space,
  Alert,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  MailOutlined,
  BellOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [faviconFileList, setFaviconFileList] = useState<UploadFile[]>([]);

  const [generalForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [notificationForm] = Form.useForm();

  const handleSave = async (
    formType: string,
    values: Record<string, unknown>
  ) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Saving settings:", values);
      message.success(`Cập nhật ${formType} thành công`);
    } catch {
      message.error(`Không thể cập nhật ${formType}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Cài đặt hệ thống</Title>
      </div>

      <Card>
        <Tabs defaultActiveKey="general" type="card">
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                Cài đặt chung
              </span>
            }
            key="general"
          >
            <Form
              form={generalForm}
              layout="vertical"
              onFinish={(values) => handleSave("cài đặt chung", values)}
              initialValues={{
                siteName: "Admin Panel",
                siteDescription: "Hệ thống quản trị nội dung",
                language: "vi",
                timezone: "Asia/Ho_Chi_Minh",
                maintenanceMode: false,
                registrationEnabled: true,
                maxFileSize: 10,
                allowedFileTypes: "jpg,jpeg,png,gif,pdf,doc,docx",
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Form.Item
                    name="siteName"
                    label="Tên website"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên website!" },
                    ]}
                  >
                    <Input placeholder="Nhập tên website" />
                  </Form.Item>

                  <Form.Item name="siteDescription" label="Mô tả website">
                    <TextArea rows={3} placeholder="Nhập mô tả website" />
                  </Form.Item>

                  <Form.Item name="language" label="Ngôn ngữ mặc định">
                    <Select>
                      <Option value="vi">Tiếng Việt</Option>
                      <Option value="en">English</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="timezone" label="Múi giờ">
                    <Select>
                      <Option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</Option>
                      <Option value="UTC">UTC</Option>
                      <Option value="America/New_York">New York (UTC-5)</Option>
                    </Select>
                  </Form.Item>
                </div>

                <div>
                  <Form.Item label="Logo website">
                    <Upload
                      listType="picture-card"
                      fileList={logoFileList}
                      onChange={({ fileList }) => setLogoFileList(fileList)}
                      beforeUpload={() => false}
                    >
                      {logoFileList.length >= 1 ? null : (
                        <div>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>Logo</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>

                  <Form.Item label="Favicon">
                    <Upload
                      listType="picture-card"
                      fileList={faviconFileList}
                      onChange={({ fileList }) => setFaviconFileList(fileList)}
                      beforeUpload={() => false}
                    >
                      {faviconFileList.length >= 1 ? null : (
                        <div>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>Favicon</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>

                  <Form.Item
                    name="maintenanceMode"
                    label="Chế độ bảo trì"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="registrationEnabled"
                    label="Cho phép đăng ký"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </div>
              </div>

              <Divider />

              <Title level={4}>Cài đặt file upload</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="maxFileSize"
                  label="Kích thước file tối đa (MB)"
                >
                  <InputNumber min={1} max={100} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item name="allowedFileTypes" label="Loại file cho phép">
                  <Input placeholder="jpg,png,pdf,doc..." />
                </Form.Item>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  Lưu cài đặt
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <SecurityScanOutlined />
                Bảo mật
              </span>
            }
            key="security"
          >
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={(values) => handleSave("cài đặt bảo mật", values)}
              initialValues={{
                passwordMinLength: 8,
                passwordRequireUppercase: true,
                passwordRequireNumbers: true,
                passwordRequireSymbols: false,
                sessionTimeout: 60,
                maxLoginAttempts: 5,
                lockoutDuration: 30,
                twoFactorEnabled: false,
              }}
            >
              <Alert
                message="Cài đặt bảo mật"
                description="Những cài đặt này ảnh hưởng đến bảo mật của toàn bộ hệ thống."
                type="info"
                showIcon
                className="mb-6"
              />

              <Title level={4}>Chính sách mật khẩu</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item name="passwordMinLength" label="Độ dài tối thiểu">
                  <InputNumber min={6} max={20} style={{ width: "100%" }} />
                </Form.Item>

                <div className="space-y-4">
                  <Form.Item
                    name="passwordRequireUppercase"
                    label="Yêu cầu chữ hoa"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="passwordRequireNumbers"
                    label="Yêu cầu số"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="passwordRequireSymbols"
                    label="Yêu cầu ký tự đặc biệt"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </div>
              </div>

              <Divider />

              <Title level={4}>Cài đặt phiên đăng nhập</Title>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Form.Item
                  name="sessionTimeout"
                  label="Thời gian hết hạn phiên (phút)"
                >
                  <InputNumber min={15} max={1440} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="maxLoginAttempts"
                  label="Số lần đăng nhập sai tối đa"
                >
                  <InputNumber min={3} max={10} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="lockoutDuration"
                  label="Thời gian khóa tài khoản (phút)"
                >
                  <InputNumber min={5} max={60} style={{ width: "100%" }} />
                </Form.Item>
              </div>

              <Divider />

              <Title level={4}>Xác thực hai yếu tố</Title>
              <Form.Item
                name="twoFactorEnabled"
                label="Bật xác thực hai yếu tố"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  Lưu cài đặt bảo mật
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <MailOutlined />
                Email
              </span>
            }
            key="email"
          >
            <Form
              form={emailForm}
              layout="vertical"
              onFinish={(values) => handleSave("cài đặt email", values)}
              initialValues={{
                smtpHost: "",
                smtpPort: 587,
                smtpUsername: "",
                smtpPassword: "",
                smtpEncryption: "TLS",
                fromEmail: "",
                fromName: "Admin Panel",
              }}
            >
              <Alert
                message="Cài đặt SMTP"
                description="Cấu hình máy chủ email để gửi thông báo và xác thực."
                type="info"
                showIcon
                className="mb-6"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="smtpHost"
                  label="SMTP Host"
                  rules={[
                    { required: true, message: "Vui lòng nhập SMTP host!" },
                  ]}
                >
                  <Input placeholder="smtp.gmail.com" />
                </Form.Item>

                <Form.Item
                  name="smtpPort"
                  label="SMTP Port"
                  rules={[
                    { required: true, message: "Vui lòng nhập SMTP port!" },
                  ]}
                >
                  <InputNumber min={1} max={65535} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  name="smtpUsername"
                  label="Username"
                  rules={[
                    { required: true, message: "Vui lòng nhập username!" },
                  ]}
                >
                  <Input placeholder="your-email@gmail.com" />
                </Form.Item>

                <Form.Item
                  name="smtpPassword"
                  label="Password"
                  rules={[
                    { required: true, message: "Vui lòng nhập password!" },
                  ]}
                >
                  <Input.Password placeholder="App password" />
                </Form.Item>

                <Form.Item name="smtpEncryption" label="Mã hóa">
                  <Select>
                    <Option value="TLS">TLS</Option>
                    <Option value="SSL">SSL</Option>
                    <Option value="NONE">Không</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="fromEmail"
                  label="Email gửi"
                  rules={[
                    { required: true, message: "Vui lòng nhập email gửi!" },
                    { type: "email", message: "Email không hợp lệ!" },
                  ]}
                >
                  <Input placeholder="noreply@yoursite.com" />
                </Form.Item>

                <Form.Item
                  name="fromName"
                  label="Tên người gửi"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên người gửi!" },
                  ]}
                >
                  <Input placeholder="Admin Panel" />
                </Form.Item>
              </div>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    Lưu cài đặt email
                  </Button>
                  <Button type="default">Gửi email thử nghiệm</Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BellOutlined />
                Thông báo
              </span>
            }
            key="notifications"
          >
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={(values) => handleSave("cài đặt thông báo", values)}
              initialValues={{
                emailNotifications: true,
                newUserRegistration: true,
                newPostCreated: true,
                systemErrors: true,
                dailyReports: false,
                weeklyReports: true,
                browserNotifications: true,
                soundEnabled: false,
              }}
            >
              <Title level={4}>Thông báo email</Title>
              <div className="space-y-4">
                <Form.Item
                  name="emailNotifications"
                  label="Bật thông báo email"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="newUserRegistration"
                  label="Thông báo khi có người dùng mới đăng ký"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="newPostCreated"
                  label="Thông báo khi có bài viết mới"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="systemErrors"
                  label="Thông báo lỗi hệ thống"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>

              <Divider />

              <Title level={4}>Báo cáo định kỳ</Title>
              <div className="space-y-4">
                <Form.Item
                  name="dailyReports"
                  label="Báo cáo hàng ngày"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="weeklyReports"
                  label="Báo cáo hàng tuần"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>

              <Divider />

              <Title level={4}>Thông báo trên trình duyệt</Title>
              <div className="space-y-4">
                <Form.Item
                  name="browserNotifications"
                  label="Bật thông báo trình duyệt"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="soundEnabled"
                  label="Âm thanh thông báo"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  Lưu cài đặt thông báo
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPage;
