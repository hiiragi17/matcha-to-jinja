// @vis.gl/react-google-maps のテスト用モック。
//
// 実物は Google Maps JS API のロード（外部スクリプト / API キー）を前提とするため
// jsdom では動かない。地図系コンポーネント（NearbyMap / RouteMap）のテストで
// 共通利用できるよう、必要な named export を軽量な React 要素へ差し替える。
//
// 使い方（テスト側）:
//   vi.mock("@vis.gl/react-google-maps", () => import("@tests/mocks/googleMaps"));
//   import { mapInstance, resetGoogleMapsMock } from "@tests/mocks/googleMaps";
// vi.mock の factory が dynamic import で本モジュールを返すため、テストが直接
// import する mapInstance などの spy と同一インスタンスを共有できる。
import type { ReactNode } from "react";
import { vi } from "vitest";

export type LatLng = { lat: number; lng: number };

// useMap() が返す地図インスタンス。pan/zoom/fitBounds の呼び出しを spy で追える。
export const mapInstance = {
  panTo: vi.fn<(pos: LatLng) => void>(),
  setCenter: vi.fn<(pos: LatLng) => void>(),
  setZoom: vi.fn<(zoom: number) => void>(),
  fitBounds: vi.fn<(bounds: MockLatLngBounds, padding?: number) => void>(),
};

export type PolylineOptions = {
  path: LatLng[];
  geodesic?: boolean;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
};

// new maps.Polyline(...) で生成されたインスタンスを記録し、経路の順序や
// setMap(map)/setMap(null)（マウント/アンマウント）を検証できるようにする。
export const polylineInstances: MockPolyline[] = [];

export class MockPolyline {
  options: PolylineOptions;
  setMap = vi.fn<(map: unknown) => void>();
  constructor(options: PolylineOptions) {
    this.options = options;
    polylineInstances.push(this);
  }
}

// new core.LatLngBounds() で生成された bounds を記録。extend で積まれた座標を検証する。
export const boundsInstances: MockLatLngBounds[] = [];

export class MockLatLngBounds {
  points: LatLng[] = [];
  constructor() {
    boundsInstances.push(this);
  }
  extend = vi.fn((point: LatLng) => {
    this.points.push(point);
    return this;
  });
}

const mapsLibrary = { Polyline: MockPolyline };
const coreLibrary = { LatLngBounds: MockLatLngBounds };

/** テスト間で spy 呼び出し履歴と生成インスタンスをリセットする。 */
export function resetGoogleMapsMock() {
  mapInstance.panTo.mockReset();
  mapInstance.setCenter.mockReset();
  mapInstance.setZoom.mockReset();
  mapInstance.fitBounds.mockReset();
  polylineInstances.length = 0;
  boundsInstances.length = 0;
}

export function APIProvider({ children }: { children?: ReactNode }) {
  return <div data-testid="api-provider">{children}</div>;
}

type MapProps = {
  children?: ReactNode;
  mapId?: string;
  defaultCenter?: LatLng;
  defaultZoom?: number;
} & Record<string, unknown>;

export function Map({ children, mapId, defaultCenter, defaultZoom }: MapProps) {
  return (
    <div
      data-testid="map"
      data-map-id={mapId}
      data-center={defaultCenter ? JSON.stringify(defaultCenter) : undefined}
      data-zoom={defaultZoom}
    >
      {children}
    </div>
  );
}

type AdvancedMarkerProps = {
  children?: ReactNode;
  position?: LatLng;
  title?: string;
  onClick?: () => void;
};

export function AdvancedMarker({
  children,
  position,
  title,
  onClick,
}: AdvancedMarkerProps) {
  return (
    <div
      data-testid="advanced-marker"
      data-position={position ? JSON.stringify(position) : undefined}
      title={title}
      role={onClick ? "button" : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

type PinProps = {
  background?: string;
  borderColor?: string;
  glyphColor?: string;
};

export function Pin({ background, borderColor, glyphColor }: PinProps) {
  return (
    <div
      data-testid="pin"
      data-background={background}
      data-border-color={borderColor}
      data-glyph-color={glyphColor}
    />
  );
}

type InfoWindowProps = {
  children?: ReactNode;
  headerContent?: ReactNode;
  position?: LatLng;
  onCloseClick?: () => void;
};

export function InfoWindow({
  children,
  headerContent,
  position,
  onCloseClick,
}: InfoWindowProps) {
  return (
    <div
      data-testid="info-window"
      data-position={position ? JSON.stringify(position) : undefined}
    >
      <button
        type="button"
        aria-label="情報ウィンドウを閉じる"
        onClick={onCloseClick}
      />
      {headerContent}
      {children}
    </div>
  );
}

export function useMap() {
  return mapInstance;
}

export function useMapsLibrary(name: string) {
  if (name === "maps") return mapsLibrary;
  if (name === "core") return coreLibrary;
  return null;
}
