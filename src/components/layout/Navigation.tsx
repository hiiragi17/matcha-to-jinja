import Link from "next/link";

export const NAV_LINKS = [
  { href: "/greenteas", label: "抹茶店" },
  { href: "/temples", label: "神社" },
  { href: "/nearby", label: "現在地から探す" },
] as const;

export default function Navigation() {
  return (
    <>
      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          <Link href={link.href}>{link.label}</Link>
        </li>
      ))}
    </>
  );
}
