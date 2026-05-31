"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type MockLoginFormProps = {
  callbackUrl?: string;
};

export default function MockLoginForm({
  callbackUrl = "/mypage",
}: MockLoginFormProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
          await signIn("mock", { name, callbackUrl });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <label className="flex flex-col gap-1.5 text-left">
        <span className="font-sans-jp text-[11px] tracking-[0.1em] text-muted">
          表示名（任意）
        </span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="ゲストさん"
          maxLength={32}
          className="border border-line bg-paper px-3 py-2 font-serif-jp text-sm text-ink focus:border-olive focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="border border-ink bg-ink px-4 py-2.5 font-mincho text-[13px] tracking-[0.15em] text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "ログイン中…" : "モックでログイン"}
      </button>
    </form>
  );
}
