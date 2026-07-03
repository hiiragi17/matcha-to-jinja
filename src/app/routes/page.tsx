import Hairline from "@/components/brand/Hairline";
import RouteList from "@/components/route/RouteList";

type SearchParams = { page?: string };

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
        モデルコース / MODEL COURSE
      </p>
      <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
        わたしのモデルコース
      </h1>
      <Hairline width={40} className="mt-5" />
      <p className="mt-5 font-serif-jp text-sm leading-[2] text-muted">
        抹茶スイーツ店と神社仏閣を組み合わせた、自分だけの巡りコースを保存できます。
      </p>

      <div className="mt-10">
        <RouteList page={page} />
      </div>
    </section>
  );
}
