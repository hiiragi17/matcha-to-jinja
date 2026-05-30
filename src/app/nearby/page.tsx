import type { Metadata } from "next";
import Hairline from "@/components/brand/Hairline";
import NearbyMap from "@/components/map/NearbyMap";

export const metadata: Metadata = {
  title: "現在地から探す",
  description:
    "現在地から徒歩圏内の抹茶スイーツ店と神社仏閣を地図で探せます。半径を切り替えて、近くのお茶と神社をひと目に。",
};

export default function NearbyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex flex-col items-center text-center">
        <p className="font-sans-jp text-xs tracking-[0.3em] text-bengara">
          NEARBY
        </p>
        <h1 className="mt-3 font-mincho text-3xl tracking-[0.1em] text-ink sm:text-4xl">
          現在地から探す
        </h1>
        <Hairline width={48} className="mt-4" />
        <p className="mt-5 max-w-2xl font-serif-jp text-sm leading-relaxed text-muted sm:text-base">
          ブラウザの位置情報を使って、いまいる場所のまわりの抹茶店と神社仏閣を地図に並べます。
          鳥居マークが神社、茶碗マークが抹茶店です。
        </p>
      </header>
      <NearbyMap />
    </div>
  );
}
