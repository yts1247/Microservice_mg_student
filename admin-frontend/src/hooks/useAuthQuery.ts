import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AuthService,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ProfileUpdateRequest,
} from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

// Login mutation
export const useLogin = (options?: {
  onSuccess?: (data: LoginResponse | { data: LoginResponse }) => void;
}) => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginRequest) => AuthService.login(credentials),
    onSuccess: (data: LoginResponse | { data: LoginResponse }) => {
      console.log("Login response:", data);
      // Support both { user, token } and { data: { user, token } }
      const responseData = "data" in data ? data.data : data;
      const user = responseData.user;
      const token = responseData.token;
      console.log("Extracted user:", user);
      console.log("Extracted token:", token);

      if (user && token) {
        setAuth(user as any, token);
        console.log("Auth state set successfully");
        if (options?.onSuccess) {
          console.log("Calling onSuccess callback");
          options.onSuccess(data);
        }
      } else {
        console.error("Failed to extract user or token from response");
      }
    },
  });
}; // Register mutation
export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: RegisterRequest) => AuthService.register(userData),
  });
};

// Logout mutation
export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
};

// Get profile query
export const useProfile = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["profile"],
    queryFn: () => AuthService.getProfile(),
    enabled: !!token,
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (profileData: ProfileUpdateRequest) =>
      AuthService.updateProfile(profileData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      updateUser(data as any);
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwordData: { oldPassword: string; newPassword: string }) =>
      AuthService.changePassword({
        currentPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      }),
  });
};
