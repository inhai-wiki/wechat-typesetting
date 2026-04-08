import fs from "fs/promises";
import path from "path";

export interface WechatConfig {
  appId: string;
  appSecret: string;
}

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

export async function getConfig(): Promise<WechatConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as WechatConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(config: WechatConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
