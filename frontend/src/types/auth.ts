export interface User {
  id: number;
  email: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}