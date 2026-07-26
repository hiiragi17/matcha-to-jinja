import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MockLoginForm from "@/components/auth/MockLoginForm";

const signInMock = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

beforeEach(() => {
  signInMock.mockReset();
  signInMock.mockResolvedValue(undefined);
});

describe("MockLoginForm", () => {
  it("入力した表示名で mock provider にサインインする", async () => {
    const user = userEvent.setup();
    render(<MockLoginForm />);

    await user.type(screen.getByLabelText(/表示名/), "抹茶太郎");
    await user.click(screen.getByRole("button", { name: "モックでログイン" }));

    expect(signInMock).toHaveBeenCalledWith("mock", {
      name: "抹茶太郎",
      redirectTo: "/mypage",
    });
  });

  it("表示名が未入力でも送信でき、既定の遷移先は /mypage", async () => {
    const user = userEvent.setup();
    render(<MockLoginForm />);

    await user.click(screen.getByRole("button", { name: "モックでログイン" }));

    expect(signInMock).toHaveBeenCalledWith("mock", {
      name: "",
      redirectTo: "/mypage",
    });
  });

  it("redirectTo を渡すとその遷移先でサインインする", async () => {
    const user = userEvent.setup();
    render(<MockLoginForm redirectTo="/routes" />);

    await user.click(screen.getByRole("button", { name: "モックでログイン" }));

    expect(signInMock).toHaveBeenCalledWith("mock", {
      name: "",
      redirectTo: "/routes",
    });
  });

  it("送信中はボタンを無効化し、完了後に戻す", async () => {
    const user = userEvent.setup();
    let resolveSignIn: () => void = () => {};
    signInMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    render(<MockLoginForm />);

    await user.click(screen.getByRole("button", { name: "モックでログイン" }));

    const pendingButton = screen.getByRole("button", { name: "ログイン中…" });
    expect(pendingButton).toBeDisabled();

    resolveSignIn();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "モックでログイン" }),
      ).toBeEnabled();
    });
    expect(signInMock).toHaveBeenCalledTimes(1);
  });

  it("表示名の入力は 32 文字までに制限する", () => {
    render(<MockLoginForm />);

    expect(screen.getByLabelText(/表示名/)).toHaveAttribute("maxLength", "32");
  });
});
