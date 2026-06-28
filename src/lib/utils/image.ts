// 画像 URL が未設定（管理画面で img を空登録した場合や、実 API が空を返した場合）に
// 使う「画像なし」プレースホルダ。外部依存を避けるため inline SVG の data URI にする。
// img の src を空のままにするとブラウザが現在ページURLを再取得し、壊れた画像表示や
// 余計なリクエストが発生するため、必ずこの関数で空をプレースホルダへ寄せる。
const NO_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#ece9e1"/><text x="50%" y="50%" fill="#9a958a" font-family="serif" font-size="20" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`;

export const NO_IMAGE_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  NO_IMAGE_SVG,
)}`;

export function imageSrcOrPlaceholder(url: string | null | undefined): string {
  return url && url.trim() !== "" ? url : NO_IMAGE_PLACEHOLDER;
}
