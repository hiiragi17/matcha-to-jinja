import type {
  RouteDetailResponse,
  RouteInput,
  RouteListResponse,
} from "@/types";
import { apiClient, buildQuery } from "./client";

// モデルルート API。ハンドオフ doc（/api/v1/routes 契約）に対応。
// 全エンドポイント JWT 認証必須のため authToken を必ず受け取る。

export function getRoutes(
  authToken: string,
  page?: number,
): Promise<RouteListResponse> {
  return apiClient<RouteListResponse>(`/routes${buildQuery({ page })}`, {
    authToken,
  });
}

export function getRoute(
  id: number | string,
  authToken: string,
): Promise<RouteDetailResponse> {
  return apiClient<RouteDetailResponse>(`/routes/${id}`, { authToken });
}

export function createRoute(
  input: RouteInput,
  authToken: string,
): Promise<RouteDetailResponse> {
  return apiClient<RouteDetailResponse>("/routes", {
    method: "POST",
    body: JSON.stringify({ route: input }),
    authToken,
  });
}

export function updateRoute(
  id: number | string,
  input: RouteInput,
  authToken: string,
): Promise<RouteDetailResponse> {
  return apiClient<RouteDetailResponse>(`/routes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ route: input }),
    authToken,
  });
}

export function deleteRoute(
  id: number | string,
  authToken: string,
): Promise<void> {
  return apiClient<void>(`/routes/${id}`, {
    method: "DELETE",
    authToken,
  });
}
