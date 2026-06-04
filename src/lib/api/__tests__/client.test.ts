import { describe, expect, it } from "vitest";
import { buildQuery } from "@/lib/api/client";

// Phase 1 の本格的なテストは #45 で追加する。
// ここではテストランナーが回ることだけ確認する最小ケース。
describe("buildQuery", () => {
  it("引数なしのときは空文字列を返す", () => {
    expect(buildQuery()).toBe("");
  });

  it("通常の key/value をクエリ文字列に変換する", () => {
    expect(buildQuery({ page: 1 })).toBe("?page=1");
  });
});
