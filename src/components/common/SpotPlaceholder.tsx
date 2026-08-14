import type { ReactNode } from "react";
import { latticeBackgroundStyle } from "./latticePattern";

type SpotPlaceholderProps = {
  name: string;
  icon: ReactNode;
  variant?: "matcha" | "shrine";
};

const backgroundClassByVariant: Record<
  NonNullable<SpotPlaceholderProps["variant"]>,
  string
> = {
  matcha: "bg-matcha-dark",
  shrine: "bg-bengara-dark",
};

// 画像未登録時のカードプレースホルダー。格子柄を敷き、店名/社寺名の頭文字を大きく見せる。
// variant で背景色を切り替える（抹茶店=緑、神社仏閣=赤/弁柄）。
export default function SpotPlaceholder({
  name,
  icon,
  variant = "matcha",
}: SpotPlaceholderProps) {
  const initial = [...name][0] ?? "";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${backgroundClassByVariant[variant]}`}
      style={latticeBackgroundStyle}
    >
      <span
        aria-hidden="true"
        className="font-mincho text-6xl font-semibold text-paper/90 sm:text-7xl"
      >
        {initial}
      </span>
      <span className="absolute bottom-2 right-2 opacity-60">{icon}</span>
    </div>
  );
}
