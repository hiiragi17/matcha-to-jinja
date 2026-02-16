#!/bin/bash
# =============================================================================
# GitHub Issues 一括登録スクリプト
# 「抹茶と神社。」Rails API化 + Next.js 移行プロジェクト
#
# 使い方:
#   1. gh CLI をインストール: brew install gh (Mac) / sudo apt install gh (Ubuntu)
#   2. gh auth login でログイン
#   3. このスクリプトを実行: bash scripts/create-issues.sh
# =============================================================================

set -e

REPO="hiiragi17/matcha-to-jinja"

echo "================================================"
echo "  抹茶と神社。 GitHub Issues 一括登録スクリプト"
echo "  リポジトリ: $REPO"
echo "================================================"
echo ""

# gh CLI の確認
if ! command -v gh &> /dev/null; then
  echo "エラー: gh CLI がインストールされていません"
  echo "インストール方法:"
  echo "  Mac:    brew install gh"
  echo "  Ubuntu: sudo apt install gh"
  echo "  Windows: winget install GitHub.cli"
  exit 1
fi

# 認証確認
if ! gh auth status &> /dev/null; then
  echo "エラー: gh にログインしていません"
  echo "以下を実行してください: gh auth login"
  exit 1
fi

# ラベルの作成（既存なら無視）
echo "ラベルを作成中..."
gh label create "backend"  --repo "$REPO" --color "0E8A16" --description "Rails バックエンド" 2>/dev/null || true
gh label create "rails"    --repo "$REPO" --color "CC0000" --description "Ruby on Rails" 2>/dev/null || true
gh label create "frontend" --repo "$REPO" --color "1D76DB" --description "Next.js フロントエンド" 2>/dev/null || true
gh label create "nextjs"   --repo "$REPO" --color "000000" --description "Next.js" 2>/dev/null || true
gh label create "auth"     --repo "$REPO" --color "D93F0B" --description "認証関連" 2>/dev/null || true
gh label create "maps"     --repo "$REPO" --color "FBCA04" --description "Google Maps 関連" 2>/dev/null || true
gh label create "infra"    --repo "$REPO" --color "5319E7" --description "インフラ・デプロイ" 2>/dev/null || true
gh label create "deploy"   --repo "$REPO" --color "006B75" --description "デプロイ" 2>/dev/null || true
echo "ラベル作成完了"
echo ""

# -----------------------------------------------------------
# Issue #1
# -----------------------------------------------------------
echo "[1/15] [Rails] API 名前空間と基盤の構築..."
gh issue create --repo "$REPO" \
  --title "[Rails] API 名前空間と基盤の構築" \
  --label "backend,rails" \
  --body "$(cat <<'EOF'
## 概要
greentea_temple リポジトリに `api/v1` 名前空間を追加し、API コントローラーの基盤を構築する。

## タスク
- [ ] `Api::V1::BaseController` の作成（エラーハンドリング、JSON レスポンス共通処理）
- [ ] `config/routes.rb` に `namespace :api { namespace :v1 { ... } }` を追加
- [ ] `rack-cors` gem を導入し CORS 設定
- [ ] API のバージョニング対応

## 関連ファイル（greentea_temple リポジトリ）
- `app/controllers/api/v1/base_controller.rb`（新規）
- `config/routes.rb`
- `config/initializers/cors.rb`（新規）
- `Gemfile`
EOF
)"

# -----------------------------------------------------------
# Issue #2
# -----------------------------------------------------------
echo "[2/15] [Rails] 読み取り系 API エンドポイントの実装..."
gh issue create --repo "$REPO" \
  --title "[Rails] 読み取り系 API エンドポイントの実装" \
  --label "backend,rails" \
  --body "$(cat <<'EOF'
## 概要
抹茶店・神社の一覧/詳細、エリア・ジャンルの一覧 API を実装する。

## タスク
- [ ] `Api::V1::GreenteasController`（index, show）
- [ ] `Api::V1::TemplesController`（index, show）
- [ ] `Api::V1::AreasController`（index）
- [ ] `Api::V1::GenresController`（index）
- [ ] Serializer の導入（`jsonapi-serializer` or `active_model_serializers`）
- [ ] Ransack による検索パラメータの対応（`q[name_cont]` 等）
- [ ] Kaminari ページネーションのメタ情報をレスポンスに含める
- [ ] 詳細ページで近隣スポット（1.5km以内）を返す

## API エンドポイント
```
GET /api/v1/greenteas       # 一覧（検索・ページネーション対応）
GET /api/v1/greenteas/:id   # 詳細（近隣の神社含む）
GET /api/v1/temples         # 一覧（検索・ページネーション対応）
GET /api/v1/temples/:id     # 詳細（近隣の抹茶店含む）
GET /api/v1/areas           # エリア一覧
GET /api/v1/genres          # ジャンル一覧
```

## 依存
- #1 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #3
# -----------------------------------------------------------
echo "[3/15] [Rails] JWT 認証 API の実装..."
gh issue create --repo "$REPO" \
  --title "[Rails] JWT 認証 API の実装" \
  --label "backend,rails,auth" \
  --body "$(cat <<'EOF'
## 概要
既存の Sorcery + OAuth 認証を活かしつつ、フロントエンド向けに JWT トークン認証を実装する。

## タスク
- [ ] `jwt` gem の導入
- [ ] `Api::V1::AuthController`（OAuth コールバック受付、JWT 発行、ログアウト）
- [ ] `Api::V1::CurrentUserController`（ログインユーザー情報取得）
- [ ] `BaseController` に JWT 検証ロジックを追加
- [ ] トークンのリフレッシュ戦略の決定と実装

## API エンドポイント
```
POST   /api/v1/auth/:provider  # OAuth 認証開始
DELETE /api/v1/auth/logout      # ログアウト
GET    /api/v1/current_user     # ログインユーザー情報
```

## 依存
- #1 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #4
# -----------------------------------------------------------
echo "[4/15] [Rails] 書き込み系 API エンドポイントの実装..."
gh issue create --repo "$REPO" \
  --title "[Rails] 書き込み系 API エンドポイントの実装" \
  --label "backend,rails" \
  --body "$(cat <<'EOF'
## 概要
いいね（Like）とコメント機能の API を実装する。認証が必要なエンドポイント。

## タスク
- [ ] `Api::V1::GreenteaLikesController`（index, create, destroy）
- [ ] `Api::V1::TempleLikesController`（index, create, destroy）
- [ ] `Api::V1::GreenteacommentsController`（index, create, destroy）
- [ ] `Api::V1::TemplecommentsController`（index, create, destroy）
- [ ] 認証チェック（`require_authentication!`）の適用

## API エンドポイント
```
GET    /api/v1/greentea_likes          # お気に入り抹茶店一覧
POST   /api/v1/greentea_likes          # いいね追加
DELETE /api/v1/greentea_likes/:id       # いいね削除
GET    /api/v1/temple_likes            # お気に入り神社一覧
POST   /api/v1/temple_likes            # いいね追加
DELETE /api/v1/temple_likes/:id         # いいね削除
GET    /api/v1/greenteacomments         # コメント一覧
POST   /api/v1/greenteacomments         # コメント投稿
DELETE /api/v1/greenteacomments/:id      # コメント削除
GET    /api/v1/templecomments           # コメント一覧
POST   /api/v1/templecomments           # コメント投稿
DELETE /api/v1/templecomments/:id        # コメント削除
```

## 依存
- #1, #3 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #5
# -----------------------------------------------------------
echo "[5/15] [Rails] 近隣検索 API の実装..."
gh issue create --repo "$REPO" \
  --title "[Rails] 近隣検索 API の実装" \
  --label "backend,rails" \
  --body "$(cat <<'EOF'
## 概要
現在地から近くの抹茶店・神社を検索する API を実装する。

## タスク
- [ ] `Api::V1::NearbyController`（search）
- [ ] 緯度・経度・半径パラメータの受付
- [ ] Geokit を使った距離計算
- [ ] レスポンスに距離情報を含める

## API エンドポイント
```
GET /api/v1/nearby?lat=35.003&lng=135.771&radius=1.5
```

## レスポンス例
```json
{
  "greenteas": [{"id": 1, "name": "...", "distance_meters": 450}],
  "temples": [{"id": 3, "name": "...", "distance_meters": 800}]
}
```

## 依存
- #1 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #6
# -----------------------------------------------------------
echo "[6/15] [Next.js] プロジェクト基盤構築..."
gh issue create --repo "$REPO" \
  --title "[Next.js] プロジェクト基盤構築" \
  --label "frontend,nextjs" \
  --body "$(cat <<'EOF'
## 概要
Next.js プロジェクトにパッケージ追加、レイアウト、API クライアント、型定義を構築する。

## タスク
- [ ] パッケージ追加（SWR or TanStack Query、react-icons、daisyUI 等）
- [ ] TypeScript 型定義（Greentea, Temple, User, Comment, Area, Genre, API レスポンス）
- [ ] API クライアント（`lib/api/client.ts`）
- [ ] 共通レイアウト（Header, Footer, Navigation）
- [ ] 各リソースの API 関数（`lib/api/greenteas.ts` 等）

## 依存
- なし（Rails API と並行して進められる。モック/型定義から先に作成可能）
EOF
)"

# -----------------------------------------------------------
# Issue #7
# -----------------------------------------------------------
echo "[7/15] [Next.js] トップページの実装..."
gh issue create --repo "$REPO" \
  --title "[Next.js] トップページの実装" \
  --label "frontend,nextjs" \
  --body "$(cat <<'EOF'
## 概要
「抹茶と神社。」のトップページを Next.js で実装する。

## タスク
- [ ] ヒーローセクション
- [ ] おすすめ抹茶店 / 神社の表示
- [ ] ナビゲーションリンク
- [ ] レスポンシブデザイン
- [ ] 既存デザイン（daisyUI + Tailwind）の踏襲

## 依存
- #6 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #8
# -----------------------------------------------------------
echo "[8/15] [Next.js] 抹茶店 一覧・詳細ページの実装..."
gh issue create --repo "$REPO" \
  --title "[Next.js] 抹茶店 一覧・詳細ページの実装" \
  --label "frontend,nextjs" \
  --body "$(cat <<'EOF'
## 概要
抹茶店の一覧ページ（検索・ページネーション）と詳細ページ（近隣の神社表示）を実装する。

## タスク
- [ ] `/greenteas` 一覧ページ（SSR + CSR）
- [ ] 検索フォーム（キーワード、ジャンル絞り込み）
- [ ] ページネーション
- [ ] `/greenteas/[id]` 詳細ページ（SSR）
- [ ] 近隣の神社リスト表示
- [ ] GreenteaCard / GreenteaList コンポーネント

## 依存
- #2, #6 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #9
# -----------------------------------------------------------
echo "[9/15] [Next.js] 神社 一覧・詳細ページの実装..."
gh issue create --repo "$REPO" \
  --title "[Next.js] 神社 一覧・詳細ページの実装" \
  --label "frontend,nextjs" \
  --body "$(cat <<'EOF'
## 概要
神社の一覧ページ（検索・ページネーション）と詳細ページ（近隣の抹茶店表示）を実装する。

## タスク
- [ ] `/temples` 一覧ページ（SSR + CSR）
- [ ] 検索フォーム（キーワード、エリア絞り込み）
- [ ] ページネーション
- [ ] `/temples/[id]` 詳細ページ（SSR）
- [ ] 近隣の抹茶店リスト表示
- [ ] TempleCard / TempleList コンポーネント

## 依存
- #2, #6 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #10
# -----------------------------------------------------------
echo "[10/15] [Next.js] 現在地検索ページの実装（Google Maps 統合）..."
gh issue create --repo "$REPO" \
  --title "[Next.js] 現在地検索ページの実装（Google Maps 統合）" \
  --label "frontend,nextjs,maps" \
  --body "$(cat <<'EOF'
## 概要
ブラウザの Geolocation API と Google Maps を使い、現在地周辺の抹茶店・神社を地図上に表示する。

## タスク
- [ ] `/nearby` ページ（CSR）
- [ ] ブラウザ Geolocation API で現在位置取得
- [ ] Google Maps コンポーネント（`@vis.gl/react-google-maps` or `@react-google-maps/api`）
- [ ] マーカー表示（抹茶店 / 神社 アイコン）
- [ ] マーカークリックで詳細情報表示
- [ ] 半径選択 UI

## 依存
- #5, #6 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #11
# -----------------------------------------------------------
echo "[11/15] [Next.js] OAuth 認証の実装（NextAuth.js）..."
gh issue create --repo "$REPO" \
  --title "[Next.js] OAuth 認証の実装（NextAuth.js）" \
  --label "frontend,nextjs,auth" \
  --body "$(cat <<'EOF'
## 概要
NextAuth.js を使って Twitter / LINE OAuth 認証を実装し、Rails API と連携する。

## タスク
- [ ] NextAuth.js セットアップ
- [ ] Twitter OAuth プロバイダ設定
- [ ] LINE OAuth プロバイダ設定
- [ ] Rails API との JWT トークン連携
- [ ] ログイン / ログアウト UI
- [ ] ユーザーメニューコンポーネント
- [ ] 認証状態の管理（SessionProvider）

## 依存
- #3, #6 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #12
# -----------------------------------------------------------
echo "[12/15] [Next.js] いいね・コメント機能の実装..."
gh issue create --repo "$REPO" \
  --title "[Next.js] いいね・コメント機能の実装" \
  --label "frontend,nextjs" \
  --body "$(cat <<'EOF'
## 概要
抹茶店・神社へのいいね（お気に入り）機能とコメント機能のフロントエンドを実装する。

## タスク
- [ ] LikeButton コンポーネント（トグル、楽観的更新）
- [ ] CommentSection / CommentForm コンポーネント
- [ ] コメントの投稿・削除
- [ ] 未認証時のログイン誘導
- [ ] お気に入り一覧ページ（`/mypage/greentea-likes`, `/mypage/temple-likes`）

## 依存
- #4, #8, #9, #11 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #13
# -----------------------------------------------------------
echo "[13/15] [Next.js] 静的ページ・SEO・その他..."
gh issue create --repo "$REPO" \
  --title "[Next.js] 静的ページ・SEO・その他" \
  --label "frontend,nextjs" \
  --body "$(cat <<'EOF'
## 概要
利用規約、プライバシーポリシー、404ページ、SEO対策、SNSシェアボタンを実装する。

## タスク
- [ ] 利用規約ページ（`/terms`）
- [ ] プライバシーポリシーページ（`/privacy`）
- [ ] 404 Not Found ページ
- [ ] メタタグ（`metadata` API）
- [ ] OGP（Open Graph Protocol）設定
- [ ] Twitter / LINE シェアボタン

## 依存
- #6 が完了していること
EOF
)"

# -----------------------------------------------------------
# Issue #14
# -----------------------------------------------------------
echo "[14/15] [インフラ] GCP Cloud Run + Neon PostgreSQL デプロイ..."
gh issue create --repo "$REPO" \
  --title "[インフラ] GCP Cloud Run + Neon PostgreSQL デプロイ" \
  --label "infra,deploy" \
  --body "$(cat <<'EOF'
## 概要
Rails API を GCP Cloud Run にデプロイし、データベースを Neon PostgreSQL に移行する。

## タスク
- [ ] Dockerfile の作成（greentea_temple リポジトリ）
- [ ] Neon アカウント作成 & プロジェクト作成（東京リージョン）
- [ ] Heroku PostgreSQL → Neon へのデータ移行（pg_dump / pg_restore）
- [ ] GCP プロジェクト作成
- [ ] Artifact Registry セットアップ
- [ ] Cloud Run デプロイ
- [ ] 環境変数設定（DATABASE_URL, FRONTEND_URL, JWT_SECRET_KEY 等）
- [ ] CarrierWave のストレージを Cloud Storage に変更
- [ ] カスタムドメイン設定 + SSL
- [ ] GitHub Actions CI/CD セットアップ

## 依存
- #1〜#5 が完了していること（Rails API 側の実装完了後）
EOF
)"

# -----------------------------------------------------------
# Issue #15
# -----------------------------------------------------------
echo "[15/15] [インフラ] Vercel デプロイ & 本番連携..."
gh issue create --repo "$REPO" \
  --title "[インフラ] Vercel デプロイ & 本番連携" \
  --label "infra,deploy" \
  --body "$(cat <<'EOF'
## 概要
Next.js フロントエンドを Vercel にデプロイし、Cloud Run の Rails API と連携する。

## タスク
- [ ] Vercel プロジェクト作成 & GitHub リポジトリ連携
- [ ] 環境変数設定（NEXT_PUBLIC_API_URL, Google Maps API Key, NextAuth 設定）
- [ ] カスタムドメイン設定（matcha-to-jinja.com）
- [ ] API ドメイン設定（api.matcha-to-jinja.com → Cloud Run）
- [ ] CORS の本番 URL 更新
- [ ] 本番動作確認

## 依存
- #6〜#13 の主要機能が完了していること
- #14 が完了していること
EOF
)"

echo ""
echo "================================================"
echo "  全 15 件の Issue を作成しました！"
echo "  確認: gh issue list --repo $REPO"
echo "================================================"
