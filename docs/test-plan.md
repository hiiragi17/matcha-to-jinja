# テスト追加 計画書

`matcha-to-jinja`（Next.js フロント）にテストを導入するための計画。
現状 0 件 → 段階的に **ユニット → コンポーネント → 結合 → E2E** の順で積み上げる。

## 1. 方針

### 1-1. 何を守るためのテストか
- **API クライアント / モック層 / 純粋ロジック**: リファクタや Rails 連携切替（#15 / #16 連携）で壊さないための回帰防止。
- **インタラクティブ要素**: 楽観的更新やフォーム検証など、視覚確認では見落としやすい状態遷移を保証する。
- **SSR ルーティング**: `notFound()` 分岐や `redirect` の境界（例: 範囲外 `page=`）を CI で検証する。
- **E2E（最小限）**: モックバックエンドで「ゴールデンパス」だけ Playwright で押さえる。フル網羅は狙わない。

### 1-2. 優先度の付け方
| 優先度 | 対象 | 理由 |
|--------|------|------|
| **A** | 純粋ロジック / API クライアント / モック層 | 副作用がなく書きやすい。ROI が最も高い |
| **B** | Client Component（LikeButton, CommentSection, Pagination, 検索フォーム） | 状態管理バグが出やすい場所 |
| **C** | Server Component / ページ（SSR の分岐） | コンパイル時に多くは弾けるが、`notFound` / `redirect` の境界は実行時 |
| **D** | E2E（Playwright + モック） | コストが高いので最小ゴールデンパスのみ |

---

## 2. ツールチェーン

| 用途 | ライブラリ | 採用理由 |
|------|-----------|---------|
| テストランナー | **Vitest** | Next.js 15 + React 19 + Tailwind v4 と相性が良く、ESM ネイティブで高速。Jest との API 互換あり |
| コンポーネント | **@testing-library/react** + **@testing-library/user-event** | RTL は事実上の標準 |
| DOM 環境 | **jsdom**（`vitest` 経由） | jsdom で十分。`happy-dom` は実装差分でハマるケースあり |
| HTTP モック | **MSW (Mock Service Worker)** | `apiClient` の実 fetch 経路（USE_MOCK=false）の検証に必要 |
| E2E | **Playwright** | Next.js 公式推奨 |
| カバレッジ | **@vitest/coverage-v8** | v8 ネイティブで速い |

### `package.json` 追加スクリプト案

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

### 追加 devDependencies

```
vitest @vitejs/plugin-react @vitest/coverage-v8
@testing-library/react @testing-library/jest-dom @testing-library/user-event
jsdom msw
@playwright/test
```

---

## 3. ディレクトリ構成

```
src/
  lib/api/__tests__/        # client, buildQuery, 各リソース API
  lib/api/mock/__tests__/   # モックルーター・state
  components/**/__tests__/  # コンポーネントごとに同階層
  app/**/__tests__/         # ページレベル（SSR 分岐のみ）
tests/
  e2e/                      # Playwright spec
  msw/handlers.ts           # MSW ハンドラ
  setup/                    # vitest.setup.ts 等
vitest.config.ts
playwright.config.ts
```

---

## 4. テスト対象とケース（フェーズ別）

### Phase 1 — 純粋ロジック / API 層（優先度 A）

**目標: 1〜2 日で着地。一番費用対効果が高い。**

#### 4-1. `src/lib/api/client.ts`
- `buildQuery`
  - `undefined` / `null` / 空文字は除外される
  - ネストしたオブジェクトが `key[nestedKey]` に展開される（Ransack 形式）
  - 値なし → 空文字を返す（先頭 `?` を付けない）
  - 真偽値・数値が文字列化される
- `apiClient`（USE_MOCK=false 経路、MSW でモック）
  - `GET` 時 `Content-Type` を付与しない
  - `POST` 時 `Content-Type: application/json` を付与
  - 既存 `Headers` インスタンスとマージしても欠落しない
  - `authToken` 指定で `Authorization: Bearer ...` が付く / 既存 `Authorization` は上書きしない
  - レスポンス 204 で `undefined` を返す（`res.json()` の SyntaxError を起こさない）
  - 空ボディ 200 でも `undefined` を返す
  - 非 2xx で `ApiError(status, body)` を throw
  - 非 JSON のエラーボディでも throw できる

#### 4-2. `src/lib/api/mock/index.ts`
- `/greenteas`
  - `q[name_cont]` で部分一致絞り込み
  - `q[genres_id_eq]` で絞り込み
  - `page` / `per_page` のページネーション `meta`（`current_page` / `total_pages` / `total_count`）
- `/greenteas/:id`
  - 存在 → 詳細 + `nearby_temples`（1.5km 以内・距離昇順）
  - 不在 → `ApiError(404)`
- `/temples` / `/temples/:id` も同様
- `/nearby`
  - `lat` / `lng` の欠損・非数で `ApiError(400)`（PR #32 で入れた検証）
  - `radius=1.5` で 1500m 以内のスポットのみ返る
  - 距離昇順
- `/greentea_likes` / `/temple_likes`
  - 未認証（`Authorization` なし）で 401
  - 重複 POST は冪等（または 409 — 実装に合わせる）
  - DELETE は `:id` を `greentea_id` として解決する旨の挙動確認
- `/greenteacomments` / `/templecomments`
  - POST で `ownerId` が記録される
  - 一覧で `owned_by_current_user` が自分のものだけ true
  - 他人のコメントを DELETE すると 403

#### 4-3. `src/lib/api/mock/state.ts`
- インメモリストアのリセットユーティリティが各テスト前に効く
- 同一ユーザーの like 重複が出ない

> Haversine 距離計算（`distanceMeters`）は `mock/index.ts` 内のプライベート関数。
> テスト容易性のため `src/lib/utils/distance.ts` に切り出すリファクタを推奨（CLAUDE.md のディレクトリ計画にも `lib/utils/distance.ts` がある）。

---

### Phase 2 — Client Component（優先度 B）

**目標: 1〜2 日。状態遷移が複雑な 4 つに絞る。**

#### 4-4. `LikeButton`
- 未ログインでクリック → `/auth/login?callbackUrl=...` に遷移（`next/navigation` を `vi.mock`）
- ログイン済でクリック → カウントが即座に +1（楽観的更新）
- API が 401 を返す → カウントがロールバックされ、ログインへ誘導
- API が 5xx → カウントがロールバック、ボタンが再度押せる状態に戻る
- 連打しても二重リクエストが発生しない（loading 中は disabled）

#### 4-5. `CommentSection`
- 空白のみは送信ボタンが disabled
- 500 文字超で文字数カウンタが警告色になり送信不可
- 投稿成功 → リスト先頭に追加される
- 自分のコメントだけ「削除」ボタンが出る（`owned_by_current_user`）
- 削除 → 確認ダイアログ後にリストから消える
- 未ログイン → フォームが「ログインが必要」案内に置き換わる

#### 4-6. `Pagination`
- 現在ページが disabled / aria-current 表示
- 1 ページ目で前へが disabled、最終ページで次へが disabled
- `preservedQuery`（`q` / `genre` / `area`）がリンクに保持される
- 不正な `page`（負数・非数）でも壊れない

#### 4-7. 検索フォーム（`GreenteaSearchForm` / `TempleSearchForm`）
- 入力で URL が `?q=...` に更新される（`useRouter().replace` を確認）
- 条件変更時に `page` が 1 にリセットされる
- クリアボタンで `q` / `genre`(/`area`) が消える

---

### Phase 3 — SSR ページの境界（優先度 C）

**目標: 0.5 日。Server Component は薄く、境界 1〜2 箇所だけ。**

- `/greenteas/[id]` / `/temples/[id]`
  - `getGreentea` が `ApiError(404)` を投げると `notFound()` が呼ばれる（`next/navigation` モック経由）
- `/greenteas` / `/temples`
  - `searchParams.page` が `total_pages` を超えたとき最終ページへ `redirect` する
- `/mypage/*-likes`
  - 未ログインで CSR ガード（ログイン誘導表示）

> Server Component の単体テストは公式サポートが薄いので、**ロジックを取り出した純関数を Phase 1 でカバー**し、ページレベルは E2E に寄せる。

---

### Phase 4 — E2E（優先度 D）

**目標: 1 日。モックモードで起動し、最小 3 シナリオだけ。**

```
NEXT_PUBLIC_USE_MOCK=true AUTH_SECRET=test npm run dev
```

を Playwright の `webServer` で起動する。

> **`next dev` を使う理由**: `src/lib/auth.ts` の mock Credentials provider は
> `NODE_ENV !== "production"` のときだけ有効になる（本番混入防止）。
> `next build && next start` は NODE_ENV=production になるため、シナリオ C（mock ログイン）
> が通らない。
> 本番ビルド経路を E2E でも通したい場合は、`auth.ts` に test 専用の有効化フラグ
> （例: `process.env.AUTH_ALLOW_MOCK === "true"`）を追加する別タスクが必要。

- シナリオ A: トップ → `/greenteas` → カードクリック → 詳細表示
- シナリオ B: `/greenteas` で検索 → URL に `?q=...` 反映 → 結果絞り込み確認 → ページネーション
- シナリオ C: mock ログイン → 詳細ページで LikeButton トグル → `/mypage/greentea-likes` に反映

> 認証は `next-auth` の Credentials (mock) provider をそのまま利用。
> Rails 連携前提のシナリオは含めない。

---

## 5. CI 連携

- GitHub Actions に `.github/workflows/test.yml` を追加
  - `npm ci` → `npm run lint` → `npm run test` → `npm run build`
  - E2E は別ジョブ（`playwright install --with-deps` を含む）
- PR で全部 green を必須にする（main 直接 push なしの運用は既存）
- カバレッジは初期は **しきい値なし**。Phase 1 完了後に
  - `src/lib/api/**` で **80%** 行カバレッジ
  - `src/components/common/**` で **60%** 行カバレッジ
  をしきい値化する。

---

## 6. 着手順と issue 分割案

GitHub issue として 4 つに分割するのを推奨。

1. **#test-infra**: Vitest / RTL / MSW のセットアップ、`vitest.config.ts`、CI ワークフロー、サンプルテスト 1 件
2. **#test-api-layer**: Phase 1（`client.ts` / `mock/*`） — Haversine 切り出しもここで実施
3. **#test-components**: Phase 2（LikeButton / CommentSection / Pagination / 検索フォーム）
4. **#test-e2e**: Phase 4（Playwright セットアップ + 3 シナリオ）

Phase 3 は重複が多いので独立 issue にせず、Phase 2 のついでに 2〜3 ケースだけ拾う。

---

## 7. やらないこと（スコープ外）

- スナップショットテスト — 帖テーマで頻繁に見た目が変わるため避ける
- `react-icons` 等サードパーティの描画確認
- Google Maps（`@vis.gl/react-google-maps`）の地図実描画 — Playwright でも flaky になりがちなので最小 smoke のみ
- Rails 連携後の結合 E2E — Rails (#15 / #16) 完成後に別途計画
- 100% カバレッジ目標 — Phase 1〜2 で重要な経路を抑えれば十分

---

## 8. リスク・補足

- **Next.js 15 + React 19 での RTL**: `act()` の警告が出る場合があるので、`@testing-library/react` は最新（v16 系）を使う。
- **`next-auth` v5 のモック**: `useSession` を `vi.mock("next-auth/react")` で差し替え、`SessionProvider` でラップして検証する。Server Component 側の `auth()` は MSW ではなく `vi.mock("@/lib/auth")` で対応。
- **MSW v2**: Service Worker 起動方式が変わっているため、Node 側は `setupServer`、ブラウザ（Playwright）側は不要（Next.js mock を使うため）。

---

## 9. マイルストーン目安

| Phase | 工数 | 完了条件 |
|-------|------|---------|
| インフラ | 0.5 日 | `npm test` が空テストで通る + CI green |
| Phase 1 | 1.5 日 | `lib/api/**` のテスト 30 件以上 |
| Phase 2 | 1.5 日 | 4 コンポーネントのテスト各 4〜6 件 |
| Phase 3 | 0.5 日 | `notFound` / `redirect` の 2〜3 ケース |
| Phase 4 | 1 日 | E2E 3 シナリオが CI で green |

合計 **約 5 日**（断続作業前提）。
