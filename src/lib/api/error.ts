export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, data: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ネットワーク断や予期しない例外（ApiError 以外）では null を返す。
// 呼び出し側は「status が取れない＝通信レベルの失敗」として扱える。
export function getErrorStatus(error: unknown): number | null {
  return error instanceof ApiError ? error.status : null;
}

export function getErrorData(error: unknown): unknown {
  return error instanceof ApiError ? error.data : null;
}

export function isUnauthorized(error: unknown): boolean {
  return getErrorStatus(error) === 401;
}

export function isForbidden(error: unknown): boolean {
  return getErrorStatus(error) === 403;
}

export function isValidationError(error: unknown): boolean {
  return getErrorStatus(error) === 422;
}

// string / string[] / { field: string | string[] } のいずれからも文字列メッセージを
// 平坦化して集める。空要素・非文字列は捨てる。
function collectMessages(value: unknown): string[] {
  if (typeof value === "string") {
    return value.length > 0 ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string" && v.length > 0);
  }
  if (value && typeof value === "object") {
    // Rails の { field: ["msg", ...] } / { field: "msg" }（ActiveModel errors）を展開する。
    return Object.values(value).flatMap((v) => collectMessages(v));
  }
  return [];
}

// Rails / mock のエラーボディから表示用メッセージを取り出す。
// 形式ゆれを吸収する:
//   - { errors: ["msg", ...] }                （文字列配列）
//   - { errors: { field: ["msg"] | "msg" } }  （Rails ActiveModel 標準ハッシュ）
//   - { details: ["msg", ...] }               （本リポジトリ mock の 422）
//   - { error: "msg" } / { message: "msg" }   （単一メッセージ）
// フィールド別ハッシュや details は具体的なので、汎用になりがちな error/message より優先する。
// どれにも当てはまらなければ fallback を返す。
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = getErrorData(error);
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    const errorsMessages = collectMessages(obj.errors);
    if (errorsMessages.length > 0) return errorsMessages.join(" / ");

    const detailsMessages = collectMessages(obj.details);
    if (detailsMessages.length > 0) return detailsMessages.join(" / ");

    if (typeof obj.error === "string" && obj.error.length > 0) return obj.error;
    if (typeof obj.message === "string" && obj.message.length > 0) {
      return obj.message;
    }
  }
  return fallback;
}
