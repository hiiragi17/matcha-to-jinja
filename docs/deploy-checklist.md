# Vercel デプロイ チェックリスト（最短手順）

> まだ Vercel にデプロイしていない段階から、**バックエンド（Rails / Cloud Run）を待たずに**
> モックモードで「共有できる URL」を作るまでのチェックリスト。
> フェーズ全体（実 API 結合・本番ドメイン）の詳細は `docs/frontend-setup-runbook.md` が正。
> 本書はその **Phase 0〜1 に絞った実行チェックリスト**。

凡例: 🧑 = あなたの手作業 / 🤖 = Claude に依頼可 / ✅ = 完了確認

---

## 0. デプロイ前チェック（ローカルで緑を確認）

Vercel のビルドは `next build` を実行する。事前にローカルで同じ緑を確認しておく。

| コマンド | 内容 | 直近の状態 |
|----------|------|-----------|
| `pnpm install --frozen-lockfile` | 依存をクリーンインストール | ✅ |
| `pnpm lint` | ESLint | ✅ warning/error なし |
| `pnpm test` | 単体テスト（Vitest） | ✅ 205 passed |
| `pnpm build` | 本番ビルド（Vercel と同じ） | ✅ 22 ルート生成 |
| `pnpm test:e2e` | E2E（Playwright） | ⚠️ ブラウザバイナリ依存。CI/ローカルでブラウザが入っていれば通る（Vercel デプロイ自体は E2E を実行しない） |

> 📌 E2E はローカル環境にブラウザが無いと `Executable doesn't exist` で落ちるが、
> これは**テスト内容ではなく実行環境の問題**。Vercel のビルドには影響しない。

🤖 これらのチェックは Claude 側でも随時回せる。差分が出たら知らせる。

---

## 1. Vercel プロジェクト作成（モックのまま Preview）

実 API もシークレットもまだ不要。**今すぐ着手できる。**

1. 🧑 Vercel にログイン → **Add New Project** → GitHub `hiiragi17/matcha-to-jinja` を import。
   - Framework Preset は **Next.js**（自動検出）。Build Command / Output はデフォルトのまま。
2. 🧑 環境変数を **Production / Preview / Development の3環境すべて**に設定：

   | 変数 | 値 | 備考 |
   |------|-----|------|
   | `NEXT_PUBLIC_USE_MOCK` | `true` | この段階はモック。Rails 完成後に `false` へ |
   | `AUTH_SECRET` | `npx auth secret` で生成した値 | **全環境・全フェーズで同一値を使い続ける（再生成しない）** |

   - `AUTH_URL` は **設定しない**（Preview は毎回 URL が変わるため。Vercel 上では Auth.js が `VERCEL_URL` から自動解決）。
   - `NEXT_PUBLIC_API_URL` はモックモードでは参照されないので**未設定で OK**（Phase 3 以降で設定）。
   - OAuth（`AUTH_GOOGLE_*` / `AUTH_LINE_*`）も**未設定で OK**（この段階では設定不要）。
3. 🧑 **Deploy** を押す。完了後、`https://<project>.vercel.app` でモックサイトが開く。
4. ✅ **ログイン不要の公開ページ**が表示されることを確認（この段階で確認できるのはここまで）：
   - `/`（トップ）/ `/greenteas`（一覧・検索）/ `/temples` / `/greenteas/[id]`（詳細）
   - `/nearby`（現在地検索・要 Maps キーは Phase 2、未設定でも地図枠は出る）
   - 表示されるデータは `NEXT_PUBLIC_USE_MOCK=true` による**モックデータ**。
5. ✅ 以降、main への push / PR ごとに Preview デプロイが自動生成される。

> ⚠️ **Vercel 上ではモックログインは使えない**（`/mypage` `/admin` などログイン必須ページはこの段階では確認不可）。
> 開発用モックログイン（`src/lib/auth.ts` の Credentials provider）は **`NODE_ENV !== "production"` のときだけ**有効で、
> Vercel は Preview / Production とも production ビルドで動くため無効化される。
> - **ログイン必須ページの確認はローカル（`pnpm dev`）で行う**（`docs/frontend-setup-runbook.md` Phase 0）。そこではモックログインが出る。
> - Vercel 上でログインを通すには **OAuth 設定（Phase 2）＋ Rails JWT 連携（Phase 3 以降）** が必要。
> - 補足: `NEXT_PUBLIC_USE_MOCK`（API の**データ**をモックにする）と、モック**ログイン**（認証を省略する）は別物。前者は Vercel でも効くが、後者は本番ビルドでは無効。

---

## 2. この後の流れ（バックエンド進捗に同期）

| 次のフェーズ | やること | 依存 |
|------------|---------|------|
| Phase 2 | Google Maps / OAuth クライアント発行 | 外部サービス登録（並行可） |
| Phase 3 | ローカルで実 Rails API 結合（`NEXT_PUBLIC_USE_MOCK=false`） | greentea_temple #13/#14/#17 |
| Phase 4 | Vercel Preview → Cloud Run dev | Rails の Cloud Run（#26） |
| Phase 5 | 本番ドメイン `matcha-to-jinja.com` 切替 | #27 |

各フェーズの手順は `docs/frontend-setup-runbook.md` を参照。

---

## 参考

- `docs/frontend-setup-runbook.md` — Phase 0〜5 の全手順（本書の親）
- `docs/migration-plan.md`「環境構成」— Vercel Preview / redirect proxy / 本番構成の詳細
- `.env.example` — 各環境変数のコメント
- 関連 issue: #27（Vercel デプロイ & 本番連携）/ #26（Cloud Run）
