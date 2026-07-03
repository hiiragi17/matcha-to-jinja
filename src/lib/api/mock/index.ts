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
  RouteDetail,
  RouteDetailResponse,
  RouteListItem,
  RouteListResponse,
  RouteSpot,
  Temple,
  TempleDetailResponse,
  TempleLike,
  TempleLikeListResponse,
  TempleLikeResponse,
  TempleListResponse,
  Transport,
} from "@/types";
import { distanceMeters } from "@/lib/utils/distance";
import type { AdminCommentListResponse } from "@/types";
import type { CurrentUserResponse } from "../auth";
import { ApiError } from "../error";
import {
  mockAreas,
  mockGenres,
  mockGreenteas as seedGreenteas,
  mockTemples as seedTemples,
  mockUserName,
  seedGreenteaComments,
  seedTempleComments,
} from "./data";
import {
  addGreenteaComment,
  addGreenteaLike,
  addTempleComment,
  addTempleLike,
  adminDeleteGreenteaComment,
  adminDeleteTempleComment,
  createMockGreentea,
  createMockTemple,
  createRouteRecord,
  deleteGreenteaComment,
  deleteMockGreentea,
  deleteMockTemple,
  deleteRouteRecord,
  deleteTempleComment,
  extractMockUserId,
  getMockGreenteas,
  getMockTemples,
  getGreenteaLikeDelta,
  getGreenteaLikedIds,
  getRouteForOwner,
  getTempleLikeDelta,
  getTempleLikedIds,
  listAllComments,
  listGreenteaComments,
  listRoutesByOwner,
  listTempleComments,
  removeGreenteaLike,
  removeTempleLike,
  updateMockGreentea,
  updateMockTemple,
  updateRouteRecord,
} from "./state";
import type { StoredRoute, StoredRouteSpot } from "./state";

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

function requireMockAdmin(headers: Headers): string {
  const userId = requireMockUser(headers);
  if (!userId.toLowerCase().includes("admin")) {
    throw new ApiError(403, { error: "Admin role required" });
  }
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

  // mock モードの単一の真実: 公開取得（list/detail/likes/nearby）も管理 CRUD も、
  // 同じ可変ストアを参照する。seed から遅延初期化されるため、admin の
  // create/update/delete が一覧・詳細に即座に反映される（Phase 1 で予告した切替）。
  const mockGreenteas = getMockGreenteas(seedGreenteas);
  const mockTemples = getMockTemples(seedTemples);

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

    // Admin: greentea 削除
    const adminGreenteaDeleteMatch = path.match(/^\/admin\/greenteas\/(\d+)$/);
    if (adminGreenteaDeleteMatch) {
      requireMockAdmin(headers);
      const id = Number(adminGreenteaDeleteMatch[1]);
      if (!deleteMockGreentea(id, { greenteas: mockGreenteas }))
        notFound(endpoint);
      return undefined as T;
    }

    // Admin: temple 削除
    const adminTempleDeleteMatch = path.match(/^\/admin\/temples\/(\d+)$/);
    if (adminTempleDeleteMatch) {
      requireMockAdmin(headers);
      const id = Number(adminTempleDeleteMatch[1]);
      if (!deleteMockTemple(id, { temples: mockTemples })) notFound(endpoint);
      return undefined as T;
    }

    // Admin: greentea コメント削除（owner チェックなし）
    const adminGreenteaCommentMatch = path.match(
      /^\/admin\/greenteacomments\/(\d+)$/,
    );
    if (adminGreenteaCommentMatch) {
      requireMockAdmin(headers);
      const id = Number(adminGreenteaCommentMatch[1]);
      const result = adminDeleteGreenteaComment(id);
      if (result === "not_found") notFound(endpoint);
      return undefined as T;
    }

    // Admin: temple コメント削除（owner チェックなし）
    const adminTempleCommentMatch = path.match(
      /^\/admin\/templecomments\/(\d+)$/,
    );
    if (adminTempleCommentMatch) {
      requireMockAdmin(headers);
      const id = Number(adminTempleCommentMatch[1]);
      const result = adminDeleteTempleComment(id);
      if (result === "not_found") notFound(endpoint);
      return undefined as T;
    }
  }

  if (method === "GET") {
    // Admin: コメント一覧（横断）
    if (path === "/admin/comments") {
      requireMockAdmin(headers);
      const all = listAllComments();
      const greenteasMap = new Map(mockGreenteas.map((g) => [g.id, g.name]));
      const templesMap = new Map(mockTemples.map((t) => [t.id, t.name]));
      const comments = all.map(({ comment, resourceType, resourceId }) => ({
        ...comment,
        resource_type: resourceType,
        resource_id: resourceId,
        resource_name:
          resourceType === "greentea"
            ? (greenteasMap.get(resourceId) ?? "")
            : (templesMap.get(resourceId) ?? ""),
      }));
      return { comments } satisfies AdminCommentListResponse as T;
    }
  }

  if (method === "POST") {
    // Admin: greentea 作成
    if (path === "/admin/greenteas") {
      requireMockAdmin(headers);
      const input = parseJsonBody<Parameters<typeof createMockGreentea>[0]>(
        options?.body,
      );
      if (!Array.isArray(input.genre_ids)) {
        throw new ApiError(400, { error: "genre_ids is required" });
      }
      const greentea = createMockGreentea(input, {
        genres: mockGenres,
        greenteas: mockGreenteas,
      });
      return { greentea } as T;
    }

    // Admin: temple 作成
    if (path === "/admin/temples") {
      requireMockAdmin(headers);
      const input = parseJsonBody<Parameters<typeof createMockTemple>[0]>(
        options?.body,
      );
      if (!Array.isArray(input.area_ids)) {
        throw new ApiError(400, { error: "area_ids is required" });
      }
      const temple = createMockTemple(input, {
        areas: mockAreas,
        temples: mockTemples,
      });
      return { temple } as T;
    }
  }

  if (method === "PATCH") {
    // Admin: greentea 更新
    const adminGreenteasPatchMatch = path.match(/^\/admin\/greenteas\/(\d+)$/);
    if (adminGreenteasPatchMatch) {
      requireMockAdmin(headers);
      const id = Number(adminGreenteasPatchMatch[1]);
      const input = parseJsonBody<Parameters<typeof updateMockGreentea>[1]>(
        options?.body,
      );
      const greentea = updateMockGreentea(id, input, {
        genres: mockGenres,
        greenteas: mockGreenteas,
      });
      if (!greentea) notFound(endpoint);
      return { greentea } as T;
    }

    // Admin: temple 更新
    const adminTemplesPatchMatch = path.match(/^\/admin\/temples\/(\d+)$/);
    if (adminTemplesPatchMatch) {
      requireMockAdmin(headers);
      const id = Number(adminTemplesPatchMatch[1]);
      const input = parseJsonBody<Parameters<typeof updateMockTemple>[1]>(
        options?.body,
      );
      const temple = updateMockTemple(id, input, {
        areas: mockAreas,
        temples: mockTemples,
      });
      if (!temple) notFound(endpoint);
      return { temple } as T;
    }
  }

  // --- モデルルート（routes）: 全メソッド認証必須・自分のルートのみ操作可 ---
  {
    const isRouteList = path === "/routes";
    const routeIdMatch = path.match(/^\/routes\/(\d+)$/);
    if (isRouteList || routeIdMatch) {
      const uid = requireMockUser(headers);

      if (isRouteList && method === "GET") {
        const page = Number(params.get("page")) || 1;
        const all = listRoutesByOwner(uid);
        const { items, meta } = paginate(all, page);
        const data: RouteListItem[] = items.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          spot_count: r.spots.length,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));
        return { data, meta } satisfies RouteListResponse as T;
      }

      if (isRouteList && method === "POST") {
        const body = parseRouteBody(options?.body);
        const name = parseRouteName(body.name, true)!;
        const description = parseRouteDescription(body.description) ?? null;
        const spots = parseRouteSpots(body.spots, mockGreenteas, mockTemples);
        const record = createRouteRecord(uid, { name, description, spots });
        return {
          data: buildRouteDetail(record, mockGreenteas, mockTemples),
        } satisfies RouteDetailResponse as T;
      }

      if (routeIdMatch) {
        const id = Number(routeIdMatch[1]);

        if (method === "GET") {
          const record = getRouteForOwner(id, uid);
          if (!record) routeNotFound();
          return {
            data: buildRouteDetail(record, mockGreenteas, mockTemples),
          } satisfies RouteDetailResponse as T;
        }

        if (method === "PATCH") {
          if (!getRouteForOwner(id, uid)) routeNotFound();
          const body = parseRouteBody(options?.body);
          const name = parseRouteName(body.name, false);
          const description = parseRouteDescription(body.description);
          const spots =
            body.spots === undefined
              ? undefined
              : parseRouteSpots(body.spots, mockGreenteas, mockTemples);
          const updated = updateRouteRecord(id, uid, { name, description, spots });
          if (!updated) routeNotFound();
          return {
            data: buildRouteDetail(updated, mockGreenteas, mockTemples),
          } satisfies RouteDetailResponse as T;
        }

        if (method === "DELETE") {
          if (!deleteRouteRecord(id, uid)) routeNotFound();
          return undefined as T;
        }
      }
    }
  }

  notFound(endpoint);
}

// --- routes 用ヘルパー ---

const VALID_TRANSPORTS = new Set<string>(["walk", "train", "bus", "car"]);

// 移動手段ごとの mock 概算速度(m/秒)。Directions API 未接続のため所要時間の擬似算出に使う。
const SPEED_M_PER_SEC: Record<Exclude<Transport, null>, number> = {
  walk: 1.33,
  bus: 5,
  train: 11,
  car: 8,
};

type RawRouteBody = {
  name?: unknown;
  description?: unknown;
  spots?: unknown;
};

function routeUnprocessable(details: string[]): never {
  throw new ApiError(422, { error: "Unprocessable Entity", details });
}

function routeNotFound(): never {
  throw new ApiError(404, { error: "Not Found" });
}

function parseRouteBody(body: BodyInit | null | undefined): RawRouteBody {
  const parsed = parseJsonBody<{ route?: unknown }>(body);
  if (!parsed.route || typeof parsed.route !== "object") {
    throw new ApiError(400, { error: "Bad Request" });
  }
  return parsed.route as RawRouteBody;
}

function parseRouteName(
  raw: unknown,
  required: boolean,
): string | undefined {
  if (raw === undefined) {
    if (required) routeUnprocessable(["Name can't be blank"]);
    return undefined;
  }
  const name = typeof raw === "string" ? raw.trim() : "";
  if (name.length === 0) routeUnprocessable(["Name can't be blank"]);
  return name;
}

// description は「キー欠落＝据え置き（undefined）」「null/空＝クリア」を区別する。
function parseRouteDescription(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  return String(raw);
}

function normalizeTransport(value: unknown): Transport {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && VALID_TRANSPORTS.has(value)) {
    return value as Transport;
  }
  routeUnprocessable([`Invalid transport: ${String(value)}`]);
}

function parseRouteSpots(
  raw: unknown,
  greenteas: Greentea[],
  temples: Temple[],
): StoredRouteSpot[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    routeUnprocessable(["Spots can't be blank"]);
  }
  return raw.map((entry): StoredRouteSpot => {
    const spot = entry as {
      spot_type?: unknown;
      spot_id?: unknown;
      transport?: unknown;
    };
    if (spot.spot_type !== "greentea" && spot.spot_type !== "temple") {
      routeUnprocessable([`Invalid spot_type: ${String(spot.spot_type)}`]);
    }
    const spotId = Number(spot.spot_id);
    const exists =
      spot.spot_type === "greentea"
        ? greenteas.some((g) => g.id === spotId)
        : temples.some((t) => t.id === spotId);
    if (!Number.isFinite(spotId) || !exists) {
      routeUnprocessable([
        `Spot not found: ${spot.spot_type} #${String(spot.spot_id)}`,
      ]);
    }
    return {
      spot_type: spot.spot_type,
      spot_id: spotId,
      transport: normalizeTransport(spot.transport),
    };
  });
}

// StoredRoute を詳細レスポンス形へ。スポット座標を解決し、各 leg の直線距離・
// 経路距離(≈直線×1.3)・所要時間(移動手段別の概算速度)を算出する。
function buildRouteDetail(
  route: StoredRoute,
  greenteas: Greentea[],
  temples: Temple[],
): RouteDetail {
  const lastIndex = route.spots.length - 1;
  const spots: RouteSpot[] = route.spots.map((s, idx) => {
    const src =
      s.spot_type === "greentea"
        ? greenteas.find((g) => g.id === s.spot_id)
        : temples.find((t) => t.id === s.spot_id);
    return {
      position: idx + 1,
      spot_type: s.spot_type,
      // 移動手段は「次スポットへの手段」。最後の要素は null。
      transport: idx === lastIndex ? null : s.transport,
      id: s.spot_id,
      name: src?.name ?? "(削除されたスポット)",
      address: src?.address ?? "",
      access: src?.access ?? "",
      latitude: src?.latitude ?? 0,
      longitude: src?.longitude ?? 0,
      img: src?.img ?? "",
      distance_to_next_meters: null,
      route_distance_to_next_meters: null,
      duration_to_next_seconds: null,
    };
  });

  let totalDistance = 0;
  let totalDuration = 0;
  let hasLeg = false;
  for (let i = 0; i < spots.length - 1; i++) {
    const a = spots[i];
    const b = spots[i + 1];
    const straight = distanceMeters(a, b);
    const routeDistance = Math.round(straight * 1.3);
    const speed = SPEED_M_PER_SEC[a.transport ?? "walk"];
    const duration = Math.round(routeDistance / speed);
    a.distance_to_next_meters = straight;
    a.route_distance_to_next_meters = routeDistance;
    a.duration_to_next_seconds = duration;
    totalDistance += routeDistance;
    totalDuration += duration;
    hasLeg = true;
  }

  return {
    id: route.id,
    name: route.name,
    description: route.description,
    created_at: route.created_at,
    updated_at: route.updated_at,
    spots,
    total_distance_meters: totalDistance,
    total_duration_seconds: hasLeg ? totalDuration : null,
  };
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
