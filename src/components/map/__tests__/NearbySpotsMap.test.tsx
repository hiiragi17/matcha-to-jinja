import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import NearbySpotsMap from "@/components/map/NearbySpotsMap";
import type { NearbySpot } from "@/types";
import { resetGoogleMapsMock } from "@tests/mocks/googleMaps";
import { vi } from "vitest";

vi.mock("@vis.gl/react-google-maps", () => import("@tests/mocks/googleMaps"));

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

const origin = { lat: 35.0036, lng: 135.7714, name: "茶寮都路里" };

const spots: NearbySpot[] = [
  {
    id: 2,
    name: "八坂神社",
    latitude: 35.0036,
    longitude: 135.7786,
    distance_meters: 320,
  },
];

beforeEach(() => {
  resetGoogleMapsMock();
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("NearbySpotsMap", () => {
  it("API キー未設定なら設定エラーを表示し、地図は表示しない", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");

    render(
      <NearbySpotsMap
        origin={origin}
        spots={spots}
        kind="temple"
        emptyMessage="近隣に登録された神社仏閣はありません。"
      />,
    );

    expect(
      screen.getByText(/Google Maps の API キー設定が必要です/),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });

  it("spots が空なら emptyMessage を表示し、地図は表示しない", () => {
    render(
      <NearbySpotsMap
        origin={origin}
        spots={[]}
        kind="temple"
        emptyMessage="近隣に登録された神社仏閣はありません。"
      />,
    );

    expect(
      screen.getByText("近隣に登録された神社仏閣はありません。"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });

  it("origin と spots のマーカーを表示する", () => {
    render(
      <NearbySpotsMap
        origin={origin}
        spots={spots}
        kind="temple"
        emptyMessage="近隣に登録された神社仏閣はありません。"
      />,
    );

    const markers = screen.getAllByTestId("advanced-marker");
    // origin(1件) + spots(1件)
    expect(markers).toHaveLength(2);
    expect(markers[1]).toHaveAttribute("title", "八坂神社");
  });

  it("マーカーをクリックすると詳細リンク付きの InfoWindow が開く", async () => {
    const user = userEvent.setup();
    render(
      <NearbySpotsMap
        origin={origin}
        spots={spots}
        kind="temple"
        emptyMessage="近隣に登録された神社仏閣はありません。"
      />,
    );

    const markers = screen.getAllByTestId("advanced-marker");
    await user.click(markers[1]);

    expect(screen.getByText("八坂神社")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /詳細を見る/ })).toHaveAttribute(
      "href",
      "/temples/2",
    );
  });
});
