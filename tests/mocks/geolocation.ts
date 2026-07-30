// navigator.geolocation のテスト用モック。
// NearbyMap は getCurrentPosition の成功/拒否/失敗で分岐するため、それぞれの
// パスを再現できるヘルパーを提供する。jsdom は geolocation を実装しないので、
// テスト側で明示的に install/clear する。
import { vi } from "vitest";

type SuccessCallback = (position: { coords: GeolocationCoordsLike }) => void;
type ErrorCallback = (error: GeolocationErrorLike) => void;

export type GeolocationCoordsLike = {
  latitude: number;
  longitude: number;
};

export type GeolocationErrorLike = {
  code: number;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
  message: string;
};

// GeolocationPositionError の code 定数。
export const GEO_ERROR = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as const;

function makeError(code: number, message: string): GeolocationErrorLike {
  return {
    code,
    PERMISSION_DENIED: GEO_ERROR.PERMISSION_DENIED,
    POSITION_UNAVAILABLE: GEO_ERROR.POSITION_UNAVAILABLE,
    TIMEOUT: GEO_ERROR.TIMEOUT,
    message,
  };
}

export const permissionDeniedError = () =>
  makeError(GEO_ERROR.PERMISSION_DENIED, "User denied Geolocation");

export const positionUnavailableError = () =>
  makeError(GEO_ERROR.POSITION_UNAVAILABLE, "Position unavailable");

/** navigator.geolocation を差し替え、getCurrentPosition の spy を返す。 */
export function installGeolocation() {
  const getCurrentPosition =
    vi.fn<
      (success: SuccessCallback, error?: ErrorCallback, options?: unknown) => void
    >();
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
    writable: true,
  });
  return { getCurrentPosition };
}

/**
 * navigator から geolocation を取り除く（非対応ブラウザの再現）。
 * `"geolocation" in navigator` が false になるよう own property を削除する。
 */
export function clearGeolocation() {
  delete (navigator as { geolocation?: unknown }).geolocation;
}

/** 現在地取得に成功するよう getCurrentPosition を設定する。 */
export function resolveWith(
  getCurrentPosition: ReturnType<typeof installGeolocation>["getCurrentPosition"],
  coords: GeolocationCoordsLike,
) {
  getCurrentPosition.mockImplementation((success) => {
    success({ coords });
  });
}

/** 現在地取得が失敗するよう getCurrentPosition を設定する。 */
export function rejectWith(
  getCurrentPosition: ReturnType<typeof installGeolocation>["getCurrentPosition"],
  error: GeolocationErrorLike,
) {
  getCurrentPosition.mockImplementation((_success, onError) => {
    onError?.(error);
  });
}
