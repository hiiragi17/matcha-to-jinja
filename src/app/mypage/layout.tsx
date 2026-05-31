import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "マイページ",
};

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return children;
}
