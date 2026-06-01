import type { Greentea } from "./greentea";
import type { Temple } from "./temple";

export interface GreenteaLike {
  id: number;
  greentea: Greentea;
  created_at: string;
}

export interface TempleLike {
  id: number;
  temple: Temple;
  created_at: string;
}

export interface GreenteaLikeListResponse {
  greentea_likes: GreenteaLike[];
}

export interface TempleLikeListResponse {
  temple_likes: TempleLike[];
}

export interface GreenteaLikeResponse {
  greentea_like: GreenteaLike;
}

export interface TempleLikeResponse {
  temple_like: TempleLike;
}
