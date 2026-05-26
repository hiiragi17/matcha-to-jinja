// 和柄パターン（SVG <pattern>）。背景画像にせずインライン化し、色・サイズ・透明度を制御する。

type PatternProps = {
  id: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
};

/** 麻の葉（六角＋星）。 */
export function AsanohaPattern({
  id,
  size = 48,
  color = "#706020",
  strokeWidth = 1,
  opacity = 1,
}: PatternProps) {
  const w = size;
  const h = size * 0.866;
  const cx = w / 2;
  const cy = h / 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    pts.push([cx + (w / 2) * Math.cos(a), cy + (w / 2) * Math.sin(a)]);
  }
  return (
    <pattern id={id} width={size} height={h} patternUnits="userSpaceOnUse">
      <g stroke={color} strokeWidth={strokeWidth} fill="none" opacity={opacity}>
        <polygon points={pts.map((p) => p.join(",")).join(" ")} />
        {pts.map(([x, y], i) => (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} />
        ))}
      </g>
    </pattern>
  );
}

/** 青海波（波模様）。 */
export function SeigaihaPattern({
  id,
  size = 56,
  color = "#706020",
  strokeWidth = 1,
  opacity = 1,
}: PatternProps) {
  const r = size / 2;
  return (
    <pattern id={id} width={size} height={size / 2} patternUnits="userSpaceOnUse">
      <g fill="none" stroke={color} strokeWidth={strokeWidth} opacity={opacity}>
        {[r * 1, r * 0.78, r * 0.56, r * 0.34].map((rr, i) => (
          <g key={i}>
            <path d={`M 0 ${r / 2} A ${rr} ${rr} 0 0 1 ${size} ${r / 2}`} />
            <path d={`M -${r} ${r / 2} A ${rr} ${rr} 0 0 1 ${r} ${r / 2}`} />
            <path d={`M ${r} ${r / 2} A ${rr} ${rr} 0 0 1 ${3 * r} ${r / 2}`} />
          </g>
        ))}
      </g>
    </pattern>
  );
}

type BackgroundProps = Omit<PatternProps, "id"> & {
  id: string;
  motif?: "asanoha" | "seigaiha";
  className?: string;
};

/** パターンを全面に敷くための絶対配置 SVG。id は呼び出し側で一意にする。 */
export function PatternBackground({
  id,
  motif = "asanoha",
  size,
  color = "#706020",
  strokeWidth = 0.5,
  opacity = 0.08,
  className,
}: BackgroundProps) {
  const Pattern = motif === "seigaiha" ? SeigaihaPattern : AsanohaPattern;
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
    >
      <Pattern
        id={id}
        size={size ?? (motif === "seigaiha" ? 56 : 56)}
        color={color}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
