import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import sanitizeHtml from "sanitize-html";

export type RenderOptions = {
  allowHtml?: boolean;        // if true, allow raw HTML in markdown (still sanitized)
  addTitle?: string | null;   // optional <title>
};

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return code;
    }
  }
});

export function renderMarkdownToHtml(markdown: string, opts: RenderOptions = {}): string {
  const raw = md.render(markdown);

  // Sanitization: safe defaults; if allowHtml is false, we strip more aggressively
  const clean = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "h4", "h5", "h6"]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title"],
      code: ["class"],
      span: ["class"],
      pre: ["class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
    // If you want to disallow raw HTML from markdown more strictly:
    // You can set md.set({ html: false }) based on opts, but we keep it simple here.
  });

  const title = opts.addTitle ? escapeHtml(opts.addTitle) : "markdown";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 0; }
    .wrap { max-width: 920px; margin: 0 auto; padding: 24px; }
    pre { padding: 14px; overflow: auto; border-radius: 10px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New"; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 12px; color: #444; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    a { word-break: break-word; }
    img { max-width: 100%; height: auto; }
  </style>
  <script>
    // Live-reload (only used by the preview server)
    (() => {
      const wsUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/livereload";
      let ws;
      function connect() {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (msg) => { if (msg.data === "reload") location.reload(); };
        ws.onclose = () => setTimeout(connect, 500);
      }
      connect();
    })();
  </script>
</head>
<body>
  <div class="wrap">
    ${clean}
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
