import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loader from "@/components/common/Loader";

describe("Loader", () => {
  it("既定文言を role=status で表示する", () => {
    render(<Loader />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("読み込み中…");
  });

  it("label を渡すとその文言を表示する", () => {
    render(<Loader label="検索中…" />);

    expect(screen.getByRole("status")).toHaveTextContent("検索中…");
  });

  it("fullScreen を指定すると中央寄せの section で囲む", () => {
    const { container } = render(<Loader fullScreen />);

    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    expect(section).toContainElement(screen.getByRole("status"));
  });

  it("fullScreen 未指定では section を描画しない", () => {
    const { container } = render(<Loader />);

    expect(container.querySelector("section")).toBeNull();
  });
});
