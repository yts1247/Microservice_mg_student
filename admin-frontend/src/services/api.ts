import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// API Base URLs for different services
const USER_SERVICE_URL =
  process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001/api";
const COURSE_SERVICE_URL =
  process.env.NEXT_PUBLIC_COURSE_SERVICE_URL || "http://localhost:3002/api";

// Create axios instances for different services
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const userApiClient = createApiClient(USER_SERVICE_URL);
const courseApiClient = createApiClient(COURSE_SERVICE_URL);

// Generic API methods with service routing
export class ApiService {
  private static getClient(url: string): AxiosInstance {
    // Route to correct service based on URL
    if (url.startsWith("/courses")) {
      return courseApiClient;
    }
    // Default to user service for auth and user endpoints
    return userApiClient;
  }

  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const client = this.getClient(url);
    const response = await client.get<T>(url, config);
    return response.data;
  }

  static async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const client = this.getClient(url);
    const response = await client.post<T>(url, data, config);
    return response.data;
  }

  static async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const client = this.getClient(url);
    const response = await client.put<T>(url, data, config);
    return response.data;
  }

  static async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const client = this.getClient(url);
    const response = await client.patch<T>(url, data, config);
    return response.data;
  }

  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const client = this.getClient(url);
    const response = await client.delete<T>(url, config);
    return response.data;
  }
}

export { userApiClient, courseApiClient };
export default userApiClient;
