import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CommentSection from "@/components/common/CommentSection";
import { server } from "@tests/msw/server";
import { commentDeleted, writeError } from "@tests/msw/writeApiHandlers";
import type { Comment } from "@/types";

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

// window.confirm 等の vi.spyOn を確実に元に戻す。アサーション失敗で
// 各テスト末尾の mockRestore() に到達しなくても次テストにリークしない。
afterEach(() => {
  vi.restoreAllMocks();
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

const baseComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 1,
  body: "おいしかった",
  user: { id: 10, name: "ゲスト" },
  created_at: "2026-05-01T00:00:00Z",
  owned_by_current_user: false,
  ...overrides,
});

describe("CommentSection", () => {
  it("未ログインだとフォームが「ログインが必要」案内に置き換わる", () => {
    mockLoggedOut();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[]}
        callbackUrl="/greenteas/1"
      />,
    );

    expect(
      screen.getByText(/コメントの投稿にはログインが必要/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /コメントを書く/ }),
    ).not.toBeInTheDocument();
    const loginLink = screen.getByRole("link", { name: /ログインへ/ });
    expect(loginLink).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Fgreenteas%2F1",
    );
  });

  it("空白のみは送信ボタンが disabled", async () => {
    mockLoggedIn();
    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[]}
        callbackUrl="/greenteas/1"
      />,
    );

    const submit = screen.getByRole("button", { name: /投稿する/ });
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", { name: /コメントを書く/ }),
      "   ",
    );
    expect(submit).toBeDisabled();
  });

  it("500 文字超で文字数カウンタが警告色になり、送信ボタンが disabled になる", async () => {
    mockLoggedIn();
    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[]}
        callbackUrl="/greenteas/1"
      />,
    );

    const textarea = screen.getByRole("textbox", { name: /コメントを書く/ });
    await user.click(textarea);
    // userEvent.type は 500 文字で遅いので fireEvent 経由で一発入力する
    const longText = "あ".repeat(501);
    // React の制御コンポーネントへ value を直接流し込む
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(textarea, longText);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    const counter = screen.getByText(/501 \/ 500/);
    expect(counter).toHaveClass("text-bengara");
    expect(screen.getByRole("button", { name: /投稿する/ })).toBeDisabled();
  });

  it("投稿成功時はリスト先頭に追加される", async () => {
    mockLoggedIn();
    server.use(
      http.post(endpoint("/greenteacomments"), async ({ request }) => {
        const body = (await request.json()) as { body: string };
        return HttpResponse.json({
          comment: {
            id: 200,
            body: body.body,
            user: { id: 10, name: "わたし" },
            created_at: "2026-06-01T00:00:00Z",
          },
        });
      }),
    );

    const existing = baseComment({ id: 1, body: "既存コメント" });
    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[existing]}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /コメントを書く/ }),
      "新しい感想",
    );
    await user.click(screen.getByRole("button", { name: /投稿する/ }));

    await waitFor(() => {
      expect(screen.getByText("新しい感想")).toBeInTheDocument();
    });
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("新しい感想");
    expect(items[1]).toHaveTextContent("既存コメント");
  });

  it("投稿が 422 だとサーバーのバリデーションメッセージを表示する", async () => {
    mockLoggedIn();
    server.use(
      writeError("post", "greenteacomments", 422, {
        errors: ["本文を入力してください"],
      }),
    );

    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[]}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /コメントを書く/ }),
      "ng",
    );
    await user.click(screen.getByRole("button", { name: /投稿する/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "本文を入力してください",
      );
    });
    // 楽観追加していないので、リストは空のまま。
    expect(screen.getByText(/まだコメントはありません/)).toBeInTheDocument();
  });

  it("投稿が 401 だと signOut してログインへ誘導する", async () => {
    mockLoggedIn();
    server.use(writeError("post", "greenteacomments", 401));

    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[]}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /コメントを書く/ }),
      "感想",
    );
    await user.click(screen.getByRole("button", { name: /投稿する/ }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fgreenteas%2F1",
    );
  });

  it("自分のコメントだけ「削除」ボタンが表示される", () => {
    mockLoggedIn();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[
          baseComment({ id: 1, body: "他人", owned_by_current_user: false }),
          baseComment({ id: 2, body: "自分", owned_by_current_user: true }),
        ]}
        callbackUrl="/greenteas/1"
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).queryByRole("button", { name: /削除/ })).toBeNull();
    expect(
      within(items[1]).getByRole("button", { name: /削除/ }),
    ).toBeInTheDocument();
  });

  it("削除すると確認ダイアログ後にリストから消える", async () => {
    mockLoggedIn();
    server.use(commentDeleted("greentea"));

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[
          baseComment({ id: 2, body: "削除対象", owned_by_current_user: true }),
        ]}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.click(screen.getByRole("button", { name: /削除/ }));
    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.queryByText("削除対象")).not.toBeInTheDocument();
    });
    expect(screen.getByText(/まだコメントはありません/)).toBeInTheDocument();
  });

  it("確認ダイアログをキャンセルすると削除されない", async () => {
    mockLoggedIn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[
          baseComment({ id: 2, body: "残す", owned_by_current_user: true }),
        ]}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.click(screen.getByRole("button", { name: /削除/ }));
    expect(screen.getByText("残す")).toBeInTheDocument();
  });

  it("他人のコメント削除で 403 が返るとロールバックして権限エラーを表示する", async () => {
    mockLoggedIn();
    server.use(writeError("delete", "greenteacomments", 403));

    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[
          baseComment({ id: 2, body: "消せない", owned_by_current_user: true }),
        ]}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.click(screen.getByRole("button", { name: /削除/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/権限がありません/);
    });
    // ロールバックされ、コメントは残る。
    expect(screen.getByText("消せない")).toBeInTheDocument();
  });
});
