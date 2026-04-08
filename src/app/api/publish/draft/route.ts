import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import {
  createDraft,
  processContentImages,
} from "@/lib/wechat";
import {
  generateCoverFromImage,
  generateDefaultCover,
  uploadCoverImage,
} from "@/lib/cover";

export async function POST(request: NextRequest) {
  try {
    const config = await getConfig();
    if (!config?.appId || !config?.appSecret) {
      return NextResponse.json(
        { error: "请先在设置中配置公众号 AppID 和 AppSecret" },
        { status: 400 }
      );
    }

    const { title, content, author, coverUrl } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    // Step 1: Process images in content — upload external images to WeChat
    const { html: processedContent, firstImageUrl } =
      await processContentImages(content);

    // Step 2: Generate and upload cover image (900x383, WeChat required ratio)
    let coverBuffer: Buffer;

    if (coverUrl) {
      // User provided a custom cover URL
      coverBuffer = await generateCoverFromImage(coverUrl, title);
    } else if (firstImageUrl && !firstImageUrl.startsWith("data:")) {
      // Use the first image from article content, crop to cover ratio
      coverBuffer = await generateCoverFromImage(firstImageUrl, title);
    } else {
      // No images — generate a default cover with the title
      coverBuffer = await generateDefaultCover(title);
    }

    const thumbMediaId = await uploadCoverImage(coverBuffer);

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
