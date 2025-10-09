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

const { Title } = Typography;

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  const { data: courseData, isLoading, error } = useCourse(courseId);
  const deleteMutation = useDeleteCourse();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(courseId);
      message.success("Xóa khóa học thành công!");
      router.push("/admin/courses");
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Xóa thất bại!";
      message.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !courseData?.data) {
    return (
      <div className="p-8">
        <Card>
          <Title level={4} type="danger">
            Không thể tải thông tin khóa học
          </Title>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </Card>
      </div>
    );
  }

  const course = courseData.data;
  const enrollmentRate =
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
            <Tag color={getLevelColor(course.level)}>
              {getLevelText(course.level)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={getStatusColor(course.status)}>
              {getStatusText(course.status)}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="mb-6" title="Thông tin đăng ký">
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Sức chứa tối đa">
            {course.capacity.max}
          </Descriptions.Item>
          <Descriptions.Item label="Đã đăng ký">
            {course.capacity.enrolled || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Danh sách chờ">
            {course.capacity.waitlist || 0}
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
            {course.instructor.teacherId && (
              <Descriptions.Item label="Mã giảng viên">
                {course.instructor.teacherId}
              </Descriptions.Item>
            )}
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
          </Descriptions>
        </Card>
      )}

      {course.schedule && (
        <Card className="mb-6" title="Lịch học">
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Học kỳ">
              {getSemesterText(course.schedule.semester)}
            </Descriptions.Item>
            <Descriptions.Item label="Năm">
              {course.schedule.year}
            </Descriptions.Item>
            {course.schedule.timeSlots &&
              course.schedule.timeSlots.length > 0 && (
                <Descriptions.Item label="Lịch trình" span={2}>
                  {course.schedule.timeSlots.map((slot, index) => (
                    <Tag key={index} color="blue" className="mb-2">
                      {slot.day}: {slot.startTime} - {slot.endTime} | Phòng:{" "}
                      {slot.room} ({slot.building})
                    </Tag>
                  ))}
                </Descriptions.Item>
              )}
          </Descriptions>
        </Card>
      )}
    </div>
  );
}
