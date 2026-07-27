import { render, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteEditForm from "@/components/route/RouteEditForm";
import { endpoint } from "@tests/msw/endpoint";
import { server } from "@tests/msw/server";

const useSessionMock = vi.fn();
const pushMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn(), back: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

const routeDetail = {
  id: 7,
  name: "祇園抹茶巡り",
  description: "神社とお茶屋さんを巡る半日コース",
  created_at: "2026-07-03T10:00:00.000Z",
  updated_at: "2026-07-03T10:00:00.000Z",
  spots: [
    {
      position: 1,
      spot_type: "greentea",
      transport: "walk",
      id: 1,
      name: "茶寮都路里",
      address: "京都市東山区四条通",
      access: "祇園四条駅から徒歩5分",
      latitude: 35.0036,
      longitude: 135.7714,
      img: "",
      distance_to_next_meters: 800,
      route_distance_to_next_meters: null,
      duration_to_next_seconds: null,
    },
    {
      position: 2,
      spot_type: "temple",
      transport: null,
      id: 3,
      name: "八坂神社",
      address: "京都市東山区祇園町北側",
      access: "祇園四条駅から徒歩8分",
      latitude: 35.0036,
      longitude: 135.7786,
      img: "",
      distance_to_next_meters: null,
      route_distance_to_next_meters: null,
      duration_to_next_seconds: null,
    },
  ],
  total_distance_meters: 800,
  total_duration_seconds: null,
};

beforeEach(() => {
  useSessionMock.mockReset();
  pushMock.mockReset();
  signOutMock.mockReset();
  signOutMock.mockResolvedValue(undefined);
  useSessionMock.mockReturnValue({
    data: { railsJwt: "jwt-token" },
    status: "authenticated",
  });
  // RouteBuilder の候補フェッチ。編集フォームの検証には不要なので空で返す。
  server.use(
    http.get(endpoint("/greenteas"), () =>
      HttpResponse.json({
        greenteas: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0 },
      }),
    ),
    http.get(endpoint("/temples"), () =>
      HttpResponse.json({
        temples: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0 },
      }),
    ),
  );
});

function renderWithSwr(ui: ReactElement) {
  return render(
    <SWRConfig
      value={{
        provider: () => new Map(),
        dedupingInterval: 0,
        shouldRetryOnError: false,
      }}
    >
      {ui}
    </SWRConfig>,
  );
}

describe("RouteEditForm", () => {
  it("未ログインではログイン案内と callbackUrl 付きリンクを出す", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<RouteEditForm id="7" />);

    expect(
      screen.getByText(/コースの編集にはログインが必要です/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ログインへ/ })).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Froutes%2F7%2Fedit",
    );
  });

  it("取得中はローディングを出す", async () => {
    server.use(
      http.get(endpoint("/routes/7"), async () => {
        await delay(50);
        return HttpResponse.json({ data: routeDetail });
      }),
    );

    renderWithSwr(<RouteEditForm id="7" />);

    expect(screen.getByText("読み込み中…")).toBeInTheDocument();
    expect(await screen.findByLabelText(/コース名/)).toHaveValue("祇園抹茶巡り");
  });

  it("取得した既存値をビルダーにプリフィルする", async () => {
    server.use(
      http.get(endpoint("/routes/7"), () =>
        HttpResponse.json({ data: routeDetail }),
      ),
    );

    renderWithSwr(<RouteEditForm id="7" />);

    expect(await screen.findByLabelText(/コース名/)).toHaveValue("祇園抹茶巡り");
    expect(screen.getByLabelText(/説明/)).toHaveValue(
      "神社とお茶屋さんを巡る半日コース",
    );
    expect(screen.getByText("茶寮都路里")).toBeInTheDocument();
    expect(screen.getByText("八坂神社")).toBeInTheDocument();
    // 先頭スポットの移動手段も引き継ぐ（末尾は select 自体が出ない）。
    expect(
      screen.getByLabelText("茶寮都路里 から次のスポットへの移動手段"),
    ).toHaveValue("walk");
    expect(
      screen.queryByLabelText("八坂神社 から次のスポットへの移動手段"),
    ).not.toBeInTheDocument();
    // mode="edit" が渡っていることは送信ボタンのラベルで判別できる。
    expect(
      screen.getByRole("button", { name: "変更を保存" }),
    ).toBeInTheDocument();
  });

  it("404 では見つからない旨を案内する", async () => {
    server.use(
      http.get(endpoint("/routes/7"), () =>
        HttpResponse.json({ error: "Not Found" }, { status: 404 }),
      ),
    );

    renderWithSwr(<RouteEditForm id="7" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "コースが見つかりませんでした。",
    );
    expect(screen.getByRole("link", { name: "コース一覧へ" })).toHaveAttribute(
      "href",
      "/routes",
    );
  });

  it("5xx では汎用エラーを出し、signOut はしない", async () => {
    server.use(
      http.get(endpoint("/routes/7"), () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    renderWithSwr(<RouteEditForm id="7" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "コースの取得に失敗しました。時間を置いてお試しください。",
    );
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("401 だと signOut してログインへ誘導する", async () => {
    server.use(
      http.get(endpoint("/routes/7"), () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    );

    renderWithSwr(<RouteEditForm id="7" />);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Froutes%2F7%2Fedit",
    );
  });
});
