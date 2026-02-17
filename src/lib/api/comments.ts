import { apiClient } from '@/lib/api/client';
import type { Comment, CreateCommentPayload } from '@/types/comment';

// Greentea comments
export async function getGreenteaComments(greenteaId: number): Promise<Comment[]> {
  const res = await apiClient<{ comments: Comment[] }>(
    `/greenteacomments?greentea_id=${greenteaId}`
  );
  return res.comments;
}

export async function createGreenteaComment(
  greenteaId: number,
  payload: CreateCommentPayload
): Promise<Comment> {
  const res = await apiClient<{ comment: Comment }>('/greenteacomments', {
    method: 'POST',
    body: JSON.stringify({ ...payload, greentea_id: greenteaId }),
  });
  return res.comment;
}

export async function deleteGreenteaComment(commentId: number): Promise<void> {
  await apiClient(`/greenteacomments/${commentId}`, { method: 'DELETE' });
}

// Temple comments
export async function getTempleComments(templeId: number): Promise<Comment[]> {
  const res = await apiClient<{ comments: Comment[] }>(
    `/templecomments?temple_id=${templeId}`
  );
  return res.comments;
}

export async function createTempleComment(
  templeId: number,
  payload: CreateCommentPayload
): Promise<Comment> {
  const res = await apiClient<{ comment: Comment }>('/templecomments', {
    method: 'POST',
    body: JSON.stringify({ ...payload, temple_id: templeId }),
  });
  return res.comment;
}

export async function deleteTempleComment(commentId: number): Promise<void> {
  await apiClient(`/templecomments/${commentId}`, { method: 'DELETE' });
}
