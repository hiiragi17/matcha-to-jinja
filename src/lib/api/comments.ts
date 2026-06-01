import type { CommentListResponse, CommentResponse } from "@/types";
import { apiClient, buildQuery } from "./client";

// 一覧は対象スポットごとに引く。Rails 側は ?greentea_id= / ?temple_id= で絞り込む想定。
export function getGreenteaComments(
  greenteaId: number,
): Promise<CommentListResponse> {
  return apiClient<CommentListResponse>(
    `/greenteacomments${buildQuery({ greentea_id: greenteaId })}`,
  );
}

export function getTempleComments(
  templeId: number,
): Promise<CommentListResponse> {
  return apiClient<CommentListResponse>(
    `/templecomments${buildQuery({ temple_id: templeId })}`,
  );
}

export function createGreenteaComment(
  greenteaId: number,
  body: string,
  authToken: string,
): Promise<CommentResponse> {
  return apiClient<CommentResponse>("/greenteacomments", {
    method: "POST",
    body: JSON.stringify({ greentea_id: greenteaId, body }),
    authToken,
  });
}

export function createTempleComment(
  templeId: number,
  body: string,
  authToken: string,
): Promise<CommentResponse> {
  return apiClient<CommentResponse>("/templecomments", {
    method: "POST",
    body: JSON.stringify({ temple_id: templeId, body }),
    authToken,
  });
}

export function deleteGreenteaComment(
  commentId: number,
  authToken: string,
): Promise<void> {
  return apiClient<void>(`/greenteacomments/${commentId}`, {
    method: "DELETE",
    authToken,
  });
}

export function deleteTempleComment(
  commentId: number,
  authToken: string,
): Promise<void> {
  return apiClient<void>(`/templecomments/${commentId}`, {
    method: "DELETE",
    authToken,
  });
}
