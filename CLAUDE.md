# 抹茶と神社。(matcha-to-jinja)

京都の抹茶スイーツ店と神社仏閣を組み合わせて紹介するWebアプリの **Next.js フロントエンド**。
既存の Rails アプリ [greentea_temple](https://github.com/hiiragi17/greentea_temple) を
「Rails API（バックエンド）+ Next.js（フロントエンド）」構成へ移行するプロジェクトの、フロント側リポジトリ。

## アーキテクチャ（2リポジトリ構成）

| 役割 | リポジトリ | 内容 |
|------|-----------|------|
| フロントエンド | **matcha-to-jinja**（このリポジトリ） | Next.js / Vercel |
| バックエンド API | greentea_temple | Rails API（`api/v1` 名前空間）/ GCP Cloud Run |

- フロントは Rails API の `GET/POST /api/v1/*` を叩いてデータを取得・更新する。
- 認証は Rails が JWT を発行し、フロントは NextAuth.js 経由で OAuth フローを管理する。
- **このリポジトリには Rails コードは含まれない**。バックエンドの変更は greentea_temple 側で行う。

## 技術スタック

### 導入済み
- Next.js 15.5.19 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4（`@tailwindcss/postcss`）
- ESLint 9（`next/core-web-vitals`, `next/typescript`）

### 導入予定（Issue #18 で追加）
- daisyUI — 既存デザイン踏襲のための Tailwind プラグイン
- SWR または TanStack Query — データフェッチ/キャッシュ
- react-icons — アイコン
- next-auth — OAuth（Google / LINE）フロー管理
- react-hook-form + zod + @hookform/resolvers — フォーム
- @react-google-maps/api または @vis.gl/react-google-maps — 地図

## ディレクトリ構成（計画）

`docs/migration-plan.md` の 2-2 が正。要点のみ抜粋:

```
src/
  app/
    page.tsx                  # トップ
    greenteas/                # 抹茶店 一覧 + [id]/ 詳細
    temples/                  # 神社 一覧 + [id]/ 詳細
    nearby/                   # 現在地検索（CSR）
    mypage/                   # マイページ + お気に入り（認証必須）
    routes/                   # モデルコース 一覧/詳細/作成(new)/編集([id]/edit)（認証必須・CSR）
    admin/                    # 管理画面（greenteas/temples CRUD + comments モデレーション、AdminGuard）
    terms/, privacy/          # 静的ページ
    auth/login/, auth/callback/
    api/auth/[...nextauth]/   # NextAuth.js ルート
    not-found.tsx
  components/
    layout/                   # Header, Footer, Navigation
    greentea/, temple/        # Card / List / Detail / Search
    map/                      # GoogleMap, LocationMarker
    route/                    # RouteList / RouteBuilder / RouteCreateForm / RouteEditForm / RouteDetailView / RouteMap
    admin/                    # AdminNav / GreenteaForm / TempleForm / *AdminTable / CommentModerationList / DeleteConfirmDialog
    common/                   # LikeButton, CommentSection, Pagination, ShareButtons 等
    auth/                     # LoginButton, UserMenu
  lib/
    api/                      # client.ts + 各リソースの API 関数（routes.ts / admin/ 含む）
    auth.ts                   # NextAuth 設定
    utils/                    # distance.ts, format.ts
  types/                      # greentea / temple / user / comment / route / api
```

エイリアス: `@/*` → `./src/*`（`tsconfig.json`）。

## API 契約（Rails API 側との取り決め）

- ベースURL: `process.env.NEXT_PUBLIC_API_URL` + `/api/v1`
- レスポンスの JSON 形は `docs/migration-plan.md` の 1-3 が「契約」。これを型定義（`types/`）と一致させる。
- 主な型: `Greentea`, `Temple`, `Genre`, `Area`, `User`, `Comment`, `RouteDetail` / `RouteListItem`, `PaginatedResponse<T>`。
- 一覧は `meta`（`current_page` / `total_pages` / `total_count`）付き。詳細は近隣スポット（1.5km以内）と距離情報を含む。
- 検索パラメータは Ransack 形式（例: `q[name_cont]`）。
- **モデルコース（`/api/v1/routes`）**は全エンドポイント JWT 認証必須（自分のコースのみ CRUD）。契約は `docs/migration-plan.md` 1-3「モデルコース（routes）」。リクエストボディは `route` キー配下で、`spots` の配列順がコース順になる。

### フロント先行のためのモック戦略
- Rails API が未完成でも進められるよう、API クライアントは **環境変数でモック / 実 API を切り替えられる** 形にする。
- モックは `docs/migration-plan.md` のレスポンス例をそのまま利用する。
- 認証（#23）といいね・コメント（#24）は Rails の JWT 発行（greentea_temple #15）に実依存するため、UI の枠のみ先行し結合は後続。

## レンダリング戦略

`docs/migration-plan.md` の 2-4 が正。要点:

| ページ | 方式 | 理由 |
|--------|------|------|
| トップ | SSG | 静的 |
| 一覧（抹茶店/神社） | SSR + CSR | 初期表示はSEO、検索/ページネーションはCSR |
| 詳細 | SSR | SEO + 動的（コメント等） |
| 現在地検索 | CSR | Geolocation API 依存 |
| マイページ | CSR | 認証必須・SEO不要 |
| モデルコース（一覧/詳細/作成/編集） | CSR | 全 API が JWT 認証必須・自分のデータのみ、SEO不要 |
| ログイン / 利用規約 / プライバシー | SSG | 静的 |

## コーディング規約

- **Server Components 優先**: データ取得は Server Components（`lib/api/`）で行い、フォームやインタラクティブ要素のみ Client Components。
- **API アクセスは `lib/api/` に集約**: ページ/コンポーネントから直接 `fetch` せず、リソースごとの API 関数を経由する。
- **型は `types/` に集約**し、API レスポンスと一致させる。`any` を避ける（`strict: true`）。
- **デザインは daisyUI + Tailwind** で既存 greentea_temple のデザインを踏襲する。
- コメントは「なぜ」が非自明な場合のみ。自明な処理にコメントを足さない。

### import スタイル

`src/` 配下の import パスは、以下の使い分けで統一する。ESLint の `no-restricted-imports` で機械的にチェックする。

- **同階層 (`./xxx`)** — 相対 import を使う。例: `src/lib/api/greenteas.ts` から `import { apiClient } from "./client"`
- **同一パッケージ内の親 1 階層 (`../xxx`)** — 相対 import を使ってよい。例: `src/lib/api/mock/index.ts` から `import { ApiError } from "../error"`
- **親 2 階層以上 (`../../`, `../../../`...)** — `@/*` エイリアス必須。深い相対 path は禁止する（ESLint で error）。
  - 例: ❌ `import { ApiError } from "../../error"` → ✅ `import { ApiError } from "@/lib/api/error"`
- **`tests/` 配下への参照** — `@tests/*` エイリアスを使う。`@/*` は `src/*` のみを指す。
  - 例: ✅ `import { server } from "@tests/msw/server"`

`tests/` 内の `./xxx` / `../xxx` の相対 import は同様の基準で OK。

## 著作権・免責

- 画像は外部URL参照のみ（Rails 側 CarrierWave の URL をそのまま表示）。
- フッターに非公式である旨/出典の注意書きを表示する。

## 環境変数

`.env.local`（開発時）:

```
NEXT_PUBLIC_API_URL=http://localhost:3001        # 本番: https://api.matcha-to-jinja.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxxxx
```

開発ポート: Next.js = `3000` / Rails API = `3001`。

## デプロイ

| レイヤー | サービス |
|---------|---------|
| フロントエンド | Vercel |
| バックエンド API | GCP Cloud Run |
| データベース | Neon PostgreSQL（無料枠） |
| 画像ストレージ | GCP Cloud Storage |

詳細は `docs/migration-plan.md` の「環境構成」を参照。

## GitHub PR ルール

- PR 本文は **日本語** で書く。
- assignee に `hiiragi17` を設定する。
- 関連 issue がある場合は本文に `Closes #<番号>` を含めて紐付ける。
- 開発は指定の作業ブランチで行い、main へ直接 push しない。

## レビューコメント対応ルール

PR には CodeRabbit / Codex などの bot レビューが付く。基本方針:

### 適用判断
- **小さく明確な指摘**（typo / lint / markdown / 表記揺れ / docs の整合性等）→ 即座に修正コミット。
- **セキュリティ / データ整合性の指摘**（認証、XSS、トークン漏洩等）→ 妥当性を検証して修正。
- **アーキテクチャに影響する指摘**（責務分離、抽象化方針、依存関係の変更等）→ 自己判断せず `AskUserQuestion` で確認してから対応。
- **複数 bot から同一指摘**が来た場合は 1 つの commit でまとめて反映する。

### コミットメッセージ
- レビュー反映の commit は `docs: <内容> にCodeRabbitレビュー指摘を反映` のように内容を要約。
- どの指摘を反映したか箇条書きで本文に残す。

### 返信ポリシー
- **bot / 人間問わず全てのレビューコメントにスレッド返信する**（`add_reply_to_pull_request_comment`）。
  - CodeRabbit が `✅ Addressed in commit XXXXXXX` を自動追記しても返信を省略しない。
- 返信内容は「対応コミットの hash」+「何をどう変えたかの要約」を必ず含める。
- 修正対応した thread は可能なら resolve する（`resolve_review_thread`）。
- 「対応しない」判断をした場合は理由を明記してスレッド返信。

### スキップしてよいケース
- bot の "Review in progress" の単なる進捗通知。
- 既にコミット済みの修正と重複する指摘（返信で既対応を伝えるだけで OK）。
- 自分の返信が webhook で echo されてきたケース。
- bot がこちらの返信を確認して送ってくる「お礼 / 確認」自動返信（さらに返信すると無限ループになる）。

## 詳細ドキュメント

- `docs/migration-plan.md` — 移行計画全文（API レスポンス設計、ディレクトリ構成、レンダリング戦略、デプロイ手順）
- `docs/github-issues.md` — GitHub issue 定義（15 件、依存順）
