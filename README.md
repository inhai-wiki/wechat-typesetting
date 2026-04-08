# WeChat Typesetting

微信公众号排版工具 — 从文章提取样式，用 Markdown 编写内容，一键排版并推送到公众号草稿箱。

## 功能

### 样式提取
- 输入微信公众号文章链接，自动提取配色方案、字体、装饰模式
- 保存为可复用的样式模板

### Markdown 排版
- 选择已保存的样式模板，将 Markdown 内容排版为微信公众号兼容格式
- 支持标题、列表、引用、代码块、表格、多图横排等
- 一键复制到公众号编辑器（内联样式，不丢失格式）

### 推送草稿箱
- 配置公众号 AppID + AppSecret
- 排版完成后一键推送到公众号草稿箱
- 自动上传文内图片到微信图床

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装

```bash
git clone https://github.com/inhai-wiki/wechat-typesetting.git
cd wechat-typesetting
npm install
```

### 启动

```bash
npm run dev
```

访问 http://localhost:3000

## 使用流程

### 1. 提取样式

在「样式提取」Tab 中粘贴微信公众号文章链接，点击「提取样式」。

提取的信息包括：
- 主色、文字色、强调色
- 字体和字号
- 标题对齐方式和装饰模式

确认无误后点击「保存为模板」。

### 2. 排版文章

切换到「Markdown 排版」Tab：
1. 在下拉框中选择样式模板
2. 粘贴 Markdown 内容
3. 点击「排版」预览效果
4. 点击「一键复制到公众号」或「推送到草稿箱」

### 3. 推送到草稿箱（可选）

首次使用需要配置：
1. 点击右上角齿轮图标
2. 输入公众号 AppID 和 AppSecret
3. 在 [微信公众平台](https://mp.weixin.qq.com/) 添加 IP 白名单

查看当前 IP：
```bash
curl -4 -s https://checkip.amazonaws.com
```

## 技术栈

- **框架**: Next.js 15 (App Router) + React + TypeScript
- **样式**: Tailwind CSS
- **解析**: cheerio（HTML 解析）、marked（Markdown 解析）
- **存储**: 本地 JSON 文件
- **API**: 微信公众号草稿箱 API

## 项目结构

```
├── skills/                  # Claude Code Skill 文档
├── data/
│   ├── templates/           # 样式模板 JSON 文件
│   └── config.json          # 公众号配置（AppID/AppSecret）
├── src/
│   ├── app/
│   │   ├── page.tsx         # 主页面
│   │   └── api/
│   │       ├── extract/     # 文章抓取和解析
│   │       ├── templates/   # 模板 CRUD
│   │       ├── config/      # 公众号配置
│   │       └── publish/     # 草稿箱推送
│   ├── lib/
│   │   ├── fetcher.ts       # 微信文章抓取
│   │   ├── parser.ts        # 样式提取（StyleProfile）
│   │   ├── storage.ts       # 模板存储
│   │   ├── config.ts        # 配置管理
│   │   └── wechat.ts        # 微信 API
│   └── components/
│       ├── MarkdownFormatter.tsx  # 排版核心组件
│       ├── ArticlePreview.tsx     # 文章预览
│       ├── StylePanel.tsx         # 样式信息面板
│       ├── TemplateList.tsx       # 模板列表
│       ├── SettingsDialog.tsx     # 配置弹窗
│       └── PublishDialog.tsx      # 推送弹窗
```

## 微信兼容性

排版引擎遵循以下规则确保微信兼容：

| 问题 | 解决方案 |
|------|---------|
| `<ul>/<ol>/<li>` 被重新排版 | 转为 `<section>` + 手动编号 |
| `<blockquote>` 变成色块 | 转为 `<section>` + `border-left` |
| `<p>` 额外间距 | 外层包 `<section>` 控制间距 |
| `calc()` 不支持 | 预计算为固定 px 值 |
| `display:flex` 不支持 | 用 `<table>` 布局 |
| 多图无法横排 | `<table>` 包裹每个图片一个 `<td>` |

## 配套项目

- [wechat-article-skills](https://github.com/inhai-wiki/wechat-article-skills) — Claude Code Skill 文档合集

## License

MIT
