import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GreenteaAdminTable from "@/components/admin/GreenteaAdminTable";
import { server } from "@tests/msw/server";
import type { Greentea } from "@/types";

const useSessionMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

const baseGreentea: Greentea = {
  id: 1,
  name: "中村藤吉本店",
  description: "宇治の老舗。",
  address: "京都府宇治市宇治壱番10",
  access: "JR宇治駅から徒歩3分",
  phone_number: "0774-22-7800",
  business_hours: "10:00-17:00",
  holiday: "無休",
  homepage: "https://tokichi.jp",
  closed: false,
  img: "https://example.com/tokichi.jpg",
  latitude: 34.9,
  longitude: 135.8,
  genres: [
    { id: 1, name: "スイーツ" },
    { id: 3, name: "カフェ" },
  ],
  likes_count: 42,
};

const closedGreentea: Greentea = {
  ...baseGreentea,
  id: 2,
  name: "閉店した店",
  address: "京都府京都市中京区",
  closed: true,
  genres: [],
};

beforeEach(() => {
  useSessionMock.mockReset();
  pushMock.mockReset();
  refreshMock.mockReset();
  signOutMock.mockReset();
  signOutMock.mockResolvedValue(undefined);
  useSessionMock.mockReturnValue({
    data: { railsJwt: "jwt-token" },
    status: "authenticated",
  });
});

describe("GreenteaAdminTable — 抹茶店の管理テーブル", () => {
  it("空配列のときは未登録メッセージを表示する", () => {
    render(<GreenteaAdminTable greenteas={[]} />);

    expect(
      screen.getByText("登録された抹茶店がありません。"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("各行に店名・住所・ジャンル・状態・編集リンクを表示する", () => {
    render(<GreenteaAdminTable greenteas={[baseGreentea, closedGreentea]} />);

    expect(screen.getByText("中村藤吉本店")).toBeInTheDocument();
    expect(
      screen.getByText("京都府宇治市宇治壱番10"),
    ).toBeInTheDocument();
    expect(screen.getByText("スイーツ / カフェ")).toBeInTheDocument();
    expect(screen.getByText("営業中")).toBeInTheDocument();
    expect(screen.getByText("閉店")).toBeInTheDocument();

    const editLinks = screen.getAllByRole("link", { name: /編集/ });
    expect(editLinks).toHaveLength(2);
    expect(editLinks[0]).toHaveAttribute("href", "/admin/greenteas/1/edit");
  });

  it("ジャンルが空の行はダッシュを表示する", () => {
    render(<GreenteaAdminTable greenteas={[closedGreentea]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("削除ボタンで確認ダイアログを開き、確定で DELETE を呼び一覧を再取得する", async () => {
    const user = userEvent.setup();
    let deleteCalled = false;
    server.use(
      http.delete(endpoint("/admin/greenteas/1"), () => {
        deleteCalled = true;
        return HttpResponse.text(null, { status: 204 });
      }),
    );

    render(<GreenteaAdminTable greenteas={[baseGreentea]} />);

    await user.click(screen.getByRole("button", { name: /削除/ }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/「中村藤吉本店」を削除します/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /削除する/ }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("削除が失敗するとダイアログ内にエラーを表示する", async () => {
    const user = userEvent.setup();
    server.use(
      http.delete(endpoint("/admin/greenteas/1"), () =>
        HttpResponse.json({ error: "server error" }, { status: 500 }),
      ),
    );

    render(<GreenteaAdminTable greenteas={[baseGreentea]} />);

    await user.click(screen.getByRole("button", { name: /削除/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /削除する/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /削除に失敗しました/,
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("削除が 401 だと signOut してログインへ誘導する", async () => {
    const user = userEvent.setup();
    server.use(
      http.delete(endpoint("/admin/greenteas/1"), () =>
        HttpResponse.json({ error: "unauthorized" }, { status: 401 }),
      ),
    );

    render(<GreenteaAdminTable greenteas={[baseGreentea]} />);

    await user.click(screen.getByRole("button", { name: /削除/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /削除する/ }));

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false }),
    );
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fadmin%2Fgreenteas",
    );
  });

  it("キャンセルでダイアログを閉じ、削除を実行しない", async () => {
    const user = userEvent.setup();
    render(<GreenteaAdminTable greenteas={[baseGreentea]} />);

    await user.click(screen.getByRole("button", { name: /削除/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "キャンセル" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("トークンが無い状態で削除確定するとセッション切れ扱いで誘導する", async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<GreenteaAdminTable greenteas={[baseGreentea]} />);

    await user.click(screen.getByRole("button", { name: /削除/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /削除する/ }));

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false }),
    );
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fadmin%2Fgreenteas",
    );
  });
});
