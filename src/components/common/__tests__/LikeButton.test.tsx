import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LikeButton from "@/components/common/LikeButton";
import { server } from "@tests/msw/server";

const pushMock = vi.fn();
const useSessionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const endpoint = (path: string) => `${API_BASE_URL}/api/v1${path}`;

beforeEach(() => {
  pushMock.mockReset();
  useSessionMock.mockReset();
});

function mockLoggedIn() {
  useSessionMock.mockReturnValue({
    data: { railsJwt: "jwt-token" },
    status: "authenticated",
  });
}

function mockLoggedOut() {
  useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
}

describe("LikeButton", () => {
  it("未ログインでクリックすると /auth/login?callbackUrl=... に遷移する", async () => {
    mockLoggedOut();
    const user = userEvent.setup();
    render(
      <LikeButton
        kind="greentea"
        id={1}
        initialCount={3}
        initialLiked={false}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fgreenteas%2F1",
    );
  });

  it("ログイン済でクリックすると即座にカウントが +1 される（楽観的更新）", async () => {
    mockLoggedIn();
    server.use(
      http.post(endpoint("/greentea_likes"), async () => {
        await delay(20);
        return HttpResponse.json({
          greentea_like: { id: 99, greentea_id: 1, user_id: 1 },
        });
      }),
    );

    const user = userEvent.setup();
    render(
      <LikeButton
        kind="greentea"
        id={1}
        initialCount={3}
        initialLiked={false}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.click(screen.getByRole("button"));
    // 楽観的更新は startTransition より前で行われるので、即時に 4 が見える。
    expect(screen.getByRole("button")).toHaveTextContent("4");
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("API が 401 を返すとカウントがロールバックされ、ログイン誘導が走る", async () => {
    mockLoggedIn();
    server.use(
      http.post(endpoint("/greentea_likes"), () =>
        HttpResponse.json({ error: "unauthorized" }, { status: 401 }),
      ),
    );

    const user = userEvent.setup();
    render(
      <LikeButton
        kind="greentea"
        id={1}
        initialCount={3}
        initialLiked={false}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("3");
    });
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fgreenteas%2F1",
    );
  });

  it("API が 5xx を返すとカウントがロールバックされ、エラー表示が出て再押下可能になる", async () => {
    mockLoggedIn();
    server.use(
      http.post(endpoint("/greentea_likes"), () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    render(
      <LikeButton
        kind="greentea"
        id={1}
        initialCount={3}
        initialLiked={false}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("3");
    });
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("alert")).toHaveTextContent(/通信に失敗/);
    // pending が解除されてボタンが再押下可能
    await waitFor(() => {
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });

  it("連打しても二重リクエストが発生しない（pending 立ち上がり前の同期連打も弾く）", async () => {
    mockLoggedIn();
    let calls = 0;
    server.use(
      http.post(endpoint("/temple_likes"), async () => {
        calls += 1;
        await delay(50);
        return HttpResponse.json({
          temple_like: { id: 1, temple_id: 5, user_id: 1 },
        });
      }),
    );

    render(
      <LikeButton
        kind="temple"
        id={5}
        initialCount={0}
        initialLiked={false}
        callbackUrl="/temples/5"
      />,
    );

    const button = screen.getByRole("button");
    // disabled が React 再レンダで立ち上がる前の同一イベントループでの連打を踏ませる。
    // userEvent.click は await ごとに React のフラッシュを待つため、useTransition の
    // pending=true が反映された 2 回目以降のクリックは disabled で弾かれてしまい、
    // 「if (pending) return;」の早期 return ガード自体は通っていない。fireEvent で
    // 同期的に 3 連射し、内部ガードが効くことを確認する。
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
    expect(calls).toBe(1);
  });
});
