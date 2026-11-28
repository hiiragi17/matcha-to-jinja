import { describe, expect, it } from "vitest";
import { formatDistance, formatWalkingMinutes } from "../format";

describe("formatDistance", () => {
  it("1000m 未満は m 表記", () => {
    expect(formatDistance(0)).toBe("0m");
    expect(formatDistance(480)).toBe("480m");
    expect(formatDistance(999)).toBe("999m");
  });

  it("1000m 以上は km 表記（小数第1位）", () => {
    expect(formatDistance(1000)).toBe("1.0km");
    expect(formatDistance(1500)).toBe("1.5km");
    expect(formatDistance(12340)).toBe("12.3km");
  });
});

describe("formatWalkingMinutes", () => {
  it("80m/分で分数に換算し、端数は切り上げる", () => {
    expect(formatWalkingMinutes(435)).toBe("徒歩6分");
    expect(formatWalkingMinutes(80)).toBe("徒歩1分");
    expect(formatWalkingMinutes(160)).toBe("徒歩2分");
  });

  it("極端に近い距離でも最低1分と表示する", () => {
    expect(formatWalkingMinutes(0)).toBe("徒歩1分");
    expect(formatWalkingMinutes(10)).toBe("徒歩1分");
  });
});
