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

export interface AdminComment extends Comment {
  resource_type: "greentea" | "temple";
  resource_id: number;
  resource_name: string;
}

export interface AdminCommentListResponse {
  comments: AdminComment[];
}
