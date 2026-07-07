import axios from "axios";

// Centralized Axios instance for the SaaS
export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30000, // 30 second timeout for AI/LaTeX heavy tasks
  headers: {
    "Content-Type": "application/json",
  },
});

// We can easily add interceptors here later for Authentication!
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const generatePDF = async (yamlContent: string): Promise<Blob> => {
  const response = await apiClient.post("/pdf", { yamlContent }, {
    responseType: "blob", // Crucial for receiving binary PDF data
  });
  return response.data;
};
