import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/utils/safeCallbackUrl";

describe("safeCallbackUrl", () => {
  it("自サイト内の絶対パスはそのまま通す", () => {
    expect(safeCallbackUrl("/greenteas/1")).toBe("/greenteas/1");
    expect(safeCallbackUrl("/mypage/temple-likes")).toBe(
      "/mypage/temple-likes",
    );
  });

  it("クエリ付きの内部パスも通す", () => {
    expect(safeCallbackUrl("/temples?page=2")).toBe("/temples?page=2");
  });

  it("プロトコル相対 URL（//evil.com）は fallback に倒す", () => {
    expect(safeCallbackUrl("//evil.com")).toBe("/mypage");
  });

  it("外部 URL（http/https）は fallback に倒す", () => {
    expect(safeCallbackUrl("https://evil.com")).toBe("/mypage");
    expect(safeCallbackUrl("http://evil.com")).toBe("/mypage");
  });

  it("相対パスや undefined は fallback に倒す", () => {
    expect(safeCallbackUrl("greenteas/1")).toBe("/mypage");
    expect(safeCallbackUrl(undefined)).toBe("/mypage");
  });

  it("配列で渡された場合は先頭要素を検証する", () => {
    expect(safeCallbackUrl(["/greenteas/1", "/temples"])).toBe("/greenteas/1");
    expect(safeCallbackUrl(["//evil.com"])).toBe("/mypage");
  });

  it("fallback は上書きできる", () => {
    expect(safeCallbackUrl(undefined, "/")).toBe("/");
  });
});
