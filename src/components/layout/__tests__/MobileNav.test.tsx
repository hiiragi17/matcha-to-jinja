import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MobileNav from "@/components/layout/MobileNav";

const useSessionMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

function getDetails() {
  return screen.getByLabelText("メニューを開く").closest("details")!;
}

beforeEach(() => {
  useSessionMock.mockReset();
  signOutMock.mockReset();
});

describe("MobileNav — ハンバーガーメニュー", () => {
  it("ナビゲーションリンクをクリックすると閉じる（別ページへ遷移してもメニューが開いたままにならない）", async () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    const user = userEvent.setup();
    render(<MobileNav />);

    const details = getDetails();
    details.open = true;
    expect(details.open).toBe(true);

    await user.click(screen.getByRole("link", { name: "抹茶スイーツ" }));

    expect(details.open).toBe(false);
  });

  it("未ログイン時、ログインリンクをクリックしても閉じる", async () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    const user = userEvent.setup();
    render(<MobileNav />);

    const details = getDetails();
    details.open = true;

    await user.click(screen.getByRole("link", { name: "ログイン" }));

    expect(details.open).toBe(false);
  });

  it("ログイン時、入れ子の UserMenu 内のボタンをクリックしても外側のメニューが閉じる", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "抹茶太郎" } },
      status: "authenticated",
    });
    const user = userEvent.setup();
    render(<MobileNav />);

    const details = getDetails();
    details.open = true;

    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    expect(details.open).toBe(false);
  });
});
