import type { Metadata } from "next";
import ComingSoon from "@/components/common/ComingSoon";

export const metadata: Metadata = {
  title: "現在地から探す",
};

export default function NearbyPage() {
  return (
    <ComingSoon
      title="現在地から探す"
      description="現在地周辺の抹茶店・神社を地図で探すページは現在準備中です。"
    />
  );
}
