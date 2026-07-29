import axios from "axios";
import { captureError } from "./error";

// Centralized Axios instance for the SaaS
export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 120000, // 120 second timeout for AI/LaTeX heavy tasks
  headers: {
    "Content-Type": "application/json",
  },
});

// Centralized Axios Interceptor for logging & Sentry error capture
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    captureError(error, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

export const generatePDF = async (yamlContent: string): Promise<Blob> => {
  const response = await apiClient.post("/pdf", { yaml_content: yamlContent }, {
    responseType: "blob", // Crucial for receiving binary PDF data
  });
  return response.data;
};

export const fetchProfiles = async (): Promise<string[]> => {
  const response = await apiClient.get("/profiles");
  return response.data;
};

export const fetchFileContent = async (profile: string, fileType: string): Promise<{ content: string, filepath: string }> => {
  const response = await apiClient.get(`/file-content?profile=${profile}&file_type=${fileType}`);
  return response.data;
};

export const saveFileContent = async (profile: string, fileType: string, content: string): Promise<any> => {
  const response = await apiClient.post("/file-content", { profile, file_type: fileType, content });
  return response.data;
};

export const fetchSchema = async (type: "selector" | "variant"): Promise<any> => {
  const response = await apiClient.get(`/schema/${type}`);
  return response.data;
};

export const resolveSyncTex = async (page: number, x: number, y: number): Promise<{ tex_file: string, tex_line: number, yaml_path: string | null }> => {
  const response = await apiClient.post("/synctex-resolve", { page, x, y });
  return response.data;
};
