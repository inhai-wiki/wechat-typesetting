"use client";

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

interface StylePanelProps {
  styleProfile: StyleProfile | null;
}

export default function StylePanel({ styleProfile }: StylePanelProps) {
  if (!styleProfile) {
    return (
      <div className="text-gray-400 text-sm text-center py-8">
        提取文章后将展示样式信息
      </div>
    );
  }

  const copyCss = () => {
    const css = styleProfile.cssRules
      .map(
        (rule) =>
          `${rule.selector} {\n${Object.entries(rule.properties)
            .map(([k, v]) => `  ${k}: ${v};`)
            .join("\n")}\n}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(css);
  };

  const copyRawCss = () => {
    if (styleProfile.rawCss) {
      navigator.clipboard.writeText(styleProfile.rawCss);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-3 bg-blue-50 rounded-lg text-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16">主色</span>
          <span
            className="inline-block w-4 h-4 rounded-sm"
            style={{ backgroundColor: styleProfile.primaryColor }}
          />
          <span className="text-gray-700">{styleProfile.primaryColor}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16">文字色</span>
          <span
            className="inline-block w-4 h-4 rounded-sm"
            style={{ backgroundColor: styleProfile.textColor }}
          />
          <span className="text-gray-700">{styleProfile.textColor}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16">背景色</span>
          <span
            className="inline-block w-4 h-4 rounded-sm border border-gray-200"
            style={{ backgroundColor: styleProfile.backgroundColor }}
          />
          <span className="text-gray-700">{styleProfile.backgroundColor}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16">字号</span>
          <span className="text-gray-700">
            正文 {styleProfile.bodyFontSize} / 标题 {styleProfile.headingFontSize}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16">行高</span>
          <span className="text-gray-700">{styleProfile.lineHeight}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16">标题</span>
          <span className="text-gray-700">
            {styleProfile.headingAlign === "center" ? "居中" : "左对齐"}
            {styleProfile.headingDecoration.type !== "none" &&
              ` · ${styleProfile.headingDecoration.type}`}
          </span>
        </div>
      </div>

      {/* Accent Colors */}
      {styleProfile.accentColors.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            强调色
          </h4>
          <div className="flex flex-wrap gap-2">
            {styleProfile.accentColors.slice(0, 8).map((color, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded border border-gray-200"
                  style={{ backgroundColor: color }}
                  title={color}
                />
                <span className="text-xs text-gray-500">{color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color Palette */}
      {styleProfile.colorPalette.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            全部颜色
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {styleProfile.colorPalette.map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded border border-gray-200"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Font Families */}
      {styleProfile.fontFamilies.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            字体
          </h4>
          <div className="flex flex-wrap gap-2">
            {styleProfile.fontFamilies.map((font, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
              >
                {font}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CSS Rules */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">
            CSS 规则 ({styleProfile.cssRules.length})
          </h4>
          <button
            onClick={copyCss}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            复制全部
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1">
          {styleProfile.cssRules.slice(0, 50).map((rule, i) => (
            <div
              key={i}
              className="p-2 bg-gray-50 rounded text-xs font-mono break-all"
            >
              <span className="text-blue-600">{rule.selector}</span>
              <span className="text-gray-500">{" {"}</span>
              <div className="pl-4">
                {Object.entries(rule.properties).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-purple-600">{k}</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-green-700">{v}</span>;
                  </div>
                ))}
              </div>
              <span className="text-gray-500">{"}"}</span>
            </div>
          ))}
          {styleProfile.cssRules.length > 50 && (
            <div className="text-xs text-gray-400 text-center py-2">
              还有 {styleProfile.cssRules.length - 50} 条规则未显示...
            </div>
          )}
        </div>
      </div>

      {/* Raw CSS */}
      {styleProfile.rawCss && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">
              原始 CSS
            </h4>
            <button
              onClick={copyRawCss}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              复制
            </button>
          </div>
          <pre className="p-2 bg-gray-50 rounded text-xs font-mono max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
            {styleProfile.rawCss.slice(0, 2000)}
            {styleProfile.rawCss.length > 2000 && "..."}
          </pre>
        </div>
      )}
    </div>
  );
}
