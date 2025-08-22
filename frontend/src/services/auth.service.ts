import api from './api';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export const authService = {
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/auth/profile');
    return data;
  },

  logout(): void {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    window.location.href = '/login';
  },
};