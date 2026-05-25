import type { Metadata } from "next";
import ComingSoon from "@/components/common/ComingSoon";

export const metadata: Metadata = {
  title: "神社の詳細",
};

export default function TempleDetailPage() {
  return (
    <ComingSoon
      title="神社の詳細"
      description="神社仏閣の詳細ページは現在準備中です。"
    />
  );
}
