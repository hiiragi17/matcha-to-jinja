import Link from "next/link";
import { getGreenteas } from "@/lib/api/greenteas";
import { getTemples } from "@/lib/api/temples";

export default async function AdminDashboardPage() {
  const [greenteaData, templeData] = await Promise.all([
    getGreenteas().catch(() => null),
    getTemples().catch(() => null),
  ]);

  const stats = [
    {
      label: "抹茶店",
      count: greenteaData?.meta.total_count ?? "—",
      href: "/admin/greenteas",
    },
    {
      label: "神社・仏閣",
      count: templeData?.meta.total_count ?? "—",
      href: "/admin/temples",
    },
    {
      label: "口コミ",
      count: "—",
      href: "/admin/comments",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 font-mincho text-xl tracking-[0.1em] text-ink">
        ダッシュボード
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, count, href }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-2 border border-line bg-paper p-5 transition-shadow hover:shadow-sm"
          >
            <span className="font-sans-jp text-xs tracking-[0.1em] text-muted">
              {label}
            </span>
            <span className="font-mincho text-3xl text-ink">{count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
