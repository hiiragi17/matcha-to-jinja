import type { User } from '@/types/user';

export interface Comment {
  id: number;
  body: string;
  user: User;
  created_at: string;
  greentea_id?: number;
  temple_id?: number;
}

export interface CreateCommentPayload {
  body: string;
}
