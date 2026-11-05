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

  it("不正な API URL でも例外にならず、追加されない", () => {
    const csp = buildCsp({ apiUrl: "not a url", isDev: false });
    expect(directive(csp, "connect-src")).toEqual(
      expect.not.arrayContaining(["not a url"]),
    );
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
