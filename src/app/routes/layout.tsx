import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "モデルコース",
  description:
    "お気に入りの抹茶スイーツ店と神社仏閣を組み合わせて、自分だけの京都モデルコースを作成できます。",
};

export default function RoutesLayout({ children }: { children: ReactNode }) {
  return children;
}
