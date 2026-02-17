'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaToriiGate } from 'react-icons/fa';
import { PiTeaBag } from 'react-icons/pi';
import { MdLocationOn } from 'react-icons/md';

const navItems = [
  { href: '/greenteas', label: '抹茶店一覧', icon: PiTeaBag },
  { href: '/temples', label: '神社一覧', icon: FaToriiGate },
  { href: '/nearby', label: '現在地検索', icon: MdLocationOn },
] as const;

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl font-bold tracking-wide">
          抹茶と神社。
        </Link>
      </div>

      {/* Desktop navigation */}
      <nav className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={pathname.startsWith(href) ? 'active' : ''}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="navbar-end gap-2">
        {/* Issue #11 で UserMenu に差し替え予定 */}
        <Link href="/auth/login" className="btn btn-primary btn-sm">
          ログイン
        </Link>

        {/* Mobile hamburger */}
        <div className="dropdown dropdown-end lg:hidden">
          <button
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-square"
            aria-label="メニューを開く"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </button>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            {navItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
