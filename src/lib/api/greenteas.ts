import { apiClient } from '@/lib/api/client';
import type { Greentea } from '@/types/greentea';
import type { PaginatedResponse } from '@/types/api';

interface RailsGreenteasResponse {
  greenteas: Greentea[];
  meta: PaginatedResponse<Greentea>['meta'];
}

export interface GetGreenteasParams {
  page?: number;
  'q[name_cont]'?: string;
  'q[genres_name_cont]'?: string;
}

export async function getGreenteas(
  params?: GetGreenteasParams
): Promise<PaginatedResponse<Greentea>> {
  const searchParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    )
  );
  const query = searchParams.toString() ? `?${searchParams}` : '';
  const res = await apiClient<RailsGreenteasResponse>(`/greenteas${query}`);
  return { data: res.greenteas, meta: res.meta };
}

export async function getGreentea(id: number): Promise<Greentea> {
  const res = await apiClient<{ greentea: Greentea }>(`/greenteas/${id}`);
  return res.greentea;
}
