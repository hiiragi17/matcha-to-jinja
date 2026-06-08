import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GreenteaSearchForm from "@/components/greentea/GreenteaSearchForm";
import type { Genre } from "@/types";

const pushMock = vi.fn();
let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

const genres: Genre[] = [
  { id: 1, name: "スイーツ" },
  { id: 3, name: "カフェ" },
];

beforeEach(() => {
  pushMock.mockReset();
  currentSearch = "";
});

describe("GreenteaSearchForm", () => {
  it("検索を実行すると router.push が ?q=... 付き URL で呼ばれる", async () => {
    const user = userEvent.setup();
    render(<GreenteaSearchForm genres={genres} />);

    await user.type(
      screen.getByRole("searchbox", { name: /キーワード/ }),
      "中村",
    );
    await user.click(screen.getByRole("button", { name: "検索" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const arg = pushMock.mock.calls[0][0];
    expect(arg.startsWith("/greenteas?")).toBe(true);
    const url = new URL(arg, "http://localhost");
    expect(url.searchParams.get("q")).toBe("中村");
  });

  it("条件変更時に page は付かない（1 ページ目に戻る）", async () => {
    // 既存 URL に page= が乗っている状態
    currentSearch = "page=4";
    const user = userEvent.setup();
    render(<GreenteaSearchForm genres={genres} />);

    await user.type(
      screen.getByRole("searchbox", { name: /キーワード/ }),
      "辻利",
    );
    await user.click(screen.getByRole("button", { name: "検索" }));

    const arg = pushMock.mock.calls[0][0];
    const url = new URL(arg, "http://localhost");
    expect(url.searchParams.has("page")).toBe(false);
    expect(url.searchParams.get("q")).toBe("辻利");
  });

  it("ジャンル選択も q に乗る", async () => {
    const user = userEvent.setup();
    render(<GreenteaSearchForm genres={genres} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: /ジャンル/ }),
      "3",
    );
    await user.click(screen.getByRole("button", { name: "検索" }));

    const arg = pushMock.mock.calls[0][0];
    const url = new URL(arg, "http://localhost");
    expect(url.searchParams.get("genre")).toBe("3");
  });

  it("クリアボタンで q / genre が消える", async () => {
    currentSearch = "q=中村&genre=3";
    const user = userEvent.setup();
    render(<GreenteaSearchForm genres={genres} />);

    // クリアボタンは hasFilter が true のときだけ表示される
    await user.click(screen.getByRole("button", { name: "クリア" }));

    expect(pushMock).toHaveBeenCalledWith("/greenteas");
  });

  it("条件未設定では空クエリでベース URL に遷移する", async () => {
    const user = userEvent.setup();
    render(<GreenteaSearchForm genres={genres} />);

    await user.click(screen.getByRole("button", { name: "検索" }));
    expect(pushMock).toHaveBeenCalledWith("/greenteas");
  });
});
