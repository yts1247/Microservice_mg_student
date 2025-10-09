"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const router = useRouter();
  const { user, token, isAuthenticated, logout: storeLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if auth state is loaded from localStorage
    setIsLoading(false);
  }, []);

  const logout = () => {
    storeLogout();
    router.push("/login");
  };

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    logout,
    requireAuth,
  };
};
