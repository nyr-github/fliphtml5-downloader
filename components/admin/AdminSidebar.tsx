"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
  desc: string;
  exact?: boolean;
}

// 后台左侧 Tab（Dashboard 侧边栏）：持久显示在各管理页左侧，点击切换右侧内容。
// exact=true 的「总览」只在完全匹配时高亮，其余用前缀匹配。
export default function AdminSidebar({ token }: { token: string }) {
  const pathname = usePathname();
  const base = `/admin/${token}`;

  const tabs: Tab[] = [
    { href: base, label: "🏠 Overview", desc: "后台总览", exact: true },
    { href: `${base}/passes`, label: "🎁 Discord Pass Codes", desc: "通行证码管理" },
    { href: `${base}/requests`, label: "🐦 Twitter Requests", desc: "发帖换券审核" },
  ];

  return (
    <aside className="w-full md:w-60 shrink-0">
      <nav className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex shrink-0 flex-col rounded-xl border px-4 py-3 text-sm transition-colors md:w-full ${
                active
                  ? "border-[var(--color-primary,#4F46E5)] bg-[var(--color-primary,#4F46E5)] text-white"
                  : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
              }`}
            >
              <span className="font-semibold whitespace-nowrap">{tab.label}</span>
              <span
                className={`text-xs font-normal ${
                  active ? "text-white/70" : "text-gray-500"
                }`}
              >
                {tab.desc}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
