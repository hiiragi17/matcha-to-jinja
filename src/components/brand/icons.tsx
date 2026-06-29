// ブランドアイコン（インライン SVG・stroke ベース）。ロゴの線画と揃える。

type IconProps = {
  size?: number;
  color?: string;
  className?: string;
};

/** 鳥居（神社）。既定色は弁柄。 */
export function ToriiIcon({
  size = 32,
  color = "#905050",
  className,
}: IconProps) {
  const sw = 2.4;
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <line x1="2" y1="9" x2="30" y2="9" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" />
      <line x1="5" y1="14" x2="27" y2="14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <line x1="9" y1="9" x2="9" y2="29" stroke={color} strokeWidth={sw + 0.4} strokeLinecap="round" />
      <line x1="23" y1="9" x2="23" y2="29" stroke={color} strokeWidth={sw + 0.4} strokeLinecap="round" />
    </svg>
  );
}

/** 茶碗 + 茶筅（抹茶）。既定色は柳色。 */
export function ChawanIcon({
  size = 32,
  color = "#608060",
  className,
}: IconProps) {
  const sw = 2.4;
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M 5 13 Q 6 26, 16 28 Q 26 26, 27 13 Z" fill={color} fillOpacity="0.14" />
      <ellipse cx="16" cy="13" rx="11" ry="2.4" stroke={color} strokeWidth={sw} fill="none" />
      <path d="M 5 13 Q 6 26, 16 28 Q 26 26, 27 13" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
      <path d="M 11 13 Q 14 11.5, 17 12.5 T 21 12.7" stroke={color} strokeWidth={sw * 0.7} fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** 茶葉のペア（ロゴの葉に対応）。 */
export function Leaves({
  size = 40,
  color = "#608060",
  className,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 40 28"
      width={size}
      height={size * 0.7}
      className={className}
      aria-hidden="true"
    >
      <path d="M 4 18 Q 8 4, 22 6 Q 18 18, 4 18 Z" fill={color} opacity="0.85" />
      <path d="M 4 18 Q 12 12, 22 6" stroke="#fbf6e5" strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M 16 24 Q 22 10, 36 12 Q 32 24, 16 24 Z" fill={color} opacity="0.95" />
      <path d="M 16 24 Q 24 18, 36 12" stroke="#fbf6e5" strokeWidth="0.8" fill="none" opacity="0.5" />
    </svg>
  );
}
