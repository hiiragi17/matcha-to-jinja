import type { Metadata } from "next";
import ComingSoon from "@/components/common/ComingSoon";

export const metadata: Metadata = {
  title: "抹茶店",
};

export default function GreenteasPage() {
  return (
    <ComingSoon
      title="抹茶店一覧"
      description="京都の抹茶スイーツ店一覧ページは現在準備中です。"
    />
  );
}
