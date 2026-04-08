# 发布到微信公众号草稿箱

将排版好的文章推送到微信公众号草稿箱。

## 前置条件

1. 已完成排版（使用 format-article skill）
2. 已在「设置」中配置公众号 AppID 和 AppSecret
3. 当前公网 IP 已加入微信公众平台的 IP 白名单

## 配置步骤（首次使用）

### 1. 获取 AppID 和 AppSecret

登录 [微信公众平台](https://mp.weixin.qq.com/) →「设置与开发」→「基本配置」

### 2. 配置 IP 白名单

「基本配置」→「IP白名单」→ 添加当前公网 IP

查看当前 IP：
```bash
curl -4 -s https://checkip.amazonaws.com
```

### 3. 保存配置

在工具右上角齿轮图标 → 输入 AppID 和 AppSecret → 保存

配置保存在本地 `data/config.json`，不会上传。

## 发布步骤

### 1. 排版文章

在「Markdown 排版」Tab 完成排版后，点击「推送到草稿箱」按钮。

### 2. 确认信息

弹窗中会显示自动提取的文章标题（可修改作者）。

### 3. 推送

点击「推送到草稿箱」，等待推送完成。

### 4. 验证

登录微信公众平台 →「内容管理」→「草稿」中查看文章。

## 技术细节

### API 流程

1. **获取 access_token**
   ```
   GET /cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
   ```

2. **上传文内图片**（替换外部图片为微信图床 URL）
   ```
   POST /cgi-bin/media/uploadimg
   ```

3. **上传封面图**（使用文章第一张图或默认封面）
   ```
   POST /cgi-bin/material/add_material?type=image
   ```

4. **创建草稿**
   ```
   POST /cgi-bin/draft/add
   Body: { articles: [{ title, content, thumb_media_id, author }] }
   ```

### 代码位置

- **配置管理**: `src/lib/config.ts` + `src/app/api/config/route.ts`
- **微信 API**: `src/lib/wechat.ts` — token 管理、图片上传、草稿创建
- **推送入口**: `src/app/api/publish/draft/route.ts`
- **前端弹窗**: `src/components/PublishDialog.tsx`

## 常见问题

| 错误 | 原因 | 解决 |
|------|------|------|
| `invalid ip` | IP 未加白名单 | 在公众平台添加当前 IP |
| `access_token 失败` | AppID/AppSecret 错误 | 检查配置 |
| `图片上传失败` | 图片 URL 无法访问 | 确保图片可公网访问 |
| 样式丢失 | HTML 含 `<style>` 标签 | 排版引擎已自动转为内联样式 |

## 注意

- access_token 有效期 2 小时，有缓存机制自动续期
- 文内图片会自动上传到微信图床，替换原始 URL
- 家庭宽带 IP 可能会变，需重新更新白名单
