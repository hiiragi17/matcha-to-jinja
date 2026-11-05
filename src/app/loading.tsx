// SSR ページの遷移中、データ取得が終わるまで白画面にならないよう全ルート共通で表示する。
import Loader from "@/components/common/Loader";

export default function Loading() {
  return <Loader fullScreen />;
}
