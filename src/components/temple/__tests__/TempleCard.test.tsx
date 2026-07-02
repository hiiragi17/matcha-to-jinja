import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TempleCard from "@/components/temple/TempleCard";
import { NO_IMAGE_PLACEHOLDER } from "@/lib/utils/image";
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
  img: "https://example.com/inari.jpg",
  latitude: 34.9,
  longitude: 135.7,
  areas: [
    { id: 1, name: "伏見" },
    { id: 2, name: "東山" },
  ],
  likes_count: 88,
};

describe("TempleCard", () => {
  it("詳細ページへのリンクになっている", () => {
    render(<TempleCard temple={baseTemple} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/temples/1");
  });

  it("名前・説明・likes_count・エリアを表示する", () => {
    render(<TempleCard temple={baseTemple} />);

    expect(
      screen.getByRole("heading", { name: "伏見稲荷大社" }),
    ).toBeInTheDocument();
    expect(screen.getByText("千本鳥居で知られる神社。")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText("伏見")).toBeInTheDocument();
    expect(screen.getByText("東山")).toBeInTheDocument();
  });

  it("img が指定されていればそのURLを表示する", () => {
    render(<TempleCard temple={baseTemple} />);

    expect(screen.getByRole("img", { name: "伏見稲荷大社" })).toHaveAttribute(
      "src",
      "https://example.com/inari.jpg",
    );
  });

  it("img が空文字ならプレースホルダ画像を表示する", () => {
    render(<TempleCard temple={{ ...baseTemple, img: "" }} />);

    expect(screen.getByRole("img", { name: "伏見稲荷大社" })).toHaveAttribute(
      "src",
      NO_IMAGE_PLACEHOLDER,
    );
  });

  it("エリアが空でも壊れない", () => {
    render(<TempleCard temple={{ ...baseTemple, areas: [] }} />);

    expect(
      screen.getByRole("heading", { name: "伏見稲荷大社" }),
    ).toBeInTheDocument();
  });
});
