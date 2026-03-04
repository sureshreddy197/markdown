#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { renderMarkdownToHtml } from "./renderer.js";
import { readUtf8, writeUtf8 } from "./utils.js";
import { serveMarkdown } from "./server.js";

const program = new Command();

program
  .name("markdown")
  .description("Markdown renderer + CLI (md -> HTML) with optional preview server")
  .version("0.1.0");

program
  .command("render")
  .description("Render a markdown file to HTML")
  .argument("<file>", "Path to a .md file")
  .option("-o, --out <file>", "Write output to a file (default: stdout)")
  .option("--title <title>", "HTML <title> value", "")
  .action(async (file, options) => {
    const abs = path.resolve(file);
    const md = await readUtf8(abs);
    const html = renderMarkdownToHtml(md, { addTitle: options.title || path.basename(abs) });

    if (options.out) {
      await writeUtf8(path.resolve(options.out), html);
      console.log(`Wrote ${options.out}`);
    } else {
      process.stdout.write(html);
    }
  });

program
  .command("serve")
  .description("Serve a markdown file with live reload")
  .argument("<file>", "Path to a .md file")
  .option("-p, --port <port>", "Port", (v) => Number(v), 3000)
  .action(async (file, options) => {
    await serveMarkdown({ file, port: options.port });
  });

program.parseAsync(process.argv);
