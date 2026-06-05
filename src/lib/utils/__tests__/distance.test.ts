import { describe, expect, it } from "vitest";
import { distanceMeters } from "@/lib/utils/distance";

describe("distanceMeters", () => {
  it("同一点は 0m を返す", () => {
    const point = { latitude: 35.0036, longitude: 135.7714 };
    expect(distanceMeters(point, point)).toBe(0);
  });

  it("京都市内 2 点（祇園 〜 二条城、約 2.4km）の距離を妥当な範囲で返す", () => {
    // 祇園四条 (≒ 茶寮都路里) と二条城。Haversine 計算では約 2.4km。
    const gion = { latitude: 35.0036, longitude: 135.7714 };
    const nijo = { latitude: 35.0142, longitude: 135.7481 };
    const d = distanceMeters(gion, nijo);
    expect(d).toBeGreaterThan(2_200);
    expect(d).toBeLessThan(2_700);
  });

  it("近接する 2 点（〜500m）の距離を妥当な範囲で返す", () => {
    // 祇園四条交差点近傍と建仁寺。実距離はおおむね 400〜500m。
    const a = { latitude: 35.0036, longitude: 135.7714 };
    const b = { latitude: 35.0, longitude: 135.7741 };
    const d = distanceMeters(a, b);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(700);
  });

  it("対称性: A→B と B→A は同じ距離を返す", () => {
    const a = { latitude: 35.0036, longitude: 135.7714 };
    const b = { latitude: 35.0142, longitude: 135.7481 };
    expect(distanceMeters(a, b)).toBe(distanceMeters(b, a));
  });

  it("赤道上の 1 度（経度差）は約 111km", () => {
    const d = distanceMeters(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
    );
    // 赤道周は 40,075km なので 1 度はおよそ 111.32km。
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});
