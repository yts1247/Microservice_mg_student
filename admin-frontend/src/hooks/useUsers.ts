// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
};
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserService, User, UsersQueryParams } from "@/services/userService";

// Get users list query
export const useUsers = (params?: UsersQueryParams) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => UserService.getUsers(params),
  });
};

// Get user by ID query
export const useUser = (id: string | "") => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => UserService.getUserById(id),
    enabled: id.length > 0, // Only enable query when id is not empty
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Get user stats query
export const useUserStats = () => {
  return useQuery({
    queryKey: ["userStats"],
    queryFn: () => UserService.getUserStats(),
  });
};

// Activate user mutation
export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UserService.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
};

// Deactivate user mutation
export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UserService.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      UserService.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
