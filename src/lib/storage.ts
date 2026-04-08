import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface Template {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  sourceUrl?: string;
  articleTitle?: string;
  styleProfile: {
    primaryColor: string;
    textColor: string;
    backgroundColor: string;
    accentColors: string[];
    fontFamily: string;
    bodyFontSize: string;
    headingFontSize: string;
    lineHeight: string;
    headingAlign: string;
    headingDecoration: {
      type: string;
      color: string;
    };
    paragraphIndent: string;
    sectionStyle: {
      background: string | null;
      borderRadius: string | null;
      padding: string | null;
    };
    quoteStyle: {
      borderLeft: string | null;
      background: string | null;
      color: string | null;
    };
    rawCss: string;
    // Kept for backward compat & StylePanel display
    cssRules: { selector: string; properties: Record<string, string> }[];
    fontFamilies: string[];
    colorPalette: string[];
    backgroundColors: string[];
  };
  sampleHtml: string;
}

const TEMPLATES_DIR = path.join(process.cwd(), "data", "templates");

async function ensureDir() {
  await fs.mkdir(TEMPLATES_DIR, { recursive: true });
}

export async function listTemplates(): Promise<
  Pick<
    Template,
    "id" | "name" | "description" | "createdAt" | "articleTitle"
  >[]
> {
  await ensureDir();
  const files = await fs.readdir(TEMPLATES_DIR);
  const templates: Pick<
    Template,
    "id" | "name" | "description" | "createdAt" | "articleTitle"
  >[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(TEMPLATES_DIR, file), "utf-8");
    const t: Template = JSON.parse(raw);
    templates.push({
      id: t.id,
      name: t.name,
      description: t.description,
      createdAt: t.createdAt,
      articleTitle: t.articleTitle,
    });
  }

  return templates.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getTemplate(id: string): Promise<Template | null> {
  await ensureDir();
  const filePath = path.join(TEMPLATES_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as Template;
  } catch {
    return null;
  }
}

export async function saveTemplate(
  data: Omit<Template, "id" | "createdAt">
): Promise<Template> {
  await ensureDir();
  const template: Template = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(TEMPLATES_DIR, `${template.id}.json`),
    JSON.stringify(template, null, 2),
    "utf-8"
  );

  return template;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const filePath = path.join(TEMPLATES_DIR, `${id}.json`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
