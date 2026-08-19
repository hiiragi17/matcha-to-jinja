import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TempleSearchForm from "@/components/temple/TempleSearchForm";
import type { Area } from "@/types";

const pushMock = vi.fn();
let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

const areas: Area[] = [
  { id: 1, name: "東山" },
  { id: 2, name: "嵐山" },
];

beforeEach(() => {
  pushMock.mockReset();
  currentSearch = "";
});

describe("TempleSearchForm", () => {
  it("検索でキーワードが URL に乗る", async () => {
    const user = userEvent.setup();
    render(<TempleSearchForm areas={areas} />);

    await user.type(
      screen.getByRole("searchbox", { name: /キーワード/ }),
      "清水",
    );
    await user.click(screen.getByRole("button", { name: "検索" }));

    const arg = pushMock.mock.calls[0][0];
    const url = new URL(arg, "http://localhost");
    expect(url.searchParams.get("q")).toBe("清水");
  });

  it("条件変更時に page は引き継がない", async () => {
    currentSearch = "page=4";
    const user = userEvent.setup();
    render(<TempleSearchForm areas={areas} />);

    await user.type(
      screen.getByRole("searchbox", { name: /キーワード/ }),
      "八坂",
    );
    await user.click(screen.getByRole("button", { name: "検索" }));

    const arg = pushMock.mock.calls[0][0];
    const url = new URL(arg, "http://localhost");
    expect(url.searchParams.has("page")).toBe(false);
  });

  it("エリアを複数選択すると area が複数回 URL に乗る", async () => {
    const user = userEvent.setup();
    render(<TempleSearchForm areas={areas} />);

    await user.click(screen.getByRole("checkbox", { name: "東山" }));
    await user.click(screen.getByRole("checkbox", { name: "嵐山" }));
    await user.click(screen.getByRole("button", { name: "検索" }));

    const arg = pushMock.mock.calls[0][0];
    const url = new URL(arg, "http://localhost");
    expect(url.searchParams.getAll("area")).toEqual(["1", "2"]);
  });

  it("URL の既存の複数 area がチェック状態に反映される", () => {
    currentSearch = "area=1&area=2";
    render(<TempleSearchForm areas={areas} />);

    expect(screen.getByRole("checkbox", { name: "東山" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "嵐山" })).toBeChecked();
  });

  it("クリアで q / area が消える", async () => {
    currentSearch = "q=清水&area=1&area=2";
    const user = userEvent.setup();
    render(<TempleSearchForm areas={areas} />);

    await user.click(screen.getByRole("button", { name: "クリア" }));
    expect(pushMock).toHaveBeenCalledWith("/temples");
  });
});
