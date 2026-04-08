"use client";

import { useEffect, useState } from "react";

interface TemplateSummary {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  articleTitle?: string;
}

interface TemplateListProps {
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  refreshTrigger: number;
}

export default function TemplateList({
  onSelect,
  onDelete,
  refreshTrigger,
}: TemplateListProps) {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      console.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定要删除这个模板吗？")) return;

    try {
      await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      console.error("Failed to delete template");
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">加载中...</div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        还没有保存的模板
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {templates.map((t) => (
        <div
          key={t.id}
          onClick={() => onSelect(t.id)}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer group"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">
              {t.name}
            </div>
            {t.articleTitle && (
              <div className="text-xs text-gray-500 truncate mt-0.5">
                来源: {t.articleTitle}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-0.5">
              {new Date(t.createdAt).toLocaleDateString("zh-CN")}
            </div>
          </div>
          <button
            onClick={(e) => handleDelete(t.id, e)}
            className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-xs px-2 py-1"
          >
            删除
          </button>
        </div>
      ))}
    </div>
  );
}
