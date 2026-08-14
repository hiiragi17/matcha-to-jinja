import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NearbySpotsList from "@/components/map/NearbySpotsList";
import type { NearbySpot } from "@/types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const spots: NearbySpot[] = [
  {
    id: 2,
    name: "八坂神社",
    latitude: 35.0036,
    longitude: 135.7786,
    distance_meters: 320,
  },
  {
    id: 3,
    name: "清水寺",
    latitude: 34.9948,
    longitude: 135.785,
    distance_meters: 1400,
  },
];

describe("NearbySpotsList", () => {
  it("spots が空なら何も表示しない", () => {
    const { container } = render(<NearbySpotsList spots={[]} kind="temple" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("各スポットの名前・距離・詳細リンクを表示する", () => {
    render(<NearbySpotsList spots={spots} kind="temple" />);

    expect(screen.getByText("八坂神社")).toBeInTheDocument();
    expect(screen.getByText("320m")).toBeInTheDocument();
    expect(screen.getByText("清水寺")).toBeInTheDocument();
    expect(screen.getByText("1.4km")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /八坂神社/ })).toHaveAttribute(
      "href",
      "/temples/2",
    );
    expect(screen.getByRole("link", { name: /清水寺/ })).toHaveAttribute(
      "href",
      "/temples/3",
    );
  });

  it("kind に応じてリンク先を切り替える", () => {
    render(<NearbySpotsList spots={spots} kind="greentea" />);

    expect(screen.getByRole("link", { name: /八坂神社/ })).toHaveAttribute(
      "href",
      "/greenteas/2",
    );
  });
});
