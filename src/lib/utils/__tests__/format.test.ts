import { describe, expect, it } from "vitest";
import {
  formatDistance,
  formatDuration,
  formatWalkingMinutes,
  transportLabel,
} from "../format";

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

describe("formatDuration", () => {
  it("null は「所要時間不明」", () => {
    expect(formatDuration(null)).toBe("所要時間不明");
  });

  it("60分未満は「約N分」（最低1分）", () => {
    expect(formatDuration(0)).toBe("約1分");
    expect(formatDuration(1080)).toBe("約18分");
    expect(formatDuration(3540)).toBe("約59分");
  });

  it("60分以上は時間表記", () => {
    expect(formatDuration(3600)).toBe("約1時間");
    expect(formatDuration(5400)).toBe("約1時間30分");
    expect(formatDuration(9000)).toBe("約2時間30分");
  });
});

describe("transportLabel", () => {
  it("各手段を日本語化し、null は空文字", () => {
    expect(transportLabel("walk")).toBe("徒歩");
    expect(transportLabel("transit")).toBe("電車・バス");
    expect(transportLabel("train")).toBe("電車");
    expect(transportLabel("bus")).toBe("バス");
    expect(transportLabel("car")).toBe("車");
    expect(transportLabel(null)).toBe("");
  });
});
