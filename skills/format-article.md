# Markdown 文章排版美化

根据已保存的样式模板，将 Markdown 文章排版为微信公众号兼容的格式。

## 使用方式

用户提供 Markdown 内容和希望使用的模板名称，我来完成排版。

## 执行步骤

### 1. 启动服务

```bash
cd /Users/nimbus/Desktop/open_wechat && npm run dev
```

访问 http://localhost:3000，切换到「Markdown 排版」Tab。

### 2. 选择模板

在右上角下拉框中选择之前保存的样式模板（或使用默认样式）。

### 3. 输入 Markdown

在左侧输入框粘贴 Markdown 内容。第一个 `# 标题` 会自动提取为文章标题。

### 4. 点击「排版」

预览区会显示排版效果。

### 5. 导出

- **「一键复制到公众号」** — 复制内联样式 HTML 到剪贴板，可直接粘贴到公众号编辑器
- **「下载 HTML」** — 下载为 .html 文件

## 微信兼容性规则（核心）

排版生成的 HTML 必须遵循以下规则，否则微信会破坏样式：

### 标签转换
- `<ul>/<ol>/<li>` → 转为 `<section>` + 手动编号/符号（微信会重新排版列表）
- `<blockquote>` → 转为 `<section>` + `border-left`（微信会把 blockquote 变色块）
- `<p>` → 外层包 `<section>` 控制间距（微信会给 p 加额外 margin）

### 禁止使用的 CSS
- `calc()` → 预计算为固定 px 值
- `#xxx80` hex+alpha → 用标准颜色
- `display:flex` → 用 `<table>` 布局
- `background` 色块 → 引用/表头/标题不要用 background

### 多图横排
同行多张图片用 `<table>` 包裹：
```markdown
![图1](url1) ![图2](url2)
```
自动转为每个图片一个 `<td>` 的表格布局。

## 技术细节

- **核心函数**: `buildInlineHtml()` in `src/components/MarkdownFormatter.tsx`
- **原理**: 用 DOMParser 解析 marked 输出，遍历 DOM 树，按标签名写入内联 style
- **预览和推送使用同一套逻辑**，确保所见即所得
