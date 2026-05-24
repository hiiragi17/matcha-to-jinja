import type { Metadata } from "next";
import ComingSoon from "@/components/common/ComingSoon";

export const metadata: Metadata = {
  title: "神社",
};

export default function TemplesPage() {
  return (
    <ComingSoon
      title="神社一覧"
      description="京都の神社仏閣一覧ページは現在準備中です。"
    />
  );
}
