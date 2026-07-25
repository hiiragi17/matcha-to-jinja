import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TempleAdminTable from "@/components/admin/TempleAdminTable";
import { server } from "@tests/msw/server";
import type { Temple } from "@/types";

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

const baseTemple: Temple = {
  id: 1,
  name: "伏見稲荷大社",
  description: "千本鳥居で知られる神社。",
  address: "京都府京都市伏見区深草藪之内町68",
  access: "JR稲荷駅すぐ",
  phone_number: "075-641-7331",
  business_hours: "24時間",
  holiday: "無休",
  homepage: "https://inari.jp",
  img: "https://example.com/inari.jpg",
  latitude: 34.9,
  longitude: 135.7,
  areas: [
    { id: 1, name: "伏見" },
    { id: 2, name: "東山" },
  ],
  likes_count: 88,
};

const noAreaTemple: Temple = {
  ...baseTemple,
  id: 2,
  name: "エリア未設定神社",
  address: "京都府京都市左京区",
  areas: [],
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

describe("TempleAdminTable — 神社仏閣の管理テーブル", () => {
  it("空配列のときは未登録メッセージを表示する", () => {
    render(<TempleAdminTable temples={[]} />);

    expect(
      screen.getByText("登録された神社・仏閣がありません。"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("各行に神社名・住所・エリア・編集リンクを表示する", () => {
    render(<TempleAdminTable temples={[baseTemple]} />);

    expect(screen.getByText("伏見稲荷大社")).toBeInTheDocument();
    expect(
      screen.getByText("京都府京都市伏見区深草藪之内町68"),
    ).toBeInTheDocument();
    expect(screen.getByText("伏見 / 東山")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /編集/ })).toHaveAttribute(
      "href",
      "/admin/temples/1/edit",
    );
  });

  it("エリアが空の行はダッシュを表示する", () => {
    render(<TempleAdminTable temples={[noAreaTemple]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("削除ボタンで確認ダイアログを開き、確定で DELETE を呼び一覧を再取得する", async () => {
    const user = userEvent.setup();
    let deleteCalled = false;
    server.use(
      http.delete(endpoint("/admin/temples/1"), () => {
        deleteCalled = true;
        return HttpResponse.text(null, { status: 204 });
      }),
    );

    render(<TempleAdminTable temples={[baseTemple]} />);

    await user.click(screen.getByRole("button", { name: /削除/ }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/「伏見稲荷大社」を削除します/),
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
      http.delete(endpoint("/admin/temples/1"), () =>
        HttpResponse.json({ error: "server error" }, { status: 500 }),
      ),
    );

    render(<TempleAdminTable temples={[baseTemple]} />);

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
      http.delete(endpoint("/admin/temples/1"), () =>
        HttpResponse.json({ error: "unauthorized" }, { status: 401 }),
      ),
    );

    render(<TempleAdminTable temples={[baseTemple]} />);

    await user.click(screen.getByRole("button", { name: /削除/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /削除する/ }));

    await waitFor(() =>
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false }),
    );
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fadmin%2Ftemples",
    );
  });
});
