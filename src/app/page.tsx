import type { Metadata } from 'next';
import Link from 'next/link';
import { FaToriiGate } from 'react-icons/fa';
import { PiTeaBag } from 'react-icons/pi';
import { MdLocationOn } from 'react-icons/md';

export const metadata: Metadata = {
  title: '抹茶と神社。- 京都の抹茶スイーツ店と神社仏閣',
};

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero section */}
      <section className="hero min-h-[60vh] rounded-2xl bg-base-200 mb-12">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-4">抹茶と神社。</h1>
            <p className="text-lg mb-8 text-base-content/70">
              京都の抹茶スイーツ店と神社仏閣を
              <br />
              組み合わせてご案内します。
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/greenteas" className="btn btn-primary">
                <PiTeaBag className="w-5 h-5" aria-hidden="true" />
                抹茶店を探す
              </Link>
              <Link href="/temples" className="btn btn-secondary">
                <FaToriiGate className="w-5 h-5" aria-hidden="true" />
                神社を探す
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body items-center text-center">
            <PiTeaBag className="w-12 h-12 text-primary mb-2" aria-hidden="true" />
            <h2 className="card-title">抹茶店一覧</h2>
            <p className="text-sm text-base-content/70">
              京都の厳選された抹茶スイーツ店をご紹介。パフェ、わらび餅、抹茶ラテなど。
            </p>
            <div className="card-actions">
              <Link href="/greenteas" className="btn btn-primary btn-sm">
                一覧を見る
              </Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body items-center text-center">
            <FaToriiGate className="w-12 h-12 text-secondary mb-2" aria-hidden="true" />
            <h2 className="card-title">神社仏閣一覧</h2>
            <p className="text-sm text-base-content/70">
              京都の神社・お寺をご紹介。観光スポットと抹茶店をセットで楽しもう。
            </p>
            <div className="card-actions">
              <Link href="/temples" className="btn btn-secondary btn-sm">
                一覧を見る
              </Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body items-center text-center">
            <MdLocationOn className="w-12 h-12 text-accent mb-2" aria-hidden="true" />
            <h2 className="card-title">現在地から検索</h2>
            <p className="text-sm text-base-content/70">
              今いる場所から近くの抹茶店・神社を地図で探せます。
            </p>
            <div className="card-actions">
              <Link href="/nearby" className="btn btn-accent btn-sm">
                検索する
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
