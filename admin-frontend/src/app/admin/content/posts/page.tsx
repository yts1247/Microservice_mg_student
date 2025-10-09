"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Typography,
  Upload,
  Image,
  Tooltip,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  UploadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  status: "draft" | "published" | "archived";
  featuredImage?: string;
  tags: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  views: number;
}

interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  publishedAt?: string | dayjs.Dayjs;
}

const PostsPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [searchText, setSearchText] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<PostFormData>();

  // Mock data
  const mockPosts: Post[] = [
    {
      id: 1,
      title: "Giới thiệu về React và Next.js",
      slug: "gioi-thieu-ve-react-va-nextjs",
      content: "Nội dung bài viết về React và Next.js...",
      excerpt: "Bài viết giới thiệu về React và Next.js cho người mới bắt đầu",
      author: "Admin",
      category: "Technology",
      status: "published",
      featuredImage: "https://via.placeholder.com/300x200",
      tags: ["React", "Next.js", "JavaScript"],
      publishedAt: "2024-01-15",
      createdAt: "2024-01-14",
      views: 1250,
    },
    {
      id: 2,
      title: "Hướng dẫn sử dụng TypeScript",
      slug: "huong-dan-su-dung-typescript",
      content: "Nội dung bài viết về TypeScript...",
      excerpt: "Hướng dẫn chi tiết về TypeScript từ cơ bản đến nâng cao",
      author: "Editor",
      category: "Programming",
      status: "draft",
      tags: ["TypeScript", "JavaScript", "Programming"],
      createdAt: "2024-01-20",
      views: 0,
    },
    {
      id: 3,
      title: "Best Practices cho Node.js",
      slug: "best-practices-cho-nodejs",
      content: "Nội dung bài viết về Node.js best practices...",
      excerpt: "Những thực hành tốt nhất khi phát triển ứng dụng Node.js",
      author: "Admin",
      category: "Backend",
      status: "published",
      tags: ["Node.js", "Backend", "Best Practices"],
      publishedAt: "2024-02-01",
      createdAt: "2024-01-30",
      views: 890,
    },
  ];

  const categories = [
    "Technology",
    "Programming",
    "Backend",
    "Frontend",
    "DevOps",
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setPosts(mockPosts);
      } catch {
        message.error("Không thể tải danh sách bài viết");
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setEditingPost(null);
    form.resetFields();
    setFileList([]);
    setModalVisible(true);
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    const formData = {
      ...post,
      publishedAt: post.publishedAt ? dayjs(post.publishedAt) : undefined,
    };
    form.setFieldsValue(formData);
    setFileList(
      post.featuredImage
        ? [
            {
              uid: "-1",
              name: "featured-image",
              status: "done",
              url: post.featuredImage,
            },
          ]
        : []
    );
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPosts(posts.filter((post) => post.id !== id));
      message.success("Xóa bài viết thành công");
    } catch {
      message.error("Không thể xóa bài viết");
    }
  };

  const handleSubmit = async (values: PostFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const formattedValues = {
        ...values,
        publishedAt: values.publishedAt
          ? dayjs(values.publishedAt).format("YYYY-MM-DD")
          : undefined,
      };

      if (editingPost) {
        // Update post
        const updatedPost = {
          ...editingPost,
          ...formattedValues,
          updatedAt: new Date().toISOString().split("T")[0],
        };
        setPosts(
          posts.map((post) => (post.id === editingPost.id ? updatedPost : post))
        );
        message.success("Cập nhật bài viết thành công");
      } else {
        // Create new post
        const newPost: Post = {
          id: Date.now(),
          ...formattedValues,
          slug: values.title.toLowerCase().replace(/\s+/g, "-"),
          author: "Current User",
          createdAt: new Date().toISOString().split("T")[0],
          views: 0,
        };
        setPosts([...posts, newPost]);
        message.success("Tạo bài viết mới thành công");
      }

      setModalVisible(false);
      form.resetFields();
      setFileList([]);
    } catch {
      message.error("Không thể lưu bài viết");
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "orange",
      published: "green",
      archived: "volcano",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: "Bản nháp",
      published: "Đã xuất bản",
      archived: "Đã lưu trữ",
    };
    return texts[status as keyof typeof texts] || status;
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchText.toLowerCase()) ||
      post.author.toLowerCase().includes(searchText.toLowerCase()) ||
      post.category.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Post> = [
    {
      title: "Ảnh",
      dataIndex: "featuredImage",
      key: "featuredImage",
      width: 80,
      render: (image: string) => (
        <div className="w-12 h-12">
          {image ? (
            <Image
              src={image}
              alt="Featured"
              width={48}
              height={48}
              className="rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <FileTextOutlined className="text-gray-400" />
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (title: string, record: Post) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">{record.excerpt}</div>
        </div>
      ),
    },
    {
      title: "Tác giả",
      dataIndex: "author",
      key: "author",
      width: 120,
      sorter: (a, b) => a.author.localeCompare(b.author),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
      filters: categories.map((cat) => ({ text: cat, value: cat })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      width: 150,
      render: (tags: string[]) => (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: "Bản nháp", value: "draft" },
        { text: "Đã xuất bản", value: "published" },
        { text: "Đã lưu trữ", value: "archived" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Lượt xem",
      dataIndex: "views",
      key: "views",
      width: 100,
      sorter: (a, b) => a.views - b.views,
      render: (views: number) => views.toLocaleString(),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record: Post) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa bài viết"
            description="Bạn có chắc chắn muốn xóa bài viết này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Quản lý bài viết</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Tạo bài viết
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Input
            placeholder="Tìm kiếm theo tiêu đề, tác giả hoặc danh mục..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 400 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredPosts}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredPosts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} bài viết`,
          }}
        />
      </Card>

      <Modal
        title={editingPost ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: "draft", tags: [] }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input placeholder="Nhập tiêu đề bài viết" />
          </Form.Item>

          <Form.Item
            name="excerpt"
            label="Tóm tắt"
            rules={[{ required: true, message: "Vui lòng nhập tóm tắt!" }]}
          >
            <TextArea rows={3} placeholder="Nhập tóm tắt bài viết" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
          >
            <TextArea rows={8} placeholder="Nhập nội dung bài viết" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="category"
              label="Danh mục"
              rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
            >
              <Select placeholder="Chọn danh mục">
                {categories.map((category) => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="tags" label="Tags">
              <Select
                mode="tags"
                placeholder="Nhập tags"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
            >
              <Select placeholder="Chọn trạng thái">
                <Option value="draft">Bản nháp</Option>
                <Option value="published">Xuất bản</Option>
                <Option value="archived">Lưu trữ</Option>
              </Select>
            </Form.Item>

            <Form.Item name="publishedAt" label="Ngày xuất bản">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item label="Ảnh đại diện">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false} // Prevent auto upload
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingPost ? "Cập nhật" : "Tạo mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PostsPage;
