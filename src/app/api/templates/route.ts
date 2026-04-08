import { NextRequest, NextResponse } from "next/server";
import { listTemplates, getTemplate, saveTemplate, deleteTemplate } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const template = await getTemplate(id);
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(template);
    }

    const templates = await listTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, sourceUrl, articleTitle, styleProfile, sampleHtml } =
      body;

    if (!name || !styleProfile || !sampleHtml) {
      return NextResponse.json(
        { error: "name, styleProfile, and sampleHtml are required" },
        { status: 400 }
      );
    }

    const template = await saveTemplate({
      name,
      description,
      sourceUrl,
      articleTitle,
      styleProfile,
      sampleHtml,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template id is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteTemplate(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
