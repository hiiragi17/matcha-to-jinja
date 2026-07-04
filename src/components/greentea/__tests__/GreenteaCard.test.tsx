import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GreenteaCard from "@/components/greentea/GreenteaCard";
import type { Greentea } from "@/types";

const baseGreentea: Greentea = {
  id: 1,
  name: "中村藤吉本店",
  description: "宇治の老舗が営む抹茶スイーツ店。",
  address: "京都府宇治市宇治壱番10",
  access: "JR宇治駅から徒歩3分",
  phone_number: "0774-22-7800",
  business_hours: "10:00-17:00",
  holiday: "無休",
  homepage: "https://tokichi.jp",
  closed: false,
  img: "https://example.com/tokichi.jpg",
  latitude: 34.9,
  longitude: 135.8,
  genres: [
    { id: 1, name: "スイーツ" },
    { id: 3, name: "カフェ" },
  ],
  likes_count: 42,
};

describe("GreenteaCard", () => {
  it("詳細ページへのリンクになっている", () => {
    render(<GreenteaCard greentea={baseGreentea} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/greenteas/1",
    );
  });

  it("名前・説明・likes_count・ジャンルを表示する", () => {
    render(<GreenteaCard greentea={baseGreentea} />);

    expect(
      screen.getByRole("heading", { name: "中村藤吉本店" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("宇治の老舗が営む抹茶スイーツ店。"),
    ).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("スイーツ")).toBeInTheDocument();
    expect(screen.getByText("カフェ")).toBeInTheDocument();
  });

  it("img が指定されていればそのURLを表示する", () => {
    render(<GreenteaCard greentea={baseGreentea} />);

    expect(screen.getByRole("img", { name: "中村藤吉本店" })).toHaveAttribute(
      "src",
      "https://example.com/tokichi.jpg",
    );
  });

  it("img が空文字なら画像を表示しない", () => {
    render(<GreenteaCard greentea={{ ...baseGreentea, img: "" }} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("ジャンルが空でも壊れない", () => {
    render(<GreenteaCard greentea={{ ...baseGreentea, genres: [] }} />);

    expect(
      screen.getByRole("heading", { name: "中村藤吉本店" }),
    ).toBeInTheDocument();
  });
});
