import type { User } from "./user";

export interface Comment {
  id: number;
  body: string;
  // 投稿者アカウントが削除済み等で Rails 側が user を含められないケースがあるため
  // null を許容する（実際にレスポンスで欠落するのを確認済み）。
  user: User | null;
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
