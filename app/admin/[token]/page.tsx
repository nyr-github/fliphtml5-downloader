// /admin/[ADMIN_TOKEN] 后台总览（令牌已由 layout 校验）。
// 左侧 Tab 负责导航到各功能页，本页只作为默认落地内容。
export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Console</h1>
        <p className="mt-1 text-sm text-gray-500">
          使用左侧标签切换功能页面：
        </p>
      </div>
      <ul className="space-y-2 text-sm text-gray-600">
        <li>🎁 <span className="font-semibold text-gray-800">Discord Pass Codes</span> — 批量生成兑换码、发送到 Discord、查看兑换状态。</li>
        <li>🐦 <span className="font-semibold text-gray-800">Twitter Requests</span> — 审核用户发帖换券申请、分配专属兑换码。</li>
      </ul>
    </div>
  );
}
