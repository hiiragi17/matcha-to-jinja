import type {
  GreenteaLikeListResponse,
  GreenteaLikeResponse,
  TempleLikeListResponse,
  TempleLikeResponse,
} from "@/types";
import { apiClient } from "./client";

export function getGreenteaLikes(
  authToken: string,
): Promise<GreenteaLikeListResponse> {
  return apiClient<GreenteaLikeListResponse>("/greentea_likes", { authToken });
}

export function getTempleLikes(
  authToken: string,
): Promise<TempleLikeListResponse> {
  return apiClient<TempleLikeListResponse>("/temple_likes", { authToken });
}

export function likeGreentea(
  greenteaId: number,
  authToken: string,
): Promise<GreenteaLikeResponse> {
  return apiClient<GreenteaLikeResponse>("/greentea_likes", {
    method: "POST",
    body: JSON.stringify({ greentea_id: greenteaId }),
    authToken,
  });
}

export function unlikeGreentea(
  greenteaId: number,
  authToken: string,
): Promise<void> {
  return apiClient<void>(`/greentea_likes/${greenteaId}`, {
    method: "DELETE",
    authToken,
  });
}

export function likeTemple(
  templeId: number,
  authToken: string,
): Promise<TempleLikeResponse> {
  return apiClient<TempleLikeResponse>("/temple_likes", {
    method: "POST",
    body: JSON.stringify({ temple_id: templeId }),
    authToken,
  });
}

export function unlikeTemple(
  templeId: number,
  authToken: string,
): Promise<void> {
  return apiClient<void>(`/temple_likes/${templeId}`, {
    method: "DELETE",
    authToken,
  });
}
