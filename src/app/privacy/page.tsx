import type { Metadata } from "next";
import ComingSoon from "@/components/common/ComingSoon";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <ComingSoon
      title="プライバシーポリシー"
      description="プライバシーポリシーページは現在準備中です。"
    />
  );
}
