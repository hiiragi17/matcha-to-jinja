import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GreenteaList from "@/components/greentea/GreenteaList";
import type { Greentea } from "@/types";

const baseGreentea: Greentea = {
  id: 1,
  name: "中村藤吉本店",
  description: "宇治の老舗抹茶店。",
  address: "京都府宇治市宇治壱番10",
  access: "JR宇治駅から徒歩3分",
  phone_number: "0774-22-7800",
  business_hours: "10:00-17:00",
  holiday: "無休",
  homepage: "https://tokichi.jp",
  closed: false,
  img: "",
  latitude: 34.9,
  longitude: 135.8,
  genres: [],
  likes_count: 42,
};

describe("GreenteaList", () => {
  it("空配列なら見つからなかった旨を表示する", () => {
    render(<GreenteaList greenteas={[]} />);

    expect(
      screen.getByText("該当する抹茶店が見つかりませんでした。"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("要素があれば件数分のカードを一覧表示する", () => {
    const greenteas: Greentea[] = [
      { ...baseGreentea, id: 1, name: "中村藤吉本店" },
      { ...baseGreentea, id: 2, name: "茶寮都路里" },
    ];
    render(<GreenteaList greenteas={greenteas} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "中村藤吉本店" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "茶寮都路里" }),
    ).toBeInTheDocument();
  });
});
