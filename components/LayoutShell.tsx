"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * 布局外壳
 * - 在 /read/iframe/* 与 /read/embed/* 路径下，移除顶部菜单与页脚，
 *   使页面可以被外部站点以 iframe 形式无干扰地嵌入。
 * - 在 /admin/* 后台路径下，同样移除前台菜单与页脚，后台自带侧边栏导航并占满屏幕。
 * - 其它路径使用默认的 Navbar + 主内容 + Footer 布局。
 */
export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const isEmbed =
    pathname.startsWith("/read/iframe/") || pathname.startsWith("/read/embed/");
  const isAdmin = pathname.startsWith("/admin/");

  if (isEmbed || isAdmin) {
    // 嵌入/后台模式：不含 Navbar / Footer，不含默认顶部留白
    return <main className="flex-grow">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 sm:pt-20 md:pt-24 flex-grow mobile-safe-bottom">
        {children}
      </main>
      <Footer />
    </>
  );
}
