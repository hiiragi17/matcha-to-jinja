import type { Metadata } from "next";
import ComingSoon from "@/components/common/ComingSoon";

export const metadata: Metadata = {
  title: "抹茶店の詳細",
};

export default function GreenteaDetailPage() {
  return (
    <ComingSoon
      title="抹茶店の詳細"
      description="抹茶店の詳細ページは現在準備中です。"
    />
  );
}
