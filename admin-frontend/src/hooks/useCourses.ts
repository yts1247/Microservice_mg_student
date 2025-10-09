import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CourseService,
  CoursesQueryParams,
  CreateCourseRequest,
  UpdateCourseRequest,
} from "@/services/courseService";

// Get courses list query
export const useCourses = (params?: CoursesQueryParams) => {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => CourseService.getCourses(params),
  });
};

// Get available courses query
export const useAvailableCourses = (params?: CoursesQueryParams) => {
  return useQuery({
    queryKey: ["availableCourses", params],
    queryFn: () => CourseService.getAvailableCourses(params),
  });
};

// Get my courses query (for instructors)
export const useMyCourses = () => {
  return useQuery({
    queryKey: ["myCourses"],
    queryFn: () => CourseService.getMyCourses(),
  });
};

// Get course by ID query
export const useCourse = (id: string) => {
  return useQuery({
    queryKey: ["course", id],
    queryFn: () => CourseService.getCourseById(id),
    enabled: !!id,
  });
};

// Get course stats query
export const useCourseStats = () => {
  return useQuery({
    queryKey: ["courseStats"],
    queryFn: () => CourseService.getCourseStats(),
  });
};

// Create course mutation
export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseData: CreateCourseRequest) =>
      CourseService.createCourse(courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courseStats"] });
    },
  });
};

// Update course mutation
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseRequest }) =>
      CourseService.updateCourse(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

// Delete course mutation
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => CourseService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courseStats"] });
    },
  });
};
