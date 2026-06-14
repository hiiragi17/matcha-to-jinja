import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LikedSpotsList from "@/components/common/LikedSpotsList";
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

beforeEach(() => {
  useSessionMock.mockReset();
  pushMock.mockReset();
  signOutMock.mockReset();
  signOutMock.mockResolvedValue(undefined);
});

// SWR のグローバルキャッシュをテスト間で持ち越さないよう、毎回空 Map で包む。
function renderWithSwr(ui: ReactElement) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {ui}
    </SWRConfig>,
  );
}

describe("LikedSpotsList — マイページの CSR ガード", () => {
  it("未ログインでは「お気に入り一覧の表示にはログインが必要」案内とログインリンクを表示する", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<LikedSpotsList kind="greentea" />);

    expect(
      screen.getByText(/お気に入り一覧の表示にはログインが必要/),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /ログインへ/ });
    expect(link).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Fmypage%2Fgreentea-likes",
    );
  });

  it("temple 種別では callbackUrl が /mypage/temple-likes になる", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    render(<LikedSpotsList kind="temple" />);

    const link = screen.getByRole("link", { name: /ログインへ/ });
    expect(link).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Fmypage%2Ftemple-likes",
    );
  });

  it("一覧取得が 401 だと signOut してログインへ誘導する", async () => {
    useSessionMock.mockReturnValue({
      data: { railsJwt: "jwt-token" },
      status: "authenticated",
    });
    server.use(
      http.get(endpoint("/greentea_likes"), () =>
        HttpResponse.json({ error: "unauthorized" }, { status: 401 }),
      ),
    );

    renderWithSwr(<LikedSpotsList kind="greentea" />);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fmypage%2Fgreentea-likes",
    );
  });
});
