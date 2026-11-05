import { describe, expect, it } from "vitest";
import { buildCsp } from "@/lib/security/csp";

function directive(csp: string, name: string): string[] {
  const found = csp.split("; ").find((d) => d.startsWith(`${name} `));
  return found ? found.split(" ").slice(1) : [];
}

describe("buildCsp", () => {
  const prod = buildCsp({ apiUrl: "https://api.example.run.app/", isDev: false });

  it("object-src / frame-ancestors を封じ、base-uri を自身に限定する", () => {
    expect(directive(prod, "object-src")).toEqual(["'none'"]);
    expect(directive(prod, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(prod, "base-uri")).toEqual(["'self'"]);
  });

  it("frame-src は Google Maps 用に *.google.com のみ許可する", () => {
    expect(directive(prod, "frame-src")).toEqual(["https://*.google.com"]);
  });

  it("本番では unsafe-eval を許可しない", () => {
    expect(directive(prod, "script-src")).not.toContain("'unsafe-eval'");
  });

  it("開発では HMR 用に unsafe-eval と ws: を許可する", () => {
    const dev = buildCsp({ isDev: true });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toContain("ws:");
  });

  it("API のオリジンだけを connect-src に追加する（パスは含めない）", () => {
    expect(directive(prod, "connect-src")).toContain("https://api.example.run.app");
  });

  it("API のベースパスは connect-src に含めない", () => {
    const csp = buildCsp({ apiUrl: "https://api.example.run.app/api/v1", isDev: false });
    expect(directive(csp, "connect-src")).toContain("https://api.example.run.app");
    expect(directive(csp, "connect-src")).not.toContain(
      "https://api.example.run.app/api/v1",
    );
  });

  it("不正な API URL でも例外にならず、API URL なしと同じポリシーになる", () => {
    expect(buildCsp({ apiUrl: "not a url", isDev: false })).toBe(
      buildCsp({ isDev: false }),
    );
  });

  it("http: の画像と Analytics の debug ローダーは dev のみ許可する", () => {
    const dev = buildCsp({ isDev: true });
    expect(directive(dev, "img-src")).toContain("http:");
    expect(directive(dev, "script-src")).toContain("https://va.vercel-scripts.com");
    expect(directive(prod, "img-src")).not.toContain("http:");
    expect(directive(prod, "script-src")).not.toContain("https://va.vercel-scripts.com");
  });

  it("script-src は Google Maps 以外の外部ホストを許可しない", () => {
    const hosts = directive(prod, "script-src").filter((v) => v.startsWith("http"));
    expect(hosts.sort()).toEqual([
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
    ]);
  });

  it("本番では upgrade-insecure-requests を付ける", () => {
    expect(prod).toContain("upgrade-insecure-requests");
    expect(buildCsp({ isDev: true })).not.toContain("upgrade-insecure-requests");
  });
});
