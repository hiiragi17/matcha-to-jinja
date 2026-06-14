// ログイン後のリダイレクト先（callbackUrl）を検証する。
// オープンリダイレクトを防ぐため、自サイト内の絶対パス（"/foo"）のみ許可し、
// "//evil.com"（プロトコル相対）や "http://..." のような外部 URL は fallback に倒す。
export function safeCallbackUrl(
  raw: string | string[] | undefined,
  fallback = "/mypage",
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return fallback;
}
