import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TempleForm from "@/components/admin/TempleForm";
import type { Area, Temple } from "@/types";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const createTempleMock = vi.fn();
const updateTempleMock = vi.fn();
const useSessionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/api/admin/temples", () => ({
  createTemple: (...args: unknown[]) => createTempleMock(...args),
  updateTemple: (...args: unknown[]) => updateTempleMock(...args),
}));

const areas: Area[] = [
  { id: 1, name: "東山区" },
  { id: 2, name: "左京区" },
];

beforeEach(() => {
  pushMock.mockReset();
  refreshMock.mockReset();
  createTempleMock.mockReset().mockResolvedValue({ temple: { id: 1 } });
  updateTempleMock.mockReset().mockResolvedValue({ temple: { id: 1 } });
  useSessionMock.mockReturnValue({
    data: { railsJwt: "jwt-token" },
    status: "authenticated",
  });
});

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/神社名/), "新神社");
  await user.type(screen.getByLabelText(/住所/), "京都市左京区");
  await user.type(screen.getByLabelText(/緯度/), "35.01");
  await user.type(screen.getByLabelText(/経度/), "135.77");
}

describe("TempleForm (create)", () => {
  it("必須を満たして送信すると createTemple が呼ばれ一覧へ遷移する", async () => {
    const user = userEvent.setup();
    render(<TempleForm areas={areas} mode="create" />);

    await fillRequired(user);
    await user.click(screen.getByLabelText("東山区"));
    await user.click(screen.getByRole("button", { name: "作成する" }));

    await waitFor(() => expect(createTempleMock).toHaveBeenCalledTimes(1));
    const [payload, token] = createTempleMock.mock.calls[0];
    expect(token).toBe("jwt-token");
    expect(payload).toMatchObject({
      name: "新神社",
      address: "京都市左京区",
      latitude: 35.01,
      longitude: 135.77,
      area_ids: [1],
    });
    expect(pushMock).toHaveBeenCalledWith("/admin/temples");
  });

  it("神社名が空だとバリデーションエラーになり API を呼ばない", async () => {
    const user = userEvent.setup();
    render(<TempleForm areas={areas} mode="create" />);

    // 住所・緯度・経度だけ埋めて神社名は空のまま
    await user.type(screen.getByLabelText(/住所/), "京都市左京区");
    await user.type(screen.getByLabelText(/緯度/), "35.01");
    await user.type(screen.getByLabelText(/経度/), "135.77");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(await screen.findByText("神社名は必須です")).toBeInTheDocument();
    expect(createTempleMock).not.toHaveBeenCalled();
  });

  it("緯度未入力だと必須エラーになる", async () => {
    const user = userEvent.setup();
    render(<TempleForm areas={areas} mode="create" />);

    await user.type(screen.getByLabelText(/神社名/), "新神社");
    await user.type(screen.getByLabelText(/住所/), "京都市左京区");
    await user.type(screen.getByLabelText(/経度/), "135.77");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(await screen.findByText("緯度を入力してください")).toBeInTheDocument();
    expect(createTempleMock).not.toHaveBeenCalled();
  });
});

describe("TempleForm (edit)", () => {
  const initial: Temple = {
    id: 5,
    name: "既存神社",
    description: "説明",
    address: "京都市東山区",
    access: "徒歩5分",
    phone_number: "075-000-0005",
    business_hours: "終日参拝可",
    holiday: "なし",
    homepage: "https://example.com",
    img: "https://example.com/x.png",
    latitude: 35.0,
    longitude: 135.77,
    areas: [areas[0]],
    likes_count: 3,
  };

  it("初期値が反映され、更新で updateTemple が id 付きで呼ばれる", async () => {
    const user = userEvent.setup();
    render(<TempleForm areas={areas} mode="edit" initial={initial} />);

    expect(screen.getByLabelText(/神社名/)).toHaveValue("既存神社");

    await user.clear(screen.getByLabelText(/神社名/));
    await user.type(screen.getByLabelText(/神社名/), "改名後");
    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => expect(updateTempleMock).toHaveBeenCalledTimes(1));
    const [id, payload, token] = updateTempleMock.mock.calls[0];
    expect(id).toBe(5);
    expect(token).toBe("jwt-token");
    expect(payload).toMatchObject({ name: "改名後", area_ids: [1] });
  });
});
