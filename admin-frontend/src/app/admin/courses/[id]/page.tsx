"use client";

import React from "react";
import {
  Typography,
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Popconfirm,
  Progress,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useCourse, useDeleteCourse } from "@/hooks/useCourses";
import { formatDateTime } from "@/lib/dateFormatter";

const { Title } = Typography;

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);

  console.log("params:", params);
  console.log("courseId:", courseId);

  const {
    data: courseData,
    isLoading,
    error,
    isFetching,
  } = useCourse(courseId);
  const deleteMutation = useDeleteCourse();

  console.log("courseData:", courseData);
  console.log("error:", error);
  console.log("isLoading:", isLoading);
  console.log("isFetching:", isFetching);

  function isAxiosError(
    error: unknown
  ): error is { response?: { data?: { message?: string } } } {
    return (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as Record<string, unknown>).response === "object"
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(courseId);
      message.success({ content: "Xóa khóa học thành công!", type: "success" });
      router.push("/admin/courses");
    } catch (err: unknown) {
      let errorMessage = "Xóa thất bại!";
      if (isAxiosError(err) && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      }
      message.error({ content: errorMessage, type: "error" });
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải thông tin khóa học..." />
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="p-8">
        <Card>
          <Title level={4} type="danger">
            Lỗi: Không tìm thấy ID khóa học
          </Title>
          <p>courseId is empty or undefined</p>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <Title level={4} type="danger">
            Lỗi khi tải khóa học
          </Title>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : JSON.stringify(error)}
          </p>
          <p className="text-gray-600 mb-4">Course ID: {courseId}</p>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </Card>
      </div>
    );
  }

  if (!courseData || !courseData.data) {
    return (
      <div className="p-8">
        <Card>
          <Title level={4} type="danger">
            Không có dữ liệu khóa học
          </Title>
          {!courseData && (
            <p className="text-red-600 mb-4">courseData is undefined</p>
          )}
          {courseData && !courseData.data && (
            <p className="text-red-600 mb-4">courseData.data is undefined</p>
          )}
          <p className="text-gray-600 mb-4">Course ID: {courseId}</p>
          <p className="text-gray-600 mb-4">
            Full Response: {JSON.stringify(courseData)}
          </p>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </Card>
      </div>
    );
  }

  const course = courseData.data;
  const enrollmentRate =
    course.capacity &&
    typeof course.capacity.max === "number" &&
    course.capacity.max > 0
      ? ((course.capacity.enrolled || 0) / course.capacity.max) * 100
      : 0;

  const getLevelColor = (level: string) => {
    const colors = { beginner: "green", intermediate: "blue", advanced: "red" };
    return colors[level as keyof typeof colors] || "default";
  };

  const getLevelText = (level: string) => {
    const texts = {
      beginner: "Cơ bản",
      intermediate: "Trung cấp",
      advanced: "Nâng cao",
    };
    return texts[level as keyof typeof texts] || level;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "default",
      published: "blue",
      ongoing: "green",
      completed: "purple",
      cancelled: "red",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: "Nháp",
      published: "Đã xuất bản",
      ongoing: "Đang diễn ra",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getSemesterText = (semester: string) => {
    const texts = { spring: "Xuân", summer: "Hè", fall: "Thu", winter: "Đông" };
    return texts[semester as keyof typeof texts] || semester;
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Quay lại
          </Button>
          <Title level={2} className="mb-0">
            <BookOutlined className="mr-2" />
            {course.title}
          </Title>
        </Space>
        <Space>
          <Button icon={<EditOutlined />}>Chỉnh sửa</Button>
          <Popconfirm
            title="Xóa khóa học"
            description="Bạn có chắc chắn muốn xóa khóa học này?"
            onConfirm={handleDelete}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Card className="mb-6">
        <Descriptions
          title="Thông tin cơ bản"
          bordered
          column={{ xs: 1, sm: 2 }}
        >
          <Descriptions.Item label="Mã khóa học">
            {course.courseCode}
          </Descriptions.Item>
          <Descriptions.Item label="Tên khóa học">
            {course.title}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={2}>
            {course.description}
          </Descriptions.Item>
          <Descriptions.Item label="Khoa">
            {course.department}
          </Descriptions.Item>
          <Descriptions.Item label="Tín chỉ">
            {course.credits}
          </Descriptions.Item>
          <Descriptions.Item label="Cấp độ">
            <Tag color={getLevelColor(course.level || "")}>
              {getLevelText(course.level || "")}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={getStatusColor(course.status || "")}>
              {getStatusText(course.status || "")}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="mb-6" title="Thông tin đăng ký">
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Sức chứa tối đa">
            {course.capacity?.max ?? "Không có dữ liệu"}
          </Descriptions.Item>
          <Descriptions.Item label="Đang đăng ký">
            {course.capacity?.enrolled ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Tỷ lệ đăng ký">
            <Progress
              percent={Math.round(enrollmentRate)}
              status={enrollmentRate >= 100 ? "exception" : "active"}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {course.instructor && (
        <Card className="mb-6" title="Thông tin giảng viên">
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            {course.instructor.name && (
              <Descriptions.Item label="Tên giảng viên">
                {course.instructor.name}
              </Descriptions.Item>
            )}
            {course.instructor.email && (
              <Descriptions.Item label="Email">
                {course.instructor.email}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Mã giảng viên">
              {course.instructor.userId}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card className="mb-6" title="Thông tin bổ sung">
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Ngày tạo">
            {formatDateTime(course.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật">
            {formatDateTime(course.updatedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái hoạt động">
            {course.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      {course.schedule && (
        <Card className="mb-6" title="Lịch học">
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Học kỳ">
              {getSemesterText(course.schedule.semester || "")}
            </Descriptions.Item>
            <Descriptions.Item label="Năm">
              {course.schedule.year}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
}
