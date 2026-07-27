import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteCreateForm from "@/components/route/RouteCreateForm";
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

beforeEach(() => {
  useSessionMock.mockReset();
  pushMock.mockReset();
  signOutMock.mockReset();
  signOutMock.mockResolvedValue(undefined);
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

describe("RouteCreateForm", () => {
  it("未ログインではビルダーを描画せずログイン導線を出す", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<RouteCreateForm />);

    expect(
      screen.getByText(/モデルコースの作成にはログインが必要です/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ログインへ/ })).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Froutes%2Fnew",
    );
    expect(screen.queryByLabelText(/コース名/)).not.toBeInTheDocument();
  });

  it("ログイン済みなら空の作成ビルダーを描画する", async () => {
    useSessionMock.mockReturnValue({
      data: { railsJwt: "jwt-token" },
      status: "authenticated",
    });

    renderWithSwr(<RouteCreateForm />);

    expect(await screen.findByLabelText(/コース名/)).toHaveValue("");
    expect(screen.getByLabelText(/説明/)).toHaveValue("");
    // mode="create" が渡っていることは送信ボタンのラベルで判別できる。
    expect(
      screen.getByRole("button", { name: "コースを作成" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/下の候補から抹茶店・神社仏閣を追加してください/),
    ).toBeInTheDocument();
  });
});
