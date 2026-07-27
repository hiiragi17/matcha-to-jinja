import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteDetailView from "@/components/route/RouteDetailView";
import { endpoint } from "@tests/msw/endpoint";
import { server } from "@tests/msw/server";

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

// 地図は Google Maps（@vis.gl/react-google-maps）依存で、モック基盤の整備は #96 の
// スコープ。ここでは spots が渡っていることだけ確認できれば十分なので差し替える。
vi.mock("@/components/route/RouteMap", () => ({
  default: ({ spots }: { spots: { id: number }[] }) => (
    <div data-testid="route-map">{`map:${spots.length}`}</div>
  ),
}));

const authedSession = {
  data: { railsJwt: "jwt-token" },
  status: "authenticated" as const,
};

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
      route_distance_to_next_meters: 1200,
      duration_to_next_seconds: 900,
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
  total_distance_meters: 1200,
  total_duration_seconds: 900,
};

beforeEach(() => {
  vi.restoreAllMocks();
  useSessionMock.mockReset();
  pushMock.mockReset();
  refreshMock.mockReset();
  signOutMock.mockReset();
  signOutMock.mockResolvedValue(undefined);
  useSessionMock.mockReturnValue(authedSession);
});

// SWR のグローバルキャッシュとリトライをテスト間で持ち越さない。
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

function routeFound() {
  return http.get(endpoint("/routes/7"), () =>
    HttpResponse.json({ data: routeDetail }),
  );
}

// dt ラベルから、同じ dt-dd を包む div を取り出す。
function stat(label: string) {
  return screen.getByText(label).closest("div") as HTMLElement;
}

describe("RouteDetailView", () => {
  it("未ログインではログイン案内と callbackUrl 付きリンクを出す", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<RouteDetailView id="7" />);

    expect(
      screen.getByText(/コースの表示にはログインが必要です/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ログインへ/ })).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Froutes%2F7",
    );
  });

  it("取得中はローディングを出す", async () => {
    server.use(
      http.get(endpoint("/routes/7"), async () => {
        await delay(50);
        return HttpResponse.json({ data: routeDetail });
      }),
    );

    renderWithSwr(<RouteDetailView id="7" />);

    expect(screen.getByText("読み込み中…")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "祇園抹茶巡り" }),
    ).toBeInTheDocument();
  });

  it("コース概要・合計値・地図・スポットを表示する", async () => {
    server.use(routeFound());

    renderWithSwr(<RouteDetailView id="7" />);

    expect(
      await screen.findByRole("heading", { name: "祇園抹茶巡り" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("神社とお茶屋さんを巡る半日コース"),
    ).toBeInTheDocument();

    expect(stat("TOTAL DISTANCE")).toHaveTextContent("1.2km");
    expect(stat("TOTAL TIME")).toHaveTextContent("約15分");
    expect(stat("SPOTS")).toHaveTextContent("2 件");

    expect(screen.getByTestId("route-map")).toHaveTextContent("map:2");

    expect(screen.getByRole("link", { name: "茶寮都路里" })).toHaveAttribute(
      "href",
      "/greenteas/1",
    );
    expect(screen.getByRole("link", { name: "八坂神社" })).toHaveAttribute(
      "href",
      "/temples/3",
    );
    expect(screen.getByText("京都市東山区四条通")).toBeInTheDocument();
    expect(screen.getByText("祇園四条駅から徒歩8分")).toBeInTheDocument();
  });

  it("区間情報は経路距離を優先し、最終スポットには出さない", async () => {
    server.use(routeFound());

    renderWithSwr(<RouteDetailView id="7" />);

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);

    // 1件目の区間: 徒歩 / 経路距離 1200m（直線 800m ではない）/ 約15分
    const firstLeg = within(items[0]);
    expect(firstLeg.getByText("徒歩")).toBeInTheDocument();
    expect(firstLeg.getByText("1.2km")).toBeInTheDocument();
    expect(firstLeg.getByText("約15分")).toBeInTheDocument();
    expect(firstLeg.queryByText("800m")).not.toBeInTheDocument();

    // 最終スポットには区間表示（↓）が付かない
    expect(within(items[1]).queryByText("↓")).not.toBeInTheDocument();
  });

  it("404 では削除済みの可能性を案内する", async () => {
    server.use(
      http.get(endpoint("/routes/7"), () =>
        HttpResponse.json({ error: "Not Found" }, { status: 404 }),
      ),
    );

    renderWithSwr(<RouteDetailView id="7" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "コースが見つかりませんでした。削除された可能性があります。",
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

    renderWithSwr(<RouteDetailView id="7" />);

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

    renderWithSwr(<RouteDetailView id="7" />);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Froutes%2F7",
    );
  });

  it("削除を確認すると DELETE して一覧へ遷移する", async () => {
    let deletedUrl: string | undefined;
    server.use(
      routeFound(),
      http.delete(endpoint("/routes/7"), ({ request }) => {
        deletedUrl = request.url;
        return HttpResponse.text(null, { status: 204 });
      }),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithSwr(<RouteDetailView id="7" />);

    await userEvent.click(
      await screen.findByRole("button", { name: "削除" }),
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/routes");
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(deletedUrl).toContain("/routes/7");
  });

  it("削除の確認をキャンセルすると API を叩かない", async () => {
    const onDelete = vi.fn();
    server.use(
      routeFound(),
      http.delete(endpoint("/routes/7"), () => {
        onDelete();
        return HttpResponse.text(null, { status: 204 });
      }),
    );
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWithSwr(<RouteDetailView id="7" />);

    await userEvent.click(
      await screen.findByRole("button", { name: "削除" }),
    );

    expect(onDelete).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("削除に失敗するとアラートを出しボタンを戻す", async () => {
    server.use(
      routeFound(),
      http.delete(endpoint("/routes/7"), () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    renderWithSwr(<RouteDetailView id="7" />);

    await userEvent.click(
      await screen.findByRole("button", { name: "削除" }),
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "削除に失敗しました。時間を置いてお試しください。",
      );
    });
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "削除" })).toBeEnabled();
  });

  it("削除が 401 だと signOut してログインへ誘導する", async () => {
    server.use(
      routeFound(),
      http.delete(endpoint("/routes/7"), () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    renderWithSwr(<RouteDetailView id="7" />);

    await userEvent.click(
      await screen.findByRole("button", { name: "削除" }),
    );

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Froutes%2F7",
    );
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
