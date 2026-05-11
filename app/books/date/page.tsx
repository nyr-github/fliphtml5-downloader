import { getAvailableDates } from "@/lib/actions/daily-books";
import { redirect } from "next/navigation";

export default async function DailyBooksRedirectPage() {
  // 获取所有可用日期
  const availableDatesResult = await getAvailableDates();

  if (availableDatesResult.dates.length > 0) {
    // 重定向到最新的日期
    redirect(`/books/date/${availableDatesResult.dates[0]}`);
  }

  // 如果没有数据，显示空状态
  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-body overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="text-center py-16 sm:py-24 bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-[var(--color-border)] mx-2">
          <p className="text-[var(--color-text-muted)] text-base sm:text-lg font-medium px-4">
            No books have been added yet
          </p>
        </div>
      </div>
    </div>
  );
}
