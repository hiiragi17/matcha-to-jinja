// 表示可能な画像 URL を持つか。画像未登録のスポットでは画像枠ごと出さないための判定。
// img が空（管理画面で img を空登録した場合や、実 API が空を返した場合）なら false。
export function hasImage(url: string | null | undefined): boolean {
  return typeof url === "string" && url.trim() !== "";
}
