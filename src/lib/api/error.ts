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

// Rails のエラーボディから表示用メッセージを取り出す。
// 形式ゆれ（{ errors: [...] } / { error: "..." } / { message: "..." }）を吸収し、
// どれにも当てはまらなければ fallback を返す。
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = getErrorData(error);
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.errors)) {
      const messages = obj.errors.filter(
        (e): e is string => typeof e === "string",
      );
      if (messages.length > 0) return messages.join(" / ");
    }
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.message === "string") return obj.message;
  }
  return fallback;
}
