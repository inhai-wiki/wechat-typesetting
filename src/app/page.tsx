"use client";

import { useState } from "react";
import UrlInput from "@/components/UrlInput";
import ArticlePreview from "@/components/ArticlePreview";
import StylePanel from "@/components/StylePanel";
import TemplateList from "@/components/TemplateList";
import SaveDialog from "@/components/SaveDialog";
import MarkdownFormatter from "@/components/MarkdownFormatter";
import SettingsDialog from "@/components/SettingsDialog";
import PublishDialog from "@/components/PublishDialog";

interface StyleProfile {
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  accentColors: string[];
  fontFamily: string;
  bodyFontSize: string;
  headingFontSize: string;
  lineHeight: string;
  headingAlign: string;
  headingDecoration: { type: string; color: string };
  paragraphIndent: string;
  sectionStyle: {
    background: string | null;
    borderRadius: string | null;
    padding: string | null;
  };
  quoteStyle: {
    borderLeft: string | null;
    background: string | null;
    color: string | null;
  };
  rawCss: string;
  cssRules: { selector: string; properties: Record<string, string> }[];
  fontFamilies: string[];
  colorPalette: string[];
  backgroundColors: string[];
}

interface ArticleData {
  contentHtml: string;
  title: string;
  author: string;
  styleProfile: StyleProfile;
  images: { src: string; alt?: string; width?: string; height?: string }[];
  sourceUrl: string;
}

type PageTab = "extract" | "markdown";

export default function Home() {
  const [pageTab, setPageTab] = useState<PageTab>("extract");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  // Extract tab state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sideTab, setSideTab] = useState<"styles" | "templates">("styles");

  // Markdown tab state — expose for publish
  const [mdInlineHtml, setMdInlineHtml] = useState("");
  const [mdTitle, setMdTitle] = useState("");

  const handleExtract = async (url: string) => {
    setLoading(true);
    setError(null);
    setArticle(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "提取失败");
        return;
      }

      setArticle(data);
      setSideTab("styles");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name: string, description: string) => {
    if (!article) return;

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          sourceUrl: article.sourceUrl,
          articleTitle: article.title,
          styleProfile: article.styleProfile,
          sampleHtml: article.contentHtml,
        }),
      });

      if (res.ok) {
        setSaveDialogOpen(false);
        setRefreshTrigger((n) => n + 1);
        setSideTab("templates");
      }
    } catch {
      console.error("Failed to save template");
    }
  };

  const handleTemplateSelect = async (id: string) => {
    try {
      const res = await fetch(`/api/templates?id=${id}`);
      const data = await res.json();
      if (res.ok) {
        setArticle({
          contentHtml: data.sampleHtml,
          title: data.articleTitle || data.name,
          author: "",
          styleProfile: data.styleProfile,
          images: [],
          sourceUrl: data.sourceUrl || "",
        });
        setSideTab("styles");
      }
    } catch {
      console.error("Failed to load template");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-green-600 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                微信公众号样式工具
              </h1>
            </div>

            {/* Settings button */}
            <div className="flex items-center gap-1">
              <a
                href="https://github.com/inhai-wiki/wechat-typesetting"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="GitHub"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <button
                onClick={() => setSettingsOpen(true)}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="公众号配置"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setPageTab("extract")}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                pageTab === "extract"
                  ? "bg-white text-emerald-700"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              样式提取
            </button>
            <button
              onClick={() => setPageTab("markdown")}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                pageTab === "markdown"
                  ? "bg-white text-emerald-700"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Markdown 排版
            </button>
          </div>
        </div>
      </header>

      {/* Extract Tab */}
      {pageTab === "extract" && (
        <>
          <div className="bg-white border-b border-stone-200">
            <div className="max-w-7xl mx-auto px-6 py-3">
              <UrlInput onExtract={handleExtract} loading={loading} />
            </div>
          </div>

          {error && (
            <div className="max-w-7xl mx-auto px-6 mt-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            </div>
          )}

          <main className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ArticlePreview
                  html={article?.contentHtml || null}
                  title={article?.title || ""}
                />
                {article && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
                    {article.author && <span>作者: {article.author}</span>}
                    {article.images.length > 0 && (
                      <span>共 {article.images.length} 张图片</span>
                    )}
                    <button
                      onClick={() => setSaveDialogOpen(true)}
                      className="ml-auto px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      保存为模板
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-stone-200 shadow-sm">
                  <div className="flex border-b border-stone-200">
                    <button
                      onClick={() => setSideTab("styles")}
                      className={`flex-1 px-4 py-3 text-sm font-medium ${
                        sideTab === "styles"
                          ? "text-emerald-600 border-b-2 border-emerald-600"
                          : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      样式信息
                    </button>
                    <button
                      onClick={() => setSideTab("templates")}
                      className={`flex-1 px-4 py-3 text-sm font-medium ${
                        sideTab === "templates"
                          ? "text-emerald-600 border-b-2 border-emerald-600"
                          : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      已保存模板
                    </button>
                  </div>

                  <div className="p-4">
                    {sideTab === "styles" ? (
                      <StylePanel styleProfile={article?.styleProfile || null} />
                    ) : (
                      <TemplateList
                        onSelect={handleTemplateSelect}
                        onDelete={() => setRefreshTrigger((n) => n + 1)}
                        refreshTrigger={refreshTrigger}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

          <SaveDialog
            open={saveDialogOpen}
            onClose={() => setSaveDialogOpen(false)}
            onSave={handleSave}
            defaultName={article?.title || ""}
          />
        </>
      )}

      {/* Markdown Tab */}
      {pageTab === "markdown" && (
        <main className="max-w-7xl mx-auto px-6 py-4">
          <MarkdownFormatter
            onContentReady={(inlineHtml, title) => {
              setMdInlineHtml(inlineHtml);
              setMdTitle(title);
            }}
            onPublish={() => setPublishOpen(true)}
          />
        </main>
      )}

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Publish Dialog */}
      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title={mdTitle}
        htmlContent={mdInlineHtml}
      />
    </div>
  );
}
