export type RoleName = 'ADMIN' | 'PM' | 'MEMBER';

export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  fullName?: string;
  displayName?: string;
  jobTitle?: string;
  bio?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
