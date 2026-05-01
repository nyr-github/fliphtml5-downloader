"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Grid, List, SortAsc, SortDesc } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RelatedBooksControlsProps {
  bookId: string;
  currentBookTitle: string;
}

export default function RelatedBooksControls({
  bookId,
  currentBookTitle,
}: RelatedBooksControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // 从 URL 参数读取当前状态
  const currentSortBy = searchParams.get("sortBy") || "name";
  const currentSortOrder = searchParams.get("sortOrder") || "asc";
  const currentLayout = searchParams.get("layout") || "grid";

  const [sortBy, setSortBy] = useState<"name" | "downloads">(
    currentSortBy as "name" | "downloads",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    currentSortOrder as "asc" | "desc",
  );
  const [layout, setLayout] = useState<"grid" | "list">(
    currentLayout as "grid" | "list",
  );

  // 更新 URL 参数并导航
  const updateParams = (
    newSortBy?: string,
    newSortOrder?: string,
    newLayout?: string,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSortBy !== undefined) {
      params.set("sortBy", newSortBy);
    }
    if (newSortOrder !== undefined) {
      params.set("sortOrder", newSortOrder);
    }
    if (newLayout !== undefined) {
      params.set("layout", newLayout);
    }

    // 如果是第一页,移除 page 参数
    if (params.get("page") === "1") {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`/book/${bookId}/related?${params.toString()}`);
    });
  };

  // 切换排序方式
  const handleSortByChange = (newSortBy: "name" | "downloads") => {
    setSortBy(newSortBy);
    updateParams(newSortBy, sortOrder, layout);
  };

  // 切换排序顺序
  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    updateParams(sortBy, newOrder, layout);
  };

  // 切换布局
  const handleLayoutChange = (newLayout: "grid" | "list") => {
    setLayout(newLayout);
    updateParams(sortBy, sortOrder, newLayout);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 sm:gap-4 mb-6 sm:mb-8">
      {/* 移动端：下拉菜单 */}
      <div className="flex items-center gap-2 w-full sm:hidden">
        {/* 排序下拉菜单 */}
        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split("-");
            setSortBy(newSortBy as "name" | "downloads");
            setSortOrder(newSortOrder as "asc" | "desc");
            updateParams(newSortBy, newSortOrder, layout);
          }}
        >
          <SelectTrigger className="flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="downloads-desc">
              Downloads (High to Low)
            </SelectItem>
            <SelectItem value="downloads-asc">
              Downloads (Low to High)
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 视图下拉菜单 */}
        <Select
          value={layout}
          onValueChange={(value) => {
            setLayout(value as "grid" | "list");
            updateParams(sortBy, sortOrder, value);
          }}
        >
          <SelectTrigger className="w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid View</SelectItem>
            <SelectItem value="list">List View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 桌面端：按钮布局 */}
      <div className="hidden sm:flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Sort by:
        </span>

        {/* 排序字段选择 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSortByChange("name")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === "name"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] hover:bg-gray-100 border border-[var(--color-border-light)]"
            }`}
            disabled={isPending}
          >
            Name
          </button>
          <button
            onClick={() => handleSortByChange("downloads")}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === "downloads"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-white text-[var(--color-text)] hover:bg-gray-100 border border-[var(--color-border-light)]"
            }`}
            disabled={isPending}
          >
            Downloads
          </button>
        </div>

        {/* 排序顺序切换 */}
        <button
          onClick={handleSortOrderToggle}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white text-[var(--color-text)] hover:bg-gray-100 border border-[var(--color-border-light)] transition-colors"
          disabled={isPending}
          title={sortOrder === "asc" ? "Ascending" : "Descending"}
        >
          {sortOrder === "asc" ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
          <span>{sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
        </button>
      </div>

      {/* 桌面端：布局切换 */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
          View:
        </span>
        <div className="flex items-center bg-white border border-[var(--color-border-light)] rounded-lg overflow-hidden">
          <button
            onClick={() => handleLayoutChange("grid")}
            className={`p-2 transition-colors ${
              layout === "grid"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-text)] hover:bg-gray-100"
            }`}
            disabled={isPending}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleLayoutChange("list")}
            className={`p-2 transition-colors ${
              layout === "list"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-text)] hover:bg-gray-100"
            }`}
            disabled={isPending}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
