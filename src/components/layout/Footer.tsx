import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer footer-center bg-base-200 text-base-content p-10">
      <nav>
        <div className="grid grid-flow-col gap-4">
          <Link href="/greenteas" className="link link-hover">
            抹茶店一覧
          </Link>
          <Link href="/temples" className="link link-hover">
            神社一覧
          </Link>
          <Link href="/nearby" className="link link-hover">
            現在地検索
          </Link>
          <Link href="/terms" className="link link-hover">
            利用規約
          </Link>
          <Link href="/privacy" className="link link-hover">
            プライバシーポリシー
          </Link>
        </div>
      </nav>
      <aside>
        <p>
          Copyright &copy; {currentYear}{' '}
          <span className="font-semibold">抹茶と神社。</span>
          All rights reserved.
        </p>
      </aside>
    </footer>
  );
}
