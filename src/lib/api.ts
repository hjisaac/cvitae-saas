import axios from "axios";
import { captureError } from "./error";

export type VariantId = string;
export type SelectorId = string;

export interface SelectorSnapshot {
  id: string;
  variant_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface VariantSummary {
  id: string;
  name: string;
  template_id: string | null;
  language: string;
  updated_at: string;
}

export interface VariantDetail extends VariantSummary {
  content: string;
  created_at: string;
  selector: SelectorSnapshot;
}

export interface TranslationArtifact {
  source: string;
  translated: string;
}

export interface TranslationReviewPayload {
  target_language: string;
  variant: TranslationArtifact;
  selector: TranslationArtifact;
}

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
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isExpectedGuestAuthFailure =
      status === 401 && (url.includes("/variants") || url.includes("/selectors"));

    if (!isExpectedGuestAuthFailure) {
      console.error("API Error:", error.response?.data || error.message);
      captureError(error, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
      });
    }
    return Promise.reject(error);
  }
);

export const generatePDF = async (yamlContent: string): Promise<Blob> => {
  const response = await apiClient.post("/pdf", { yaml_content: yamlContent }, {
    responseType: "blob", // Crucial for receiving binary PDF data
  });
  return response.data;
};

export const listVariants = async (): Promise<VariantSummary[]> => {
  const response = await apiClient.get("/variants");
  return response.data;
};

export const getVariant = async (variantId: VariantId): Promise<VariantDetail> => {
  const response = await apiClient.get(`/variants/${variantId}`);
  return response.data;
};

export interface CreateVariantPayload {
  name?: string;
  content: string;
  selector_content: string;
  language?: string;
  template_id?: string | null;
  source_variant_id?: VariantId;
}

export const createVariant = async (payload: CreateVariantPayload): Promise<VariantDetail> => {
  const response = await apiClient.post("/variants", payload);
  return response.data;
};

export const listSelectors = async (): Promise<SelectorSnapshot[]> => {
  const response = await apiClient.get("/selectors");
  return response.data;
};

export const getSelector = async (selectorId: SelectorId): Promise<SelectorSnapshot> => {
  const response = await apiClient.get(`/selectors/${selectorId}`);
  return response.data;
};

export const translateDocument = async (
  variantContent: string,
  selectorContent: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<TranslationReviewPayload> => {
  const response = await apiClient.post("/translate", {
    variant_content: variantContent,
    selector_content: selectorContent,
    source_language: sourceLanguage,
    target_language: targetLanguage,
  });
  return response.data;
};

export const fetchSchema = async (type: "selector" | "variant", locale: string = "en"): Promise<any> => {
  const response = await apiClient.get(`/schema/${type}?locale=${locale}`);
  return response.data;
};

export const resolveSyncTex = async (
  page: number,
  x: number,
  y: number,
): Promise<{ tex_line: number; tex_text: string }> => {
  const response = await apiClient.post("/synctex-resolve", { page, x, y });
  return response.data;
};
