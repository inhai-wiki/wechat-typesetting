# 提取微信公众号文章样式

从微信公众号文章 URL 中提取排版样式，保存为可复用的样式模板。

## 使用方式

用户提供一个微信公众号文章链接，我来完成样式提取并保存。

## 执行步骤

### 1. 启动服务

```bash
cd /Users/nimbus/Desktop/open_wechat && npm run dev
```

访问 http://localhost:3000

### 2. 提取样式

在「样式提取」Tab 中粘贴微信文章链接，点击「提取样式」。

### 3. 验证样式

检查右侧面板「样式信息」中的：
- 主色 / 文字色 / 强调色
- 字体和字号
- 标题对齐方式和装饰类型
- CSS 规则

确认文章预览区显示正常。

### 4. 保存模板

点击「保存为模板」，输入模板名称。

## 技术细节

- **抓取**: `src/lib/fetcher.ts` — 服务端 fetch，伪装浏览器 UA
- **解析**: `src/lib/parser.ts` — cheerio 解析 `#js_content` 区域，提取 StyleProfile：
  - 配色：primaryColor, textColor, accentColors
  - 字体：fontFamily, bodyFontSize, headingFontSize
  - 装饰：headingDecoration (left-border/bottom-border/none)
  - 引用：quoteStyle (borderLeft)
- **存储**: `src/lib/storage.ts` — JSON 文件存入 `data/templates/`

## 注意事项

- 只支持 `mp.weixin.qq.com` 域名的文章链接
- 文章中的懒加载图片会自动转换 `data-src → src`
- 提取的是"视觉 DNA"（配色/字体/装饰模式），不是原始 CSS 选择器
