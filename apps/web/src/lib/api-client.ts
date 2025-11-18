import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  auth = {
    register: async (data: { email: string; username: string; password: string }) => {
      const response = await this.client.post('/auth/register', data);
      return response.data;
    },

    login: async (data: { email: string; password: string }) => {
      const response = await this.client.post('/auth/login', data);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    },

    logout: async () => {
      await this.client.post('/auth/logout');
      localStorage.removeItem('auth_token');
    },

    me: async () => {
      const response = await this.client.get('/auth/me');
      return response.data;
    },
  };

  // Data sources endpoints
  sources = {
    list: async (params?: { page?: number; limit?: number; type?: string; isActive?: boolean }) => {
      const response = await this.client.get('/sources', { params });
      return response.data;
    },

    get: async (id: string) => {
      const response = await this.client.get(`/sources/${id}`);
      return response.data;
    },

    create: async (data: any) => {
      const response = await this.client.post('/sources', data);
      return response.data;
    },

    update: async (id: string, data: any) => {
      const response = await this.client.put(`/sources/${id}`, data);
      return response.data;
    },

    delete: async (id: string) => {
      const response = await this.client.delete(`/sources/${id}`);
      return response.data;
    },

    stats: async (id: string) => {
      const response = await this.client.get(`/sources/${id}/stats`);
      return response.data;
    },
  };

  // Notification rules endpoints
  rules = {
    list: async (params?: { page?: number; limit?: number }) => {
      const response = await this.client.get('/rules', { params });
      return response.data;
    },

    get: async (id: string) => {
      const response = await this.client.get(`/rules/${id}`);
      return response.data;
    },

    create: async (data: any) => {
      const response = await this.client.post('/rules', data);
      return response.data;
    },

    update: async (id: string, data: any) => {
      const response = await this.client.put(`/rules/${id}`, data);
      return response.data;
    },

    delete: async (id: string) => {
      const response = await this.client.delete(`/rules/${id}`);
      return response.data;
    },

    stats: async (id: string) => {
      const response = await this.client.get(`/rules/${id}/stats`);
      return response.data;
    },
  };

  // Jobs endpoints
  jobs = {
    collect: async (data: { sourceId: string; force?: boolean }) => {
      const response = await this.client.post('/jobs/collect', data);
      return response.data;
    },

    status: async (id: string) => {
      const response = await this.client.get(`/jobs/status/${id}`);
      return response.data;
    },

    stats: async () => {
      const response = await this.client.get('/jobs/stats');
      return response.data;
    },
  };
}

export const apiClient = new APIClient();
