import express from "express";
import chokidar from "chokidar";
import { WebSocketServer } from "ws";
import http from "node:http";
import path from "node:path";
import { renderMarkdownToHtml } from "./renderer.js";
import { readUtf8 } from "./utils.js";

export type ServeOptions = {
  file: string;
  port: number;
};

export async function serveMarkdown({ file, port }: ServeOptions): Promise<void> {
  const abs = path.resolve(file);

  const app = express();
  const server = http.createServer(app);

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/livereload") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
      return;
    }
    socket.destroy();
  });

  async function render(): Promise<string> {
    const md = await readUtf8(abs);
    return renderMarkdownToHtml(md, { addTitle: path.basename(abs) });
  }

  app.get("/", async (_req, res) => {
    try {
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.send(await render());
    } catch (e: any) {
      res.status(500).send(`Failed to render: ${String(e?.message ?? e)}`);
    }
  });

  // Watch + reload
  const watcher = chokidar.watch(abs, { ignoreInitial: true });
  watcher.on("change", () => {
    for (const client of wss.clients) {
      try {
        client.send("reload");
      } catch {
        // ignore
      }
    }
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Preview: http://localhost:${port} (watching ${abs})`);
  });
}
