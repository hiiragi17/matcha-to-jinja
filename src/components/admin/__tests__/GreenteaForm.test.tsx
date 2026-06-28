import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GreenteaForm from "@/components/admin/GreenteaForm";
import type { Genre, Greentea } from "@/types";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const createGreenteaMock = vi.fn();
const updateGreenteaMock = vi.fn();
const useSessionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/api/admin/greenteas", () => ({
  createGreentea: (...args: unknown[]) => createGreenteaMock(...args),
  updateGreentea: (...args: unknown[]) => updateGreenteaMock(...args),
}));

const genres: Genre[] = [
  { id: 1, name: "パフェ" },
  { id: 2, name: "ドリンク" },
];

beforeEach(() => {
  pushMock.mockReset();
  refreshMock.mockReset();
  createGreenteaMock.mockReset().mockResolvedValue({ greentea: { id: 1 } });
  updateGreenteaMock.mockReset().mockResolvedValue({ greentea: { id: 1 } });
  useSessionMock.mockReturnValue({
    data: { railsJwt: "jwt-token" },
    status: "authenticated",
  });
});

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/店名/), "新店");
  await user.type(screen.getByLabelText(/住所/), "京都市中京区");
  await user.type(screen.getByLabelText(/緯度/), "35.01");
  await user.type(screen.getByLabelText(/経度/), "135.77");
}

describe("GreenteaForm (create)", () => {
  it("必須を満たして送信すると createGreentea が呼ばれ一覧へ遷移する", async () => {
    const user = userEvent.setup();
    render(<GreenteaForm genres={genres} mode="create" />);

    await fillRequired(user);
    await user.click(screen.getByLabelText("パフェ"));
    await user.click(screen.getByRole("button", { name: "作成する" }));

    await waitFor(() => expect(createGreenteaMock).toHaveBeenCalledTimes(1));
    const [payload, token] = createGreenteaMock.mock.calls[0];
    expect(token).toBe("jwt-token");
    expect(payload).toMatchObject({
      name: "新店",
      address: "京都市中京区",
      latitude: 35.01,
      longitude: 135.77,
      genre_ids: [1],
    });
    expect(pushMock).toHaveBeenCalledWith("/admin/greenteas");
  });

  it("店名が空だとバリデーションエラーになり API を呼ばない", async () => {
    const user = userEvent.setup();
    render(<GreenteaForm genres={genres} mode="create" />);

    // 住所・緯度・経度だけ埋めて店名は空のまま
    await user.type(screen.getByLabelText(/住所/), "京都市中京区");
    await user.type(screen.getByLabelText(/緯度/), "35.01");
    await user.type(screen.getByLabelText(/経度/), "135.77");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(await screen.findByText("店名は必須です")).toBeInTheDocument();
    expect(createGreenteaMock).not.toHaveBeenCalled();
  });

  it("緯度未入力だと必須エラーになる", async () => {
    const user = userEvent.setup();
    render(<GreenteaForm genres={genres} mode="create" />);

    await user.type(screen.getByLabelText(/店名/), "新店");
    await user.type(screen.getByLabelText(/住所/), "京都市中京区");
    await user.type(screen.getByLabelText(/経度/), "135.77");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(await screen.findByText("緯度を入力してください")).toBeInTheDocument();
    expect(createGreenteaMock).not.toHaveBeenCalled();
  });
});

describe("GreenteaForm (edit)", () => {
  const initial: Greentea = {
    id: 5,
    name: "既存店",
    description: "説明",
    address: "京都市東山区",
    access: "徒歩5分",
    phone_number: "075-000-0005",
    business_hours: "10:00-21:00",
    holiday: "不定休",
    homepage: "https://example.com",
    closed: false,
    img: "https://example.com/x.png",
    latitude: 35.0,
    longitude: 135.77,
    genres: [genres[0]],
    likes_count: 3,
  };

  it("初期値が反映され、更新で updateGreentea が id 付きで呼ばれる", async () => {
    const user = userEvent.setup();
    render(<GreenteaForm genres={genres} mode="edit" initial={initial} />);

    expect(screen.getByLabelText(/店名/)).toHaveValue("既存店");

    await user.clear(screen.getByLabelText(/店名/));
    await user.type(screen.getByLabelText(/店名/), "改名後");
    await user.click(screen.getByRole("button", { name: "更新する" }));

    await waitFor(() => expect(updateGreenteaMock).toHaveBeenCalledTimes(1));
    const [id, payload, token] = updateGreenteaMock.mock.calls[0];
    expect(id).toBe(5);
    expect(token).toBe("jwt-token");
    expect(payload).toMatchObject({ name: "改名後", genre_ids: [1] });
  });
});
