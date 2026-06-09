import { expect, test } from "@playwright/test";

// 最小ゴールデンパス。フル網羅は狙わない（docs/test-plan.md Phase 4）。
// すべて NEXT_PUBLIC_USE_MOCK=true のモックモードで動作する想定。

test.describe("シナリオ A: トップ → 一覧 → 詳細", () => {
  test("トップから抹茶店一覧に遷移し、カードから詳細まで辿れる", async ({
    page,
  }) => {
    await page.goto("/");
    // トップにはワードマーク（alt="抹茶と神社。"）の Logo 画像が出る。
    await expect(page.getByRole("img", { name: "抹茶と神社。" })).toBeVisible();

    // トップの主要導線「抹茶スイーツを探す」から一覧へ。
    await page.getByRole("link", { name: /抹茶スイーツを探す/ }).click();
    await page.waitForURL("**/greenteas");
    await expect(
      page.getByRole("heading", { level: 1, name: "抹茶店をさがす" }),
    ).toBeVisible();

    // 1 件目（茶寮都路里）の詳細へ。
    await page.getByRole("link", { name: "茶寮都路里" }).first().click();
    await page.waitForURL(/\/greenteas\/\d+$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "茶寮都路里" }),
    ).toBeVisible();
    // 近隣神社セクションが存在する（建仁寺が 1.5km 圏内に入る seed）。
    await expect(
      page.getByRole("heading", { level: 2, name: /近くの神社仏閣/ }),
    ).toBeVisible();
  });
});

test.describe("シナリオ B: 検索フォームで URL と結果が絞り込まれる", () => {
  test("キーワード入力で ?q= が URL に反映され、件数表示が変わる", async ({
    page,
  }) => {
    await page.goto("/greenteas");
    // 絞り込み前は全 3 件。
    await expect(page.getByText(/全\s*3\s*件/)).toBeVisible();

    await page
      .getByRole("searchbox", { name: /キーワード/ })
      .fill("中村");
    await page.getByRole("button", { name: "検索" }).click();

    // URL に q が乗る（日本語はエンコードされる）。
    await expect(page).toHaveURL(/\/greenteas\?q=/);
    await expect(page).toHaveURL(/q=(%E4%B8%AD%E6%9D%91|中村)/);

    // 中村藤吉本店のみ残る → 全 1 件。
    await expect(page.getByText(/全\s*1\s*件/)).toBeVisible();
    await expect(
      page.getByText("キーワード: 「中村」", { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "中村藤吉本店" })).toBeVisible();

    // クリアボタンで条件解除 → 全件に戻る。
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page).toHaveURL(/\/greenteas$/);
    await expect(page.getByText(/全\s*3\s*件/)).toBeVisible();

    // 注: モックの greentea は 3 件 / PER_PAGE=12 のため、Pagination は
    // 描画されない（totalPages <= 1）。ページネーション保持の挙動は
    // Pagination の単体テスト（src/components/common/__tests__/）でカバーする。
  });
});

test.describe("シナリオ C: mock ログイン → Like → お気に入り一覧", () => {
  test("ログイン後の LikeButton トグルが /mypage/greentea-likes に反映される", async ({
    page,
  }) => {
    // mock provider でログイン（NEXT_PUBLIC_USE_MOCK=true により有効化されている）。
    await page.goto("/auth/login");
    await page
      .getByRole("textbox", { name: /表示名/ })
      .fill("テスター");
    await page.getByRole("button", { name: /モックでログイン/ }).click();

    // ログイン成功で /mypage へリダイレクト。
    await page.waitForURL("**/mypage", { timeout: 15_000 });

    // 詳細ページで LikeButton を押下。
    await page.goto("/greenteas/1");
    const likeButton = page.getByRole("button", {
      name: "お気に入りに追加",
    });
    await expect(likeButton).toBeVisible();
    await likeButton.click();
    // 楽観的更新で aria-label が「解除」に切り替わる。
    await expect(
      page.getByRole("button", { name: "お気に入りを解除" }),
    ).toBeVisible();

    // お気に入り一覧に反映される。
    await page.goto("/mypage/greentea-likes");
    await expect(
      page.getByRole("heading", { level: 1, name: "抹茶店" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "茶寮都路里" }),
    ).toBeVisible();
  });
});
