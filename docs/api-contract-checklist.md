# API 契約 突き合わせチェック表（フロント期待値 ↔ 実 Rails API）

実 API 連携（issue #49 / #50 / #51）の前に、**Rails の実レスポンスがフロントの期待形と一致するか**を
1 エンドポイントずつ照合するためのチェック表。

## 「正本」はどこか

このリポジトリでは、フロントが期待するレスポンス形は次の 3 つで一致しているべき:

1. `docs/migration-plan.md` 1〜3（設計上の契約・人間が読む正本）
2. `src/types/`（TypeScript 型）
3. `src/lib/api/__tests__/fixtures/*.json`（MSW が配信するサンプル。`contract.test.ts` が検証）

→ **照合の基準は fixtures**。`contract.test.ts` が緑なら「フロントは fixtures の形を正しく解釈できる」ことは保証済み。
このチェック表でやるのは **「実 Rails のレスポンスが fixtures と一致するか」** の人手確認。

## 前提（URL の組み立て）

- ベース: `NEXT_PUBLIC_API_URL`（例 `http://localhost:3001`）。**`/api/v1` は含めない。**
- `src/lib/api/client.ts` が `${NEXT_PUBLIC_API_URL}/api/v1${endpoint}` を組み立てる。
- 下表の「実パス」は curl 用にプレフィックス込みで記載（`http://localhost:3001/api/v1/...`）。

## 確認の進め方

各行について、Rails を `bin/rails server -p 3001` で起動し curl で叩き、
**(1) キーのネスト名 (2) フィールド名（snake_case） (3) 型** が fixtures と一致するか確認してチェックを入れる。

```bash
# 例
curl -s http://localhost:3001/api/v1/greenteas | jq .
# 認証付き（Rails 発行 JWT を環境変数に入れて）
curl -s -H "Authorization: Bearer $JWT" http://localhost:3001/api/v1/current_user | jq .
```

---

## 読み取り系（issue #49）

### 一覧 / 詳細

| # | メソッド & 実パス | ルートキー | meta | 主なフィールド | fixture | ✅ |
|---|---|---|---|---|---|---|
| 1 | `GET /api/v1/greenteas` | `greenteas: [...]` | あり | `id, name, description, address, access, phone_number, business_hours, holiday, homepage, closed, img, latitude, longitude, genres[], likes_count` | `greenteas.list.json` | ☐ |
| 2 | `GET /api/v1/greenteas/:id` | `greentea: {...}` | なし | 上記 + `liked_by_current_user`, `nearby_temples[]`, `comments[]` | `greenteas.show.json` | ☐ |
| 3 | `GET /api/v1/temples` | `temples: [...]` | あり | `id, name, description, address, access, phone_number, business_hours, holiday, homepage, img, latitude, longitude, areas[], likes_count`（`closed` 無し） | `temples.list.json` | ☐ |
| 4 | `GET /api/v1/temples/:id` | `temple: {...}` | なし | 上記 + `liked_by_current_user`, `nearby_greenteas[]`, `comments[]` | `temples.show.json` | ☐ |
| 5 | `GET /api/v1/genres` | `genres: [...]` | **なし（全件）** | `id, name` | `genres.list.json` | ☐ |
| 6 | `GET /api/v1/areas` | `areas: [...]` | **なし（全件）** | `id, name` | `areas.list.json` | ☐ |
| 7 | `GET /api/v1/nearby?lat=&lng=&radius=` | `greenteas: [...]`, `temples: [...]` | なし | 各要素 `id, name, latitude, longitude, distance_meters` | `nearby.json` | ☐ |

### 検索パラメータ（Ransack 形式 / #1, #3）

| # | パラメータ | 備考 | ✅ |
|---|---|---|---|
| 8 | `q[name_cont]=<キーワード>` | 部分一致 | ☐ |
| 9 | `q[greentea_genres_genre_id_eq_any][]=<genre_id>`（複数指定可） | 抹茶店のジャンル絞り込み（OR検索） | ☐ |
| 10 | `q[temple_areas_area_id_eq_any][]=<area_id>`（複数指定可） | 神社のエリア絞り込み（OR検索） | ☐ |
| 11 | `page=<n>` | ページネーション | ☐ |

### meta の形

| # | 確認内容 | 期待 | ✅ |
|---|---|---|---|
| 13 | 一覧 meta のキー | `{ current_page, total_pages, total_count }` | ☐ |

### nearby 配列 / 近隣スポットの形

| # | 確認内容 | 期待 | ✅ |
|---|---|---|---|
| 13 | `nearby_temples` / `nearby_greenteas` の要素 | `{ id, name, latitude, longitude, distance_meters }` | ☐ |
| 14 | `distance_meters` の型 | **整数**（小数やメートル以外の単位でないこと） | ☐ |

---

## 認証系（issue #50）

| # | メソッド & 実パス | リクエスト body | レスポンス | fixture | ✅ |
|---|---|---|---|---|---|
| 15 | `POST /api/v1/auth/:provider` | `{ access_token, uid?, info?: { name, email, image } }` | `{ token, user: { id, name, role } }` | `auth.exchange.json` | ☐ |
| 16 | `GET /api/v1/current_user`（Bearer） | — | `{ user: { id, name, role } }` | `current_user.json` | ☐ |
| 17 | `DELETE /api/v1/auth/logout`（Bearer） | — | 204 / 空ボディ可 | — | ☐ |

| # | 確認内容 | 期待 | ✅ |
|---|---|---|---|
| 18 | `:provider` の制約 | `google` / `line` のみ受理（Rails `constraints: { provider: /line\|google/ }`） | ☐ |
| 19 | JWT のキー名 | レスポンスは `token`（`access_token` 等ではない） | ☐ |

---

## 書き込み系（issue #51・要 Bearer）

> ⚠️ **命名の罠**: いいねは **アンダースコアあり**（`greentea_likes`）、コメントは **アンダースコアなし**（`greenteacomments`）。
> Rails のルート定義と必ず突き合わせること。

### いいね

| # | メソッド & 実パス | body | レスポンス | ✅ |
|---|---|---|---|---|
| 20 | `GET /api/v1/greentea_likes`（Bearer） | — | `{ greentea_likes: [ { id, greentea, created_at } ] }` | ☐ |
| 21 | `POST /api/v1/greentea_likes`（Bearer） | `{ greentea_id }` | `{ greentea_like: { id, greentea, created_at } }` | ☐ |
| 22 | `DELETE /api/v1/greentea_likes/:id`（Bearer） | — | 204 / 空可 | ☐ |
| 23 | `GET/POST/DELETE /api/v1/temple_likes`（Bearer） | `{ temple_id }` | `{ temple_like(s): ... }` | ☐ |

| # | 確認内容 | 期待 | ✅ |
|---|---|---|---|
| 24 | **DELETE like の `:id`** | フロントは **greentea_id / temple_id** を渡す（like レコードの id ではない）。Rails 側がこれで削除できること | ☐ |

### コメント

| # | メソッド & 実パス | body | レスポンス | ✅ |
|---|---|---|---|---|
| 25 | `GET /api/v1/greenteacomments?greentea_id=<id>` | — | `{ comments: [ { id, body, user: {id,name}, created_at, owned_by_current_user } ] }` | ☐ |
| 26 | `POST /api/v1/greenteacomments`（Bearer） | `{ greentea_id, body }` | `{ comment: {...} }` | ☐ |
| 27 | `DELETE /api/v1/greenteacomments/:id`（Bearer） | — | 204 / 空可 | ☐ |
| 28 | `GET/POST/DELETE /api/v1/templecomments`（Bearer） | `{ temple_id, body }` | `{ comment(s): ... }` | ☐ |

| # | 確認内容 | 期待 | ✅ |
|---|---|---|---|
| 29 | **DELETE comment の `:id`** | こちらは **comment レコードの id**（like とは違うので注意） | ☐ |
| 30 | コメント所有判定 | `owned_by_current_user`（Bearer 有無で出し分け） | ☐ |

---

## フィールド名の要注意ポイント（ドリフトしやすい）

実装と照合した結果、特にズレやすい / 誤記しやすいもの:

| 項目 | 正（fixtures / 型） | 誤りやすい表記 |
|---|---|---|
| いいね数 | **`likes_count`** | ~~`like_count`~~ |
| 一覧 meta | `{ current_page, total_pages, total_count }` | **`per_page` は含めない**（Rails 側で削除する方針に決定。フロント未使用） |
| 距離 | `distance_meters`（整数） | ~~`distance` / `distance_km`~~ |
| いいね済み判定 | `liked_by_current_user`（**詳細のみ**） | 一覧には無い |
| コメント所有 | `owned_by_current_user` | — |
| コメントの endpoint | `greenteacomments` / `templecomments`（**`_` 無し**） | ~~`greentea_comments`~~ |
| いいねの endpoint | `greentea_likes` / `temple_likes`（**`_` あり**） | ~~`greentealikes`~~ |
| 認証ユーザー | `current_user` / `auth` の `user` は **`{ id, name, role }`**（`role` を契約に含める方針に決定） | コメント投稿者の `user` は `{ id, name }` のみで **`role` 無し** |

> いずれかが実 Rails と食い違ったら、**Rails 側を契約に寄せる**のが原則（fixtures が正本）。
> どうしても Rails 側を変えられない場合は `src/types/` と `fixtures/` を更新し、`contract.test.ts` を通してから
> フロントの該当 API 関数（`src/lib/api/*.ts`）を直す。

## CORS（curl では出ないがブラウザで出る）

curl は CORS を無視するため、curl が通っても**ブラウザでは弾かれることがある**。
実装は `client.ts` で `credentials: "include"` を付けているため、Rails 側に下記が必要:

- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Origin` が `*` ではなく **`http://localhost:3000`（本番は確定ドメイン）を明示**
- 許可メソッドに `GET, POST, DELETE` と preflight（`OPTIONS`）

詳細は `docs/local-setup.md` の CORS セクション参照。
