import type { Greentea } from "@/types";
import GreenteaCard from "@/components/greentea/GreenteaCard";

type GreenteaListProps = {
  greenteas: Greentea[];
};

export default function GreenteaList({ greenteas }: GreenteaListProps) {
  if (greenteas.length === 0) {
    return (
      <div className="border border-line-soft bg-paper px-6 py-12 text-center">
        <p className="font-mincho text-base text-ink">
          該当する抹茶店が見つかりませんでした。
        </p>
        <p className="mt-2 font-sans-jp text-xs tracking-[0.1em] text-muted">
          検索条件を変えてもう一度お試しください。
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {greenteas.map((greentea) => (
        <li key={greentea.id}>
          <GreenteaCard greentea={greentea} />
        </li>
      ))}
    </ul>
  );
}
