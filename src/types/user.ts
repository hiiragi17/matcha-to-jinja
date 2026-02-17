export interface User {
  id: number;
  name: string;
  avatar_url?: string;
  provider: 'twitter' | 'line';
}

export interface AuthResponse {
  token: string;
  user: User;
}
