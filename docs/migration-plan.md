# 抹茶と神社。 Rails API化 + Next.js フロントエンド移行計画

## 現状分析

### greentea_temple (Rails アプリ)
- **概要**: 京都の抹茶スイーツ店と神社仏閣を組み合わせて紹介するWebアプリ
- **技術スタック**: Ruby 3.1.2 / Rails 7.0.3 / PostgreSQL / Hotwire / Tailwind CSS + daisyUI
- **認証**: Sorcery + OAuth (Twitter, LINE) ※パスワード認証なし
- **特徴的機能**: Geokit による位置情報検索（1.5km圏内の近隣スポット表示）
- **API**: 現状なし（サーバーサイドレンダリングのみ）

### matcha-to-jinja (Next.js アプリ)
- **状態**: create-next-app で生成したばかりの初期状態
- **技術スタック**: Next.js 15.3.3 / React 19 / TypeScript 5 / Tailwind CSS v4

---

## Phase 1: Rails API化 (greentea_temple リポジトリ側)

### 1-1. Rails を API モードに対応させる

Rails アプリ全体を `--api` モードに変換するのではなく、**既存のビューを残しつつ API 名前空間を追加する**方法を推奨します。これにより：
- 管理画面（Administrate）はそのまま使える
- 段階的に移行できる
- 問題発生時にロールバックしやすい

```ruby
# config/routes.rb に追加
namespace :api do
  namespace :v1 do
    resources :greenteas, only: [:index, :show]
    resources :temples, only: [:index, :show]
    resources :areas, only: [:index]
    resources :genres, only: [:index]
    resources :greentea_likes, only: [:index, :create, :destroy]
    resources :temple_likes, only: [:index, :create, :destroy]
    resources :greenteacomments, only: [:index, :create, :destroy]
    resources :templecomments, only: [:index, :create, :destroy]
    get 'nearby', to: 'nearby#search'
    resource :current_user, only: [:show]
    post 'auth/:provider', to: 'auth#create'
    delete 'auth/logout', to: 'auth#destroy'
  end
end
```

### 1-2. API コントローラーの作成

```
app/controllers/api/v1/
├── base_controller.rb          # 共通の認証・エラーハンドリング
├── greenteas_controller.rb     # 抹茶店一覧・詳細
├── temples_controller.rb       # 神社仏閣一覧・詳細
├── areas_controller.rb         # エリア一覧
├── genres_controller.rb        # ジャンル一覧
├── greentea_likes_controller.rb
├── temple_likes_controller.rb
├── greenteacomments_controller.rb
├── templecomments_controller.rb
├── nearby_controller.rb        # 近隣検索
├── current_user_controller.rb  # ログインユーザー情報
└── auth_controller.rb          # OAuth認証
```

### 1-3. API レスポンス設計

各エンドポイントのレスポンス形式：

#### GET /api/v1/greenteas
```json
{
  "greenteas": [
    {
      "id": 1,
      "name": "茶寮都路里",
      "description": "...",
      "address": "京都市東山区...",
      "phone_number": "075-XXX-XXXX",
      "business_hours": "10:00-21:00",
      "holiday": "不定休",
      "homepage": "https://...",
      "img": "https://...",
      "latitude": 35.0036,
      "longitude": 135.7714,
      "genres": [{"id": 1, "name": "パフェ"}],
      "likes_count": 12
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 48
  }
}
```

#### GET /api/v1/greenteas/:id
```json
{
  "greentea": {
    "id": 1,
    "name": "茶寮都路里",
    "description": "...",
    "address": "京都市東山区...",
    "access": "祇園四条駅から徒歩5分",
    "phone_number": "075-XXX-XXXX",
    "business_hours": "10:00-21:00",
    "holiday": "不定休",
    "homepage": "https://...",
    "closed": false,
    "img": "https://...",
    "latitude": 35.0036,
    "longitude": 135.7714,
    "genres": [{"id": 1, "name": "パフェ"}],
    "likes_count": 12,
    "liked_by_current_user": true,
    "nearby_temples": [
      {"id": 3, "name": "建仁寺", "distance_meters": 450}
    ],
    "comments": [
      {
        "id": 1,
        "body": "抹茶パフェが最高でした！",
        "user": {"id": 1, "name": "ユーザー"},
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### GET /api/v1/nearby?lat=35.003&lng=135.771&radius=1.5
```json
{
  "greenteas": [...],
  "temples": [...]
}
```

### 1-4. 認証方式の変更

現在の Sorcery セッションベース認証から、**JWT トークン認証**に移行する。

**推奨ライブラリ:**
- `jwt` gem（シンプルな JWT 生成・検証）

**フロー:**
1. Next.js フロントからOAuth認証プロバイダ（Twitter/LINE）へリダイレクト
2. コールバックで Rails API が JWT トークンを発行
3. Next.js が JWT を Cookie（httpOnly, secure, sameSite）に保存
4. 以降のAPIリクエストで Authorization ヘッダーに JWT を付与

```ruby
# app/controllers/api/v1/base_controller.rb
class Api::V1::BaseController < ActionController::API
  include ActionController::Cookies

  private

  def current_user
    @current_user ||= authenticate_with_token
  end

  def authenticate_with_token
    token = request.headers['Authorization']&.split(' ')&.last
    return nil unless token

    decoded = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')
    User.find_by(id: decoded[0]['user_id'])
  rescue JWT::DecodeError
    nil
  end

  def require_authentication!
    render json: { error: 'Unauthorized' }, status: :unauthorized unless current_user
  end
end
```

### 1-5. CORS 設定

```ruby
# Gemfile に追加
gem 'rack-cors'

# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV['FRONTEND_URL'] || 'http://localhost:3000'
    resource '/api/*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      credentials: true,
      expose: ['Authorization']
  end
end
```

### 1-6. Serializer の導入

```ruby
# Gemfile に追加
gem 'jsonapi-serializer'  # または gem 'active_model_serializers'
```

レスポンスの JSON 構造を統一的に管理する。

---

## Phase 2: Next.js フロントエンド構築 (matcha-to-jinja リポジトリ)

### 2-1. 追加パッケージ

```bash
# API通信
npm install axios swr
# または
npm install @tanstack/react-query

# 地図
npm install @react-google-maps/api
# または
npm install @vis.gl/react-google-maps

# UI コンポーネント
npm install daisyui@latest  # Tailwind CSS プラグイン（元のデザイン踏襲）

# 認証
npm install next-auth  # OAuth フロー管理

# アイコン
npm install react-icons

# フォーム
npm install react-hook-form zod @hookform/resolvers
```

### 2-2. ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # トップページ
│   ├── greenteas/
│   │   ├── page.tsx                  # 抹茶店一覧
│   │   └── [id]/
│   │       └── page.tsx              # 抹茶店詳細
│   ├── temples/
│   │   ├── page.tsx                  # 神社仏閣一覧
│   │   └── [id]/
│   │       └── page.tsx              # 神社仏閣詳細
│   ├── nearby/
│   │   └── page.tsx                  # 現在地検索
│   ├── mypage/
│   │   ├── page.tsx                  # マイページ
│   │   ├── greentea-likes/
│   │   │   └── page.tsx              # お気に入り抹茶店
│   │   └── temple-likes/
│   │       └── page.tsx              # お気に入り神社
│   ├── terms/
│   │   └── page.tsx                  # 利用規約
│   ├── privacy/
│   │   └── page.tsx                  # プライバシーポリシー
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx              # ログインページ
│   │   └── callback/
│   │       └── page.tsx              # OAuthコールバック
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth.js API ルート
│   └── not-found.tsx                 # 404ページ
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # ヘッダー
│   │   ├── Footer.tsx                # フッター
│   │   └── Navigation.tsx            # ナビゲーション
│   ├── greentea/
│   │   ├── GreenteaCard.tsx          # 抹茶店カード
│   │   ├── GreenteaList.tsx          # 抹茶店リスト
│   │   ├── GreenteaDetail.tsx        # 抹茶店詳細
│   │   └── GreenteaSearch.tsx        # 抹茶店検索
│   ├── temple/
│   │   ├── TempleCard.tsx            # 神社カード
│   │   ├── TempleList.tsx            # 神社リスト
│   │   ├── TempleDetail.tsx          # 神社詳細
│   │   └── TempleSearch.tsx          # 神社検索
│   ├── map/
│   │   ├── GoogleMap.tsx             # Google Maps コンポーネント
│   │   └── LocationMarker.tsx        # マーカー
│   ├── common/
│   │   ├── LikeButton.tsx            # いいねボタン
│   │   ├── CommentSection.tsx        # コメントセクション
│   │   ├── CommentForm.tsx           # コメントフォーム
│   │   ├── Pagination.tsx            # ページネーション
│   │   ├── SearchForm.tsx            # 検索フォーム
│   │   └── ShareButtons.tsx          # SNSシェアボタン
│   └── auth/
│       ├── LoginButton.tsx           # ログインボタン
│       └── UserMenu.tsx              # ユーザーメニュー
├── lib/
│   ├── api/
│   │   ├── client.ts                 # API クライアント (axios / fetch)
│   │   ├── greenteas.ts              # 抹茶店 API
│   │   ├── temples.ts                # 神社 API
│   │   ├── likes.ts                  # いいね API
│   │   ├── comments.ts               # コメント API
│   │   └── auth.ts                   # 認証 API
│   ├── auth.ts                       # NextAuth 設定
│   └── utils/
│       ├── distance.ts               # 距離計算ユーティリティ
│       └── format.ts                 # 日付等フォーマット
└── types/
    ├── greentea.ts                   # 抹茶店型定義
    ├── temple.ts                     # 神社型定義
    ├── user.ts                       # ユーザー型定義
    ├── comment.ts                    # コメント型定義
    └── api.ts                        # API レスポンス型定義
```

### 2-3. TypeScript 型定義

```typescript
// types/greentea.ts
export interface Greentea {
  id: number;
  name: string;
  description: string;
  address: string;
  access: string;
  phone_number: string;
  business_hours: string;
  holiday: string;
  homepage: string;
  closed: boolean;
  img: string;
  latitude: number;
  longitude: number;
  genres: Genre[];
  likes_count: number;
  liked_by_current_user?: boolean;
}

// types/temple.ts
export interface Temple {
  id: number;
  name: string;
  description: string;
  address: string;
  access: string;
  phone_number: string;
  business_hours: string;
  holiday: string;
  homepage: string;
  img: string;
  latitude: number;
  longitude: number;
  areas: Area[];
  likes_count: number;
  liked_by_current_user?: boolean;
}

// types/api.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}
```

### 2-4. ページごとのレンダリング戦略

| ページ | レンダリング方式 | 理由 |
|--------|-----------------|------|
| トップページ | SSG (Static) | コンテンツが静的 |
| 抹茶店一覧 | SSR + CSR | 検索・ページネーションはCSR、初期表示はSSR（SEO対策） |
| 抹茶店詳細 | SSR | SEO対策 + 動的コンテンツ（コメント等） |
| 神社一覧 | SSR + CSR | 同上 |
| 神社詳細 | SSR | 同上 |
| 現在地検索 | CSR | ブラウザの Geolocation API 依存 |
| マイページ | CSR | 認証必須、SEO不要 |
| ログイン | SSG | 静的ページ |
| 利用規約/プライバシーポリシー | SSG | 静的コンテンツ |

### 2-5. API クライアント設計

```typescript
// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}/api/v1${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.json());
  }

  return res.json();
}
```

---

## Phase 3: 認証フローの詳細設計

### OAuth フロー（Next.js + Rails API）

```
[ユーザー] → [Next.js] → [OAuth Provider (Twitter/LINE)]
                                    ↓
                              [コールバック]
                                    ↓
                        [Next.js API Route で受信]
                                    ↓
                    [Rails API に認証コード送信]
                                    ↓
                      [Rails が JWT トークン発行]
                                    ↓
                  [Next.js が httpOnly Cookie に保存]
                                    ↓
                      [以降の API リクエストに付与]
```

**NextAuth.js を使用する場合:**
- NextAuth がOAuthフローを管理
- カスタムプロバイダーでRails APIと連携
- セッション管理はNextAuth側で行い、Rails APIへのリクエスト時にトークンを付与

---

## Phase 4: 移行のステップ（推奨順序）

### Step 1: Rails API エンドポイントの構築
1. `api/v1` 名前空間の作成
2. CORS 設定
3. 読み取り系 API（greenteas, temples, areas, genres の index/show）
4. Serializer の実装
5. 認証 API（JWT発行）
6. 書き込み系 API（likes, comments の create/destroy）
7. 近隣検索 API

### Step 2: Next.js 基盤構築
1. パッケージインストール
2. レイアウト（ヘッダー、フッター、ナビゲーション）
3. API クライアント
4. 型定義

### Step 3: 公開ページの実装
1. トップページ
2. 抹茶店一覧・詳細
3. 神社一覧・詳細
4. 現在地検索（Google Maps 統合）

### Step 4: 認証機能
1. NextAuth.js セットアップ
2. ログイン/ログアウト
3. ユーザーメニュー

### Step 5: 認証が必要な機能
1. いいね機能
2. コメント機能
3. マイページ

### Step 6: その他
1. 404 ページ
2. 利用規約・プライバシーポリシー
3. SEO（メタタグ）
4. SNS シェアボタン
5. レスポンシブデザイン

---

## 環境構成

### 開発環境
- **Rails API**: `localhost:3001`（ポート変更）
- **Next.js**: `localhost:3000`

### 本番環境の選択肢

| 構成 | フロント | バックエンド | 特徴 |
|------|---------|-------------|------|
| **案A** | Vercel | Heroku (既存) | 最も簡単。Vercel は Next.js に最適化 |
| **案B** | Vercel | Railway/Render | Heroku 無料枠廃止対応 |
| **案C** | 両方 Heroku | Heroku | 一元管理 |

**推奨: 案A**（Vercel + Heroku）
- 既存の Heroku デプロイをそのまま活用
- Vercel は Next.js のデプロイに最適化されている
- 環境変数で API URL を設定するだけで連携可能

### 環境変数

#### Next.js 側 (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxx
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxxxx
```

#### Rails 側 (.env)
```
FRONTEND_URL=http://localhost:3000
JWT_SECRET_KEY=xxxxx  # または Rails.application.secret_key_base を使用
```

---

## 注意点・考慮事項

1. **画像**: 現在 CarrierWave で管理されている画像の URL が API レスポンスで正しく返されるか確認
2. **Geocoding**: Geokit のジオコーディングは Rails 側で引き続き処理。フロントは座標を受け取るだけ
3. **検索**: Ransack の検索パラメータを API で受け付けるように変換（`q[name_cont]` 等）
4. **ページネーション**: Kaminari のメタ情報を API レスポンスに含める
5. **管理画面**: Administrate はそのまま Rails 側で運用（API化の対象外）
6. **LINE/Twitter OAuth**: プロバイダのコールバック URL を Next.js 側に変更する必要あり
