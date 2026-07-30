import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NearbyMap from "@/components/map/NearbyMap";
import type { NearbyResponse } from "@/types";
import { apiUrl } from "@tests/msw/writeApiHandlers";
import { server } from "@tests/msw/server";
import {
  clearGeolocation,
  installGeolocation,
  permissionDeniedError,
  positionUnavailableError,
  rejectWith,
  resolveWith,
} from "@tests/mocks/geolocation";
import { mapInstance, resetGoogleMapsMock } from "@tests/mocks/googleMaps";

vi.mock("@vis.gl/react-google-maps", () => import("@tests/mocks/googleMaps"));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// 京都圏内 / 圏外の座標。
const KYOTO_POINT = { latitude: 35.02, longitude: 135.77 };
const OUTSIDE_POINT = { latitude: 35.68, longitude: 139.76 }; // 東京

const nearbyData: NearbyResponse = {
  greenteas: [
    {
      id: 1,
      name: "一保堂茶舗",
      latitude: 35.013,
      longitude: 135.767,
      distance_meters: 320,
    },
  ],
  temples: [
    {
      id: 2,
      name: "八坂神社",
      latitude: 35.0036,
      longitude: 135.7786,
      distance_meters: 1200,
    },
  ],
};

const emptyData: NearbyResponse = { greenteas: [], temples: [] };

function nearbyHandler(data: NearbyResponse) {
  return http.get(apiUrl("/nearby"), () => HttpResponse.json(data));
}

beforeEach(() => {
  resetGoogleMapsMock();
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  // このファイルは vi.spyOn を使わず vi.fn() のみのため restoreAllMocks は無効。
  // vi.fn の呼び出し履歴をクリアして次テストへ持ち越さない。
  vi.clearAllMocks();
});

describe("NearbyMap", () => {
  it("API キー未設定なら設定エラーを表示し、地図も現在地取得も行わない", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    const { getCurrentPosition } = installGeolocation();

    render(<NearbyMap />);

    expect(
      screen.getByText(/Google Maps の API キーが設定されていません/),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("Geolocation 非対応ブラウザでは非対応メッセージを出す", async () => {
    clearGeolocation();

    render(<NearbyMap />);

    expect(
      await screen.findByText(/お使いのブラウザは位置情報に対応していません/),
    ).toBeInTheDocument();
  });

  it("位置情報が拒否されると案内を出し、再試行できる", async () => {
    const { getCurrentPosition } = installGeolocation();
    rejectWith(getCurrentPosition, permissionDeniedError());

    render(<NearbyMap />);

    expect(
      await screen.findByText(/位置情報の利用が拒否されました/),
    ).toBeInTheDocument();
    // 地図は京都市中心部で描画される。
    expect(screen.getByTestId("map")).toHaveAttribute(
      "data-center",
      JSON.stringify({ lat: 35.0116, lng: 135.7681 }),
    );
    // 半径ボタンは位置未取得なので無効。
    expect(screen.getByRole("button", { name: "1.5 km" })).toBeDisabled();

    // 再試行で今度は成功させる。
    resolveWith(getCurrentPosition, KYOTO_POINT);
    server.use(nearbyHandler(nearbyData));
    await userEvent.click(
      screen.getByRole("button", { name: "もう一度試す" }),
    );

    expect(await screen.findByText("一保堂茶舗")).toBeInTheDocument();
  });

  it("現在地取得の失敗（拒否以外）ではエラー案内を出す", async () => {
    const { getCurrentPosition } = installGeolocation();
    rejectWith(getCurrentPosition, positionUnavailableError());

    render(<NearbyMap />);

    expect(
      await screen.findByText(/現在地を取得できませんでした/),
    ).toBeInTheDocument();
  });

  it("京都圏内で現在地取得に成功すると近隣スポットを取得・表示する", async () => {
    const { getCurrentPosition } = installGeolocation();
    resolveWith(getCurrentPosition, KYOTO_POINT);
    server.use(nearbyHandler(nearbyData));

    render(<NearbyMap />);

    // 一覧に抹茶店・神社が並ぶ。
    expect(await screen.findByText("一保堂茶舗")).toBeInTheDocument();
    expect(screen.getByText("八坂神社")).toBeInTheDocument();

    // 件数表示（各カラム 1 件）。
    const counts = screen.getAllByText("1 件");
    expect(counts).toHaveLength(2);

    // 距離フォーマット（m / km）。
    expect(screen.getByText("320m")).toBeInTheDocument();
    expect(screen.getByText("1.2km")).toBeInTheDocument();

    // marker: 現在地 + スポット 2 件。
    await waitFor(() => {
      expect(screen.getAllByTestId("advanced-marker").length).toBe(3);
    });
    expect(screen.getByTitle("現在地")).toBeInTheDocument();

    // 圏内なので京都中心へ寄せる注意書きは出ない。
    expect(
      screen.queryByText(/現在地が京都府の外のようです/),
    ).not.toBeInTheDocument();
  });

  it("一覧のスポットを選ぶと InfoWindow を開き、地図をそこへ寄せる", async () => {
    const { getCurrentPosition } = installGeolocation();
    resolveWith(getCurrentPosition, KYOTO_POINT);
    server.use(nearbyHandler(nearbyData));

    render(<NearbyMap />);
    await screen.findByText("一保堂茶舗");

    await userEvent.click(
      screen.getByRole("button", { name: "一保堂茶舗 を地図で表示" }),
    );

    // InfoWindow が開き、詳細リンクを持つ。
    const infoWindow = await screen.findByTestId("info-window");
    expect(within(infoWindow).getByText("抹茶店")).toBeInTheDocument();
    expect(within(infoWindow).getByRole("link", { name: /詳細を見る/ })).toHaveAttribute(
      "href",
      "/greenteas/1",
    );
    // 選択スポットの位置へ panTo。
    expect(mapInstance.panTo).toHaveBeenCalledWith({
      lat: 35.013,
      lng: 135.767,
    });

    // 閉じると InfoWindow が消える。
    await userEvent.click(
      within(infoWindow).getByRole("button", {
        name: "情報ウィンドウを閉じる",
      }),
    );
    await waitFor(() => {
      expect(screen.queryByTestId("info-window")).not.toBeInTheDocument();
    });
  });

  it("地図上の marker をクリックしても InfoWindow を開く", async () => {
    const { getCurrentPosition } = installGeolocation();
    resolveWith(getCurrentPosition, KYOTO_POINT);
    server.use(nearbyHandler(nearbyData));

    render(<NearbyMap />);
    await screen.findByText("一保堂茶舗");

    // 神社 marker（title で特定）をクリック。
    await userEvent.click(screen.getByTitle("八坂神社"));

    const infoWindow = await screen.findByTestId("info-window");
    expect(within(infoWindow).getByText("神社仏閣")).toBeInTheDocument();
    expect(
      within(infoWindow).getByRole("link", { name: /詳細を見る/ }),
    ).toHaveAttribute("href", "/temples/2");
  });

  it("現在地取得中は取得中の案内を出す", async () => {
    const { getCurrentPosition } = installGeolocation();
    // success/error を呼ばず requesting のまま留める。
    getCurrentPosition.mockImplementation(() => {});

    render(<NearbyMap />);

    expect(await screen.findByText("現在地を取得中…")).toBeInTheDocument();
  });

  it("京都圏外の現在地は京都市中心部へ寄せ、その旨の案内を出す", async () => {
    const { getCurrentPosition } = installGeolocation();
    resolveWith(getCurrentPosition, OUTSIDE_POINT);
    server.use(nearbyHandler(nearbyData));

    render(<NearbyMap />);

    expect(
      await screen.findByText(/現在地が京都府の外のようです/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/距離は京都市中心部からの目安です/),
    ).toBeInTheDocument();
    // origin は京都中心へ寄る（現在地ではなく京都市中心部マーカー）。
    expect(screen.getByTitle("京都市中心部")).toBeInTheDocument();
    expect(screen.getByTestId("map")).toHaveAttribute(
      "data-center",
      JSON.stringify({ lat: 35.0116, lng: 135.7681 }),
    );
  });

  it("近隣スポットが 0 件のときは半径を広げる案内を出す", async () => {
    const { getCurrentPosition } = installGeolocation();
    resolveWith(getCurrentPosition, KYOTO_POINT);
    server.use(nearbyHandler(emptyData));

    render(<NearbyMap />);

    expect(
      await screen.findByText(/指定した範囲には登録されたスポットがありません/),
    ).toBeInTheDocument();
    // 各カラムに空メッセージ。
    expect(
      screen.getAllByText("該当するスポットはありません。"),
    ).toHaveLength(2);
  });

  it("近隣スポット取得が失敗するとステータスに応じたエラー文を出す", async () => {
    const { getCurrentPosition } = installGeolocation();
    resolveWith(getCurrentPosition, KYOTO_POINT);
    server.use(
      http.get(apiUrl("/nearby"), () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    render(<NearbyMap />);

    expect(
      await screen.findByText("近隣スポットの取得に失敗しました（500）。"),
    ).toBeInTheDocument();
  });

  it("半径を変えると再取得し、選択中の半径が aria-pressed になる", async () => {
    const { getCurrentPosition } = installGeolocation();
    resolveWith(getCurrentPosition, KYOTO_POINT);
    const requestedRadii: string[] = [];
    server.use(
      http.get(apiUrl("/nearby"), ({ request }) => {
        const url = new URL(request.url);
        requestedRadii.push(url.searchParams.get("radius") ?? "");
        return HttpResponse.json(nearbyData);
      }),
    );

    render(<NearbyMap />);
    await screen.findByText("一保堂茶舗");

    // 初期半径 1.5km で取得済み。
    expect(requestedRadii).toContain("1.5");
    expect(screen.getByRole("button", { name: "1.5 km" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // 2.0km へ変更 → 再取得。
    await userEvent.click(screen.getByRole("button", { name: "2.0 km" }));

    await waitFor(() => {
      expect(requestedRadii).toContain("2");
    });
    expect(screen.getByRole("button", { name: "2.0 km" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
