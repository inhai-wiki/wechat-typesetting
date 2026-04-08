import { getConfig } from "./config";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const config = await getConfig();
  if (!config) {
    throw new Error("请先配置公众号 AppID 和 AppSecret");
  }

  // Return cached token if still valid (with 5min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300000) {
    return cachedToken.token;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errmsg} (${data.errcode})`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Upload image to WeChat as permanent material and return media_id
 */
export async function uploadImage(imageUrl: string): Promise<string> {
  const token = await getAccessToken();

  // Download the image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`下载图片失败: ${imageUrl}`);

  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  // Upload as permanent material (素材)
  const formData = new FormData();
  formData.append(
    "media",
    new Blob([buffer], { type: contentType }),
    `image.${ext}`
  );

  const uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });
  const uploadData = await uploadRes.json();

  if (uploadData.errcode) {
    throw new Error(`上传图片失败: ${uploadData.errmsg}`);
  }

  return uploadData.media_id;
}

/**
 * Upload an HTML content image to WeChat (for in-article images).
 * Returns the WeChat URL for the uploaded image.
 */
export async function uploadContentImage(imageUrl: string): Promise<string> {
  const token = await getAccessToken();

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`下载图片失败: ${imageUrl}`);

  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  const formData = new FormData();
  formData.append(
    "media",
    new Blob([buffer], { type: contentType }),
    `image.${ext}`
  );

  // Upload content image (图文消息内的图片)
  const uploadUrl = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`;
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });
  const uploadData = await uploadRes.json();

  if (uploadData.errcode) {
    throw new Error(`上传内容图片失败: ${uploadData.errmsg}`);
  }

  return uploadData.url;
}

export interface DraftArticle {
  title: string;
  content: string;
  thumbMediaId: string;
  author?: string;
  digest?: string;
  contentSourceUrl?: string;
}

/**
 * Create a draft in the WeChat Official Account draft box.
 * Returns the media_id of the created draft.
 */
export async function createDraft(article: DraftArticle): Promise<string> {
  const token = await getAccessToken();

  const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      articles: [
        {
          title: article.title,
          author: article.author || "",
          digest: article.digest || "",
          content: article.content,
          thumb_media_id: article.thumbMediaId,
          content_source_url: article.contentSourceUrl || "",
          need_open_comment: 0,
          only_fans_can_comment: 0,
        },
      ],
    }),
  });

  const data = await res.json();

  if (data.errcode) {
    throw new Error(`创建草稿失败: ${data.errmsg} (${data.errcode})`);
  }

  return data.media_id;
}

/**
 * Process HTML content: find all external images, upload them to WeChat,
 * and replace URLs with WeChat-hosted URLs.
 */
export async function processContentImages(
  html: string
): Promise<{ html: string; firstImageUrl: string | null }> {
  // Find all image URLs in the HTML
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const matches = [...html.matchAll(imgRegex)];

  if (matches.length === 0) {
    return { html, firstImageUrl: null };
  }

  let processedHtml = html;
  let firstImageUrl: string | null = null;

  for (const match of matches) {
    const originalUrl = match[1];

    // Skip data URIs and already WeChat-hosted images
    if (originalUrl.startsWith("data:") || originalUrl.includes("mmbiz.qpic.cn")) {
      if (!firstImageUrl) firstImageUrl = originalUrl;
      continue;
    }

    try {
      const wechatUrl = await uploadContentImage(originalUrl);
      processedHtml = processedHtml.replace(originalUrl, wechatUrl);
      if (!firstImageUrl) firstImageUrl = wechatUrl;
    } catch (err) {
      console.error(`Failed to upload image ${originalUrl}:`, err);
      // Keep original URL as fallback
      if (!firstImageUrl) firstImageUrl = originalUrl;
    }
  }

  return { html: processedHtml, firstImageUrl };
}
