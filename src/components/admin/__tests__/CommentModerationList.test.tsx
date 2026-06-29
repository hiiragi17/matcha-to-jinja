import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CommentModerationList from "@/components/admin/CommentModerationList";
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

const comments = [
  {
    id: 101,
    body: "抹茶パフェが最高でした",
    user: { id: 1, name: "テスト太郎" },
    created_at: "2026-06-01T00:00:00.000Z",
    resource_type: "greentea",
    resource_id: 1,
    resource_name: "茶寮 翠",
  },
  {
    id: 202,
    body: "静かで落ち着く神社でした",
    user: { id: 2, name: "テスト花子" },
    created_at: "2026-06-02T00:00:00.000Z",
    resource_type: "temple",
    resource_id: 3,
    resource_name: "下鴨神社",
  },
];

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

describe("CommentModerationList — コメントモデレーション", () => {
  it("未ログインではログイン案内とログインリンクを表示する", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<CommentModerationList />);

    expect(
      screen.getByText(/コメント管理の表示にはログインが必要/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ログインへ/ })).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Fadmin%2Fcomments",
    );
  });

  it("ログイン時は横断コメント一覧を対象リンク付きで表示する", async () => {
    useSessionMock.mockReturnValue({
      data: { railsJwt: "jwt-token" },
      status: "authenticated",
    });
    server.use(
      http.get(endpoint("/admin/comments"), () =>
        HttpResponse.json({ comments }),
      ),
    );

    renderWithSwr(<CommentModerationList />);

    expect(await screen.findByText("抹茶パフェが最高でした")).toBeInTheDocument();
    expect(screen.getByText("静かで落ち着く神社でした")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "茶寮 翠" })).toHaveAttribute(
      "href",
      "/greenteas/1",
    );
    expect(screen.getByRole("link", { name: "下鴨神社" })).toHaveAttribute(
      "href",
      "/temples/3",
    );
  });

  it("削除は確認後に対応するリソースの admin DELETE を呼び一覧を再取得する", async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue({
      data: { railsJwt: "jwt-token" },
      status: "authenticated",
    });
    let deleteCalled = false;
    let listCalls = 0;
    server.use(
      http.get(endpoint("/admin/comments"), () => {
        listCalls += 1;
        return HttpResponse.json({
          comments: deleteCalled ? [comments[1]] : comments,
        });
      }),
      http.delete(endpoint("/admin/greenteacomments/101"), () => {
        deleteCalled = true;
        return HttpResponse.text(null, { status: 204 });
      }),
    );

    renderWithSwr(<CommentModerationList />);

    await screen.findByText("抹茶パフェが最高でした");

    const deleteButtons = screen.getAllByRole("button", { name: /削除/ });
    await user.click(deleteButtons[0]);

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /削除する/ }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    await waitFor(() =>
      expect(screen.queryByText("抹茶パフェが最高でした")).not.toBeInTheDocument(),
    );
    expect(listCalls).toBeGreaterThanOrEqual(2);
  });

  it("一覧取得が 401 だと signOut してログインへ誘導する", async () => {
    useSessionMock.mockReturnValue({
      data: { railsJwt: "jwt-token" },
      status: "authenticated",
    });
    server.use(
      http.get(endpoint("/admin/comments"), () =>
        HttpResponse.json({ error: "unauthorized" }, { status: 401 }),
      ),
    );

    renderWithSwr(<CommentModerationList />);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fadmin%2Fcomments",
    );
  });
});
