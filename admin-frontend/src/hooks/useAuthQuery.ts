import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService, LoginRequest, RegisterRequest } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

// Login mutation
export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginRequest) => AuthService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};

// Register mutation
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
    queryKey: ['profile'],
    queryFn: () => AuthService.getProfile(),
    enabled: !!token,
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (profileData: any) => AuthService.updateProfile(profileData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateUser(data);
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwordData: { oldPassword: string; newPassword: string }) =>
      AuthService.changePassword(passwordData),
  });
};
