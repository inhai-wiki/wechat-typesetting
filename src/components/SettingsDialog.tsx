"use client";

import { useState, useEffect } from "react";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/config")
        .then((r) => r.json())
        .then((data) => {
          if (data.configured) {
            setAppId(data.appId);
            setAppSecret(data.appSecret);
            setConfigured(true);
          } else {
            setAppId("");
            setAppSecret("");
            setConfigured(false);
          }
        })
        .catch(() => {});
      setMsg(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!appId.trim() || !appSecret.trim()) {
      setMsg({ type: "err", text: "AppID 和 AppSecret 都不能为空" });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: appId.trim(), appSecret: appSecret.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: "保存成功" });
        setConfigured(true);
      } else {
        setMsg({ type: "err", text: data.error || "保存失败" });
      }
    } catch {
      setMsg({ type: "err", text: "网络错误" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要清除配置吗？")) return;
    await fetch("/api/config", { method: "DELETE" });
    setAppId("");
    setAppSecret("");
    setConfigured(false);
    setMsg(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">公众号配置</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 leading-relaxed">
            AppID 和 AppSecret 保存在本地 data/config.json 中，不会上传到任何服务器。
            请在 <a href="https://mp.weixin.qq.com/" target="_blank" rel="noopener noreferrer" className="underline">微信公众平台</a> 的
            「设置与开发 → 基本配置」中获取。
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AppID (开发者ID)
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="wx1234567890abcdef"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AppSecret (开发者密码)
              </label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={configured ? "已配置，输入可更新" : "请输入 AppSecret"}
              />
            </div>
          </div>

          {msg && (
            <div
              className={`mt-3 text-sm px-3 py-2 rounded-lg ${
                msg.type === "ok"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          {configured && (
            <button
              onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700"
            >
              清除配置
            </button>
          )}
          {!configured && <div />}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
