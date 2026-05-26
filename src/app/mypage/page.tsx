import type { Metadata } from "next";
import ComingSoon from "@/components/common/ComingSoon";

export const metadata: Metadata = {
  title: "マイページ",
};

export default function MyPage() {
  return (
    <ComingSoon
      title="マイページ"
      description="お気に入りや投稿をまとめるマイページは現在準備中です。"
    />
  );
}
