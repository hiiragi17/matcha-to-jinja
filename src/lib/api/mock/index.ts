import type {
  AreaListResponse,
  GenreListResponse,
  GreenteaDetailResponse,
  GreenteaListResponse,
  NearbyResponse,
  NearbySpot,
  TempleDetailResponse,
  TempleListResponse,
} from "@/types";
import { ApiError } from "../error";
import {
  mockAreas,
  mockGenres,
  mockGreenteaComments,
  mockGreenteas,
  mockTempleComments,
  mockTemples,
} from "./data";

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

// 緯度経度から概算の距離（メートル）を求める（Haversine）。
function distanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function notFound(endpoint: string): never {
  throw new ApiError(404, { error: `Mock route not found: ${endpoint}` });
}

export async function mockClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const url = new URL(endpoint, "http://mock.local");
  const path = url.pathname;
  const params = url.searchParams;

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

      const { items: greenteas, meta } = paginate(items, page);
      return { greenteas, meta } satisfies GreenteaListResponse as T;
    }

    const greenteaMatch = path.match(/^\/greenteas\/(\d+)$/);
    if (greenteaMatch) {
      const greentea = mockGreenteas.find(
        (g) => g.id === Number(greenteaMatch[1]),
      );
      if (!greentea) notFound(endpoint);

      const nearby_temples: NearbySpot[] = mockTemples
        .map((t) => ({
          id: t.id,
          name: t.name,
          distance_meters: distanceMeters(greentea, t),
        }))
        .filter((t) => t.distance_meters <= 1500)
        .sort((a, b) => a.distance_meters - b.distance_meters);

      return {
        greentea: {
          ...greentea,
          liked_by_current_user: false,
          nearby_temples,
          comments: mockGreenteaComments,
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

      const { items: temples, meta } = paginate(items, page);
      return { temples, meta } satisfies TempleListResponse as T;
    }

    const templeMatch = path.match(/^\/temples\/(\d+)$/);
    if (templeMatch) {
      const temple = mockTemples.find((t) => t.id === Number(templeMatch[1]));
      if (!temple) notFound(endpoint);

      const nearby_greenteas: NearbySpot[] = mockGreenteas
        .map((g) => ({
          id: g.id,
          name: g.name,
          distance_meters: distanceMeters(temple, g),
        }))
        .filter((g) => g.distance_meters <= 1500)
        .sort((a, b) => a.distance_meters - b.distance_meters);

      return {
        temple: {
          ...temple,
          liked_by_current_user: false,
          nearby_greenteas,
          comments: mockTempleComments,
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
  }

  notFound(endpoint);
}
