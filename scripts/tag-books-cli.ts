#!/usr/bin/env tsx

/**
 * 书籍AI标签分析CLI工具
 *
 * 使用方法:
 * npm run tag-books                    # 执行标签分析
 * npm run tag-books -- --dry-run       # 仅查看未标记书籍,不执行分析
 * npm run tag-books -- --limit 10      # 限制处理数量
 */

// 加载环境变量(必须在最前面)
import "dotenv/config";

import {
  analyzeAndTagUntaggedBooks,
  getUntaggedBooks,
} from "@/lib/actions/tag-analysis";
import { BOOK_TAGS } from "@/lib/constants";

interface Args {
  dryRun: boolean;
  limit: number | null;
}

// 解析命令行参数
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : null;

  return { dryRun, limit };
}

// 执行标签分析 - 直接调用函数而非HTTP API
async function runTagAnalysis(limit: number | null) {
  console.log("🚀 启动书籍AI标签分析...\n");
  console.log(`📋 可用标签 (${BOOK_TAGS.length}个):`);
  console.log(`   ${BOOK_TAGS.join(", ")}\n`);

  try {
    // CLI模式: 如果指定了limit则使用,否则不限制(处理所有未标记书籍)
    const options = limit ? { limit } : undefined;
    const result = await analyzeAndTagUntaggedBooks(options);

    console.log("\n✅ 标签分析完成!\n");
    console.log("📊 统计信息:");
    console.log(`   总处理数量: ${result.total}`);
    console.log(`   成功标记: ${result.tagged}`);
    console.log(`   失败: ${result.failed}`);
    console.log(`   时间: ${new Date().toISOString()}\n`);

    if (result.failed > 0) {
      console.warn("⚠️  部分书籍标记失败,请查看上方日志了解详情\n");
    }
  } catch (error) {
    console.error("❌ 标签分析失败:", error);
    process.exit(1);
  }
}

// Dry Run模式 - 仅查询未标记书籍
async function runDryRun(limit: number | null) {
  console.log("📋 Dry Run模式 - 查询未标记书籍\n");
  console.log(`📋 可用标签 (${BOOK_TAGS.length}个):`);
  console.log(`   ${BOOK_TAGS.join(", ")}\n`);

  try {
    // CLI模式: 如果指定了limit则使用,否则不限制
    const options = limit ? { limit } : undefined;
    const untaggedBooks = await getUntaggedBooks(options);

    if (untaggedBooks.length === 0) {
      console.log("✅ 所有书籍都已标记!");
      return;
    }

    const displayLimit = limit || untaggedBooks.length;
    const booksToShow = untaggedBooks.slice(0, displayLimit);

    console.log(`📚 找到 ${untaggedBooks.length} 本未标记的书籍`);
    if (limit && untaggedBooks.length > limit) {
      console.log(`   (仅显示前 ${limit} 本)\n`);
    } else {
      console.log("\n");
    }

    booksToShow.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title}`);
      if (book.description) {
        const desc =
          book.description.length > 100
            ? book.description.substring(0, 100) + "..."
            : book.description;
        console.log(`   描述: ${desc}`);
      }
      console.log(`   ID: ${book.id}`);
      console.log("");
    });

    console.log(`\n💡 提示: 运行 'npm run tag-books' 开始AI标签分析`);
  } catch (error) {
    console.error("❌ 查询失败:", error);
    process.exit(1);
  }
}

// 主函数
async function main() {
  const { dryRun, limit } = parseArgs();

  if (dryRun) {
    await runDryRun(limit);
  } else {
    await runTagAnalysis(limit);
  }
}

// 运行主函数
main().catch((error) => {
  console.error("❌ 执行失败:", error);
  process.exit(1);
});
