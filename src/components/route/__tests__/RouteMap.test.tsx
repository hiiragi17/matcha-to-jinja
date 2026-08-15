import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RouteMap from "@/components/route/RouteMap";
import type { RouteSpot } from "@/types";
import {
  boundsInstances,
  decodePath,
  mapInstance,
  polylineInstances,
  resetGoogleMapsMock,
} from "@tests/mocks/googleMaps";

vi.mock("@vis.gl/react-google-maps", () => import("@tests/mocks/googleMaps"));

function makeSpot(overrides: Partial<RouteSpot> = {}): RouteSpot {
  return {
    position: 1,
    spot_type: "greentea",
    transport: null,
    id: 1,
    name: "スポット",
    address: "京都市",
    access: "駅から徒歩5分",
    latitude: 35.0,
    longitude: 135.7,
    img: "",
    distance_to_next_meters: null,
    route_distance_to_next_meters: null,
    duration_to_next_seconds: null,
    route_polyline_to_next: null,
    ...overrides,
  };
}

beforeEach(() => {
  resetGoogleMapsMock();
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("RouteMap", () => {
  it("API キー未設定なら設定を促すメッセージを出す", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");

    render(<RouteMap spots={[makeSpot()]} />);

    expect(
      screen.getByText(/Google Maps の API キーが設定されていません/),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });

  it("表示できるスポットが無いとき（空配列）は案内文を出す", () => {
    render(<RouteMap spots={[]} />);

    expect(
      screen.getByText("地図に表示できるスポットがありません。"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });

  it("緯度経度が 0 のスポット（削除済み）は除外され、全滅なら案内文を出す", () => {
    render(
      <RouteMap
        spots={[makeSpot({ id: 1, latitude: 0, longitude: 0 })]}
      />,
    );

    expect(
      screen.getByText("地図に表示できるスポットがありません。"),
    ).toBeInTheDocument();
  });

  it("スポット 1 件では marker を出し、その位置に setCenter/setZoom する", () => {
    render(
      <RouteMap
        spots={[makeSpot({ position: 1, latitude: 35.01, longitude: 135.76 })]}
      />,
    );

    const markers = screen.getAllByTestId("advanced-marker");
    expect(markers).toHaveLength(1);
    expect(markers[0]).toHaveAttribute("title", "スポット");

    // 1 件のときは fitBounds ではなく setCenter + setZoom。
    expect(mapInstance.setCenter).toHaveBeenCalledWith({
      lat: 35.01,
      lng: 135.76,
    });
    expect(mapInstance.setZoom).toHaveBeenCalledWith(15);
    // 1 件では経路線は引かない。
    expect(polylineInstances).toHaveLength(0);
    expect(mapInstance.fitBounds).not.toHaveBeenCalled();
  });

  it("複数スポットを position 順に marker 表示し、順序どおりに経路線を引く", () => {
    const spots = [
      makeSpot({
        position: 1,
        id: 10,
        spot_type: "greentea",
        name: "一保堂",
        latitude: 35.01,
        longitude: 135.76,
      }),
      makeSpot({
        position: 2,
        id: 20,
        spot_type: "temple",
        name: "八坂神社",
        latitude: 35.02,
        longitude: 135.77,
      }),
      makeSpot({
        position: 3,
        id: 30,
        spot_type: "greentea",
        name: "茶寮都路里",
        latitude: 35.03,
        longitude: 135.78,
      }),
    ];

    render(<RouteMap spots={spots} />);

    // 順序バッジ（position 番号）が 1→2→3 で並ぶ。
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    const markers = screen.getAllByTestId("advanced-marker");
    expect(markers.map((m) => m.getAttribute("title"))).toEqual([
      "一保堂",
      "八坂神社",
      "茶寮都路里",
    ]);

    // route_polyline_to_next が無い leg は区間ごとに直線の経路線を引く（2 spot 間 = 2 本）。
    expect(polylineInstances).toHaveLength(2);
    expect(polylineInstances[0].options.path).toEqual([
      { lat: 35.01, lng: 135.76 },
      { lat: 35.02, lng: 135.77 },
    ]);
    expect(polylineInstances[1].options.path).toEqual([
      { lat: 35.02, lng: 135.77 },
      { lat: 35.03, lng: 135.78 },
    ]);
    expect(polylineInstances[0].setMap).toHaveBeenCalledWith(mapInstance);
    expect(polylineInstances[1].setMap).toHaveBeenCalledWith(mapInstance);

    // fitBounds は全スポットを extend した bounds で呼ばれる。
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);
    expect(boundsInstances).toHaveLength(1);
    expect(boundsInstances[0].points).toEqual([
      { lat: 35.01, lng: 135.76 },
      { lat: 35.02, lng: 135.77 },
      { lat: 35.03, lng: 135.78 },
    ]);
  });

  it("座標が無いスポットは経路・marker から除外される", () => {
    const spots = [
      makeSpot({ position: 1, id: 1, latitude: 35.01, longitude: 135.76 }),
      makeSpot({ position: 2, id: 2, latitude: 0, longitude: 0 }),
      makeSpot({ position: 3, id: 3, latitude: 35.03, longitude: 135.78 }),
    ];

    render(<RouteMap spots={spots} />);

    const markers = screen.getAllByTestId("advanced-marker");
    expect(markers).toHaveLength(2);
    // 経路 path も有効な 2 点のみ。
    expect(polylineInstances[0].options.path).toEqual([
      { lat: 35.01, lng: 135.76 },
      { lat: 35.03, lng: 135.78 },
    ]);
  });

  it("route_polyline_to_next がある leg は道なり経路をデコードして描画する", () => {
    const decodedPath = [
      { lat: 35.01, lng: 135.76 },
      { lat: 35.015, lng: 135.765 },
      { lat: 35.02, lng: 135.77 },
    ];
    decodePath.mockReturnValueOnce(decodedPath);

    const spots = [
      makeSpot({
        position: 1,
        id: 1,
        latitude: 35.01,
        longitude: 135.76,
        route_polyline_to_next: "abc123encoded",
      }),
      makeSpot({ position: 2, id: 2, latitude: 35.02, longitude: 135.77 }),
      makeSpot({ position: 3, id: 3, latitude: 35.03, longitude: 135.78 }),
    ];

    render(<RouteMap spots={spots} />);

    expect(decodePath).toHaveBeenCalledWith("abc123encoded");
    // leg1: デコードされた道なり経路をそのまま path に使う（直線ではない = geodesic: false）。
    expect(polylineInstances[0].options.path).toEqual(decodedPath);
    expect(polylineInstances[0].options.geodesic).toBe(false);
    // leg2: route_polyline_to_next が無いので従来どおり2点間の直線。
    expect(polylineInstances[1].options.path).toEqual([
      { lat: 35.02, lng: 135.77 },
      { lat: 35.03, lng: 135.78 },
    ]);
    expect(polylineInstances[1].options.geodesic).toBe(true);
  });

  it("アンマウント時に経路線を破棄する（setMap(null)）", () => {
    const spots = [
      makeSpot({ position: 1, id: 1, latitude: 35.01, longitude: 135.76 }),
      makeSpot({ position: 2, id: 2, latitude: 35.02, longitude: 135.77 }),
    ];

    const { unmount } = render(<RouteMap spots={spots} />);
    expect(polylineInstances).toHaveLength(1);

    unmount();

    expect(polylineInstances[0].setMap).toHaveBeenLastCalledWith(null);
  });
});
