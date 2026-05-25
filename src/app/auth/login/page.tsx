import type { Metadata } from "next";
import ComingSoon from "@/components/common/ComingSoon";

export const metadata: Metadata = {
  title: "ログイン",
};

export default function LoginPage() {
  return (
    <ComingSoon
      title="ログイン"
      description="Twitter / LINE でのログインは現在準備中です。"
    />
  );
}
