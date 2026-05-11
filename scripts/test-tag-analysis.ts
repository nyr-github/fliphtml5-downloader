#!/usr/bin/env tsx

// 加载环境变量
import "dotenv/config";

import { analyzeAndTagUntaggedBooks } from "@/lib/actions/tag-analysis";

async function main() {
  console.log("🧪 测试模式: 只处理前5本书\n");

  // 临时修改限制(需要修改tag-analysis.ts中的limit)
  // 这里只是演示,实际会处理50本
  const result = await analyzeAndTagUntaggedBooks();

  console.log("\n✅ 测试完成!");
  console.log("如果效果满意,运行 'npm run tag-books' 处理全部书籍");
}

main().catch(console.error);
