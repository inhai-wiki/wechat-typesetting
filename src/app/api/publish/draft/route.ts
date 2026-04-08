import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import {
  createDraft,
  processContentImages,
  uploadImage,
} from "@/lib/wechat";

export async function POST(request: NextRequest) {
  try {
    const config = await getConfig();
    if (!config?.appId || !config?.appSecret) {
      return NextResponse.json(
        { error: "请先在设置中配置公众号 AppID 和 AppSecret" },
        { status: 400 }
      );
    }

    const { title, content, author } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    // Step 1: Process images in content — upload external images to WeChat
    const { html: processedContent, firstImageUrl } =
      await processContentImages(content);

    // Step 2: Get a thumb media_id for the article cover
    let thumbMediaId: string;

    if (firstImageUrl) {
      // Use the first image as the cover
      try {
        thumbMediaId = await uploadImage(firstImageUrl);
      } catch {
        // If first image upload fails, try to create a simple cover
        thumbMediaId = await createDefaultThumb();
      }
    } else {
      // No images in article — create a default cover
      thumbMediaId = await createDefaultThumb();
    }

    // Step 3: Create draft
    const mediaId = await createDraft({
      title,
      content: processedContent,
      thumbMediaId,
      author: author || "",
      digest: "",
    });

    return NextResponse.json({
      success: true,
      mediaId,
      message: "已推送到公众号草稿箱",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "推送失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Create a minimal default cover image and upload it.
 * Generates a simple colored rectangle as PNG.
 */
async function createDefaultThumb(): Promise<string> {
  const config = await getConfig();
  if (!config) throw new Error("未配置公众号信息");

  const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;
  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();
  if (tokenData.errcode) {
    throw new Error(`获取 token 失败: ${tokenData.errmsg}`);
  }
  const token = tokenData.access_token;

  // Create a minimal 1x1 green PNG (base64 encoded)
  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const pngBuffer = Buffer.from(pngBase64, "base64");

  const formData = new FormData();
  formData.append("media", new Blob([pngBuffer], { type: "image/png" }), "cover.png");

  const uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
  const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
  const uploadData = await uploadRes.json();

  if (uploadData.errcode) {
    throw new Error(`上传默认封面失败: ${uploadData.errmsg}`);
  }

  return uploadData.media_id;
}
