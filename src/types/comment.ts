import type { User } from "./user";

export interface Comment {
  id: number;
  body: string;
  user: User;
  created_at: string;
  owned_by_current_user?: boolean;
}

export interface CommentListResponse {
  comments: Comment[];
}

export interface CommentResponse {
  comment: Comment;
}
