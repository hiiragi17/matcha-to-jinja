import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { mutate as globalMutate, SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileEditForm from "@/components/auth/ProfileEditForm";
import { server } from "@tests/msw/server";

const useSessionMock = vi.fn();
const updateSessionMock = vi.fn();
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

const authedSession = {
  data: { railsJwt: "jwt-token" },
  status: "authenticated" as const,
  update: updateSessionMock,
};

beforeEach(() => {
  useSessionMock.mockReset();
  updateSessionMock.mockReset().mockResolvedValue(undefined);
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

describe("ProfileEditForm — マイページの CSR ガード", () => {
  it("未ログインでは案内とログインリンク（callbackUrl=/mypage/profile）を表示する", () => {
    useSessionMock.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: updateSessionMock,
    });

    render(<ProfileEditForm />);

    expect(
      screen.getByText(/プロフィールの編集にはログインが必要/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ログインへ/ })).toHaveAttribute(
      "href",
      "/auth/login?callbackUrl=%2Fmypage%2Fprofile",
    );
  });

  it("セッション解決中（loading）はログイン CTA を出さず読み込み中を表示する", () => {
    useSessionMock.mockReturnValue({
      data: null,
      status: "loading",
      update: updateSessionMock,
    });

    render(<ProfileEditForm />);

    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
    expect(
      screen.queryByText(/プロフィールの編集にはログインが必要/),
    ).not.toBeInTheDocument();
  });

  it("初期取得が 401 だと signOut してログインへ誘導する", async () => {
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/current_user"), () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    );

    renderWithSwr(<ProfileEditForm />);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fmypage%2Fprofile",
    );
  });

  it("401 以外の取得失敗では汎用エラーを表示し signOut しない", async () => {
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/current_user"), () =>
        HttpResponse.json({ error: "server error" }, { status: 500 }),
      ),
    );

    renderWithSwr(<ProfileEditForm />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /プロフィールの取得に失敗しました/,
    );
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("取得できた現在の表示名をフォームに反映する", async () => {
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/current_user"), () =>
        HttpResponse.json({
          user: { id: 1, name: "現在の名前", role: "general" },
        }),
      ),
    );

    renderWithSwr(<ProfileEditForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/表示名/)).toHaveValue("現在の名前");
    });
  });

  it("編集中（未保存）はバックグラウンド再検証で入力値が上書きされない", async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/current_user"), () =>
        HttpResponse.json({
          user: { id: 1, name: "サーバー側の名前", role: "general" },
        }),
      ),
    );

    // このテストだけは SWR のデフォルトキャッシュを使い、`mutate` で
    // ウィンドウフォーカス復帰等によるバックグラウンド再検証を模す
    // （isolated Map だと外部から同じキーで mutate できないため）。
    render(<ProfileEditForm />);
    await waitFor(() =>
      expect(screen.getByLabelText(/表示名/)).toHaveValue("サーバー側の名前"),
    );

    await user.clear(screen.getByLabelText(/表示名/));
    await user.type(screen.getByLabelText(/表示名/), "入力中の値");

    await globalMutate(["/current_user", "jwt-token"]);

    expect(screen.getByLabelText(/表示名/)).toHaveValue("入力中の値");
  });

  it("表示名を空にして送信するとバリデーションエラーになり API を呼ばない", async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue(authedSession);
    let patchCalled = false;
    server.use(
      http.get(endpoint("/current_user"), () =>
        HttpResponse.json({
          user: { id: 1, name: "現在の名前", role: "general" },
        }),
      ),
      http.patch(endpoint("/current_user"), () => {
        patchCalled = true;
        return HttpResponse.json({
          user: { id: 1, name: "", role: "general" },
        });
      }),
    );

    renderWithSwr(<ProfileEditForm />);
    await waitFor(() =>
      expect(screen.getByLabelText(/表示名/)).toHaveValue("現在の名前"),
    );

    await user.clear(screen.getByLabelText(/表示名/));
    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    expect(await screen.findByText("表示名は必須です")).toBeInTheDocument();
    expect(patchCalled).toBe(false);
  });

  it("保存に成功すると PATCH を送り、成功メッセージを表示しセッションを更新する", async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue(authedSession);
    let receivedBody: unknown = null;
    server.use(
      http.get(endpoint("/current_user"), () =>
        HttpResponse.json({
          user: { id: 1, name: "旧名前", role: "general" },
        }),
      ),
      http.patch(endpoint("/current_user"), async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          user: { id: 1, name: "新しい名前", role: "general" },
        });
      }),
    );

    renderWithSwr(<ProfileEditForm />);
    await waitFor(() =>
      expect(screen.getByLabelText(/表示名/)).toHaveValue("旧名前"),
    );

    await user.clear(screen.getByLabelText(/表示名/));
    await user.type(screen.getByLabelText(/表示名/), "新しい名前");
    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    expect(
      await screen.findByText("プロフィールを更新しました。"),
    ).toBeInTheDocument();
    expect(receivedBody).toEqual({ user: { name: "新しい名前" } });
    expect(updateSessionMock).toHaveBeenCalledWith({ name: "新しい名前" });
  });

  it("PATCH は成功したがセッション更新が失敗しても、保存成功として表示する", async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    useSessionMock.mockReturnValue(authedSession);
    updateSessionMock.mockRejectedValue(new Error("network down"));
    server.use(
      http.get(endpoint("/current_user"), () =>
        HttpResponse.json({
          user: { id: 1, name: "旧名前", role: "general" },
        }),
      ),
      http.patch(endpoint("/current_user"), () =>
        HttpResponse.json({
          user: { id: 1, name: "新しい名前", role: "general" },
        }),
      ),
    );

    renderWithSwr(<ProfileEditForm />);
    await waitFor(() =>
      expect(screen.getByLabelText(/表示名/)).toHaveValue("旧名前"),
    );

    await user.clear(screen.getByLabelText(/表示名/));
    await user.type(screen.getByLabelText(/表示名/), "新しい名前");
    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    expect(
      await screen.findByText("プロフィールを更新しました。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/保存に失敗しました/),
    ).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("保存が 422 だとサーバーのエラーメッセージを表示する", async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/current_user"), () =>
        HttpResponse.json({
          user: { id: 1, name: "旧名前", role: "general" },
        }),
      ),
      http.patch(endpoint("/current_user"), () =>
        HttpResponse.json({ error: "Name can't be blank" }, { status: 422 }),
      ),
    );

    renderWithSwr(<ProfileEditForm />);
    await waitFor(() =>
      expect(screen.getByLabelText(/表示名/)).toHaveValue("旧名前"),
    );

    await user.clear(screen.getByLabelText(/表示名/));
    await user.type(screen.getByLabelText(/表示名/), "x");
    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    expect(await screen.findByText("Name can't be blank")).toBeInTheDocument();
    expect(updateSessionMock).not.toHaveBeenCalled();
  });

  it("保存が 401 だと signOut してログインへ誘導する", async () => {
    const user = userEvent.setup();
    useSessionMock.mockReturnValue(authedSession);
    server.use(
      http.get(endpoint("/current_user"), () =>
        HttpResponse.json({
          user: { id: 1, name: "旧名前", role: "general" },
        }),
      ),
      http.patch(endpoint("/current_user"), () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    );

    renderWithSwr(<ProfileEditForm />);
    await waitFor(() =>
      expect(screen.getByLabelText(/表示名/)).toHaveValue("旧名前"),
    );

    await user.clear(screen.getByLabelText(/表示名/));
    await user.type(screen.getByLabelText(/表示名/), "x");
    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fmypage%2Fprofile",
    );
  });
});
