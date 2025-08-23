import { api } from './api';
import { LoginDto, LoginResponse, User } from '@/types';

export const authService = {
  async login(credentials: LoginDto) {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },
  
  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data;
  }
};