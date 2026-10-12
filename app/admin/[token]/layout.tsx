import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { checkAdminToken } from "@/lib/discord-pass";
import AdminSidebar from "@/components/admin/AdminSidebar";

// /admin/[ADMIN_TOKEN] 统一后台入口：所有管理页共用本布局做路径令牌校验。
// 令牌不匹配（含 ADMIN_TOKEN 未配置）一律 404，不暴露后台存在性。
// 布局为顶部专属 Header + 左侧 Tab + 右侧内容：侧边栏持久显示，点击 Tab 切换右侧 {children}。
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!checkAdminToken(token)) notFound();
  return (
    <div className="px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <ShieldCheck className="h-5 w-5 text-[var(--color-primary,#4F46E5)]" />
          <span>管理后台</span>
        </div>
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="whitespace-nowrap">返回网站首页</span>
        </Link>
      </header>
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <AdminSidebar token={token} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
