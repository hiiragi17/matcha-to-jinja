# フロント側 セットアップ手順書（オーナー作業）

`matcha-to-jinja`（Next.js フロント）を、ローカル開発 → Vercel Preview → 本番まで
立ち上げるために **オーナー（あなた）が手を動かす必要がある作業** を、実行順にまとめた手順書。

- 外部サービス（Vercel / GCP / LINE Developers）の操作やシークレット発行は **人間にしかできない作業**。本書はそこを主に扱う。
- コード変更・env 名の整合・実 API 結合の実装は Claude 側で対応できる（各フェーズ末尾の「Claude に任せられること」参照）。
- 設計の背景・詳細は重複させず、`docs/migration-plan.md`「環境構成」/ `docs/local-setup.md` を参照する。

> 凡例: 🧑 = あなたの手作業 / 🤖 = Claude に依頼可 / ✅ = 完了確認

---

## 全体像（依存順）

```text
Phase 0  ローカル(モック)で起動         ← 依存なし。今すぐ
Phase 1  Vercel 連携(モック Preview)    ← 依存なし。今すぐ
Phase 2  地図・認証シークレット発行      ← 外部サービス登録
Phase 3  ローカルで実 Rails 結合         ← greentea_temple #13/#14/#17
Phase 4  Vercel Preview → Cloud Run dev ← Rails の Cloud Run(#26)
Phase 5  本番ドメイン切替                ← #27
```

各フェーズは前のフェーズが緑になってから進む。Phase 0・1 はバックエンド非依存で**今すぐ**着手できる。

---

## Phase 0 — ローカル（モックモード）で起動

バックエンド不要。まず「動くフロント」を手元で確認する。

1. 🧑 依存インストールと env 用意
   ```bash
   npm install
   cp .env.example .env.local
   ```
2. 🧑 `.env.local` は既定のまま（`NEXT_PUBLIC_USE_MOCK=true`）で OK。`AUTH_SECRET` だけ入れておくと認証 UI も確認しやすい：
   ```bash
   npx auth secret   # 生成値を .env.local の AUTH_SECRET= に貼る
   ```
3. 🧑 起動して確認
   ```bash
   npm run dev
   ```
4. ✅ <http://localhost:3000> で各ページ（`/greenteas` `/temples` `/nearby` `/mypage`）が表示される。OAuth 未設定なので、ログインは**開発用モックログイン**が出る。

---

## Phase 1 — Vercel 連携（モックのまま Preview を出す）

「共有できる URL」を最短で作る。実 API もシークレットもまだ不要。

1. 🧑 Vercel でプロジェクト作成 → GitHub `hiiragi17/matcha-to-jinja` を import。
2. 🧑 Vercel の環境変数（**Production / Preview / Development の3環境すべて**）に最低限：
   | 変数 | 値 |
   |------|-----|
   | `NEXT_PUBLIC_USE_MOCK` | `true`（この段階） |
   | `AUTH_SECRET` | `npx auth secret` の生成値 |
   - `AUTH_URL` は **Production にのみ**確定ドメインを設定。Preview には入れない（Auth.js が `VERCEL_URL` から自動解決）。
3. ✅ main への push / PR で Preview デプロイが生成され、その URL でモックサイトが開ける。

---

## Phase 2 — 地図・OAuth シークレットの発行

実データ前に、外部サービスのキーを揃える。**Rails と同一の OAuth クライアントを共有する**方針（issue #60）。

### 2-1. Google Maps 🧑
1. GCP Console で **Maps JavaScript API** を有効化し、APIキーを発行。
2. **Map ID** を発行（Advanced Markers 用。未設定なら DEMO_MAP_ID で動くが本番は発行推奨）。
3. キーに HTTP リファラ制限（`localhost:3000` / Vercel ドメイン）をかける。
4. 値を以下に設定：`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
   - ローカル `.env.local` と Vercel 全環境の両方。

### 2-2. Google OAuth 🧑（Rails #90 のクライアント発行と兼用）
1. GCP で OAuth 2.0 クライアント（ウェブ）を発行（Rails と同一クライアントを共有）。
2. **承認済みリダイレクト URI** に Next.js 側を追加：
   - `http://localhost:3000/api/auth/callback/google`（ローカル）
   - `https://<本番ドメイン>/api/auth/callback/google`（本番）
   - Preview を使う場合は **redirect proxy の安定 URL** の `/api/auth/callback/google` を登録（毎回変わる `*.vercel.app` は登録しない。詳細は Phase 4）
3. `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` を取得。

### 2-3. LINE OAuth 🧑
1. LINE Developers でチャネル作成。
2. コールバック URL に同様に `/api/auth/callback/line`（ローカル / 本番 / proxy 安定 URL）を登録。
3. `AUTH_LINE_ID` / `AUTH_LINE_SECRET` を取得。

### 2-4. シークレットの配置 🧑
取得した OAuth 値を **ローカル `.env.local` と Vercel の全環境**に登録する。

> ⚠️ `AUTH_GOOGLE_*` / `AUTH_LINE_*` を設定した瞬間、`src/lib/auth.ts` が実 OAuth を有効化し、モックログインは無効になる。ローカルで OAuth を試すには Rails の JWT 発行 API（greentea_temple #15）も必要。まだなら設定を保留し、モックログインのまま進めてよい。

**🤖 Claude に任せられること**: env 名の整合、`.env.example` の追補、`src/lib/auth.ts` のプロバイダ設定確認。

---

## Phase 3 — ローカルで実 Rails API と結合（読み取り系）

> 依存: greentea_temple が `localhost:3001` で起動でき、#13（CORS）/#14（読み取り）/#17（近隣）が動くこと。

1. 🧑 greentea_temple を起動（手順は `docs/local-setup.md`）。
2. 🧑 `.env.local` を実 API に向ける：
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_USE_MOCK=false
   ```
3. 🧑 `npm run dev` で再起動（`NEXT_PUBLIC_*` はビルド時埋め込みのため HMR では切り替わらない）。
4. ✅ `/greenteas` `/temples` `/greenteas/[id]` `/nearby` が実データで描画される。
5. ✅ 認証を試す場合は Rails #15（JWT）も起動し、Google / LINE ログイン → `session.railsJwt` に JWT が入ることを確認。

**🤖 Claude に任せられること**: レスポンス差分の吸収（`src/types/` 更新・`src/lib/api/*` のマッピング）、contract test / fixture 更新（#49 / #51 / #64）。差分が出たら教えてください。

---

## Phase 4 — Vercel Preview → Cloud Run dev で結合

> 依存: Rails が Cloud Run dev にデプロイ済み（#26）、Neon dev 接続済み。

### 4-1. redirect proxy（Preview の肝）🧑
Preview URL は毎回変わり OAuth に登録できないため、Auth.js v5 の **redirect proxy** を使う。
- `AUTH_REDIRECT_PROXY_URL` に安定 URL の `/api/auth`（例: 本番 or 専用の安定デプロイ）を設定。
- 全環境で **同一の `AUTH_SECRET`** を共有。
- OAuth プロバイダには **安定 URL の** `/api/auth/callback/{google,line}` のみ登録。

### 4-2. Vercel Preview の環境変数 🧑
| 変数 | 値 |
|------|-----|
| `NEXT_PUBLIC_API_URL` | Cloud Run dev の URL |
| `NEXT_PUBLIC_USE_MOCK` | `false` |
| `AUTH_SECRET` | proxy 元と同一値 |
| `AUTH_REDIRECT_PROXY_URL` | 安定 URL の `/api/auth` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | 開発用 OAuth |
| `AUTH_LINE_ID` / `AUTH_LINE_SECRET` | 開発用 OAuth |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Maps |

> `AUTH_URL` は Preview に入れない。

### 4-3. CORS / Cookie（Rails 側の設定だが方針はあなたが決める）🧑
- Rails `rack-cors` の origins に Preview ドメインを許可。`*.vercel.app` ワイルドカードは第三者も通るため、**自プロジェクトの URL を正規表現で絞る**のが無難。
- `apiClient` は `credentials: "include"` で送るため、Rails は `credentials: true`（origin に `*` 不可）。
- cross-site なので NextAuth Cookie は `SameSite=None; Secure`（HTTPS 必須）。
- Cloud Run dev には `FRONTEND_URL` / `JWT_SECRET_KEY` を設定。

### 4-4. 確認 ✅
- Preview から `/greenteas` `/temples` `/nearby` の読み取りが動く。
- Preview から OAuth ログイン → いいね / コメントが動く。
- DevTools の Network で CORS preflight エラーが出ない、401/5xx 時の UI が壊れない。

---

## Phase 5 — 本番ドメイン切替（#27）

> 依存: Phase 4 が緑。

1. 🧑 Vercel にカスタムドメイン `matcha-to-jinja.com` を設定。
2. 🧑 Cloud Run に `api.matcha-to-jinja.com` を割当 + SSL。
3. 🧑 Production 環境変数を本番値に：`NEXT_PUBLIC_API_URL=https://api.matcha-to-jinja.com` / `AUTH_URL=https://matcha-to-jinja.com` / `NEXT_PUBLIC_USE_MOCK=false`。
4. 🧑 OAuth プロバイダの本番リダイレクト URI を確認。Rails の CORS を本番ドメインに更新。
5. ✅ 本番ドメインでログイン含む主要フローが動作する。

---

## いま着手すべきこと（要約）

- **今すぐ**: Phase 0（ローカルモック）→ Phase 1（Vercel モック Preview）。これだけで共有可能な動くサイトになる。
- **並行で進められる**: Phase 2（Maps / OAuth クライアント発行）。ただし OAuth 値を入れるとモックログインが無効化されるため、Rails #15 の準備が整うまでは設定を保留してよい。
- **バックエンド待ち**: Phase 3 以降は greentea_temple（#13〜#17, #26）の進捗に同期。

## 参考

- `docs/local-setup.md` — Rails とのローカル結合手順
- `docs/migration-plan.md`「環境構成」— Vercel Preview / redirect proxy / 本番構成の詳細
- `.env.example` — 各環境変数のコメント
- 関連 issue: #27 / #52（インフラ）, #49 / #50 / #51 / #64（API 結合）, #60（Google ログイン移行）
