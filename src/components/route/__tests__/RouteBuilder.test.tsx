import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteBuilder from "@/components/route/RouteBuilder";
import { endpoint } from "@tests/msw/endpoint";
import { server } from "@tests/msw/server";
import type { RouteDetail } from "@/types";

const useSessionMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();
const backMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock, back: backMock }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

function greentea(id: number, name: string) {
  return {
    id,
    name,
    description: "",
    address: "",
    access: "",
    phone_number: "",
    business_hours: "",
    holiday: "",
    homepage: "",
    closed: false,
    img: "",
    latitude: 35.0036,
    longitude: 135.7714,
    genres: [],
    likes_count: 0,
  };
}

function temple(id: number, name: string) {
  return {
    id,
    name,
    description: "",
    address: "",
    access: "",
    phone_number: "",
    business_hours: "",
    holiday: "",
    homepage: "",
    img: "",
    latitude: 35.0036,
    longitude: 135.7786,
    areas: [],
    likes_count: 0,
  };
}

const greenteasPayload = {
  greenteas: [greentea(1, "茶寮都路里")],
  meta: { current_page: 1, total_pages: 1, total_count: 1 },
};

const emptyTemples = {
  temples: [],
  meta: { current_page: 1, total_pages: 1, total_count: 0 },
};

// 編集モードの初期値。並べ替え・削除で transport がどうクリアされるかを
// 見たいので、移動手段付きのスポットを 3 件持たせる。
const initialRoute: RouteDetail = {
  id: 7,
  name: "祇園抹茶巡り",
  description: "半日コース",
  created_at: "2026-07-03T10:00:00.000Z",
  updated_at: "2026-07-03T10:00:00.000Z",
  spots: [
    {
      position: 1,
      spot_type: "greentea",
      transport: "walk",
      id: 1,
      name: "茶寮都路里",
      address: "",
      access: "",
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
      transport: "train",
      id: 3,
      name: "八坂神社",
      address: "",
      access: "",
      latitude: 35.0036,
      longitude: 135.7786,
      img: "",
      distance_to_next_meters: 1500,
      route_distance_to_next_meters: null,
      duration_to_next_seconds: null,
    },
    {
      position: 3,
      spot_type: "greentea",
      transport: null,
      id: 5,
      name: "中村藤吉本店",
      address: "",
      access: "",
      latitude: 34.8912,
      longitude: 135.7998,
      img: "",
      distance_to_next_meters: null,
      route_distance_to_next_meters: null,
      duration_to_next_seconds: null,
    },
  ],
  total_distance_meters: 2300,
  total_duration_seconds: null,
};

beforeEach(() => {
  useSessionMock.mockReset();
  pushMock.mockReset();
  refreshMock.mockReset();
  backMock.mockReset();
  signOutMock.mockReset();
  signOutMock.mockResolvedValue(undefined);
  useSessionMock.mockReturnValue({
    data: { railsJwt: "mock:mock-alice" },
    status: "authenticated",
  });
  server.use(
    http.get(endpoint("/greenteas"), () => HttpResponse.json(greenteasPayload)),
    http.get(endpoint("/temples"), () => HttpResponse.json(emptyTemples)),
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

// 選択済みスポット一覧のセクション（候補一覧と名前が衝突するため常にここで絞る）。
function selectedSection() {
  return screen
    .getByRole("heading", { name: /コースのスポット/ })
    .closest("section") as HTMLElement;
}

const SPOT_NAMES = initialRoute.spots.map((s) => s.name);

// 並び順はスタイル用クラスではなく可視テキストから読む
// （Tailwind のクラス名変更でテストが黙って壊れないように）。
function selectedNames() {
  return within(selectedSection())
    .getAllByRole("listitem")
    .map(
      (li) => SPOT_NAMES.find((name) => within(li).queryByText(name)) ?? null,
    );
}

function routeDetailResponse(id: number, name: string) {
  return {
    data: {
      id,
      name,
      description: "",
      created_at: "2026-07-03T00:00:00Z",
      updated_at: "2026-07-03T00:00:00Z",
      spots: [],
      total_distance_meters: 0,
      total_duration_seconds: null,
    },
  };
}

describe("RouteBuilder（作成）", () => {
  it("スポット未追加で保存するとバリデーションエラーを出す", async () => {
    renderWithSwr(<RouteBuilder mode="create" />);

    await userEvent.type(screen.getByLabelText(/コース名/), "テストコース");
    await userEvent.click(screen.getByRole("button", { name: "コースを作成" }));

    expect(
      await screen.findByText(/スポットを1件以上追加してください/),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("コース名が空だとバリデーションエラーを出す", async () => {
    renderWithSwr(<RouteBuilder mode="create" />);

    await userEvent.click(await screen.findByRole("button", { name: /茶寮都路里/ }));
    await userEvent.click(screen.getByRole("button", { name: "コースを作成" }));

    expect(await screen.findByText("コース名は必須です")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("候補からスポットを追加して作成すると詳細へ遷移する", async () => {
    let postedBody: unknown;
    server.use(
      http.post(endpoint("/routes"), async ({ request }) => {
        postedBody = await request.json();
        return HttpResponse.json(routeDetailResponse(42, "テストコース"), {
          status: 201,
        });
      }),
    );

    renderWithSwr(<RouteBuilder mode="create" />);

    await userEvent.type(screen.getByLabelText(/コース名/), "テストコース");
    await userEvent.type(screen.getByLabelText(/説明/), "半日で回れます");
    // 候補（茶寮都路里）の追加ボタンをクリック
    const candidate = await screen.findByRole("button", { name: /茶寮都路里/ });
    await userEvent.click(candidate);

    // 選択リストに反映される
    expect(
      within(selectedSection()).getByText("茶寮都路里"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "コースを作成" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/routes/42");
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(postedBody).toMatchObject({
      route: {
        name: "テストコース",
        description: "半日で回れます",
        spots: [{ spot_type: "greentea", spot_id: 1 }],
      },
    });
  });

  it("422 ではサーバのメッセージを表示する", async () => {
    server.use(
      http.post(endpoint("/routes"), () =>
        HttpResponse.json(
          { errors: { name: ["はすでに使われています"] } },
          { status: 422 },
        ),
      ),
    );

    renderWithSwr(<RouteBuilder mode="create" />);

    await userEvent.type(screen.getByLabelText(/コース名/), "テストコース");
    await userEvent.click(await screen.findByRole("button", { name: /茶寮都路里/ }));
    await userEvent.click(screen.getByRole("button", { name: "コースを作成" }));

    expect(
      await screen.findByText("はすでに使われています"),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    // 送信ボタンは再試行できる状態に戻る
    expect(screen.getByRole("button", { name: "コースを作成" })).toBeEnabled();
  });

  it("5xx では汎用の保存失敗メッセージを表示する", async () => {
    server.use(
      http.post(endpoint("/routes"), () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    renderWithSwr(<RouteBuilder mode="create" />);

    await userEvent.type(screen.getByLabelText(/コース名/), "テストコース");
    await userEvent.click(await screen.findByRole("button", { name: /茶寮都路里/ }));
    await userEvent.click(screen.getByRole("button", { name: "コースを作成" }));

    expect(
      await screen.findByText("保存に失敗しました。時間を置いてお試しください。"),
    ).toBeInTheDocument();
  });

  it("401 だと signOut して作成ページへ戻れるログインに誘導する", async () => {
    server.use(
      http.post(endpoint("/routes"), () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    );

    renderWithSwr(<RouteBuilder mode="create" />);

    await userEvent.type(screen.getByLabelText(/コース名/), "テストコース");
    await userEvent.click(await screen.findByRole("button", { name: /茶寮都路里/ }));
    await userEvent.click(screen.getByRole("button", { name: "コースを作成" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Froutes%2Fnew",
    );
  });

  it("トークンが無い状態で送信するとログインへ誘導する", async () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    renderWithSwr(<RouteBuilder mode="edit" initial={initialRoute} />);

    await userEvent.click(screen.getByRole("button", { name: "変更を保存" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Froutes%2F7%2Fedit",
    );
  });

  it("キャンセルは前の画面へ戻る", async () => {
    renderWithSwr(<RouteBuilder mode="create" />);

    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(backMock).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});

describe("RouteBuilder（スポット選択 UI）", () => {
  it("タブを切り替えると神社仏閣の候補を取得する", async () => {
    server.use(
      http.get(endpoint("/temples"), () =>
        HttpResponse.json({
          temples: [temple(3, "八坂神社")],
          meta: { current_page: 1, total_pages: 1, total_count: 1 },
        }),
      ),
    );

    renderWithSwr(<RouteBuilder mode="create" />);

    await screen.findByRole("button", { name: /茶寮都路里/ });
    await userEvent.click(screen.getByRole("button", { name: "神社仏閣" }));

    expect(
      await screen.findByRole("button", { name: /八坂神社/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "神社仏閣" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: "抹茶スイーツ" }));

    expect(
      await screen.findByRole("button", { name: /茶寮都路里/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "神社仏閣" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("検索語はデバウンスして Ransack パラメータで送る", async () => {
    const requested: string[] = [];
    server.use(
      http.get(endpoint("/greenteas"), ({ request }) => {
        requested.push(request.url);
        return HttpResponse.json(greenteasPayload);
      }),
    );

    renderWithSwr(<RouteBuilder mode="create" />);

    await screen.findByRole("button", { name: /茶寮都路里/ });
    await userEvent.type(
      screen.getByLabelText("スポットを名前で絞り込み"),
      "都路里",
    );

    await waitFor(() => {
      expect(
        requested.some((url) =>
          decodeURIComponent(url).includes("q[name_cont]=都路里"),
        ),
      ).toBe(true);
    });
    // デバウンスが効いていれば 1 文字ごとにはリクエストしない
    expect(requested.length).toBeLessThan(4);
  });

  it("候補が空なら該当なしを案内する", async () => {
    server.use(
      http.get(endpoint("/greenteas"), () =>
        HttpResponse.json({
          greenteas: [],
          meta: { current_page: 1, total_pages: 1, total_count: 0 },
        }),
      ),
    );

    renderWithSwr(<RouteBuilder mode="create" />);

    expect(
      await screen.findByText("該当するスポットがありません。"),
    ).toBeInTheDocument();
  });

  it("候補の取得に失敗するとエラーを出す", async () => {
    server.use(
      http.get(endpoint("/greenteas"), () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    renderWithSwr(<RouteBuilder mode="create" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "候補の取得に失敗しました。時間を置いてお試しください。",
    );
  });
});

describe("RouteBuilder（編集）", () => {
  it("並べ替えると順序が入れ替わり、影響する区間の移動手段がクリアされる", async () => {
    renderWithSwr(<RouteBuilder mode="edit" initial={initialRoute} />);

    expect(selectedNames()).toEqual(["茶寮都路里", "八坂神社", "中村藤吉本店"]);
    expect(
      screen.getByLabelText("茶寮都路里 から次のスポットへの移動手段"),
    ).toHaveValue("walk");

    const rows = within(selectedSection()).getAllByRole("listitem");
    await userEvent.click(within(rows[0]).getByRole("button", { name: "下へ移動" }));

    expect(selectedNames()).toEqual(["八坂神社", "茶寮都路里", "中村藤吉本店"]);
    // 入れ替えで「次のスポット」が変わった 2 件はどちらも未設定に戻る
    expect(
      screen.getByLabelText("八坂神社 から次のスポットへの移動手段"),
    ).toHaveValue("");
    expect(
      screen.getByLabelText("茶寮都路里 から次のスポットへの移動手段"),
    ).toHaveValue("");

    // 上へ戻すと順序も元どおりになる（transport はクリアされたまま）
    const moved = within(selectedSection()).getAllByRole("listitem");
    await userEvent.click(
      within(moved[1]).getByRole("button", { name: "上へ移動" }),
    );

    expect(selectedNames()).toEqual(["茶寮都路里", "八坂神社", "中村藤吉本店"]);
  });

  it("先頭スポットは上へ移動できず、末尾は下へ移動できない", async () => {
    renderWithSwr(<RouteBuilder mode="edit" initial={initialRoute} />);

    const rows = within(selectedSection()).getAllByRole("listitem");
    expect(within(rows[0]).getByRole("button", { name: "上へ移動" })).toBeDisabled();
    expect(within(rows[2]).getByRole("button", { name: "下へ移動" })).toBeDisabled();
  });

  it("スポットを削除すると直前の区間の移動手段がクリアされる", async () => {
    renderWithSwr(<RouteBuilder mode="edit" initial={initialRoute} />);

    const rows = within(selectedSection()).getAllByRole("listitem");
    await userEvent.click(within(rows[1]).getByRole("button", { name: "削除" }));

    expect(selectedNames()).toEqual(["茶寮都路里", "中村藤吉本店"]);
    expect(
      screen.getByLabelText("茶寮都路里 から次のスポットへの移動手段"),
    ).toHaveValue("");
  });

  it("全て削除すると空案内に戻る", async () => {
    renderWithSwr(<RouteBuilder mode="edit" initial={initialRoute} />);

    for (let i = 0; i < 3; i += 1) {
      const rows = within(selectedSection()).getAllByRole("listitem");
      await userEvent.click(within(rows[0]).getByRole("button", { name: "削除" }));
    }

    expect(
      within(selectedSection()).getByText(
        /下の候補から抹茶店・神社仏閣を追加してください/,
      ),
    ).toBeInTheDocument();
  });

  it("スポットが未変更なら PATCH に spots を含めない", async () => {
    let patchedBody: unknown;
    server.use(
      http.patch(endpoint("/routes/7"), async ({ request }) => {
        patchedBody = await request.json();
        return HttpResponse.json(routeDetailResponse(7, "祇園抹茶巡り 改"));
      }),
    );

    renderWithSwr(<RouteBuilder mode="edit" initial={initialRoute} />);

    await userEvent.type(screen.getByLabelText(/コース名/), " 改");
    await userEvent.click(screen.getByRole("button", { name: "変更を保存" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/routes/7");
    });
    expect(patchedBody).toEqual({
      route: { name: "祇園抹茶巡り 改", description: "半日コース" },
    });
  });

  it("移動手段を変えたら PATCH に spots を含める", async () => {
    let patchedBody: unknown;
    server.use(
      http.patch(endpoint("/routes/7"), async ({ request }) => {
        patchedBody = await request.json();
        return HttpResponse.json(routeDetailResponse(7, "祇園抹茶巡り"));
      }),
    );

    renderWithSwr(<RouteBuilder mode="edit" initial={initialRoute} />);

    await userEvent.selectOptions(
      screen.getByLabelText("茶寮都路里 から次のスポットへの移動手段"),
      "bus",
    );
    await userEvent.click(screen.getByRole("button", { name: "変更を保存" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/routes/7");
    });
    expect(patchedBody).toMatchObject({
      route: {
        spots: [
          { spot_type: "greentea", spot_id: 1, transport: "bus" },
          { spot_type: "temple", spot_id: 3, transport: "train" },
          { spot_type: "greentea", spot_id: 5, transport: null },
        ],
      },
    });
  });

  it("移動手段を未設定に戻せる", async () => {
    let patchedBody: unknown;
    server.use(
      http.patch(endpoint("/routes/7"), async ({ request }) => {
        patchedBody = await request.json();
        return HttpResponse.json(routeDetailResponse(7, "祇園抹茶巡り"));
      }),
    );

    renderWithSwr(<RouteBuilder mode="edit" initial={initialRoute} />);

    await userEvent.selectOptions(
      screen.getByLabelText("茶寮都路里 から次のスポットへの移動手段"),
      "",
    );
    await userEvent.click(screen.getByRole("button", { name: "変更を保存" }));

    await waitFor(() => {
      expect(patchedBody).toMatchObject({
        route: {
          spots: [
            { spot_id: 1, transport: null },
            { spot_id: 3, transport: "train" },
            { spot_id: 5, transport: null },
          ],
        },
      });
    });
  });
});
