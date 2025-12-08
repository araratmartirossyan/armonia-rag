const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-ai-rag-o62iq.ondigitalocean.app';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
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
  message: string;
  knowledgeBaseId?: string;
}

export interface ChatResponse {
  response: string;
  reasoning?: string;
  sources?: Source[];
}

export interface UploadDocumentRequest {
  file: File;
  knowledgeBaseId?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Handle different possible response formats
    const token = response.accessToken || response.token || response.access_token;
    
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    
    return {
      accessToken: token,
      user: response.user || { id: '', email: credentials.email, role: '' }
    };
  }

  async chat(
    message: string,
    knowledgeBaseId?: string,
    onStream?: (chunk: string) => void
  ): Promise<ChatResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/rag/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message, knowledgeBaseId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    // Check if response is streaming
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream') || contentType?.includes('text/plain')) {
      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  onStream?.(parsed.content);
                }
              } catch {
                // If not JSON, treat as plain text
                fullResponse += data;
                onStream?.(data);
              }
            } else if (line.trim()) {
              fullResponse += line;
              onStream?.(line);
            }
          }
        }
      }

      return {
        response: fullResponse,
      };
    }

    // Regular JSON response
    return response.json();
  }

  async uploadDocument(file: File, knowledgeBaseId?: string): Promise<{ message: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (knowledgeBaseId) {
      formData.append('knowledgeBaseId', knowledgeBaseId);
    }

    const response = await fetch(`${API_BASE_URL}/rag/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

export const apiClient = new ApiClient();

