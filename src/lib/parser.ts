import * as cheerio from "cheerio";

export interface ParsedArticle {
  contentHtml: string;
  title: string;
  author: string;
  styleProfile: StyleProfile;
  images: ImageInfo[];
}

export interface StyleProfile {
  // Color scheme
  primaryColor: string;       // Most prominent non-neutral color (accent)
  textColor: string;          // Main body text color
  backgroundColor: string;    // Page/content background
  accentColors: string[];     // All non-neutral colors (for reuse)

  // Typography
  fontFamily: string;
  bodyFontSize: string;
  headingFontSize: string;
  lineHeight: string;

  // Detected patterns
  headingAlign: string;           // "center" | "left"
  headingDecoration: {
    type: "left-border" | "bottom-border" | "background" | "none";
    color: string;
  };
  paragraphIndent: string;       // e.g. "2em" if indented

  // Section/block patterns
  sectionStyle: {
    background: string | null;
    borderRadius: string | null;
    padding: string | null;
  };

  // Quote patterns
  quoteStyle: {
    borderLeft: string | null;
    background: string | null;
    color: string | null;
  };

  // Complete <style> blocks from the article
  rawCss: string;

  // Original CSS rules (for reference/display)
  cssRules: CssRule[];
  fontFamilies: string[];
  colorPalette: string[];
  backgroundColors: string[];
}

export interface CssRule {
  selector: string;
  properties: Record<string, string>;
}

export interface ImageInfo {
  src: string;
  alt?: string;
  width?: string;
  height?: string;
}

export function parseArticle(html: string): ParsedArticle {
  const $ = cheerio.load(html);

  // Extract metadata
  const title =
    $("#activity-name").text().trim() ||
    $("meta[property='og:title']").attr("content") ||
    "Untitled";
  const author =
    $("#js_name").text().trim() ||
    $("meta[property='og:article:author']").attr("content") ||
    "";

  // Extract article content
  const contentEl = $("#js_content");
  if (!contentEl.length) {
    throw new Error(
      "Could not find article content (#js_content). The URL may not be a valid WeChat article."
    );
  }

  // Process images: convert data-src to src for lazy-loaded images
  contentEl.find("img").each((_, el) => {
    const img = $(el);
    const dataSrc = img.attr("data-src");
    if (dataSrc) {
      img.attr("src", dataSrc);
    }
  });

  // Remove script tags
  contentEl.find("script").remove();

  const contentHtml = contentEl.html() || "";

  // Extract style profile
  const styleProfile = extractStyleProfile($, contentEl, html);

  // Extract images
  const images: ImageInfo[] = [];
  contentEl.find("img").each((_, el) => {
    const img = $(el);
    const src = img.attr("src") || img.attr("data-src") || "";
    if (src) {
      images.push({
        src,
        alt: img.attr("alt"),
        width: img.attr("width") || img.attr("data-w"),
        height: img.attr("height"),
      });
    }
  });

  return { contentHtml, title, author, styleProfile, images };
}

function extractStyleProfile(
  $: cheerio.CheerioAPI,
  contentEl: cheerio.Cheerio<any>,
  fullHtml: string
): StyleProfile {
  // Collect all inline styles
  const allColors: { color: string; weight: number }[] = [];
  const allBgColors: string[] = [];
  const allFontSizes: { size: number; count: number }[] = [];
  const allFontFamilies: string[] = [];
  let totalTextElements = 0;
  const cssRules: CssRule[] = [];

  // Track heading patterns
  let headingAlign = "left";
  let headingDecoration: StyleProfile["headingDecoration"] = {
    type: "none",
    color: "",
  };
  let paragraphIndent = "";
  const sectionStyle: StyleProfile["sectionStyle"] = {
    background: null,
    borderRadius: null,
    padding: null,
  };
  const quoteStyle: StyleProfile["quoteStyle"] = {
    borderLeft: null,
    background: null,
    color: null,
  };

  contentEl.find("[style]").each((_, el) => {
    const element = $(el);
    const styleAttr = element.attr("style") || "";
    const props = parseInlineStyle(styleAttr);
    if (Object.keys(props).length === 0) return;

    const tagName = element.prop("tagName")?.toLowerCase() || "div";
    const className = element.attr("class") || "";
    const selector = className
      ? `${tagName}.${className.split(/\s+/).join(".")}`
      : tagName;
    cssRules.push({ selector, properties: props });

    // Collect colors (weighted by content length)
    if (props["color"]) {
      const text = element.text().trim();
      const weight = text.length;
      allColors.push({ color: props["color"], weight });
      totalTextElements += weight;
    }

    // Collect backgrounds
    if (props["background-color"]) {
      allBgColors.push(props["background-color"]);
    }
    if (props["background"]) {
      const bgColor = props["background"].match(
        /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/i
      )?.[1];
      if (bgColor) allBgColors.push(bgColor);
    }

    // Collect font sizes
    if (props["font-size"]) {
      const px = parsePxValue(props["font-size"]);
      if (px > 0) {
        const existing = allFontSizes.find((f) => f.size === px);
        if (existing) existing.count++;
        else allFontSizes.push({ size: px, count: 1 });
      }
    }

    // Collect font families
    if (props["font-family"] && !allFontFamilies.includes(props["font-family"])) {
      allFontFamilies.push(props["font-family"]);
    }

    // Detect heading alignment
    if (
      props["text-align"] &&
      (props["font-weight"] === "bold" ||
        props["font-weight"] === "700" ||
        parseInt(props["font-size"] || "0") >= 18)
    ) {
      headingAlign = props["text-align"];
    }

    // Detect heading decoration (left border, bottom border, background)
    if (tagName === "section" || tagName === "h1" || tagName === "h2") {
      if (
        props["border-left"] &&
        props["border-left"] !== "none" &&
        props["border-left"] !== "0"
      ) {
        const borderColor = props["border-left"].match(
          /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/i
        )?.[1];
        if (borderColor && !isNeutralColor(borderColor)) {
          headingDecoration = { type: "left-border", color: borderColor };
        }
      }
      if (
        props["border-bottom"] &&
        props["border-bottom"] !== "none" &&
        props["border-bottom"] !== "0"
      ) {
        const borderColor = props["border-bottom"].match(
          /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/i
        )?.[1];
        if (borderColor && !isNeutralColor(borderColor)) {
          headingDecoration = { type: "bottom-border", color: borderColor };
        }
      }
      if (
        props["background-color"] &&
        !isNeutralColor(props["background-color"])
      ) {
        headingDecoration = { type: "background", color: props["background-color"] };
      }
    }

    // Detect paragraph indent
    if (
      tagName === "p" &&
      props["text-indent"] &&
      !paragraphIndent
    ) {
      paragraphIndent = props["text-indent"];
    }

    // Detect section patterns (background + border-radius + padding combo)
    if (
      props["background-color"] &&
      props["padding"] &&
      !isNeutralColor(props["background-color"])
    ) {
      sectionStyle.background = props["background-color"];
      if (props["border-radius"]) sectionStyle.borderRadius = props["border-radius"];
      if (props["padding"]) sectionStyle.padding = props["padding"];
    }

    // Detect quote-like patterns (left border + different background)
    if (
      props["border-left"] &&
      props["border-left"] !== "none" &&
      props["border-left"] !== "0"
    ) {
      const borderLeft = props["border-left"];
      quoteStyle.borderLeft = borderLeft;
      if (props["background-color"]) quoteStyle.background = props["background-color"];
      if (props["color"]) quoteStyle.color = props["color"];
    }
  });

  // Collect <style> block content
  let rawCss = "";
  contentEl.find("style").each((_, el) => {
    rawCss += $(el).text() + "\n";
  });
  // Also check page-level <style> for article-related rules
  const pageStyles: CssRule[] = [];
  $("style").each((_, el) => {
    const cssText = $(el).text();
    // Only include rules that relate to content styling
    if (
      cssText.includes("rich_media") ||
      cssText.includes("js_content") ||
      cssText.includes("article")
    ) {
      rawCss += cssText + "\n";
    }
    const rules = parseCssText(cssText);
    pageStyles.push(...rules);
  });

  // Determine primary color: most used non-neutral color
  const colorMap = new Map<string, number>();
  for (const { color, weight } of allColors) {
    if (!isNeutralColor(color)) {
      colorMap.set(color, (colorMap.get(color) || 0) + weight);
    }
  }
  let primaryColor = "#576b95"; // WeChat default blue fallback
  let maxWeight = 0;
  for (const [color, weight] of colorMap) {
    if (weight > maxWeight) {
      maxWeight = weight;
      primaryColor = color;
    }
  }

  // Determine text color: most used color overall
  const textColorMap = new Map<string, number>();
  for (const { color, weight } of allColors) {
    textColorMap.set(color, (textColorMap.get(color) || 0) + weight);
  }
  let textColor = "#333";
  let maxTextWeight = 0;
  for (const [color, weight] of textColorMap) {
    if (weight > maxTextWeight) {
      maxTextWeight = weight;
      textColor = color;
    }
  }

  // Determine body font size (most common)
  allFontSizes.sort((a, b) => b.count - a.count);
  const bodyFontSize = allFontSizes.length > 0
    ? `${allFontSizes[0].size}px`
    : "16px";

  // Determine heading font size (largest common size)
  const largeSizes = allFontSizes
    .filter((f) => f.size >= 18)
    .sort((a, b) => b.size - a.size);
  const headingFontSize = largeSizes.length > 0
    ? `${largeSizes[0].size}px`
    : "22px";

  // Determine background color (most common non-white)
  const bgColorMap = new Map<string, number>();
  for (const color of allBgColors) {
    if (!isNeutralColor(color)) {
      bgColorMap.set(color, (bgColorMap.get(color) || 0) + 1);
    }
  }
  let backgroundColor = "#fff";
  let maxBgCount = 0;
  for (const [color, count] of bgColorMap) {
    if (count > maxBgCount) {
      maxBgCount = count;
      backgroundColor = color;
    }
  }

  // Accent colors = all unique non-neutral colors
  const accentColorSet = new Set<string>();
  for (const { color } of allColors) {
    if (!isNeutralColor(color)) accentColorSet.add(color);
  }
  for (const color of allBgColors) {
    if (!isNeutralColor(color)) accentColorSet.add(color);
  }

  const fontFamily = allFontFamilies[0] ||
    "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif";

  return {
    primaryColor,
    textColor,
    backgroundColor,
    accentColors: Array.from(accentColorSet),
    fontFamily,
    bodyFontSize,
    headingFontSize,
    lineHeight: "1.8",
    headingAlign,
    headingDecoration,
    paragraphIndent,
    sectionStyle,
    quoteStyle,
    rawCss,
    cssRules: [...cssRules, ...pageStyles],
    fontFamilies: allFontFamilies,
    colorPalette: Array.from(new Set(allColors.map((c) => c.color))),
    backgroundColors: Array.from(new Set(allBgColors)),
  };
}

function parseInlineStyle(style: string): Record<string, string> {
  const properties: Record<string, string> = {};
  const declarations = style.split(";").filter((s) => s.trim());

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(":");
    if (colonIndex === -1) continue;
    const prop = decl.slice(0, colonIndex).trim().toLowerCase();
    const val = decl.slice(colonIndex + 1).trim();
    if (prop && val) {
      properties[prop] = val;
    }
  }

  return properties;
}

function parseCssText(cssText: string): CssRule[] {
  const rules: CssRule[] = [];
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = ruleRegex.exec(cssText)) !== null) {
    const selector = match[1].trim();
    const propsStr = match[2].trim();
    const properties = parseInlineStyle(propsStr);

    if (Object.keys(properties).length > 0) {
      rules.push({ selector, properties });
    }
  }

  return rules;
}

function parsePxValue(value: string): number {
  const match = value.match(/([\d.]+)\s*px/i);
  return match ? parseFloat(match[1]) : 0;
}

function isNeutralColor(color: string): boolean {
  if (!color) return true;
  const lower = color.toLowerCase().trim();

  // Named neutrals
  if (["transparent", "inherit", "initial", "none"].includes(lower)) return true;
  if (["white", "#fff", "#ffffff", "#FFF", "#FFFFFF"].includes(lower)) return true;
  if (["black", "#000", "#000000"].includes(lower)) return true;

  // Gray shades via hex
  const hexMatch = lower.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3 || hex.length === 6) {
      const full = hex.length === 3
        ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        : hex;
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      // Check if it's a gray (r ≈ g ≈ b)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min < 20) return true; // Very low saturation = neutral
      // Also consider very light or very dark colors as "neutral"
      if (max > 240 && max - min < 30) return true; // Very light
      if (min < 30 && max - min < 30) return true; // Very dark
    }
  }

  // rgba/rgb neutrals
  const rgbMatch = lower.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 20) return true;
    if (max > 240 && max - min < 30) return true;
    if (min < 30 && max - min < 30) return true;
  }

  return false;
}
