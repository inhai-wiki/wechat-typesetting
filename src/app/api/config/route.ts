import { NextRequest, NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/config";

export async function GET() {
  const config = await getConfig();
  if (!config) {
    return NextResponse.json({ configured: false });
  }
  return NextResponse.json({
    configured: true,
    appId: config.appId,
    // Mask appSecret for security
    appSecret: config.appSecret.slice(0, 4) + "****" + config.appSecret.slice(-4),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { appId, appSecret } = await request.json();

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: "AppID 和 AppSecret 不能为空" },
        { status: 400 }
      );
    }

    await saveConfig({ appId, appSecret });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const fs = await import("fs/promises");
  const path = await import("path");
  const configPath = path.join(process.cwd(), "data", "config.json");
  try {
    await fs.unlink(configPath);
  } catch {}
  return NextResponse.json({ success: true });
}
