import type { Temple } from "@/types";
import TempleCard from "@/components/temple/TempleCard";

type TempleListProps = {
  temples: Temple[];
};

export default function TempleList({ temples }: TempleListProps) {
  if (temples.length === 0) {
    return (
      <div className="border border-line-soft bg-paper px-6 py-12 text-center">
        <p className="font-mincho text-base text-ink">
          該当する神社仏閣が見つかりませんでした。
        </p>
        <p className="mt-2 font-sans-jp text-xs tracking-[0.1em] text-muted">
          検索条件を変えてもう一度お試しください。
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {temples.map((temple) => (
        <li key={temple.id}>
          <TempleCard temple={temple} />
        </li>
      ))}
    </ul>
  );
}
