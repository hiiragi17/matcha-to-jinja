"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/greenteas", label: "抹茶店" },
  { href: "/admin/temples", label: "神社・仏閣" },
  { href: "/admin/comments", label: "コメント" },
] as const;

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 border-r border-line bg-paper">
      <div className="border-b border-line px-4 py-4">
        <span className="font-mincho text-xs tracking-[0.15em] text-muted">
          管理画面
        </span>
      </div>
      <nav className="flex flex-col py-2">
        {navItems.map(({ href, label }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2.5 font-serif-jp text-sm transition-colors hover:bg-stone-100 ${
                isActive ? "bg-stone-100 text-olive" : "text-ink"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
