import axios from "axios";
import { AxiosHeaders, InternalAxiosRequestConfig } from "axios";

function normalizeApiUrl(value?: string) {
  return (value ?? "http://localhost:4000/api").trim().replace(/\s+/g, "").replace(/\/+$/, "");
}

const apiBaseUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

export const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const accessToken = window.localStorage.getItem("taspa.accessToken");

    if (accessToken) {
      const headers =
        config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);
      headers.set("Authorization", `Bearer ${accessToken}`);
      config.headers = headers;
    }
  }

  return config;
});

function clearSessionAndRedirect() {
  window.localStorage.removeItem("taspa.accessToken");
  window.localStorage.removeItem("taspa.refreshToken");
  if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
    window.location.href = "/login";
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = window.localStorage.getItem("taspa.refreshToken");

      if (!refreshToken) {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(
          `${apiBaseUrl}/auth/refresh`,
          { refreshToken }
        );

        window.localStorage.setItem("taspa.accessToken", refreshResponse.data.accessToken);
        window.localStorage.setItem("taspa.refreshToken", refreshResponse.data.refreshToken);

        const headers =
          originalRequest.headers instanceof AxiosHeaders
            ? originalRequest.headers
            : new AxiosHeaders(originalRequest.headers);
        headers.set("Authorization", `Bearer ${refreshResponse.data.accessToken}`);
        originalRequest.headers = headers;
        return api(originalRequest);
      } catch {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
