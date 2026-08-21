import CommentModerationList from "@/components/admin/CommentModerationList";

export default function AdminCommentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mincho text-xl tracking-[0.1em] text-ink">
          口コミの管理
        </h1>
        <p className="mt-1 font-sans-jp text-xs tracking-[0.1em] text-muted">
          抹茶店・神社仏閣に投稿された口コミを横断して確認・削除できます。
        </p>
      </div>

      <CommentModerationList />
    </div>
  );
}
