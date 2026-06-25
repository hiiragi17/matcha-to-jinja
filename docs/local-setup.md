# ローカル開発セットアップ

`matcha-to-jinja`（Next.js フロント）と [`greentea_temple`](https://github.com/hiiragi17/greentea_temple)（Rails API）を
**両方ローカルで起動して結合確認する** ための手順をまとめる。
読み取り系 API 繋ぎ込み（issue #49）以降の作業で参照する。

## 構成

| 役割 | リポジトリ | ポート |
|------|-----------|--------|
| フロント（Next.js） | matcha-to-jinja | `3000` |
| バックエンド（Rails API） | greentea_temple | `3001` |

## 1. greentea_temple（Rails API）の起動

別のターミナルで:

```bash
cd path/to/greentea_temple

# 初回のみ
bundle install
bin/rails db:setup

# サーバ起動（ポート 3001）
bin/rails server -p 3001
```

起動後、ブラウザや curl で疎通確認:

```bash
curl -i http://localhost:3001/api/v1/areas
# => HTTP/1.1 200 OK / Content-Type: application/json
```

### CORS の確認 ⚠️ 最初のハマりどころ

`config/initializers/cors.rb` で `http://localhost:3000` からの GET/POST/DELETE が
許可されていること（Rails issue #13 で対応済み）。
ブラウザ DevTools の Network タブで CORS preflight のエラーが出ていなければ OK。

フロントの API クライアント（`src/lib/api/client.ts`）は実 fetch で **`credentials: "include"`** を付けて
送る。このため Rails の CORS 設定が以下を満たしていないとブラウザで弾かれる:

- `Access-Control-Allow-Credentials: true` を返す（`rack-cors` の `credentials: true`）
- `Access-Control-Allow-Origin` が **`*` ではなく `http://localhost:3000` を明示**
  （`credentials: true` のとき `*` は仕様上使えない。本番は確定ドメインを明示）
- 許可メソッドに `GET, POST, DELETE` と preflight の `OPTIONS`

> **重要**: 認証は JWT を `Authorization: Bearer` ヘッダで送る方針。`credentials: include` は
> Cookie 送受信も有効化するため、Rails 側で Cookie セッションと JWT を**混在させない**こと
> （混ぜると CORS / 認証の挙動が複雑化する）。

curl は CORS を無視するので、**curl が 200 でもブラウザで CORS エラーになる**ことがある。
切り分けはブラウザ DevTools → Network の preflight（`OPTIONS`）レスポンスヘッダで行う。

## 2. matcha-to-jinja（Next.js）の起動

```bash
cd path/to/matcha-to-jinja

# 初回のみ
npm install

# .env.local の用意（実 API に向ける）
cp .env.example .env.local
# .env.local を編集して以下に変更:
#   NEXT_PUBLIC_API_URL=http://localhost:3001
#   NEXT_PUBLIC_USE_MOCK=false

# サーバ起動（ポート 3000）
npm run dev
```

ブラウザで <http://localhost:3000/greenteas> を開き、Rails が返した一覧が描画されれば疎通成功。

## モック / 実 API の切替

`NEXT_PUBLIC_USE_MOCK` 環境変数で切り替える。
- **`true`**: `src/lib/api/mock` のインメモリ実装が応答する。Rails 未起動で UI 開発できる。
- **`false`**: `NEXT_PUBLIC_API_URL` に対して実 fetch する。本作業（実 API 連携）モード。

両モードを行き来する場合は `.env.local` を書き換えて `npm run dev` を再起動する
（`NEXT_PUBLIC_*` はビルド時に埋め込まれるため、HMR では切り替わらない）。

## 動作確認の最小チェック

`NEXT_PUBLIC_USE_MOCK=false` で起動した後、以下が描画されることを確認する:

| URL | 期待 |
|-----|------|
| `/greenteas` | 抹茶店一覧、`meta.total_count` 件数表示、ページネーション |
| `/greenteas/1`（存在する id） | 詳細＋近隣神社 1.5km 以内のリスト |
| `/greenteas/99999`（存在しない） | 404 ページ |
| `/temples` `/temples/1` | 同様 |
| `/nearby`（位置情報許可後） | 地図にマーカー表示 |

エラーになった場合はブラウザ DevTools → Network タブで:
- レスポンスの JSON を確認し `src/types/` と差分がないかチェック
- 401/403/404/500 の場合はステータスとボディを Rails のログと突き合わせ

## 契約のドリフト検知（自動テスト）

`src/lib/api/__tests__/contract.test.ts` は `docs/migration-plan.md` の API
レスポンス契約に基づく fixture を MSW で配信し、API クライアントが想定どおりに
解釈できるかを CI で検証する。

Rails 側のレスポンス形が変わったらこのテストが失敗する想定。
契約変更があった場合は fixture（`src/lib/api/__tests__/fixtures/`）と
`src/types/` を合わせて更新する。

### 実 Rails との手動突き合わせ

`contract.test.ts` は **fixtures（フロントの期待形）に対して**フロントが正しく動くかを検証するもので、
**実 Rails が fixtures どおりに返すか**までは保証しない。実 API 連携の初回は、
`docs/api-contract-checklist.md` のチェック表に沿って 1 エンドポイントずつ curl で照合すること。
特にエンドポイント名の罠（いいね=`greentea_likes` / コメント=`greenteacomments`）と
フィールド名（`likes_count`・`distance_meters`・`liked_by_current_user`）に注意。
