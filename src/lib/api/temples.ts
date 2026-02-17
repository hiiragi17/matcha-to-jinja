import { apiClient } from '@/lib/api/client';
import type { Temple } from '@/types/temple';
import type { PaginatedResponse, Area } from '@/types/api';

interface RailsTemplesResponse {
  temples: Temple[];
  meta: PaginatedResponse<Temple>['meta'];
}

export interface GetTemplesParams {
  page?: number;
  'q[name_cont]'?: string;
  'q[areas_name_cont]'?: string;
}

export async function getTemples(
  params?: GetTemplesParams
): Promise<PaginatedResponse<Temple>> {
  const searchParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    )
  );
  const query = searchParams.toString() ? `?${searchParams}` : '';
  const res = await apiClient<RailsTemplesResponse>(`/temples${query}`);
  return { data: res.temples, meta: res.meta };
}

export async function getTemple(id: number): Promise<Temple> {
  const res = await apiClient<{ temple: Temple }>(`/temples/${id}`);
  return res.temple;
}

export async function getAreas(): Promise<Area[]> {
  const res = await apiClient<{ areas: Area[] }>('/areas');
  return res.areas;
}
