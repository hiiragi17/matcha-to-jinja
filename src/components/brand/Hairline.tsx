// 中央に小さな点を持つ細い水平区切り。

type HairlineProps = {
  width?: number;
  color?: string;
  className?: string;
};

export default function Hairline({
  width = 60,
  color = "#9c8b45",
  className,
}: HairlineProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
    >
      <span style={{ width, height: 1, background: color }} />
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: color }} />
      <span style={{ width, height: 1, background: color }} />
    </span>
  );
}
