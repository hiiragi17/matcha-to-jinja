import type {
  AreaListResponse,
  Comment,
  CommentListResponse,
  CommentResponse,
  GenreListResponse,
  Greentea,
  GreenteaDetailResponse,
  GreenteaLike,
  GreenteaLikeListResponse,
  GreenteaLikeResponse,
  GreenteaListResponse,
  NearbyResponse,
  NearbySpot,
  Temple,
  TempleDetailResponse,
  TempleLike,
  TempleLikeListResponse,
  TempleLikeResponse,
  TempleListResponse,
} from "@/types";
import { distanceMeters } from "@/lib/utils/distance";
import type { CurrentUserResponse } from "../auth";
import { ApiError } from "../error";
import {
  mockAreas,
  mockGenres,
  mockGreenteas,
  mockTemples,
  mockUserName,
  seedGreenteaComments,
  seedTempleComments,
} from "./data";
import {
  addGreenteaComment,
  addGreenteaLike,
  addTempleComment,
  addTempleLike,
  deleteGreenteaComment,
  deleteTempleComment,
  extractMockUserId,
  getGreenteaLikeDelta,
  getGreenteaLikedIds,
  getTempleLikeDelta,
  getTempleLikedIds,
  listGreenteaComments,
  listTempleComments,
  removeGreenteaLike,
  removeTempleLike,
} from "./state";

const PER_PAGE = 12;

function paginate<T>(items: T[], page: number) {
  const start = (page - 1) * PER_PAGE;
  return {
    items: items.slice(start, start + PER_PAGE),
    meta: {
      current_page: page,
      total_pages: Math.max(1, Math.ceil(items.length / PER_PAGE)),
      total_count: items.length,
    },
  };
}

function notFound(endpoint: string): never {
  throw new ApiError(404, { error: `Mock route not found: ${endpoint}` });
}

function unauthorized(): never {
  throw new ApiError(401, { error: "Authentication required" });
}

function withLikeState(
  greentea: Greentea,
  userId: string | null,
): Greentea {
  const likedIds = userId ? getGreenteaLikedIds(userId) : null;
  return {
    ...greentea,
    likes_count: greentea.likes_count + getGreenteaLikeDelta(greentea.id),
    liked_by_current_user: likedIds?.has(greentea.id) ?? false,
  };
}

function withTempleLikeState(
  temple: Temple,
  userId: string | null,
): Temple {
  const likedIds = userId ? getTempleLikedIds(userId) : null;
  return {
    ...temple,
    likes_count: temple.likes_count + getTempleLikeDelta(temple.id),
    liked_by_current_user: likedIds?.has(temple.id) ?? false,
  };
}

function mergedGreenteaComments(
  greenteaId: number,
  viewerId: string | null,
): Comment[] {
  return [
    ...listGreenteaComments(greenteaId, viewerId),
    ...(seedGreenteaComments[greenteaId] ?? []),
  ];
}

function mergedTempleComments(
  templeId: number,
  viewerId: string | null,
): Comment[] {
  return [
    ...listTempleComments(templeId, viewerId),
    ...(seedTempleComments[templeId] ?? []),
  ];
}

function requireMockUser(headers: Headers): string {
  const userId = extractMockUserId(headers);
  if (!userId) unauthorized();
  return userId;
}

export async function mockClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const url = new URL(endpoint, "http://mock.local");
  const path = url.pathname;
  const params = url.searchParams;
  const headers = new Headers(options?.headers);
  const userId = extractMockUserId(headers);

  if (method === "GET") {
    if (path === "/greenteas") {
      const page = Number(params.get("page")) || 1;
      const nameCont = params.get("q[name_cont]")?.toLowerCase();
      const genreId = params.get("q[genres_id_eq]");

      let items = mockGreenteas;
      if (nameCont) {
        items = items.filter((g) => g.name.toLowerCase().includes(nameCont));
      }
      if (genreId) {
        items = items.filter((g) =>
          g.genres.some((genre) => String(genre.id) === genreId),
        );
      }

      const { items: paged, meta } = paginate(items, page);
      const greenteas = paged.map((g) => withLikeState(g, userId));
      return { greenteas, meta } satisfies GreenteaListResponse as T;
    }

    const greenteaMatch = path.match(/^\/greenteas\/(\d+)$/);
    if (greenteaMatch) {
      const base = mockGreenteas.find(
        (g) => g.id === Number(greenteaMatch[1]),
      );
      if (!base) notFound(endpoint);
      const greentea = withLikeState(base, userId);

      const nearby_temples: NearbySpot[] = mockTemples
        .map((t) => ({
          id: t.id,
          name: t.name,
          latitude: t.latitude,
          longitude: t.longitude,
          distance_meters: distanceMeters(greentea, t),
        }))
        .filter((t) => t.distance_meters <= 1500)
        .sort((a, b) => a.distance_meters - b.distance_meters);

      return {
        greentea: {
          ...greentea,
          nearby_temples,
          comments: mergedGreenteaComments(greentea.id, userId),
        },
      } satisfies GreenteaDetailResponse as T;
    }

    if (path === "/temples") {
      const page = Number(params.get("page")) || 1;
      const nameCont = params.get("q[name_cont]")?.toLowerCase();
      const areaId = params.get("q[areas_id_eq]");

      let items = mockTemples;
      if (nameCont) {
        items = items.filter((t) => t.name.toLowerCase().includes(nameCont));
      }
      if (areaId) {
        items = items.filter((t) =>
          t.areas.some((area) => String(area.id) === areaId),
        );
      }

      const { items: paged, meta } = paginate(items, page);
      const temples = paged.map((t) => withTempleLikeState(t, userId));
      return { temples, meta } satisfies TempleListResponse as T;
    }

    const templeMatch = path.match(/^\/temples\/(\d+)$/);
    if (templeMatch) {
      const base = mockTemples.find((t) => t.id === Number(templeMatch[1]));
      if (!base) notFound(endpoint);
      const temple = withTempleLikeState(base, userId);

      const nearby_greenteas: NearbySpot[] = mockGreenteas
        .map((g) => ({
          id: g.id,
          name: g.name,
          latitude: g.latitude,
          longitude: g.longitude,
          distance_meters: distanceMeters(temple, g),
        }))
        .filter((g) => g.distance_meters <= 1500)
        .sort((a, b) => a.distance_meters - b.distance_meters);

      return {
        temple: {
          ...temple,
          nearby_greenteas,
          comments: mergedTempleComments(temple.id, userId),
        },
      } satisfies TempleDetailResponse as T;
    }

    if (path === "/areas") {
      return { areas: mockAreas } satisfies AreaListResponse as T;
    }

    if (path === "/genres") {
      return { genres: mockGenres } satisfies GenreListResponse as T;
    }

    if (path === "/nearby") {
      const lat = Number(params.get("lat"));
      const lng = Number(params.get("lng"));
      if (
        !params.has("lat") ||
        !params.has("lng") ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        throw new ApiError(400, {
          error: "lat and lng are required and must be valid numbers",
        });
      }
      const radiusKm = Number(params.get("radius")) || 1.5;
      const origin = { latitude: lat, longitude: lng };
      const radiusM = radiusKm * 1000;

      const toSpot = (item: {
        id: number;
        name: string;
        latitude: number;
        longitude: number;
      }): NearbySpot => ({
        id: item.id,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        distance_meters: distanceMeters(origin, item),
      });

      const within = (spot: NearbySpot) => spot.distance_meters <= radiusM;
      const byDistance = (a: NearbySpot, b: NearbySpot) =>
        a.distance_meters - b.distance_meters;

      return {
        greenteas: mockGreenteas.map(toSpot).filter(within).sort(byDistance),
        temples: mockTemples.map(toSpot).filter(within).sort(byDistance),
      } satisfies NearbyResponse as T;
    }

    if (path === "/greentea_likes") {
      const uid = requireMockUser(headers);
      const liked = getGreenteaLikedIds(uid);
      const greentea_likes: GreenteaLike[] = mockGreenteas
        .filter((g) => liked.has(g.id))
        .map((g) => ({
          id: g.id,
          greentea: withLikeState(g, uid),
          created_at: new Date().toISOString(),
        }));
      return { greentea_likes } satisfies GreenteaLikeListResponse as T;
    }

    if (path === "/temple_likes") {
      const uid = requireMockUser(headers);
      const liked = getTempleLikedIds(uid);
      const temple_likes: TempleLike[] = mockTemples
        .filter((t) => liked.has(t.id))
        .map((t) => ({
          id: t.id,
          temple: withTempleLikeState(t, uid),
          created_at: new Date().toISOString(),
        }));
      return { temple_likes } satisfies TempleLikeListResponse as T;
    }

    if (path === "/greenteacomments") {
      const greenteaId = Number(params.get("greentea_id"));
      if (!Number.isFinite(greenteaId) || greenteaId <= 0) {
        throw new ApiError(400, { error: "greentea_id is required" });
      }
      return {
        comments: mergedGreenteaComments(greenteaId, userId),
      } satisfies CommentListResponse as T;
    }

    if (path === "/templecomments") {
      const templeId = Number(params.get("temple_id"));
      if (!Number.isFinite(templeId) || templeId <= 0) {
        throw new ApiError(400, { error: "temple_id is required" });
      }
      return {
        comments: mergedTempleComments(templeId, userId),
      } satisfies CommentListResponse as T;
    }

    if (path === "/current_user") {
      const uid = requireMockUser(headers);
      return {
        user: { id: hashUserId(uid), name: mockUserName(uid), role: "general" },
      } satisfies CurrentUserResponse as T;
    }
  }

  if (method === "POST") {
    if (path === "/greentea_likes") {
      const uid = requireMockUser(headers);
      const { greentea_id } = parseJsonBody<{ greentea_id?: number }>(
        options?.body,
      );
      if (!greentea_id) {
        throw new ApiError(400, { error: "greentea_id is required" });
      }
      const greentea = mockGreenteas.find((g) => g.id === greentea_id);
      if (!greentea) notFound(endpoint);
      addGreenteaLike(uid, greentea.id);
      return {
        greentea_like: {
          id: greentea.id,
          greentea: withLikeState(greentea, uid),
          created_at: new Date().toISOString(),
        },
      } satisfies GreenteaLikeResponse as T;
    }

    if (path === "/temple_likes") {
      const uid = requireMockUser(headers);
      const { temple_id } = parseJsonBody<{ temple_id?: number }>(
        options?.body,
      );
      if (!temple_id) {
        throw new ApiError(400, { error: "temple_id is required" });
      }
      const temple = mockTemples.find((t) => t.id === temple_id);
      if (!temple) notFound(endpoint);
      addTempleLike(uid, temple.id);
      return {
        temple_like: {
          id: temple.id,
          temple: withTempleLikeState(temple, uid),
          created_at: new Date().toISOString(),
        },
      } satisfies TempleLikeResponse as T;
    }

    if (path === "/greenteacomments") {
      const uid = requireMockUser(headers);
      const { greentea_id, body } = parseJsonBody<{
        greentea_id?: number;
        body?: string;
      }>(options?.body);
      if (!greentea_id || !body || body.trim().length === 0) {
        throw new ApiError(400, {
          error: "greentea_id and non-empty body are required",
        });
      }
      const comment = addGreenteaComment(greentea_id, uid, {
        body: body.trim(),
        user: { id: hashUserId(uid), name: mockUserName(uid) },
      });
      return { comment } satisfies CommentResponse as T;
    }

    if (path === "/templecomments") {
      const uid = requireMockUser(headers);
      const { temple_id, body } = parseJsonBody<{
        temple_id?: number;
        body?: string;
      }>(options?.body);
      if (!temple_id || !body || body.trim().length === 0) {
        throw new ApiError(400, {
          error: "temple_id and non-empty body are required",
        });
      }
      const comment = addTempleComment(temple_id, uid, {
        body: body.trim(),
        user: { id: hashUserId(uid), name: mockUserName(uid) },
      });
      return { comment } satisfies CommentResponse as T;
    }
  }

  if (method === "DELETE") {
    // Rails API 契約上は :id だが、UI が like 行 ID を保持しないため、
    // mock 実装は :id を greentea_id / temple_id として扱う。
    // 連携時は Rails 側で `find_by(user:, greentea_id: params[:id])` 相当を実装する想定。
    const greenteaLikeMatch = path.match(/^\/greentea_likes\/(\d+)$/);
    if (greenteaLikeMatch) {
      const uid = requireMockUser(headers);
      const id = Number(greenteaLikeMatch[1]);
      if (!removeGreenteaLike(uid, id)) {
        throw new ApiError(404, { error: "like not found" });
      }
      return undefined as T;
    }

    const templeLikeMatch = path.match(/^\/temple_likes\/(\d+)$/);
    if (templeLikeMatch) {
      const uid = requireMockUser(headers);
      const id = Number(templeLikeMatch[1]);
      if (!removeTempleLike(uid, id)) {
        throw new ApiError(404, { error: "like not found" });
      }
      return undefined as T;
    }

    const greenteaCommentMatch = path.match(/^\/greenteacomments\/(\d+)$/);
    if (greenteaCommentMatch) {
      const uid = requireMockUser(headers);
      const id = Number(greenteaCommentMatch[1]);
      const result = deleteGreenteaComment(id, uid);
      if (result === "forbidden") {
        throw new ApiError(403, { error: "not allowed to delete this comment" });
      }
      if (result === "not_found") {
        throw new ApiError(404, { error: "comment not found" });
      }
      return undefined as T;
    }

    const templeCommentMatch = path.match(/^\/templecomments\/(\d+)$/);
    if (templeCommentMatch) {
      const uid = requireMockUser(headers);
      const id = Number(templeCommentMatch[1]);
      const result = deleteTempleComment(id, uid);
      if (result === "forbidden") {
        throw new ApiError(403, { error: "not allowed to delete this comment" });
      }
      if (result === "not_found") {
        throw new ApiError(404, { error: "comment not found" });
      }
      return undefined as T;
    }

    // モックは Rails 側の JWT 失効ストレージを持たないため、認証済みリクエストには
    // 204 を返すだけの no-op として振る舞う（未認証は 401）。
    if (path === "/auth/logout") {
      requireMockUser(headers);
      return undefined as T;
    }
  }

  notFound(endpoint);
}

function parseJsonBody<T>(body: BodyInit | null | undefined): T {
  if (typeof body !== "string" || body.length === 0) {
    throw new ApiError(400, { error: "request body is required" });
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new ApiError(400, { error: "invalid JSON body" });
  }
}

// 表示用にユーザー ID（mock-<name>）を数値化する。コメント user.id は Rails 上で
// 数値だが、モックでは便宜上の安定したハッシュ。
function hashUserId(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (Math.imul(31, h) + userId.charCodeAt(i)) | 0;
  }
  // 削除権限は state 側で文字列 ID と比較するため、ここの数値は表示用のみ。
  return Math.abs(h);
}
