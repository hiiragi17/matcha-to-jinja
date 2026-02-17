import { apiClient } from '@/lib/api/client';
import type { Greentea } from '@/types/greentea';
import type { Temple } from '@/types/temple';

// Greentea likes
export async function getGreenteaLikes(): Promise<Greentea[]> {
  const res = await apiClient<{ greenteas: Greentea[] }>('/greentea_likes');
  return res.greenteas;
}

export async function createGreenteaLike(greenteaId: number): Promise<void> {
  await apiClient('/greentea_likes', {
    method: 'POST',
    body: JSON.stringify({ greentea_id: greenteaId }),
  });
}

export async function deleteGreenteaLike(likeId: number): Promise<void> {
  await apiClient(`/greentea_likes/${likeId}`, { method: 'DELETE' });
}

// Temple likes
export async function getTempleLikes(): Promise<Temple[]> {
  const res = await apiClient<{ temples: Temple[] }>('/temple_likes');
  return res.temples;
}

export async function createTempleLike(templeId: number): Promise<void> {
  await apiClient('/temple_likes', {
    method: 'POST',
    body: JSON.stringify({ temple_id: templeId }),
  });
}

export async function deleteTempleLike(likeId: number): Promise<void> {
  await apiClient(`/temple_likes/${likeId}`, { method: 'DELETE' });
}
