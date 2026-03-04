import { promises as fs } from "node:fs";
import path from "node:path";

export async function readUtf8(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

export async function writeUtf8(filePath: string, data: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data, "utf8");
}
