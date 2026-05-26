import Image from "next/image";

// 確定ロゴ（ワードマーク）。差し替え禁止。背景に応じて variant を使い分ける。
const SOURCES = {
  full: { src: "/brand/logo.png", ratio: 1772 / 1692 },
  compact: { src: "/brand/logo2.png", ratio: 886 / 846 },
} as const;

type LogoProps = {
  variant?: keyof typeof SOURCES;
  /** 高さ(px)。幅はアスペクト比から自動算出。 */
  size?: number;
  priority?: boolean;
  className?: string;
};

export default function Logo({
  variant = "full",
  size = 200,
  priority = false,
  className,
}: LogoProps) {
  const { src, ratio } = SOURCES[variant];
  const width = Math.round(size * ratio);
  return (
    <Image
      src={src}
      alt="抹茶と神社。"
      width={width}
      height={size}
      priority={priority}
      className={className}
      style={{ height: size, width: "auto" }}
    />
  );
}
