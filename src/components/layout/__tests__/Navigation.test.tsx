import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Navigation, { NAV_LINKS } from "@/components/layout/Navigation";

let currentPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

beforeEach(() => {
  currentPathname = "/";
});

describe("Navigation", () => {
  it("全てのナビリンクを表示する", () => {
    render(<Navigation />);

    for (const link of NAV_LINKS) {
      expect(
        screen.getByRole("link", { name: link.label }),
      ).toHaveAttribute("href", link.href);
    }
  });

  it("トップ（/）は完全一致のときだけアクティブ", () => {
    currentPathname = "/";
    render(<Navigation />);

    expect(screen.getByRole("link", { name: "トップ" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "抹茶スイーツ" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("配下パスは前方一致でアクティブになる", () => {
    currentPathname = "/greenteas/1";
    render(<Navigation />);

    expect(
      screen.getByRole("link", { name: "抹茶スイーツ" }),
    ).toHaveAttribute("aria-current", "page");
    // トップは前方一致の対象外（/ は完全一致のみ）
    expect(screen.getByRole("link", { name: "トップ" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("orientation=vertical でも全リンクを表示する", () => {
    render(<Navigation orientation="vertical" />);

    expect(screen.getAllByRole("link")).toHaveLength(NAV_LINKS.length);
  });
});
