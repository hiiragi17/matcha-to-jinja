import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";

const pushMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

beforeEach(() => {
  pushMock.mockReset();
  signOutMock.mockReset();
  signOutMock.mockResolvedValue(undefined);
});

describe("useSessionExpiredHandler", () => {
  it("signOut(redirect:false) を呼んでから callbackUrl 付きでログインへ push する", async () => {
    const { result } = renderHook(() =>
      useSessionExpiredHandler("/greenteas/1"),
    );

    await result.current();

    expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fgreenteas%2F1",
    );
  });

  it("callbackUrl をエンコードして付与する", async () => {
    const { result } = renderHook(() =>
      useSessionExpiredHandler("/mypage/temple-likes?tab=a&b=c"),
    );

    await result.current();

    expect(pushMock).toHaveBeenCalledWith(
      "/auth/login?callbackUrl=%2Fmypage%2Ftemple-likes%3Ftab%3Da%26b%3Dc",
    );
  });
});
