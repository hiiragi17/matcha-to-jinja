import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TempleList from "@/components/temple/TempleList";
import type { Temple } from "@/types";

const baseTemple: Temple = {
  id: 1,
  name: "伏見稲荷大社",
  description: "千本鳥居で知られる神社。",
  address: "京都府京都市伏見区深草藪之内町68",
  access: "JR稲荷駅すぐ",
  phone_number: "075-641-7331",
  business_hours: "24時間",
  holiday: "無休",
  homepage: "https://inari.jp",
  img: "",
  latitude: 34.9,
  longitude: 135.7,
  areas: [],
  likes_count: 88,
};

describe("TempleList", () => {
  it("空配列なら見つからなかった旨を表示する", () => {
    render(<TempleList temples={[]} />);

    expect(
      screen.getByText("該当する神社仏閣が見つかりませんでした。"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("要素があれば件数分のカードを一覧表示する", () => {
    const temples: Temple[] = [
      { ...baseTemple, id: 1, name: "伏見稲荷大社" },
      { ...baseTemple, id: 2, name: "清水寺" },
    ];
    render(<TempleList temples={temples} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "伏見稲荷大社" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "清水寺" }),
    ).toBeInTheDocument();
  });
});
