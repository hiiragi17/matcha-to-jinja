"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTemple, updateTemple } from "@/lib/api/admin/temples";
import { getApiErrorMessage, isUnauthorized, isValidationError } from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import {
  templeFormSchema,
  type TempleFormValues,
} from "@/lib/validation/temple";
import type { Area, Temple } from "@/types";
import ImageUrlField from "./ImageUrlField";

type TempleFormProps = {
  areas: Area[];
  mode: "create" | "edit";
  initial?: Temple;
};

function toDefaults(initial?: Temple): Partial<TempleFormValues> {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    address: initial?.address ?? "",
    access: initial?.access ?? "",
    phone_number: initial?.phone_number ?? "",
    business_hours: initial?.business_hours ?? "",
    holiday: initial?.holiday ?? "",
    homepage: initial?.homepage ?? "",
    img: initial?.img ?? "",
    // 未入力（新規）は number 入力で NaN になり、スキーマ側で必須エラーになる。
    latitude: initial?.latitude,
    longitude: initial?.longitude,
    area_ids: initial?.areas.map((a) => a.id) ?? [],
  };
}

export default function TempleForm({ areas, mode, initial }: TempleFormProps) {
  const router = useRouter();
  const authToken = useAuthToken();
  const handleSessionExpired = useSessionExpiredHandler("/admin/temples");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TempleFormValues>({
    resolver: zodResolver(templeFormSchema),
    defaultValues: toDefaults(initial),
  });

  const imgValue = watch("img") ?? "";

  const onSubmit = handleSubmit(async (values) => {
    if (!authToken) {
      await handleSessionExpired();
      return;
    }
    setSubmitError(null);
    try {
      if (mode === "create") {
        await createTemple(values, authToken);
      } else if (initial) {
        await updateTemple(initial.id, values, authToken);
      }
      router.push("/admin/temples");
      router.refresh();
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
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-5">
      <TextField
        id="name"
        label="神社名 / NAME *"
        error={errors.name?.message}
        registration={register("name")}
      />
      <TextArea
        id="description"
        label="説明 / DESCRIPTION"
        error={errors.description?.message}
        registration={register("description")}
      />
      <TextField
        id="address"
        label="住所 / ADDRESS *"
        error={errors.address?.message}
        registration={register("address")}
      />
      <TextField
        id="access"
        label="アクセス / ACCESS"
        error={errors.access?.message}
        registration={register("access")}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          id="phone_number"
          label="電話番号 / PHONE"
          error={errors.phone_number?.message}
          registration={register("phone_number")}
        />
        <TextField
          id="business_hours"
          label="参拝時間 / HOURS"
          error={errors.business_hours?.message}
          registration={register("business_hours")}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          id="holiday"
          label="定休日 / HOLIDAY"
          error={errors.holiday?.message}
          registration={register("holiday")}
        />
        <TextField
          id="homepage"
          label="ホームページ / HOMEPAGE"
          error={errors.homepage?.message}
          registration={register("homepage")}
        />
      </div>

      <ImageUrlField
        id="img"
        label="画像 URL / IMAGE"
        value={imgValue}
        error={errors.img?.message}
        registration={register("img")}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <NumberField
          id="latitude"
          label="緯度 / LATITUDE *"
          error={errors.latitude?.message}
          registration={register("latitude", { valueAsNumber: true })}
        />
        <NumberField
          id="longitude"
          label="経度 / LONGITUDE *"
          error={errors.longitude?.message}
          registration={register("longitude", { valueAsNumber: true })}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-sans-jp text-[11px] tracking-[0.2em] text-olive">
          エリア / AREAS
        </legend>
        <Controller
          control={control}
          name="area_ids"
          render={({ field }) => (
            <div className="flex flex-wrap gap-3">
              {areas.map((area) => {
                const checked = field.value?.includes(area.id) ?? false;
                return (
                  <label
                    key={area.id}
                    className="flex items-center gap-1.5 border border-line bg-paper px-3 py-1.5"
                  >
                    <input
                      type="checkbox"
                      value={area.id}
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(field.value ?? []);
                        if (e.target.checked) next.add(area.id);
                        else next.delete(area.id);
                        field.onChange([...next]);
                      }}
                      className="h-4 w-4 accent-olive"
                    />
                    <span className="font-serif-jp text-sm text-ink">
                      {area.name}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        />
      </fieldset>

      {submitError && (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          {submitError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="border border-olive bg-olive px-6 py-2 font-mincho text-[13px] tracking-[0.15em] text-paper transition-colors hover:bg-olive-dark disabled:opacity-60"
        >
          {isSubmitting ? "保存中…" : mode === "create" ? "作成する" : "更新する"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/temples")}
          disabled={isSubmitting}
          className="border border-line bg-paper px-5 py-2 font-mincho text-[13px] tracking-[0.15em] text-ink transition-colors hover:bg-washi disabled:opacity-60"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  registration: React.ComponentProps<"input">;
};

function TextField({ id, label, error, registration }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-sans-jp text-[11px] tracking-[0.2em] text-olive"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink placeholder:text-muted/60 focus:border-olive focus:outline-none"
        {...registration}
      />
      {error && (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          {error}
        </p>
      )}
    </div>
  );
}

function NumberField({ id, label, error, registration }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-sans-jp text-[11px] tracking-[0.2em] text-olive"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        step="any"
        className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink focus:border-olive focus:outline-none"
        {...registration}
      />
      {error && (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          {error}
        </p>
      )}
    </div>
  );
}

function TextArea({
  id,
  label,
  error,
  registration,
}: {
  id: string;
  label: string;
  error?: string;
  registration: React.ComponentProps<"textarea">;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-sans-jp text-[11px] tracking-[0.2em] text-olive"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className="resize-y border border-line bg-washi px-3 py-2 font-serif-jp text-sm leading-[1.9] text-ink focus:border-olive focus:outline-none"
        {...registration}
      />
      {error && (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          {error}
        </p>
      )}
    </div>
  );
}
