# 抹茶と神社。(matcha-to-jinja)

京都の抹茶スイーツ店と神社仏閣を組み合わせて紹介する Web アプリの **Next.js フロントエンド**。

既存の Rails アプリ [greentea_temple](https://github.com/hiiragi17/greentea_temple) を
「Rails API（バックエンド）+ Next.js（フロントエンド）」構成へ移行するプロジェクトの、フロント側リポジトリです。

## アーキテクチャ（2 リポジトリ構成）

| 役割 | リポジトリ | 内容 | デプロイ先 |
|------|-----------|------|-----------|
| フロントエンド | **matcha-to-jinja**（このリポジトリ） | Next.js | Vercel |
| バックエンド API | [greentea_temple](https://github.com/hiiragi17/greentea_temple) | Rails API（`api/v1` 名前空間） | GCP Cloud Run |

- フロントは Rails API の `GET/POST /api/v1/*` を叩いてデータを取得・更新します。
- 認証は Rails が JWT を発行し、フロントは NextAuth.js（Auth.js v5）経由で OAuth（Google / LINE）フローを管理します。
- **このリポジトリに Rails コードは含まれません。** バックエンドの変更は greentea_temple 側で行います。

## 技術スタック

- Next.js 15（App Router）+ React 19 + TypeScript 5
- Tailwind CSS v4 + daisyUI
- SWR（データフェッチ / キャッシュ）
- NextAuth.js（Auth.js v5、Google / LINE OAuth）
- react-icons / `@vis.gl/react-google-maps`
- Vitest + React Testing Library + MSW（ユニット / 統合テスト）
- Playwright（E2E ゴールデンパス）

## クイックスタート（モックモード）

Rails API を起動しなくても、インメモリのモック実装でフロント単独で動かせます。

```bash
pnpm install

# 環境変数を用意（既定で NEXT_PUBLIC_USE_MOCK=true）
cp .env.example .env.local

pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開くと、`src/lib/api/mock` が応答する状態で UI を確認できます。

実 Rails API（`greentea_temple`、:3001）と結合して動かす手順は
[`docs/local-setup.md`](docs/local-setup.md) を参照してください。

## モック / 実 API の切替

`NEXT_PUBLIC_USE_MOCK` 環境変数で切り替えます。

- **`true`** … `src/lib/api/mock` のインメモリ実装が応答する（Rails 未起動で開発可）
- **`false`** … `NEXT_PUBLIC_API_URL` に対して実 fetch を行う

`NEXT_PUBLIC_*` はビルド時に埋め込まれるため、切り替えたら `pnpm dev` を再起動してください。

## 環境変数

`.env.example` をコピーして `.env.local` を作成します。主な変数:

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_API_URL` | Rails API のベース URL（開発: `http://localhost:3001`） |
| `NEXT_PUBLIC_USE_MOCK` | モック / 実 API の切替（`true` / `false`） |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | 現在地検索の地図表示 |
| `AUTH_SECRET` / `AUTH_URL` | NextAuth.js（Auth.js v5） |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `AUTH_LINE_ID` / `AUTH_LINE_SECRET` | OAuth プロバイダー（未設定時は開発用モックログインを表示） |

各変数の詳細はコメント付きで `.env.example` に記載しています。

## スクリプト

| コマンド | 内容 |
|----------|------|
| `pnpm dev` | 開発サーバ起動（:3000） |
| `pnpm build` | 本番ビルド |
| `pnpm start` | ビルド済みアプリの起動 |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest（ユニット / 統合） |
| `pnpm test:watch` | Vitest ウォッチモード |
| `pnpm test:coverage` | カバレッジ付きで実行（`coverage/` に出力） |
| `pnpm test:e2e` | Playwright E2E（モックモードで起動） |

## ディレクトリ構成（抜粋）

```text
src/
  app/            # ルーティング（greenteas / temples / nearby / mypage / auth ...）
  components/     # layout / greentea / temple / map / common / auth / brand
  lib/
    api/          # client.ts + 各リソースの API 関数 + mock 実装
    auth.ts       # NextAuth 設定
    utils/        # distance.ts ほか
  types/          # API レスポンスに対応する型定義
tests/
  msw/            # MSW ハンドラ
  e2e/            # Playwright シナリオ
```

エイリアス: `@/*` → `./src/*`、`@tests/*` → `./tests/*`。

## ドキュメント

- [`docs/local-setup.md`](docs/local-setup.md) — Rails API とのローカル結合手順
- [`docs/migration-plan.md`](docs/migration-plan.md) — 移行計画（API レスポンス契約 / 構成 / レンダリング戦略 / デプロイ）
- [`docs/test-plan.md`](docs/test-plan.md) — テスト方針
- [`docs/github-issues.md`](docs/github-issues.md) — issue 定義
- [`CLAUDE.md`](CLAUDE.md) — コーディング規約・アーキテクチャ方針

## 著作権・免責

- 画像は外部 URL 参照のみ（Rails 側 CarrierWave の URL をそのまま表示）。
- 本アプリは非公式です。出典の注意書きをフッターに表示しています。
