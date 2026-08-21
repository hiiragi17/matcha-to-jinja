import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CommentSection from "@/components/common/CommentSection";
import { server } from "@tests/msw/server";
import {
  commentCreated,
  commentDeleted,
  writeError,
} from "@tests/msw/writeApiHandlers";
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
      screen.getByText(/口コミの投稿にはログインが必要/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /口コミを書く/ }),
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
      screen.getByRole("textbox", { name: /口コミを書く/ }),
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

    const textarea = screen.getByRole("textbox", { name: /口コミを書く/ });
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

    const existing = baseComment({ id: 1, body: "既存口コミ" });
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
      screen.getByRole("textbox", { name: /口コミを書く/ }),
      "新しい感想",
    );
    await user.click(screen.getByRole("button", { name: /投稿する/ }));

    await waitFor(() => {
      expect(screen.getByText("新しい感想")).toBeInTheDocument();
    });
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("新しい感想");
    expect(items[1]).toHaveTextContent("既存口コミ");
    expect(screen.getByRole("textbox", { name: /口コミを書く/ })).toHaveValue("");
  });

  // Rails 側がルートキーを `comment` ではなく `data` で返していたため、
  // 投稿直後に本文・投稿日時が空の「匿名ユーザー」カードが並ぶ不具合があった。
  it("投稿レスポンスから口コミ本体を取り出せないときは空カードを追加しない", async () => {
    mockLoggedIn();
    server.use(
      http.post(endpoint("/greenteacomments"), () =>
        HttpResponse.json({
          data: {
            id: 200,
            body: "抹茶パフェ",
            user: { id: 10, name: "わたし" },
            created_at: "2026-06-01T00:00:00Z",
          },
        }),
      ),
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
      screen.getByRole("textbox", { name: /口コミを書く/ }),
      "抹茶パフェ",
    );
    await user.click(screen.getByRole("button", { name: /投稿する/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "表示の更新に失敗しました",
    );
    expect(screen.queryByText("匿名ユーザー")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  // id はあるが本文・投稿日時が欠けたレスポンスでも、空カードを並べない。
  it("投稿レスポンスの口コミに必須フィールドが欠けていても空カードを追加しない", async () => {
    mockLoggedIn();
    server.use(
      http.post(endpoint("/greenteacomments"), () =>
        HttpResponse.json({ comment: { id: 200 } }),
      ),
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
      screen.getByRole("textbox", { name: /口コミを書く/ }),
      "抹茶パフェ",
    );
    await user.click(screen.getByRole("button", { name: /投稿する/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "表示の更新に失敗しました",
    );
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
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
      screen.getByRole("textbox", { name: /口コミを書く/ }),
      "ng",
    );
    await user.click(screen.getByRole("button", { name: /投稿する/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "本文を入力してください",
      );
    });
    // 楽観追加していないので、リストは空のまま。
    expect(screen.getByText(/まだ口コミはありません/)).toBeInTheDocument();
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
      screen.getByRole("textbox", { name: /口コミを書く/ }),
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

  it("自分の口コミだけ「削除」ボタンが表示される", () => {
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
    expect(screen.getByText(/まだ口コミはありません/)).toBeInTheDocument();
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

  it("他人の口コミ削除で 403 が返るとロールバックして権限エラーを表示する", async () => {
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
    // ロールバックされ、口コミは残る。
    expect(screen.getByText("消せない")).toBeInTheDocument();
  });

  it("投稿が 5xx だと汎用エラーを表示しリストは変わらない", async () => {
    mockLoggedIn();
    server.use(writeError("post", "greenteacomments", 500));

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
      screen.getByRole("textbox", { name: /口コミを書く/ }),
      "感想",
    );
    await user.click(screen.getByRole("button", { name: /投稿する/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/投稿に失敗しました/);
    });
    expect(signOutMock).not.toHaveBeenCalled();
    expect(screen.getByText(/まだ口コミはありません/)).toBeInTheDocument();
  });

  it("削除が 5xx だとロールバックして汎用エラーを表示する", async () => {
    mockLoggedIn();
    server.use(writeError("delete", "greenteacomments", 500));

    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[
          baseComment({ id: 2, body: "消えない", owned_by_current_user: true }),
        ]}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.click(screen.getByRole("button", { name: /削除/ }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/削除に失敗しました/);
    });
    expect(screen.getByText("消えない")).toBeInTheDocument();
  });

  it("削除が 401 だと signOut してログインへ誘導する", async () => {
    mockLoggedIn();
    server.use(writeError("delete", "greenteacomments", 401));

    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[
          baseComment({ id: 2, body: "対象", owned_by_current_user: true }),
        ]}
        callbackUrl="/greenteas/1"
      />,
    );

    await user.click(screen.getByRole("button", { name: /削除/ }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fgreenteas%2F1",
    );
  });

  it("temple 種別でも投稿が templecomments API 経由でリスト先頭に追加される", async () => {
    mockLoggedIn();
    server.use(commentCreated("temple"));

    const user = userEvent.setup();
    render(
      <CommentSection
        kind="temple"
        targetId={3}
        initialComments={[baseComment({ id: 1, body: "既存" })]}
        callbackUrl="/temples/3"
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /口コミを書く/ }),
      "神社の感想",
    );
    await user.click(screen.getByRole("button", { name: /投稿する/ }));

    await waitFor(() => {
      expect(screen.getByText("神社の感想")).toBeInTheDocument();
    });
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("神社の感想");
  });

  it("temple 種別でも自分の口コミを templecomments API 経由で削除できる", async () => {
    mockLoggedIn();
    server.use(commentDeleted("temple"));

    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <CommentSection
        kind="temple"
        targetId={3}
        initialComments={[
          baseComment({ id: 2, body: "削除対象", owned_by_current_user: true }),
        ]}
        callbackUrl="/temples/3"
      />,
    );

    await user.click(screen.getByRole("button", { name: /削除/ }));

    await waitFor(() => {
      expect(screen.queryByText("削除対象")).not.toBeInTheDocument();
    });
  });

  it("不正な日付でも例外を投げず元の文字列を表示する", () => {
    mockLoggedIn();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[
          baseComment({ id: 1, body: "日付おかしい", created_at: "not-a-date" }),
        ]}
        callbackUrl="/greenteas/1"
      />,
    );

    expect(screen.getByText("日付おかしい")).toBeInTheDocument();
  });

  it("投稿者が欠落した口コミ（user: null）でもクラッシュせず「匿名ユーザー」と表示する", () => {
    mockLoggedIn();
    render(
      <CommentSection
        kind="greentea"
        targetId={1}
        initialComments={[
          baseComment({ id: 1, body: "投稿者不明", user: null }),
        ]}
        callbackUrl="/greenteas/1"
      />,
    );

    expect(screen.getByText("投稿者不明")).toBeInTheDocument();
    expect(screen.getByText("匿名ユーザー")).toBeInTheDocument();
  });
});
