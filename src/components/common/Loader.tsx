// データ取得中に表示するローダー。文言のみの箇所が各所に重複していたため共通化。

type LoaderProps = {
  label?: string;
  fullScreen?: boolean;
  className?: string;
};

export default function Loader({
  label = "読み込み中…",
  fullScreen = false,
  className,
}: LoaderProps) {
  const indicator = (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2.5 ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="h-3 w-3 animate-spin rounded-full border border-line-soft border-t-olive"
      />
      <span className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
        {label}
      </span>
    </div>
  );

  if (!fullScreen) return indicator;

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      {indicator}
    </section>
  );
}
