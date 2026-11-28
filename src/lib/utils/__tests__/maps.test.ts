import { describe, expect, it } from "vitest";
import { googleMapsDirectionsUrl, hasCoords } from "../maps";

describe("googleMapsDirectionsUrl", () => {
  it("出発地・目的地の座標を含む Maps URL を返し、移動手段は指定しない", () => {
    const url = new URL(
      googleMapsDirectionsUrl(
        { latitude: 34.8965705, longitude: 135.8087227 },
        { latitude: 35.0036007, longitude: 135.7779565 },
      ),
    );

    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("origin")).toBe("34.8965705,135.8087227");
    expect(url.searchParams.get("destination")).toBe("35.0036007,135.7779565");
    expect(url.searchParams.has("travelmode")).toBe(false);
  });
});

describe("hasCoords", () => {
  it("lat/lng が両方 0（削除済みスポット）のときだけ false", () => {
    expect(hasCoords({ latitude: 0, longitude: 0 })).toBe(false);
    expect(hasCoords({ latitude: 35.0036, longitude: 135.7714 })).toBe(true);
  });
});
