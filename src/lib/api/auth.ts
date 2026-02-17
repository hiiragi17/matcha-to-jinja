import { apiClient } from '@/lib/api/client';
import type { User } from '@/types/user';

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await apiClient<{ user: User }>('/current_user');
    return res.user;
  } catch {
    // 401 Unauthorized は未ログイン状態 - null を返す
    return null;
  }
}

export async function logout(): Promise<void> {
  await apiClient('/auth/logout', { method: 'DELETE' });
}
