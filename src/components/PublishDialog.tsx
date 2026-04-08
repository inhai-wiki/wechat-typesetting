"use client";

import { useState } from "react";

interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  htmlContent: string;
}

export default function PublishDialog({
  open,
  onClose,
  title,
  htmlContent,
}: PublishDialogProps) {
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (!open) return null;

  const handlePublish = async () => {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/publish/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: htmlContent,
          author: author.trim(),
          coverUrl: coverUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg({ type: "ok", text: "已成功推送到公众号草稿箱！" });
      } else {
        setMsg({ type: "err", text: data.error || "推送失败" });
      }
    } catch {
      setMsg({ type: "err", text: "网络错误" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">推送到草稿箱</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文章标题
              </label>
              <div className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-800">
                {title}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作者（可选）
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="作者名称"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                封面图片（可选）
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="留空则自动使用文章首图或生成封面"
              />
              <p className="mt-1 text-xs text-gray-400">
                微信要求封面比例 2.35:1，系统会自动裁剪
              </p>
            </div>
          </div>

          {msg && (
            <div
              className={`mt-3 text-sm px-3 py-2 rounded-lg ${
                msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-stone-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "推送中..." : "推送到草稿箱"}
          </button>
        </div>
      </div>
    </div>
  );
}
