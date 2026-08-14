import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "@/components/layout/Footer";

describe("Footer", () => {
  it("非公式である旨と出典の免責を表示する", () => {
    render(<Footer />);

    expect(
      screen.getByText(/非公式のファンサイト/),
    ).toBeInTheDocument();
    expect(screen.getByText(/出典/)).toBeInTheDocument();
  });

  it("利用規約 / プライバシー / 現在地から のリンクを表示する", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "利用規約" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(
      screen.getByRole("link", { name: "プライバシー" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: "現在地から" }),
    ).toHaveAttribute("href", "/nearby");
  });

  it("お問い合わせリンクを新しいタブで表示する", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: "お問い合わせ" });
    expect(link).toHaveAttribute(
      "href",
      "https://docs.google.com/forms/d/e/1FAIpQLSdYI7QDiZJ_WlBFuVsc6DCb-1s0JUwy_NGfLeqnWO_EP76pIQ/viewform?usp=dialog",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("現在の年号を著作権表記に含める", () => {
    render(<Footer />);

    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`${year}\\s*抹茶と神社。`)),
    ).toBeInTheDocument();
  });
});
