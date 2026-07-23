import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ComingSoon from "@/components/common/ComingSoon";

describe("ComingSoon", () => {
  it("title を見出しに表示する", () => {
    render(<ComingSoon title="マイページ" />);

    expect(
      screen.getByRole("heading", { name: "マイページ" }),
    ).toBeInTheDocument();
  });

  it("description 未指定なら既定の準備中文言を表示する", () => {
    render(<ComingSoon title="マイページ" />);

    expect(
      screen.getByText(/このページは現在準備中です/),
    ).toBeInTheDocument();
  });

  it("description を渡すとその文言を表示する", () => {
    render(<ComingSoon title="ルート" description="近日公開します。" />);

    expect(screen.getByText("近日公開します。")).toBeInTheDocument();
    expect(
      screen.queryByText(/このページは現在準備中です/),
    ).not.toBeInTheDocument();
  });

  it("トップへ戻るリンクを表示する", () => {
    render(<ComingSoon title="マイページ" />);

    expect(
      screen.getByRole("link", { name: "トップへ戻る" }),
    ).toHaveAttribute("href", "/");
  });
});
