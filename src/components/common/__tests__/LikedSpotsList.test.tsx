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

const greenteaLike = {
  id: 11,
  greentea: {
    id: 1,
    name: "中村藤吉本店",
    description: "宇治の老舗。",
    address: "京都府宇治市",
    access: "JR宇治駅",
    phone_number: "0774-22-7800",
    business_hours: "10:00-17:00",
    holiday: "無休",
    homepage: "https://tokichi.jp",
    closed: false,
    img: "",
    latitude: 34.9,
    longitude: 135.8,
    genres: [],
    likes_count: 42,
  },
};

const templeLike = {
  id: 21,
  temple: {
    id: 1,
    name: "伏見稲荷大社",
    description: "千本鳥居。",
    address: "京都府京都市伏見区",
    access: "JR稲荷駅",
    phone_number: "075-641-7331",
    business_hours: "24時間",
    holiday: "無休",
    homepage: "https://inari.jp",
    img: "",
    latitude: 34.9,
    longitude: 135.7,
    areas: [],
    likes_count: 88,
  },
};

const authedSession = {
  data: { railsJwt: "jwt-token" },
  status: "authenticated" as const,
};

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

  it("greentea のお気に入りが空なら空メッセージを表示する", async () => {
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/greentea_likes"), () =>
        HttpResponse.json({ greentea_likes: [] }),
      ),
    );

    renderWithSwr(<LikedSpotsList kind="greentea" />);

    expect(
      await screen.findByText(/お気に入りに追加した抹茶店はまだありません/),
    ).toBeInTheDocument();
  });

  it("greentea のお気に入り一覧を GreenteaCard で表示する", async () => {
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/greentea_likes"), () =>
        HttpResponse.json({ greentea_likes: [greenteaLike] }),
      ),
    );

    renderWithSwr(<LikedSpotsList kind="greentea" />);

    expect(
      await screen.findByRole("heading", { name: "中村藤吉本店" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/greenteas/1");
  });

  it("temple のお気に入りが空なら空メッセージを表示する", async () => {
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/temple_likes"), () =>
        HttpResponse.json({ temple_likes: [] }),
      ),
    );

    renderWithSwr(<LikedSpotsList kind="temple" />);

    expect(
      await screen.findByText(/お気に入りに追加した神社仏閣はまだありません/),
    ).toBeInTheDocument();
  });

  it("temple のお気に入り一覧を TempleCard で表示する", async () => {
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/temple_likes"), () =>
        HttpResponse.json({ temple_likes: [templeLike] }),
      ),
    );

    renderWithSwr(<LikedSpotsList kind="temple" />);

    expect(
      await screen.findByRole("heading", { name: "伏見稲荷大社" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/temples/1");
  });

  it("401 以外の取得失敗では汎用エラーを表示し signOut しない", async () => {
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/greentea_likes"), () =>
        HttpResponse.json({ error: "server error" }, { status: 500 }),
      ),
    );

    renderWithSwr(<LikedSpotsList kind="greentea" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /お気に入りの取得に失敗しました/,
    );
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
