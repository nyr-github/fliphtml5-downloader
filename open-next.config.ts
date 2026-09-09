import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 默认配置即可：本应用无本地文件系统/进程内 DB 依赖，
// 数据经 Postgres(Vercel/VPS) 或 D1 绑定(Workers) 访问。
export default defineCloudflareConfig();
