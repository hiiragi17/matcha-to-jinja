import type { Comment } from "@/types";
import { apiClient } from "@/lib/api/client";

export type AdminComment = Comment & {
  resource_type: "greentea" | "temple";
  resource_id: number;
  resource_name: string;
};

export type AdminCommentListResponse = {
  comments: AdminComment[];
};

export function listAdminComments(
  authToken: string,
): Promise<AdminCommentListResponse> {
  return apiClient<AdminCommentListResponse>("/admin/comments", { authToken });
}

export function adminDeleteGreenteaComment(
  id: number,
  authToken: string,
): Promise<void> {
  return apiClient<void>(`/admin/greenteacomments/${id}`, {
    method: "DELETE",
    authToken,
  });
}

export function adminDeleteTempleComment(
  id: number,
  authToken: string,
): Promise<void> {
  return apiClient<void>(`/admin/templecomments/${id}`, {
    method: "DELETE",
    authToken,
  });
}
