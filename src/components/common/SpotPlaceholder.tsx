import type { ReactNode } from "react";
import { latticeBackgroundStyle } from "./latticePattern";

type SpotPlaceholderProps = {
  name: string;
  icon: ReactNode;
};

// 画像未登録時のカードプレースホルダー。緑地に格子柄を敷き、店名/社寺名の頭文字を大きく見せる。
export default function SpotPlaceholder({ name, icon }: SpotPlaceholderProps) {
  const initial = [...name][0] ?? "";

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-matcha-dark"
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
