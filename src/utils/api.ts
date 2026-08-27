const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  mustSetPassword?: boolean;
}

export interface AuthRequest {
  email: string;
  password?: string;
}


function getHeaders(extraHeaders: any = {}): Record<string, string> {
  const token = localStorage.getItem('edusys_token');
  const headersInput = extraHeaders?.headers || extraHeaders || {};
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headersInput,
  };
  
  if (headers['Content-Type'] === 'multipart/form-data') {
    delete headers['Content-Type'];
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let message = `Request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) {
        message = parsed.message;
      } else if (parsed.error) {
        message = parsed.error;
      }
    } catch {
      if (errorText && errorText.trim().length > 0) {
        message = errorText;
      }
    }
    throw new Error(message);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export const api = {
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    return handleResponse<AuthResponse>(response);
  },


  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body: any, extraHeaders?: any): Promise<T> {
    const isString = typeof body === 'string';
    const isFormData = body instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(isFormData ? { 'Content-Type': 'multipart/form-data' } : extraHeaders),
      body: isString ? body : (isFormData ? body : JSON.stringify(body)),
    });
    return handleResponse<T>(response);
  },
  

  async put<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },


  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<T>(response);
  }
};
