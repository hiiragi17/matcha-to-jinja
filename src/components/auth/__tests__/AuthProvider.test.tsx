import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AuthProvider from "@/components/auth/AuthProvider";

const sessionProviderProps = vi.fn();

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => {
    sessionProviderProps();
    return <div data-testid="session-provider">{children}</div>;
  },
}));

describe("AuthProvider", () => {
  it("SessionProvider で children をラップする", () => {
    render(
      <AuthProvider>
        <span>子要素</span>
      </AuthProvider>,
    );

    const provider = screen.getByTestId("session-provider");
    expect(provider).toBeInTheDocument();
    expect(provider).toContainElement(screen.getByText("子要素"));
    expect(sessionProviderProps).toHaveBeenCalledTimes(1);
  });
});
