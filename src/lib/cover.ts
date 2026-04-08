import sharp from "sharp";
import { getAccessToken } from "./wechat";

/**
 * Generate a default cover image (900x383) with the article title.
 * Used when no image is available in the article.
 */
export async function generateDefaultCover(title: string): Promise<Buffer> {
  const width = 900;
  const height = 383;

  // Create a green gradient background with title text
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#07C160"/>
        <stop offset="100%" style="stop-color:#06AD56"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <text x="${width / 2}" y="${height / 2 - 10}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="36" fill="white" text-anchor="middle" font-weight="bold">${escapeXml(title.slice(0, 20))}</text>
    <text x="${width / 2}" y="${height / 2 + 30}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="16" fill="rgba(255,255,255,0.7)" text-anchor="middle">微信公众号文章</text>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Crop an image to WeChat cover ratio (900x383, 2.35:1).
 * Takes the center crop of the image.
 */
export async function cropToCover(
  imageBuffer: Buffer,
  contentType: string
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("无法读取图片尺寸");
  }

  const targetRatio = 900 / 383; // ~2.35:1
  const currentRatio = metadata.width / metadata.height;

  let cropWidth: number;
  let cropHeight: number;
  let left: number;
  let top: number;

  if (currentRatio > targetRatio) {
    // Image is wider than target — crop sides
    cropHeight = metadata.height;
    cropWidth = Math.round(metadata.height * targetRatio);
    left = Math.round((metadata.width - cropWidth) / 2);
    top = 0;
  } else {
    // Image is taller than target — crop top/bottom
    cropWidth = metadata.width;
    cropHeight = Math.round(metadata.width / targetRatio);
    left = 0;
    top = Math.round((metadata.height - cropHeight) / 2);
  }

  return image
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(900, 383, { fit: "fill" })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Generate cover from first image in article (crop to 900x383).
 * Falls back to default cover if the image can't be processed.
 */
export async function generateCoverFromImage(
  imageUrl: string,
  title: string
): Promise<Buffer> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("下载失败");

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    return await cropToCover(buffer, "image/jpeg");
  } catch {
    // Fallback to generated cover
    return generateDefaultCover(title);
  }
}

/**
 * Upload a cover image buffer to WeChat as permanent material.
 * Returns the media_id.
 */
export async function uploadCoverImage(
  imageBuffer: Buffer
): Promise<string> {
  const token = await getAccessToken();

  const formData = new FormData();
  formData.append(
    "media",
    new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }),
    "cover.jpg"
  );

  const uploadUrl = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`;
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });
  const uploadData = await uploadRes.json();

  if (uploadData.errcode) {
    throw new Error(`上传封面失败: ${uploadData.errmsg} (${uploadData.errcode})`);
  }

  return uploadData.media_id;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
