const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api-ai-rag-o62iq.ondigitalocean.app";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  license: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  reasoning?: string;
  sources?: Source[];
  isStreaming?: boolean;
}

export interface Source {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
}

export interface ChatRequest {
  question: string;
  licenseKey: string;
  kbId?: string;
}

export interface ChatResponse {
  answer: string;
}

export interface UploadDocumentRequest {
  file: File;
  knowledgeBaseId?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  private getLicenseKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("license_key");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // Handle different possible response formats
    const token = response.accessToken;

    if (token && typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }

    if (response.license && typeof window !== "undefined") {
      localStorage.setItem("license_key", response.license);
    }

    return {
      accessToken: token,
      license: response.license,
      user: response.user || { id: "", email: credentials.email, role: "" },
    };
  }

  async chat(
    question: string,
    kbId?: string
  ): Promise<ChatResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const licenseKey = this.getLicenseKey();
    if (!licenseKey) {
      throw new Error("License key not found");
    }

    const response = await fetch(`${API_BASE_URL}/rag/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question,
        licenseKey,
        ...(kbId && { kbId }),
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  async uploadDocument(
    file: File,
    knowledgeBaseId?: string
  ): Promise<{ message: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const formData = new FormData();
    formData.append("file", file);
    if (knowledgeBaseId) {
      formData.append("knowledgeBaseId", knowledgeBaseId);
    }

    const response = await fetch(`${API_BASE_URL}/rag/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("license_key");
    }
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

export const apiClient = new ApiClient();
