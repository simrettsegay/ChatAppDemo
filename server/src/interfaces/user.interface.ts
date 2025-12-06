import { User } from '@prisma/client';

export type UserResponse = Omit<User, 'password'>;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}
