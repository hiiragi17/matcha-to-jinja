import Link from "next/link";
import { HiBars3 } from "react-icons/hi2";
import Navigation from "./Navigation";

export default function Header() {
  return (
    <header className="navbar sticky top-0 z-50 border-b border-base-300 bg-base-100">
      <div className="navbar-start">
        <details className="dropdown lg:hidden">
          <summary
            className="btn btn-ghost btn-circle"
            aria-label="メニューを開く"
          >
            <HiBars3 className="h-5 w-5" />
          </summary>
          <ul className="menu dropdown-content z-50 mt-3 w-56 gap-1 rounded-box bg-base-100 p-2 shadow">
            <Navigation />
          </ul>
        </details>
        <Link href="/" className="btn btn-ghost text-xl font-bold normal-case">
          <span className="text-primary">抹茶</span>と
          <span className="text-secondary">神社</span>。
        </Link>
      </div>
      <nav className="navbar-end hidden lg:flex">
        <ul className="menu menu-horizontal gap-1 px-1">
          <Navigation />
        </ul>
      </nav>
    </header>
  );
}
