"use client";

interface ArticlePreviewProps {
  html: string | null;
  title: string;
}

export default function ArticlePreview({ html, title }: ArticlePreviewProps) {
  if (!html) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm border border-dashed border-gray-300 rounded-lg">
        输入文章链接后，预览将显示在这里
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">
        {title}
      </div>
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <iframe
          srcDoc={wrapHtml(html)}
          className="w-full min-h-[400px] border-0"
          sandbox="allow-same-origin"
          title="Article Preview"
          onLoad={(e) => {
            const iframe = e.target as HTMLIFrameElement;
            try {
              const doc = iframe.contentDocument;
              if (doc?.body) {
                iframe.style.height = doc.body.scrollHeight + 40 + "px";
              }
            } catch {
              // cross-origin, ignore
            }
          }}
        />
      </div>
    </div>
  );
}

function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>${content}</body>
</html>`;
}
