import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteBuilder from "@/components/route/RouteBuilder";
import { apiUrl } from "@tests/msw/writeApiHandlers";
import { server } from "@tests/msw/server";

const useSessionMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock, back: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

const greenteasPayload = {
  greenteas: [
    {
      id: 1,
      name: "茶寮都路里",
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
    },
  ],
  meta: { current_page: 1, total_pages: 1, total_count: 1 },
};

beforeEach(() => {
  useSessionMock.mockReset();
  pushMock.mockReset();
  refreshMock.mockReset();
  signOutMock.mockReset();
  useSessionMock.mockReturnValue({
    data: { railsJwt: "mock:mock-alice" },
    status: "authenticated",
  });
  server.use(
    http.get(apiUrl("/greenteas"), () => HttpResponse.json(greenteasPayload)),
    http.get(apiUrl("/temples"), () =>
      HttpResponse.json({
        temples: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0 },
      }),
    ),
  );
});

function renderWithSwr(ui: ReactElement) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {ui}
    </SWRConfig>,
  );
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

  it("候補からスポットを追加して作成すると詳細へ遷移する", async () => {
    let postedBody: unknown;
    server.use(
      http.post(apiUrl("/routes"), async ({ request }) => {
        postedBody = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: 42,
              name: "テストコース",
              description: "",
              created_at: "2026-07-03T00:00:00Z",
              updated_at: "2026-07-03T00:00:00Z",
              spots: [],
              total_distance_meters: 0,
              total_duration_seconds: null,
            },
          },
          { status: 201 },
        );
      }),
    );

    renderWithSwr(<RouteBuilder mode="create" />);

    await userEvent.type(screen.getByLabelText(/コース名/), "テストコース");
    // 候補（茶寮都路里）の追加ボタンをクリック
    const candidate = await screen.findByRole("button", { name: /茶寮都路里/ });
    await userEvent.click(candidate);

    // 選択リストに反映される
    const selectedSection = screen
      .getByRole("heading", { name: /コースのスポット/ })
      .closest("section") as HTMLElement;
    expect(within(selectedSection).getByText("茶寮都路里")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "コースを作成" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/routes/42");
    });
    expect(postedBody).toMatchObject({
      route: {
        name: "テストコース",
        spots: [{ spot_type: "greentea", spot_id: 1 }],
      },
    });
  });
});
