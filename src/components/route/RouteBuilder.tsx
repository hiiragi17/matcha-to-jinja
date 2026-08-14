"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ChawanIcon, ToriiIcon } from "@/components/brand/icons";
import Loader from "../common/Loader";
import {
  ApiError,
  createRoute,
  getApiErrorMessage,
  getGreenteas,
  getTemples,
  isUnauthorized,
  isValidationError,
  updateRoute,
} from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import { routeFormSchema, toRouteInput } from "@/lib/validation/route";
import type {
  GreenteaListResponse,
  RouteDetail,
  SpotType,
  TempleListResponse,
  Transport,
} from "@/types";

type RouteBuilderProps = {
  mode: "create" | "edit";
  initial?: RouteDetail;
};

type SelectedSpot = {
  spot_type: SpotType;
  spot_id: number;
  name: string;
  transport: Transport;
};

const TRANSPORT_OPTIONS: { value: Exclude<Transport, null>; label: string }[] = [
  { value: "walk", label: "徒歩" },
  { value: "train", label: "電車" },
  { value: "bus", label: "バス" },
  { value: "car", label: "車" },
];

function toSelected(initial?: RouteDetail): SelectedSpot[] {
  return (
    initial?.spots.map((s) => ({
      spot_type: s.spot_type,
      spot_id: s.id,
      name: s.name,
      transport: s.transport,
    })) ?? []
  );
}

// 並び順・スポット・移動手段が初期状態と同一かどうか。
// 同一ならタイトル/説明のみ変更とみなし、PATCH で spots を省く（経路再計算を避ける）。
function spotsUnchanged(a: SelectedSpot[], b: SelectedSpot[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => {
    const t = b[i];
    // 末尾の transport はサーバ側で null になるため比較から除外する。
    const isLast = i === a.length - 1;
    return (
      s.spot_type === t.spot_type &&
      s.spot_id === t.spot_id &&
      (isLast || s.transport === t.transport)
    );
  });
}

export default function RouteBuilder({ mode, initial }: RouteBuilderProps) {
  const router = useRouter();
  const authToken = useAuthToken();
  const callbackUrl =
    mode === "edit" && initial
      ? `/routes/${initial.id}/edit`
      : "/routes/new";
  const handleSessionExpired = useSessionExpiredHandler(callbackUrl);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [selected, setSelected] = useState<SelectedSpot[]>(() =>
    toSelected(initial),
  );
  const [tab, setTab] = useState<SpotType>("greentea");
  const [search, setSearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialSelected = useMemo(() => toSelected(initial), [initial]);

  // transport は「そのスポットから次のスポットへの手段」。並び替え・削除で
  // 「次のスポット」が変わると手段が別の区間に付いたままになるため、
  // 隣接が変化したスポットの transport はクリアして状態の整合を保つ。
  const clearTransportAt = (spots: SelectedSpot[], index: number) => {
    if (index >= 0 && index < spots.length && spots[index].transport !== null) {
      spots[index] = { ...spots[index], transport: null };
    }
  };

  const addSpot = (spot: SelectedSpot) =>
    setSelected((prev) => [...prev, spot]);

  const removeSpot = (index: number) =>
    setSelected((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // 削除位置の直前スポットの「次」が変わるため transport をクリア
      clearTransportAt(next, index - 1);
      return next;
    });

  const moveSpot = (index: number, dir: -1 | 1) =>
    setSelected((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      // 入れ替えに関与した2要素と、その直前要素の「次」が変わるためクリア
      const lo = Math.min(index, target);
      clearTransportAt(next, lo - 1);
      clearTransportAt(next, lo);
      clearTransportAt(next, lo + 1);
      return next;
    });

  const setTransport = (index: number, transport: Transport) =>
    setSelected((prev) =>
      prev.map((s, i) => (i === index ? { ...s, transport } : s)),
    );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const parsed = routeFormSchema.safeParse({
      name,
      description,
      spots: selected.map((s) => ({
        spot_type: s.spot_type,
        spot_id: s.spot_id,
        transport: s.transport,
      })),
    });
    if (!parsed.success) {
      setSubmitError(
        parsed.error.issues[0]?.message ?? "入力内容を確認してください。",
      );
      return;
    }

    if (!authToken) {
      await handleSessionExpired();
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        const res = await createRoute(toRouteInput(parsed.data, true), authToken);
        router.push(`/routes/${res.data.id}`);
        router.refresh();
      } else if (initial) {
        const includeSpots = !spotsUnchanged(initialSelected, selected);
        const res = await updateRoute(
          initial.id,
          toRouteInput(parsed.data, includeSpots),
          authToken,
        );
        router.push(`/routes/${res.data.id}`);
        router.refresh();
      }
    } catch (err) {
      if (isUnauthorized(err)) {
        await handleSessionExpired();
        return;
      }
      if (isValidationError(err)) {
        setSubmitError(getApiErrorMessage(err, "入力内容を確認してください。"));
      } else {
        setSubmitError("保存に失敗しました。時間を置いてお試しください。");
      }
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="route-name"
            className="font-sans-jp text-[11px] tracking-[0.2em] text-olive"
          >
            コース名 / NAME *
          </label>
          <input
            id="route-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="祇園抹茶巡り"
            className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink placeholder:text-muted/60 focus:border-olive focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="route-description"
            className="font-sans-jp text-[11px] tracking-[0.2em] text-olive"
          >
            説明 / DESCRIPTION
          </label>
          <textarea
            id="route-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="神社とお茶屋さんを巡る半日コース"
            className="resize-y border border-line bg-washi px-3 py-2 font-serif-jp text-sm leading-[1.9] text-ink placeholder:text-muted/60 focus:border-olive focus:outline-none"
          />
        </div>
      </div>

      <SelectedSpots
        selected={selected}
        onMove={moveSpot}
        onRemove={removeSpot}
        onTransport={setTransport}
      />

      <SpotPicker
        tab={tab}
        onTab={setTab}
        search={search}
        onSearch={setSearch}
        onAdd={addSpot}
      />

      {submitError && (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          {submitError}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="border border-olive bg-olive px-6 py-2 font-mincho text-[13px] tracking-[0.15em] text-paper transition-colors hover:bg-olive-dark disabled:opacity-60"
        >
          {submitting
            ? "保存中…"
            : mode === "create"
              ? "コースを作成"
              : "変更を保存"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="border border-line bg-paper px-5 py-2 font-mincho text-[13px] tracking-[0.15em] text-ink transition-colors hover:bg-washi disabled:opacity-60"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

function SelectedSpots({
  selected,
  onMove,
  onRemove,
  onTransport,
}: {
  selected: SelectedSpot[];
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (index: number) => void;
  onTransport: (index: number, transport: Transport) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mincho text-base tracking-[0.15em] text-ink">
        コースのスポット
        <span className="ml-3 font-sans-jp text-xs tracking-[0.1em] text-muted">
          {selected.length} 件
        </span>
      </h2>
      {selected.length === 0 ? (
        <p className="border border-dashed border-line bg-paper px-5 py-6 text-center font-serif-jp text-sm text-muted">
          下の候補から抹茶店・神社仏閣を追加してください。追加した順にコースになります。
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {selected.map((spot, index) => {
            const isLast = index === selected.length - 1;
            return (
              <li
                key={`${spot.spot_type}-${spot.spot_id}-${index}`}
                className="flex flex-col gap-3 border border-line bg-paper px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-olive font-sans-jp text-sm text-olive">
                    {index + 1}
                  </span>
                  {spot.spot_type === "greentea" ? (
                    <ChawanIcon size={20} color="#608060" />
                  ) : (
                    <ToriiIcon size={20} color="#905050" />
                  )}
                  <span className="font-mincho text-base text-ink">
                    {spot.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!isLast && (
                    <label className="flex items-center gap-1.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                      次へ
                      <select
                        value={spot.transport ?? ""}
                        onChange={(e) =>
                          onTransport(
                            index,
                            e.target.value === ""
                              ? null
                              : (e.target.value as Transport),
                          )
                        }
                        className="border border-line bg-washi px-2 py-1 font-serif-jp text-sm text-ink focus:border-olive focus:outline-none"
                        aria-label={`${spot.name} から次のスポットへの移動手段`}
                      >
                        <option value="">未設定</option>
                        {TRANSPORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <IconButton
                    label="上へ移動"
                    disabled={index === 0}
                    onClick={() => onMove(index, -1)}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    label="下へ移動"
                    disabled={isLast}
                    onClick={() => onMove(index, 1)}
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    label="削除"
                    onClick={() => onRemove(index)}
                    tone="danger"
                  >
                    ×
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-bengara text-bengara hover:bg-bengara hover:text-paper"
      : "border-line text-ink hover:border-olive hover:text-olive";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center border font-sans-jp text-base transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  );
}

type CandidateResponse = GreenteaListResponse | TempleListResponse;

function SpotPicker({
  tab,
  onTab,
  search,
  onSearch,
  onAdd,
}: {
  tab: SpotType;
  onTab: (t: SpotType) => void;
  search: string;
  onSearch: (v: string) => void;
  onAdd: (spot: SelectedSpot) => void;
}) {
  // 実 API 連携時にキー入力ごとのリクエストを抑えるため、SWR キーに渡す
  // 検索語をデバウンスする（入力自体は即時反映しつつ、フェッチだけ遅らせる）。
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetcher = ([, kind, term]: readonly [
    string,
    SpotType,
    string,
  ]): Promise<CandidateResponse> =>
    kind === "greentea"
      ? getGreenteas({ q: { name_cont: term } })
      : getTemples({ q: { name_cont: term } });

  const { data, error, isLoading } = useSWR<
    CandidateResponse,
    ApiError,
    readonly [string, SpotType, string]
  >(["/route-candidates", tab, debouncedSearch] as const, fetcher, {
    keepPreviousData: true,
  });

  const items =
    data && "greenteas" in data
      ? data.greenteas
      : data && "temples" in data
        ? data.temples
        : [];

  return (
    <section className="flex flex-col gap-3 border border-line-soft bg-washi-bg px-4 py-4">
      <h2 className="font-mincho text-base tracking-[0.15em] text-ink">
        スポットを追加
      </h2>
      <div className="flex gap-2">
        <TabButton active={tab === "greentea"} onClick={() => onTab("greentea")}>
          抹茶スイーツ
        </TabButton>
        <TabButton active={tab === "temple"} onClick={() => onTab("temple")}>
          神社仏閣
        </TabButton>
      </div>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="名前で絞り込み"
        aria-label="スポットを名前で絞り込み"
        className="h-10 border border-line bg-paper px-3 font-serif-jp text-sm text-ink placeholder:text-muted/60 focus:border-olive focus:outline-none"
      />
      {error ? (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          候補の取得に失敗しました。時間を置いてお試しください。
        </p>
      ) : isLoading ? (
        <Loader />
      ) : items.length === 0 ? (
        <p className="font-serif-jp text-sm text-muted">
          該当するスポットがありません。
        </p>
      ) : (
        <ul className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  onAdd({
                    spot_type: tab,
                    spot_id: item.id,
                    name: item.name,
                    transport: null,
                  })
                }
                className="flex w-full items-center gap-2 border border-line bg-paper px-3 py-2 text-left transition-colors hover:border-olive hover:bg-paper/80"
              >
                {tab === "greentea" ? (
                  <ChawanIcon size={18} color="#608060" />
                ) : (
                  <ToriiIcon size={18} color="#905050" />
                )}
                <span className="flex-1 font-mincho text-sm text-ink">
                  {item.name}
                </span>
                <span className="font-sans-jp text-lg text-olive">＋</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-4 py-1.5 font-sans-jp text-sm tracking-[0.1em] transition-colors ${
        active
          ? "border-olive bg-olive text-paper"
          : "border-line bg-paper text-ink hover:border-olive hover:text-olive"
      }`}
    >
      {children}
    </button>
  );
}
