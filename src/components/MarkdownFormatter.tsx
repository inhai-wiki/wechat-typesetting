"use client";

import { useState, useEffect, useCallback } from "react";
import { marked } from "marked";

interface TemplateOption {
  id: string;
  name: string;
  articleTitle?: string;
}

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
}

interface MarkdownFormatterProps {
  onContentReady: (inlineHtml: string, title: string) => void;
  onPublish: () => void;
}

export default function MarkdownFormatter({ onContentReady, onPublish }: MarkdownFormatterProps) {
  const [markdown, setMarkdown] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [renderedHtml, setRenderedHtml] = useState("");
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");
  const [cachedInlineHtml, setCachedInlineHtml] = useState("");

  // Auto-detect title from markdown first heading
  useEffect(() => {
    const titleMatch = markdown.match(/^#{1,6}\s+(.+)$/m);
    const detected = titleMatch?.[1]?.trim() || "";
    if (detected && !articleTitle) {
      setArticleTitle(detected);
    }
  }, [markdown]);

  // Sync title to parent whenever it changes
  useEffect(() => {
    const effectiveTitle = articleTitle.trim() || markdown.match(/^#{1,6}\s+(.+)$/m)?.[1]?.trim() || "未命名文章";
    onContentReady(cachedInlineHtml, effectiveTitle);
  }, [articleTitle, cachedInlineHtml, markdown, onContentReady]);

  // Load template list
  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {});
  }, []);

  // Load template detail when selected
  useEffect(() => {
    if (!selectedTemplateId) {
      setStyleProfile(null);
      return;
    }
    fetch(`/api/templates?id=${selectedTemplateId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.styleProfile) setStyleProfile(data.styleProfile);
      })
      .catch(() => setStyleProfile(null));
  }, [selectedTemplateId]);

  const showCopyMsg = (msg: string) => {
    setCopyMsg(msg);
    setTimeout(() => setCopyMsg(""), 2500);
  };

  const buildCss = useCallback((profile: StyleProfile): string => {
    const {
      primaryColor, textColor, accentColors, fontFamily,
      bodyFontSize, headingFontSize, lineHeight, headingAlign,
      headingDecoration, paragraphIndent, sectionStyle, quoteStyle,
    } = profile;

    const secondaryColor = accentColors[1] || primaryColor;
    const lighterBg = sectionStyle.background || lightenColor(primaryColor, 0.9);

    let css = `
.article-content {
  font-family: ${fontFamily}; color: ${textColor}; background-color: #fff;
  line-height: ${lineHeight}; font-size: ${bodyFontSize};
  padding: 20px 16px; max-width: 100%; word-wrap: break-word;
}
.article-content a { color: ${primaryColor}; text-decoration: none; border-bottom: 1px solid ${primaryColor}33; }
.article-content a:hover { border-bottom-color: ${primaryColor}; }
.article-content h1 { font-size: ${headingFontSize}; font-weight: bold; color: ${textColor}; text-align: ${headingAlign}; margin: 1.5em 0 0.8em; padding-bottom: 0.3em; }
.article-content h2 { font-size: calc(${headingFontSize} * 0.85); font-weight: bold; color: ${primaryColor}; margin: 1.3em 0 0.6em; padding-bottom: 0.2em; }
.article-content h3 { font-size: calc(${headingFontSize} * 0.72); font-weight: bold; color: ${textColor}; margin: 1.2em 0 0.5em; }
.article-content h4 { font-size: calc(${bodyFontSize} * 1.05); font-weight: bold; color: ${primaryColor}; margin: 1em 0 0.4em; }
`;

    if (headingDecoration.type === "left-border") {
      const c = headingDecoration.color || primaryColor;
      css += `.article-content h2 { border-left: 4px solid ${c}; padding-left: 12px; }\n.article-content h3 { border-left: 3px solid ${c}80; padding-left: 10px; }\n`;
    } else if (headingDecoration.type === "bottom-border") {
      const c = headingDecoration.color || primaryColor;
      css += `.article-content h1 { border-bottom: 2px solid ${c}; }\n.article-content h2 { border-bottom: 1px solid ${c}60; }\n`;
    } else if (headingDecoration.type === "background") {
      // No background block — just rely on colored text (already set in base h2 style)
    }

    css += `
.article-content p { margin: 0.8em 0; ${paragraphIndent ? `text-indent: ${paragraphIndent};` : ""} }
.article-content strong { color: ${primaryColor}; font-weight: bold; }
.article-content em { color: ${secondaryColor}; font-style: normal; background: ${lighterBg}30; padding: 1px 4px; border-radius: 3px; }
.article-content blockquote { margin: 1em 0; padding: 8px 0 8px 16px; border-left: 4px solid ${primaryColor}; color: #666; }
.article-content blockquote p { margin: 0.3em 0; text-indent: 0; }
.article-content ul, .article-content ol { padding-left: 2em; margin: 0.5em 0; }
.article-content li { margin: 0.3em 0; }
.article-content li::marker { color: ${primaryColor}; }
.article-content code { background: ${lighterBg}20; color: ${primaryColor}; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; font-family: 'SFMono-Regular', Consolas, monospace; }
.article-content pre { background: #2d2d2d; color: #ccc; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
.article-content pre code { background: none; color: inherit; padding: 0; border-radius: 0; }
.article-content hr { border: none; height: 1px; background: linear-gradient(to right, transparent, ${primaryColor}40, transparent); margin: 2em 0; }
.article-content table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.95em; }
.article-content th { color: ${primaryColor}; font-weight: bold; padding: 10px 14px; text-align: left; border: 1px solid #e0e0e0; border-bottom: 2px solid ${primaryColor}; }
.article-content td { padding: 10px 14px; border: 1px solid ${primaryColor}20; }
.article-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5em 0; }
.article-content p img:nth-last-of-type(n+2):first-child ~ img { display: inline-block; width: 48%; vertical-align: top; }
`;
    return css;
  }, []);

  // Build fully inline-styled HTML (for WeChat copy and download)
  const buildInlineHtml = useCallback(
    (markdownHtml: string, profile: StyleProfile): string => {
      const {
        primaryColor, textColor, accentColors, fontFamily,
        bodyFontSize, headingFontSize, lineHeight, headingAlign,
        headingDecoration, paragraphIndent, sectionStyle, quoteStyle,
      } = profile;

      const secondaryColor = accentColors[1] || primaryColor;
      const lighterBg = sectionStyle.background || lightenColor(primaryColor, 0.9);

      // Pre-calculate sizes (no calc() — WeChat doesn't support it)
      const hSizeNum = parseInt(headingFontSize) || 22;
      const bSizeNum = parseInt(bodyFontSize) || 16;
      const h2Size = Math.round(hSizeNum * 0.85);
      const h3Size = Math.round(hSizeNum * 0.72);
      const h4Size = Math.round(bSizeNum * 1.05);

      const styleMap: Record<string, string> = {
        h1: `margin-top:24px;margin-bottom:12px;padding-bottom:5px;font-size:${hSizeNum}px;font-weight:bold;color:${textColor};text-align:${headingAlign};line-height:1.4;`,
        h2: `margin-top:20px;margin-bottom:10px;padding-bottom:4px;font-size:${h2Size}px;font-weight:bold;color:${primaryColor};line-height:1.4;`,
        h3: `margin-top:18px;margin-bottom:8px;font-size:${h3Size}px;font-weight:bold;color:${textColor};line-height:1.4;`,
        h4: `margin-top:16px;margin-bottom:6px;font-size:${h4Size}px;font-weight:bold;color:${primaryColor};line-height:1.4;`,
        p: `margin:0;padding:0;color:${textColor};font-size:${bSizeNum}px;line-height:${lineHeight};${paragraphIndent ? `text-indent:${paragraphIndent};` : ""}`,
        strong: `color:${primaryColor};font-weight:bold;`,
        em: `color:${secondaryColor};font-style:normal;background:${lighterBg};padding:1px 4px;border-radius:3px;`,
        a: `color:${primaryColor};text-decoration:none;`,
        ul: `padding-left:2em;margin:8px 0;`,
        ol: `padding-left:2em;margin:8px 0;`,
        li: `margin:4px 0;color:${textColor};font-size:${bSizeNum}px;line-height:${lineHeight};`,
        pre: `background:#f6f8fa;color:#333;padding:16px;border-radius:6px;margin:16px 0;white-space:pre-wrap;word-wrap:break-word;font-size:14px;`,
        code: `background:#f0f0f0;color:${primaryColor};padding:2px 6px;border-radius:3px;font-size:14px;font-family:Menlo,Monaco,monospace;`,
        hr: `border:none;border-top:1px solid #e0e0e0;margin:24px 0;`,
        img: `max-width:100%;height:auto;border-radius:4px;margin:8px 0;display:block;`,
        table: `border-collapse:collapse;width:100%;margin:16px 0;font-size:14px;`,
        th: `color:${primaryColor};font-weight:bold;padding:10px 14px;text-align:left;border:1px solid #e0e0e0;border-bottom:2px solid ${primaryColor};`,
        td: `padding:10px 14px;border:1px solid #e0e0e0;`,
      };

      if (headingDecoration.type === "left-border") {
        const c = headingDecoration.color || primaryColor;
        styleMap.h2 += `border-left:4px solid ${c};padding-left:12px;`;
        styleMap.h3 += `border-left:3px solid ${c};padding-left:10px;`;
      } else if (headingDecoration.type === "bottom-border") {
        const c = headingDecoration.color || primaryColor;
        styleMap.h1 += `border-bottom:2px solid ${c};`;
        styleMap.h2 += `border-bottom:1px solid ${c};`;
      }
      // "background" type: just use colored text, no background block

      const preCodeStyle = `background:none;color:inherit;padding:0;border-radius:0;font-size:0.9em;`;
      const parser = new DOMParser();
      const doc = parser.parseFromString(markdownHtml, "text/html");

      // Style pre > code
      doc.querySelectorAll("pre code").forEach((code) => {
        code.setAttribute("style", preCodeStyle);
      });

      // Convert <blockquote> to <section> for WeChat compatibility
      // WeChat transforms <blockquote> into its own colored block — <section> is reliable
      doc.querySelectorAll("blockquote").forEach((bq) => {
        const wrapper = doc.createElement("section");
        wrapper.setAttribute("style", `margin:16px 0;padding:8px 0 8px 16px;border-left:4px solid ${primaryColor};color:#666;`);

        // Move all children into the wrapper
        while (bq.firstChild) {
          const child = bq.firstChild;
          if (child.nodeType === 1) {
            const el = child as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (tag === "p") {
              el.setAttribute("style", `margin:0;padding:0;color:#666;font-size:${bSizeNum}px;line-height:${lineHeight};text-indent:0;`);
            }
            // Style inline elements
            if (tag === "strong" && styleMap.strong) el.setAttribute("style", styleMap.strong);
            if (tag === "em" && styleMap.em) el.setAttribute("style", styleMap.em);
          }
          wrapper.appendChild(child);
        }

        bq.parentNode?.replaceChild(wrapper, bq);
      });

      // Convert <ul>/<ol> lists to flat <section> elements for WeChat compatibility
      const listItemStyle = `margin:4px 0;padding-left:1.5em;color:${textColor};font-size:${bSizeNum}px;line-height:${lineHeight};text-indent:0;`;
      const listBulletStyle = `color:${primaryColor};margin-right:4px;`;

      doc.querySelectorAll("ul, ol").forEach((list) => {
        const isOrdered = list.tagName.toLowerCase() === "ol";
        const items = list.querySelectorAll(":scope > li");
        const fragment = doc.createDocumentFragment();

        items.forEach((li, index) => {
          const section = doc.createElement("section");
          section.setAttribute("style", listItemStyle);

          if (isOrdered) {
            const num = doc.createElement("span");
            num.setAttribute("style", listBulletStyle);
            num.textContent = `${index + 1}. `;
            section.appendChild(num);
          } else {
            const bullet = doc.createElement("span");
            bullet.setAttribute("style", listBulletStyle);
            bullet.textContent = "• ";
            section.appendChild(bullet);
          }

          // Move li's children into the section
          while (li.firstChild) {
            const child = li.firstChild;
            // Style inline elements inside the list item
            if (child.nodeType === 1) {
              const el = child as HTMLElement;
              const tag = el.tagName.toLowerCase();
              if (tag === "strong" && styleMap.strong) el.setAttribute("style", styleMap.strong);
              if (tag === "em" && styleMap.em) el.setAttribute("style", styleMap.em);
              if (tag === "code" && styleMap.code) el.setAttribute("style", styleMap.code);
            }
            section.appendChild(child);
          }

          fragment.appendChild(section);
        });

        list.parentNode?.replaceChild(fragment, list);
      });

      // Convert <p> with multiple images to side-by-side table layout (WeChat compatible)
      doc.querySelectorAll("p").forEach((p) => {
        const imgs = p.querySelectorAll("img");
        if (imgs.length >= 2) {
          const hasText = Array.from(p.childNodes).some(
            (n) => n.nodeType === 3 && n.textContent?.trim()
          );
          if (!hasText) {
            const table = doc.createElement("table");
            table.setAttribute("style", `border:none;width:100%;margin:8px 0;border-collapse:separate;border-spacing:4px;`);
            const tr = doc.createElement("tr");
            imgs.forEach((img) => {
              const td = doc.createElement("td");
              td.setAttribute("style", `border:none;padding:0;vertical-align:top;width:${Math.floor(100 / imgs.length)}%;`);
              img.setAttribute("style", `width:100%;height:auto;border-radius:4px;display:block;margin:0;`);
              td.appendChild(img);
              tr.appendChild(td);
            });
            table.appendChild(tr);
            p.parentNode?.replaceChild(table, p);
          }
        }
      });

      // Style remaining elements
      doc.body.querySelectorAll("*").forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (el.hasAttribute("style") && (tag === "p" || tag === "code")) return;
        if (styleMap[tag]) el.setAttribute("style", styleMap[tag]);
      });

      // Wrap top-level <p> elements in <section> with spacing
      // This prevents WeChat from adding its own margin to <p> tags
      const bodyChildren = Array.from(doc.body.childNodes);
      bodyChildren.forEach((node) => {
        if (node.nodeType === 1) {
          const el = node as HTMLElement;
          if (el.tagName.toLowerCase() === "p") {
            const wrapper = doc.createElement("section");
            wrapper.setAttribute("style", `margin-bottom:${bSizeNum}px;`);
            el.parentNode?.insertBefore(wrapper, el);
            wrapper.appendChild(el);
          }
        }
      });

      const containerStyle = `font-family:${fontFamily};color:${textColor};line-height:${lineHeight};font-size:${bodyFontSize};padding:20px 16px;word-wrap:break-word;background-color:#fff;`;
      return `<section style="${containerStyle}">${doc.body.innerHTML}</section>`;
    },
    []
  );

  const handleRender = async () => {
    if (!markdown.trim()) return;
    setGenerating(true);
    try {
      const html = await marked(markdown);
      let finalHtml: string;

      if (styleProfile) {
        // Use inline HTML for both preview and export — ensures consistency
        const inlineHtml = buildInlineHtml(html, styleProfile);
        finalHtml = inlineHtml;
        setCachedInlineHtml(inlineHtml);
      } else {
        finalHtml = `<section style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.8;font-size:16px;padding:20px;">${html}</section>`;
        setCachedInlineHtml(finalHtml);
      }

      setRenderedHtml(finalHtml);

      // Prepare inline HTML for publish/copy
      const inlineHtml = styleProfile
        ? buildInlineHtml(html, styleProfile)
        : `<section style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#333;line-height:1.8;font-size:16px;padding:20px;">${html}</section>`;

      setCachedInlineHtml(inlineHtml);

      // Auto-detect title if not manually set
      const titleMatch = markdown.match(/^#{1,6}\s+(.+)$/m);
      const title = articleTitle.trim() || titleMatch?.[1] || "未命名文章";
      onContentReady(inlineHtml, title);
    } catch {
      setRenderedHtml("<p style='color:red;'>Markdown 解析失败</p>");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToWechat = async () => {
    try {
      const mdHtml = await marked(markdown);
      const inlineHtml = styleProfile
        ? buildInlineHtml(mdHtml, styleProfile)
        : `<section style="font-family:-apple-system,sans-serif;color:#333;line-height:1.8;font-size:16px;padding:20px;">${mdHtml}</section>`;

      const htmlBlob = new Blob([inlineHtml], { type: "text/html" });
      const textBlob = new Blob([mdHtml], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob }),
      ]);
      showCopyMsg("已复制，可直接粘贴到公众号");
    } catch {
      showCopyMsg("复制失败");
    }
  };

  const handleDownloadHtml = async () => {
    const mdHtml = await marked(markdown);
    const inlineHtml = styleProfile
      ? buildInlineHtml(mdHtml, styleProfile)
      : `<section style="font-family:-apple-system,sans-serif;color:#333;line-height:1.8;font-size:16px;padding:20px;">${mdHtml}</section>`;

    const fullHtml = wrapPreviewHtml(inlineHtml);
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${articleTitle || "article"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-130px)]">
      {/* Left: Input */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-stone-700">Markdown 输入</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="text-sm border border-stone-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">默认样式</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={handleRender}
              disabled={!markdown.trim() || generating}
              className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {generating ? "排版中..." : "排版"}
            </button>
          </div>
        </div>

        {/* Title input */}
        <input
          type="text"
          value={articleTitle}
          onChange={(e) => setArticleTitle(e.target.value)}
          className="w-full px-4 py-2 mb-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="文章标题（用于推送到草稿箱）"
        />

        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="flex-1 w-full p-4 border border-stone-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder={"在此粘贴 Markdown 内容...\n\n支持标题、列表、加粗、斜体、引用、代码块、表格等语法"}
        />
      </div>

      {/* Right: Preview */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-700">排版预览</h2>
          {renderedHtml && (
            <div className="flex items-center gap-2">
              {copyMsg && (
                <span className="text-xs text-emerald-600 font-medium animate-pulse">{copyMsg}</span>
              )}
              <button
                onClick={handleCopyToWechat}
                className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
              >
                一键复制到公众号
              </button>
              <button
                onClick={handleDownloadHtml}
                className="text-xs px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
              >
                下载 HTML
              </button>
              <button
                onClick={onPublish}
                className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors"
              >
                推送到草稿箱
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 border border-stone-200 rounded-lg overflow-hidden bg-white shadow-sm">
          {renderedHtml ? (
            <iframe
              srcDoc={wrapPreviewHtml(renderedHtml)}
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
              title="Markdown Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-stone-400 text-sm">
              <div className="text-center">
                <svg className="mx-auto mb-2 text-stone-300" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                输入 Markdown 并点击「排版」查看效果
              </div>
            </div>
          )}
        </div>
        {styleProfile && (
          <div className="mt-3 p-3 bg-white border border-stone-200 rounded-lg text-xs text-stone-500 space-y-1">
            <div className="flex items-center gap-4">
              <span>
                主色:{" "}
                <span className="inline-block w-3 h-3 rounded-sm align-middle" style={{ backgroundColor: styleProfile.primaryColor }} />
                {" "}{styleProfile.primaryColor}
              </span>
              <span>字体: {styleProfile.fontFamily.split(",")[0]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>配色:</span>
              {styleProfile.accentColors.slice(0, 8).map((c, i) => (
                <span key={i} className="inline-block w-4 h-4 rounded-sm" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function wrapPreviewHtml(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0}img{max-width:100%;height:auto}</style></head><body>${content}</body></html>`;
}

function lightenColor(color: string, factor: number): string {
  const hex = color.replace("#", "");
  if (hex.length === 3 || hex.length === 6) {
    const full = hex.length === 3 ? hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2] : hex;
    const r = parseInt(full.slice(0,2),16), g = parseInt(full.slice(2,4),16), b = parseInt(full.slice(4,6),16);
    const lr = Math.round(r+(255-r)*factor), lg = Math.round(g+(255-g)*factor), lb = Math.round(b+(255-b)*factor);
    return `#${lr.toString(16).padStart(2,"0")}${lg.toString(16).padStart(2,"0")}${lb.toString(16).padStart(2,"0")}`;
  }
  return color;
}
