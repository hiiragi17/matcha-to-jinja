# Rails API 化 issue 一式（greentea_temple 用）

`hiiragi17/greentea_temple` リポジトリに登録するための issue 定義集。
コピペで `gh issue create -t "..." -b "$(cat ...)" -l "..."` または GitHub Web から登録できる形式で記載する。

> このリポジトリ（matcha-to-jinja）には対応する issue が #13〜#17 / #26 として既に存在するが、
> あれは **「フロント側からの参照用ミラー」** として作られたもの。実体は greentea_temple 側に登録する。

依存順は **#1 → #2 / #3 → #4 / #5 → #6**。
推奨ラベル: `rails`, `api`, `auth`（#3 のみ）, `infra`（#6 のみ）。

---

## #1 [Rails] API 名前空間と基盤の構築

**ラベル**: `rails`, `api`
**依存**: なし
**対応するフロント側 issue**: matcha-to-jinja#13

### 概要

`api/v1` 名前空間を追加し、API コントローラーの基盤と CORS 設定、共通エラーハンドリングを整える。
**この issue を最初に着地させる**。以降の API 実装はすべてこの基盤の上に乗る。

### タスク

- [ ] `Api::V1::BaseController` の作成
  - `ActionController::API` を継承
  - `before_action :set_default_format`（`request.format = :json`）
  - 共通 `rescue_from`:
    - `ActiveRecord::RecordNotFound` → 404
    - `ActionController::ParameterMissing` → 400
    - `StandardError` → 500（本番のみ）
- [ ] `config/routes.rb` に `namespace :api { namespace :v1 { ... } }` を追加（空でよい）
- [ ] `Gemfile` に `rack-cors` を追加し `config/initializers/cors.rb` を作成
  - `origins` は `ENV['FRONTEND_URL']`（開発: `http://localhost:3000` / 本番: `https://matcha-to-jinja.com`）
  - `resource '/api/*'` に `headers: :any, methods: %i[get post put patch delete options], credentials: true, expose: ['Authorization']`
- [ ] 動作確認用に `/api/v1/health`（200 を返すだけ）を追加 — フロントの疎通確認に使う
- [ ] 既存の Web 画面のセッション認証に影響しないことを確認

### 受け入れ条件

- `curl -i http://localhost:3001/api/v1/health` で 200 + `{"status":"ok"}` が返る
- 既存の HTML ページが従来どおり動く（Administrate 含む）

### 参考

- matcha-to-jinja: `docs/migration-plan.md` 1-1〜1-2, 1-5

---

## #2 [Rails] 読み取り系 API エンドポイントの実装

**ラベル**: `rails`, `api`
**依存**: #1
**対応するフロント側 issue**: matcha-to-jinja#14

### 概要

抹茶店・神社の一覧 / 詳細、エリア・ジャンル一覧の API を実装する。
**未認証でアクセス可能**。フロント側はすでに UI が完成しており、本 API 完成で実 API 切替（`NEXT_PUBLIC_USE_MOCK=false`）が可能になる。

### エンドポイント

```
GET /api/v1/greenteas        # 一覧（Ransack 検索 + Kaminari ページネーション）
GET /api/v1/greenteas/:id    # 詳細（1.5km 以内の近隣神社含む）
GET /api/v1/temples          # 一覧
GET /api/v1/temples/:id      # 詳細（1.5km 以内の近隣抹茶店含む）
GET /api/v1/areas            # エリア一覧
GET /api/v1/genres           # ジャンル一覧
```

### タスク

- [ ] `Api::V1::GreenteasController`（`index`, `show`）
- [ ] `Api::V1::TemplesController`（`index`, `show`）
- [ ] `Api::V1::AreasController`（`index`）
- [ ] `Api::V1::GenresController`（`index`）
- [ ] Serializer 導入（`jsonapi-serializer` 推奨）
  - `GreenteaSerializer` / `TempleSerializer` / `GenreSerializer` / `AreaSerializer`
  - 詳細用に `nearby_temples` / `nearby_greenteas`（距離付き）を含める専用 serializer
- [ ] Ransack 対応（`ransackable_attributes` / `ransackable_associations` を allowlist で明示）
  - 検索: `q[name_cont]`, `q[genres_id_eq]`, `q[areas_id_eq]`
- [ ] Kaminari ページネーション
  - メタ情報を `meta: { current_page, total_pages, total_count, per_page }` 形式でレスポンスに含める
- [ ] 詳細レスポンスに近隣スポット（≤1.5km、距離昇順）を含める
  - Geokit の `Geokit::LatLng#distance_to(other, units: :meters)` を利用
  - `distance_meters` を整数で返す

### レスポンス契約

`matcha-to-jinja/docs/migration-plan.md` の **1-3 API レスポンス設計** に準拠する。
特に以下を **必ず一致させる**:

- `Greentea` / `Temple` の フィールド名（snake_case）
- `latitude` / `longitude` を含める（`/nearby` だけでなく一覧・詳細でも）
- 一覧の `meta` キー名
- 詳細の `nearby_*` 配列の構造（`id`, `name`, `latitude`, `longitude`, `distance_meters` 等）

### 受け入れ条件

- フロントの mock データ（matcha-to-jinja `src/lib/api/mock/data.ts`）と同じスキーマで返る
- フロントを `NEXT_PUBLIC_USE_MOCK=false NEXT_PUBLIC_API_URL=http://localhost:3001` で起動し、一覧 / 詳細 / 検索 / ページネーションが動作する

### 参考

- matcha-to-jinja: `docs/migration-plan.md` 1-2, 1-3, 1-6

---

## #3 [Rails] JWT 認証 API の実装

**ラベル**: `rails`, `api`, `auth`
**依存**: #1
**対応するフロント側 issue**: matcha-to-jinja#15

### 概要

既存の Sorcery + OAuth（Twitter / LINE）を活かしつつ、フロント向けに JWT 発行 API を実装する。
フロント（NextAuth.js）は OAuth プロバイダ認証後、`access_token` を Rails に渡し、
Rails が User を作成 / 取得して **Rails 発行の JWT** を返す。

### エンドポイント

```
POST   /api/v1/auth/:provider   # provider: twitter | line
                                 # body: { access_token, access_token_secret? }
                                 # → { jwt, user: { id, name, ... } }
DELETE /api/v1/auth/logout       # クライアント側で破棄するだけでも可。サーバー側はトークン無効化リスト等
GET    /api/v1/current_user      # JWT から User を解決して返す
```

### タスク

- [ ] `Gemfile` に `jwt` gem を追加
- [ ] `JwtService`（`encode(payload)` / `decode(token)`）を `app/services/` に作成
  - HS256 / 有効期限 14 日（リフレッシュ戦略は後続で）
  - 署名鍵は `Rails.application.credentials.jwt_secret` または `ENV['JWT_SECRET_KEY']`
- [ ] `Api::V1::BaseController` に以下を追加
  - `current_user` / `authenticate_with_token!` / `require_authentication!`
  - `Authorization: Bearer <token>` ヘッダから JWT を取り出す
- [ ] `Api::V1::AuthController#create`
  - provider 別に既存の OAuth トークンを検証してユーザー情報を取得
  - User がいなければ作成、いれば取得
  - JWT を発行して返す
- [ ] `Api::V1::CurrentUserController#show`
  - 認証必須。User をシリアライズして返す
- [ ] リフレッシュ戦略の決定（短命 access + リフレッシュ or 単一長命）と issue への記録
- [ ] 不正トークン / 期限切れトークンで 401 を返すこと

### 受け入れ条件

- mock provider ではなく実 OAuth を使ったフローでもログインできる
- フロント（matcha-to-jinja の `src/lib/auth.ts` の `jwt` callback）の TODO コメントを差し替えるだけで結合できる
- 期限切れ JWT で叩くと 401

### 参考

- matcha-to-jinja: `docs/migration-plan.md` 1-4, Phase 3

---

## #4 [Rails] 書き込み系 API（いいね・コメント）の実装

**ラベル**: `rails`, `api`
**依存**: #1, #3
**対応するフロント側 issue**: matcha-to-jinja#16

### 概要

いいね（お気に入り）とコメントの API を実装する。**すべて認証必須**。

### エンドポイント

```
GET    /api/v1/greentea_likes           # 自分のお気に入り抹茶店一覧
POST   /api/v1/greentea_likes           # body: { greentea_id }
DELETE /api/v1/greentea_likes/:id        # :id は greentea_id を受ける運用

GET    /api/v1/temple_likes
POST   /api/v1/temple_likes
DELETE /api/v1/temple_likes/:id

GET    /api/v1/greenteacomments?greentea_id=:id
POST   /api/v1/greenteacomments         # body: { greentea_id, body }
DELETE /api/v1/greenteacomments/:id      # 自分のコメントのみ削除可

GET    /api/v1/templecomments?temple_id=:id
POST   /api/v1/templecomments
DELETE /api/v1/templecomments/:id
```

> **`DELETE /greentea_likes/:id` の :id について**
> フロント側は like 行 ID を保持していないため、`:id` を `greentea_id` として解釈し
> `Like.find_by(user: current_user, greentea_id: params[:id])` で解決する設計にする。
> これで楽観的更新 UI（matcha-to-jinja PR #42）と直接結合できる。

### タスク

- [ ] `Api::V1::GreenteaLikesController`（index / create / destroy）
- [ ] `Api::V1::TempleLikesController`（index / create / destroy）
- [ ] `Api::V1::GreenteacommentsController`（index / create / destroy）
- [ ] `Api::V1::TemplecommentsController`（index / create / destroy）
- [ ] 全 action に `before_action :require_authentication!`
- [ ] コメント削除は `current_user.id == comment.user_id` をチェック。違えば 403
- [ ] 抹茶店 / 神社の **詳細 / 一覧レスポンスに以下を含めるよう #2 を拡張**:
  - `liked_by_current_user: boolean`（未認証時は `false`）
  - `like_count: integer`
- [ ] コメント一覧レスポンスに `owned_by_current_user: boolean` を含める
- [ ] like 重複作成は冪等（既に存在すれば 200 で既存を返す）または 409 Conflict（要決定）

### 受け入れ条件

- 未認証で POST すると 401
- 自分以外のコメントを DELETE すると 403
- フロント（matcha-to-jinja の `LikeButton` / `CommentSection`）が結合後そのまま動作する

### 参考

- matcha-to-jinja: `docs/migration-plan.md` 1-2, フロント PR #42

---

## #5 [Rails] 近隣検索 API の実装

**ラベル**: `rails`, `api`
**依存**: #1
**対応するフロント側 issue**: matcha-to-jinja#17

### 概要

現在地から半径 N km 以内の抹茶店・神社をまとめて返す。

### エンドポイント

```
GET /api/v1/nearby?lat=35.003&lng=135.771&radius=1.5
```

- `radius` 単位は **km**（フロント `NearbyMap` と合わせる）
- `lat` / `lng` が欠損 / 非数なら **400** を返す（フロント mock #32 で同様の検証を入れている）
- `radius` 省略時は 1.5km

### レスポンス

```json
{
  "greenteas": [
    { "id": 1, "name": "...", "latitude": 35.003, "longitude": 135.771, "distance_meters": 450 }
  ],
  "temples": [
    { "id": 3, "name": "...", "latitude": 35.005, "longitude": 135.770, "distance_meters": 800 }
  ]
}
```

- 各配列は `distance_meters` 昇順
- スポット数は各 50 件で打ち切り（パフォーマンス保護）

### タスク

- [ ] `Api::V1::NearbyController#search`
- [ ] Geokit による距離計算（必要なら `acts_as_mappable` を Greentea/Temple に追加）
- [ ] パラメータ検証（`lat` / `lng` の有限数判定、`radius` の上限 = 例: 10km）
- [ ] 専用 serializer（距離付きの軽量版）
- [ ] N+1 を避ける（`includes` 等）

### 受け入れ条件

- フロント `/nearby`（matcha-to-jinja PR #40）が実 API でそのまま動作する
- `lat=abc` で 400 が返る

### 参考

- matcha-to-jinja: `docs/migration-plan.md` 1-3 (`/nearby`)

---

## #6 [インフラ] GCP Cloud Run + Neon PostgreSQL デプロイ

**ラベル**: `infra`, `deploy`
**依存**: #1〜#5
**対応するフロント側 issue**: matcha-to-jinja#26

### 概要

Rails API を **GCP Cloud Run** にデプロイし、データベースを **Neon PostgreSQL（東京リージョン）** に移行する。
CarrierWave の画像保存先を **GCP Cloud Storage** に切り替える。

### タスク

#### Cloud Run

- [ ] `Dockerfile` 作成（multi-stage / production assets precompile / bootsnap）
- [ ] `.dockerignore` 整備（`tmp/`, `log/`, `node_modules/` 等）
- [ ] GCP プロジェクト作成（リージョン: `asia-northeast1`）
- [ ] Artifact Registry リポジトリ作成
- [ ] Cloud Run サービスデプロイ
  - `--allow-unauthenticated`
  - メモリ 512Mi / CPU 1 / 最小インスタンス 0（スケールトゥゼロ）
  - 環境変数: `RAILS_ENV=production`, `DATABASE_URL`, `FRONTEND_URL`, `JWT_SECRET_KEY`, `RAILS_MASTER_KEY`, `GCP_PROJECT_ID`, `GCS_BUCKET`
- [ ] カスタムドメイン `api.matcha-to-jinja.com` 設定 + SSL

#### Neon PostgreSQL

- [ ] Neon アカウント作成・プロジェクト作成（東京リージョン）
- [ ] 開発用 / 本番用ブランチ分け
- [ ] Heroku PostgreSQL → Neon へデータ移行
  - `heroku pg:backups:capture` → ダウンロード → `pg_restore`
- [ ] Cloud Run から接続確認（Pooled connection / SSL 必須）

#### Cloud Storage

- [ ] バケット作成（`asia-northeast1`、公開読み取り）
- [ ] CarrierWave / `fog-google` で `production` 環境のみ GCS に切替
- [ ] 既存画像の移行（Heroku ストレージ → GCS）

#### CI/CD

- [ ] GitHub Actions ワークフロー
  - `main` push で Docker build → Artifact Registry push → Cloud Run deploy
  - Workload Identity Federation で鍵レス認証
- [ ] PR で `bundle exec rspec` / `rubocop` を実行

### 受け入れ条件

- `https://api.matcha-to-jinja.com/api/v1/health` が 200
- フロント（Vercel preview）から CORS エラーなく API を叩ける
- 画像 URL が `https://storage.googleapis.com/...` で配信される
- スケールトゥゼロから起動して 5 秒以内に初回レスポンスが返る（コールドスタート許容）

### 参考

- matcha-to-jinja: `docs/migration-plan.md` 「環境構成」「GCP Cloud Run デプロイ手順」「Neon PostgreSQL セットアップ」

---

## 登録手順（メモ）

```bash
# greentea_temple リポジトリで:
gh label create rails --color "CC0000"
gh label create api --color "0E8A16"
gh label create auth --color "5319E7"
gh label create infra --color "1D76DB"
gh label create deploy --color "0052CC"

# 各 issue を作成（例: #1）
gh issue create \
  --title "[Rails] API 名前空間と基盤の構築" \
  --label "rails,api" \
  --body-file ./rails-api-issue-01.md
```

各 issue 本文は本ファイルの該当セクションを個別ファイルに切り出してから使うのが楽。
