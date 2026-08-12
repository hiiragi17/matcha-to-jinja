"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import {
  ApiError,
  getApiErrorMessage,
  getCurrentUser,
  isUnauthorized,
  isValidationError,
  updateCurrentUser,
} from "@/lib/api";
import type { CurrentUserResponse } from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import { profileFormSchema, type ProfileFormValues } from "@/lib/validation/user";

type SwrKey = readonly [string, string];

// 編集画面の初期値表示には GET /current_user を使う（NextAuth の session.user.name は
// OAuth プロバイダの表示名で、Rails 側で更新した名前と食い違いうるため）。
export default function ProfileEditForm() {
  const authToken = useAuthToken();
  const { status, update } = useSession();
  const callbackUrl = "/mypage/profile";
  const handleSessionExpired = useSessionExpiredHandler(callbackUrl);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetcher = ([, token]: SwrKey): Promise<CurrentUserResponse> =>
    getCurrentUser(token);

  const { data, error, isLoading, mutate } = useSWR<
    CurrentUserResponse,
    ApiError,
    SwrKey | null
  >(authToken ? (["/current_user", authToken] as const) : null, fetcher);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "" },
  });

  // 取得完了時にフォームへ現在の表示名を反映する（defaultValues は初回マウント時点の
  // 値しか使えないため、非同期取得後は reset で明示的に流し込む）。
  // SWR はウィンドウフォーカス時等に再検証するため、編集中（isDirty）に再取得が
  // 走ると入力中の値が上書きされてしまう。編集中でないときだけ反映する。
  useEffect(() => {
    if (data?.user && !isDirty) reset({ name: data.user.name });
  }, [data, isDirty, reset]);

  const sessionExpired = !!error && isUnauthorized(error);
  useEffect(() => {
    if (sessionExpired) void handleSessionExpired();
  }, [sessionExpired, handleSessionExpired]);

  // NextAuth セッション解決中はログイン CTA を出さない。解決前は railsJwt が
  // 一時的に undefined になり、ログイン済みでも一瞬「ログインが必要」が見えてしまうため
  // （CommentModerationList / mypage と同じガード）。
  if (status === "loading") {
    return (
      <p className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
        読み込み中…
      </p>
    );
  }

  if (!authToken) {
    return (
      <div className="border border-line-soft bg-paper px-5 py-6">
        <p className="font-serif-jp text-sm leading-[1.9] text-muted">
          プロフィールの編集にはログインが必要です。
        </p>
        <Link
          href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="mt-3 inline-block border border-olive px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:bg-olive hover:text-paper"
        >
          ログインへ
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
        読み込み中…
      </p>
    );
  }

  if (error && !sessionExpired) {
    return (
      <p role="alert" className="font-serif-jp text-sm text-muted">
        プロフィールの取得に失敗しました。時間を置いてお試しください。
      </p>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSaved(false);
    try {
      const res = await updateCurrentUser(values, authToken);
      // 直後の再取得に頼らず、PATCH のレスポンスでキャッシュを直接更新する
      // （キャッシュの取り回しで古い名前が一瞬見える事故を避ける）。
      await mutate(res, { revalidate: false });
      reset({ name: res.user.name });
      setSaved(true);
      // ヘッダー等のセッション表示名反映は best-effort。ここが失敗/null でも
      // Rails 側の保存自体は成功しているため、保存失敗として扱わない
      // （次回のセッション再検証で追いつく）。
      try {
        await update({ name: res.user.name });
      } catch (sessionError) {
        console.warn(
          "[ProfileEditForm] session update failed",
          sessionError,
        );
      }
    } catch (e) {
      if (isUnauthorized(e)) {
        await handleSessionExpired();
        return;
      }
      if (isValidationError(e)) {
        setSubmitError(getApiErrorMessage(e, "入力内容を確認してください。"));
        return;
      }
      setSubmitError("保存に失敗しました。時間を置いてお試しください。");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="profile-name"
          className="font-sans-jp text-[11px] tracking-[0.2em] text-olive"
        >
          表示名 / NAME *
        </label>
        <input
          id="profile-name"
          type="text"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "profile-name-error" : undefined}
          className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink placeholder:text-muted/60 focus:border-olive focus:outline-none"
          {...register("name")}
        />
        {errors.name && (
          <p
            id="profile-name-error"
            role="alert"
            className="font-sans-jp text-xs text-bengara"
          >
            {errors.name.message}
          </p>
        )}
      </div>

      {submitError && (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          {submitError}
        </p>
      )}
      {saved && !submitError && (
        <p className="font-sans-jp text-xs text-olive">
          プロフィールを更新しました。
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="border border-olive bg-olive px-6 py-2 font-mincho text-[13px] tracking-[0.15em] text-paper transition-colors hover:bg-olive-dark disabled:opacity-60"
        >
          {isSubmitting ? "保存中…" : "変更を保存"}
        </button>
      </div>
    </form>
  );
}
