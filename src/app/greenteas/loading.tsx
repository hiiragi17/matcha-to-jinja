// SSR ページの遷移中、データ取得が終わるまで白画面にならないよう表示する。
// ルート直下に置くと admin 配下などビルド時に API を叩くページまで事前生成の対象になり
// ビルドが失敗するため、公開ページ（greenteas / temples）の配下にのみ置いている。
import Loader from "@/components/common/Loader";

export default function Loading() {
  return <Loader fullScreen />;
}
