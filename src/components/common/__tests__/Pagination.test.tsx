import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Pagination from "@/components/common/Pagination";

describe("Pagination", () => {
  it("totalPages が 1 以下のときは何も描画しない", () => {
    const { container } = render(
      <Pagination basePath="/greenteas" currentPage={1} totalPages={1} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("現在ページは aria-current=\"page\" で表示され、リンクではない", () => {
    render(
      <Pagination basePath="/greenteas" currentPage={3} totalPages={5} />,
    );

    const current = screen.getByText("3", { selector: "[aria-current]" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).not.toBe("A");
  });

  it("1 ページ目では「前へ」が無効、最終ページでは「次へ」が無効", () => {
    const { rerender } = render(
      <Pagination basePath="/greenteas" currentPage={1} totalPages={5} />,
    );

    const prev1 = screen.getByText(/前へ/);
    expect(prev1.tagName).toBe("SPAN");
    expect(prev1).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText(/次へ/).tagName).toBe("A");

    rerender(
      <Pagination basePath="/greenteas" currentPage={5} totalPages={5} />,
    );
    expect(screen.getByText(/前へ/).tagName).toBe("A");
    const next = screen.getByText(/次へ/);
    expect(next.tagName).toBe("SPAN");
    expect(next).toHaveAttribute("aria-hidden", "true");
  });

  it("preservedQuery がリンクの href に保持される", () => {
    render(
      <Pagination
        basePath="/greenteas"
        currentPage={2}
        totalPages={5}
        preservedQuery="q=中村&genre=3"
      />,
    );

    const nextLink = screen.getByText(/次へ/);
    const href = nextLink.getAttribute("href") ?? "";
    expect(href.startsWith("/greenteas?")).toBe(true);
    const url = new URL(href, "http://localhost");
    expect(url.searchParams.get("q")).toBe("中村");
    expect(url.searchParams.get("genre")).toBe("3");
    expect(url.searchParams.get("page")).toBe("3");
  });

  it("1 ページ目に戻るリンクには page= を付けない", () => {
    render(
      <Pagination
        basePath="/greenteas"
        currentPage={2}
        totalPages={5}
        preservedQuery="q=辻利"
      />,
    );

    const prevLink = screen.getByText(/前へ/);
    expect(prevLink.tagName).toBe("A");
    const href = prevLink.getAttribute("href") ?? "";
    const url = new URL(href, "http://localhost");
    expect(url.searchParams.has("page")).toBe(false);
    expect(url.searchParams.get("q")).toBe("辻利");
  });

  it("ページ数が多いと先頭ページと省略記号が描画される", () => {
    render(
      <Pagination basePath="/greenteas" currentPage={7} totalPages={10} />,
    );

    const nav = screen.getByRole("navigation", { name: /ページネーション/ });
    expect(within(nav).getByText("1").tagName).toBe("A");
    expect(within(nav).getAllByText("…").length).toBeGreaterThanOrEqual(1);
    expect(within(nav).getByText("10").tagName).toBe("A");
  });
});
