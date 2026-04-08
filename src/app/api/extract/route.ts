import { NextRequest, NextResponse } from "next/server";
import { fetchWechatArticle } from "@/lib/fetcher";
import { parseArticle } from "@/lib/parser";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    if (
      !url.startsWith("https://mp.weixin.qq.com/") &&
      !url.startsWith("http://mp.weixin.qq.com/")
    ) {
      return NextResponse.json(
        { error: "Please provide a valid WeChat article URL" },
        { status: 400 }
      );
    }

    const { html, title: rawTitle } = await fetchWechatArticle(url);
    const parsed = parseArticle(html);

    return NextResponse.json({
      ...parsed,
      sourceUrl: url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to extract article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
