import type { AdminComment, AdminCommentListResponse } from "@/types";
import { apiClient } from "../client";

export type { AdminComment, AdminCommentListResponse };

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
