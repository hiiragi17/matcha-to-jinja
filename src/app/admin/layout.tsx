import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: "管理画面" };

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
