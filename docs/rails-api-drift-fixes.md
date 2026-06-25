# Rails API ドリフト修正リスト（greentea_temple 側で実施）

フロント（matcha-to-jinja）の契約正本 = `src/lib/api/__tests__/fixtures/*.json` と、
実 Rails API（greentea_temple）のレスポンスを突き合わせた結果のドリフトと、その修正方針をまとめる。

- **正本はフロントの fixtures**（`docs/api-contract-checklist.md` 参照）。原則 Rails を fixtures に寄せる。
- 検証は greentea_temple 側の `scripts/verify-api-contract.sh`（自己完結版・jq idiom 修正済み）で実走する。
- **ゴール: スクリプトが `PASS=8`（読み取り7 + current_user）になること。**
- 静的解析（全 serializer / controller）＋ローカル Rails 実走で確認済み。

## 検証時点のサマリ

```
PASS=1  DRIFT=6  FAIL=0   （+ current_user も DRIFT）
PASS したのは GET /nearby のみ
```

`GET /nearby` だけが `data` で包まず `{ greenteas:[…], temples:[…] }` を直接返している。
**これが目指すべき形の手本**。他エンドポイントもこの方針に揃える。

---

## 第1層：エンベロープ（根本原因・全体に波及）

`BaseController` の `render_collection` / `render_resource` / `render_full_collection` が
すべて **`data`** キーで包むため、フロントが期待する名前付きルートキーと総ずれする。

| 項目 | Rails 現状 | フロント期待 | 影響範囲 |
|------|-----------|-------------|----------|
| 一覧ルートキー | `data` | `greenteas` / `temples` / `genres` / `areas` | 一覧4種 |
| 詳細ルートキー | `data` | `greentea` / `temple` / `user` | show2種 + current_user |
| いいね数 | `like_count` | `likes_count` | greentea / temple の list + show |
| 認証トークン | `jwt` | `token` | POST /auth/:provider |

> ⚠️ show の `description, phone_number, homepage, genres, nearby_temples` は**ドリフトではない**。
> `data.` を `greentea.` に直せば一致する（比較基準は CLAUDE.md の散文ではなく fixtures）。

### 修正
1. `BaseController` の3メソッドを **ルートキー名を渡せる**形にする（`data` → `greenteas` / `greentea` / `temples` / …）。
2. `like_count` → **`likes_count`**（list / detail 両方の serializer）。
3. `AuthController` のトークンキー `jwt` → **`token`**。

---

## 第2層：フィールドの過不足（エンベロープ修正後に残るもの）

### 一覧 serializer が薄すぎる（フロント一覧はフルオブジェクトを期待）

- **`GreenteaSerializer`（一覧）に追加**: `closed`, `description`, `genres[]`, `homepage`, `phone_number`
- **`TempleSerializer`（一覧）に追加**: `areas[]`, `description`, `homepage`, `phone_number`
- 両一覧から**削除**: `liked_by_current_user`（フロント一覧は持たない。詳細のみ）
- `likes_count` への改名は上記第1層 #2 と同じ

### 詳細 serializer の欠落

- **`GreenteaDetailSerializer` に追加**: `closed`（DB カラムは存在するのに serializer が出していない）
- **`*DetailSerializer` に `comments[]` を丸ごと追加**（← 一番大きい穴）
  - 各要素: `id`, `body`, `created_at`, `owned_by_current_user`, `user: { id, name }`

### `closed` の補足

- `greenteas` テーブルには `closed` カラムあり（integer 型）。フロントは boolean を期待。
  serializer 出力時に **boolean へ正規化**すること（`closed: record.closed?` 等）。
- `temples` には `closed` 無し（フロント fixtures も temples に `closed` を含まないので整合。追加不要）。

---

## 決定事項（フロントと合意済み）

| 項目 | 決定 | フロント側の状態 |
|------|------|-----------------|
| `meta.per_page` | **Rails 側で削除**（フロント未使用） | 変更なし（`Meta` 型に元々無い） |
| `user.role` | **残す（両側で揃える）** | 追加済み（`AuthUser` 型 / fixtures / mock 反映済み） |

- `meta` は `{ current_page, total_pages, total_count }` のみ返す（`per_page` を出さない）。
- `current_user` / `auth` の `user` は `{ id, name, role }`。
  - フロントの fixtures は `role: "general"` を仮置き。**keypaths 比較では値は無関係**（キー有無のみ判定）。
  - role enum の実値を union で型に固定したい場合は matcha-to-jinja 側に共有すること。
  - コメント投稿者の `user` は `{ id, name }` のみ（**role 無し**）。混同しないこと。

---

## エンドポイント別 期待レスポンス（修正後の到達点）

各キーは値非依存のキーパス。配列は `[]` 表記。詳細は `docs/api-contract-checklist.md`。

| エンドポイント | ルートキー | meta | 主なフィールド |
|---|---|---|---|
| `GET /greenteas` | `greenteas[]` | あり | id, name, description, address, access, phone_number, business_hours, holiday, homepage, closed, img, latitude, longitude, genres[]{id,name}, likes_count |
| `GET /greenteas/:id` | `greentea` | なし | 上記 + liked_by_current_user, nearby_temples[]{id,name,latitude,longitude,distance_meters}, comments[]{id,body,created_at,owned_by_current_user,user{id,name}} |
| `GET /temples` | `temples[]` | あり | id, name, description, address, access, phone_number, business_hours, holiday, homepage, img, latitude, longitude, areas[]{id,name}, likes_count（`closed` 無し） |
| `GET /temples/:id` | `temple` | なし | 上記 + liked_by_current_user, nearby_greenteas[]{…}, comments[]{…} |
| `GET /genres` | `genres[]` | なし | id, name |
| `GET /areas` | `areas[]` | なし | id, name |
| `GET /nearby` | `greenteas[]`, `temples[]` | なし | id, name, latitude, longitude, distance_meters（※既に合格） |
| `POST /auth/:provider` | `token`, `user` | なし | token, user{id,name,role} |
| `GET /current_user` | `user` | なし | user{id,name,role} |

---

## チェックリスト（Rails 側 PR）

- [ ] `BaseController` のエンベロープをルートキー名指定可能にする（`data` 廃止）
- [ ] `like_count` → `likes_count`（list / detail）
- [ ] `AuthController` の `jwt` → `token`
- [ ] `meta` から `per_page` を削除
- [ ] `GreenteaSerializer`（一覧）に closed / description / genres / homepage / phone_number 追加
- [ ] `TempleSerializer`（一覧）に areas / description / homepage / phone_number 追加
- [ ] 一覧 serializer から `liked_by_current_user` 削除
- [ ] `GreenteaDetailSerializer` に `closed`（boolean 正規化）追加
- [ ] `*DetailSerializer` に `comments[]`（user{id,name} 含む）追加
- [ ] `user.role` は残す（削除しない）
- [ ] `scripts/verify-api-contract.sh` 実走で `PASS=8` を確認
