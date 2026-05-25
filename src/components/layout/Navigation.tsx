"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
  { href: "/", label: "トップ" },
  { href: "/greenteas", label: "抹茶スイーツ" },
  { href: "/temples", label: "神社仏閣" },
  { href: "/nearby", label: "現在地から" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavigationProps = {
  orientation?: "horizontal" | "vertical";
};

export default function Navigation({
  orientation = "horizontal",
}: NavigationProps) {
  const pathname = usePathname();
  return (
    <ul
      className={
        orientation === "horizontal"
          ? "flex justify-center gap-7"
          : "flex flex-col gap-3"
      }
    >
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`border-b pb-1 font-mincho text-sm tracking-[0.06em] transition-colors ${
                active
                  ? "border-bengara font-semibold text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
