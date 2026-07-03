import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteList from "@/components/route/RouteList";
import { apiUrl } from "@tests/msw/writeApiHandlers";
import { server } from "@tests/msw/server";

const useSessionMock = vi.fn();
const pushMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
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
});

function renderWithSwr(ui: ReactElement) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {ui}
    </SWRConfig>,
  );
}

const routesPayload = {
  data: [
    {
      id: 1,
      name: "祇園抹茶巡り",
      description: "神社とお茶屋さんを巡る",
      spot_count: 2,
      created_at: "2026-07-03T10:00:00.000Z",
      updated_at: "2026-07-03T10:00:00.000Z",
    },
  ],
  meta: { current_page: 1, total_pages: 1, total_count: 1 },
};

describe("RouteList", () => {
  it("未ログインではログイン案内と callbackUrl 付きリンクを出す", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<RouteList />);

    expect(
      screen.getByText(/モデルコースの表示・作成にはログインが必要/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ログインへ/ })).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Froutes",
    );
  });

  it("一覧を表示し、削除すると行が消える", async () => {
    useSessionMock.mockReturnValue({
      data: { railsJwt: "mock:mock-alice" },
      status: "authenticated",
    });
    server.use(
      http.get(apiUrl("/routes"), () => HttpResponse.json(routesPayload)),
      http.delete(apiUrl("/routes/:id"), () =>
        HttpResponse.text(null, { status: 204 }),
      ),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithSwr(<RouteList />);

    expect(
      await screen.findByRole("link", { name: "祇園抹茶巡り" }),
    ).toBeInTheDocument();
    expect(screen.getByText("スポット 2 件")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "削除" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "祇園抹茶巡り" }),
      ).not.toBeInTheDocument();
    });
  });

  it("空のときは案内文を出す", async () => {
    useSessionMock.mockReturnValue({
      data: { railsJwt: "mock:mock-alice" },
      status: "authenticated",
    });
    server.use(
      http.get(apiUrl("/routes"), () =>
        HttpResponse.json({
          data: [],
          meta: { current_page: 1, total_pages: 1, total_count: 0 },
        }),
      ),
    );

    renderWithSwr(<RouteList />);

    expect(
      await screen.findByText(/まだモデルコースがありません/),
    ).toBeInTheDocument();
  });
});
