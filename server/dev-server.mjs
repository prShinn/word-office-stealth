// Máy chủ chạy thử trên máy: web tĩnh + API. Chỉ nghe 127.0.0.1.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import worker from "./worker.js";
import { createLocalDb } from "./d1-local.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dataDir = join(here, ".data");
const port = Number(process.env.PORT) || 8787;

// WHITELIST: chỉ phục vụ đúng các file này, để đề thi trong server/ không bao giờ lộ ra web
const STATIC_FILES = new Set([
  "index.html", "styles.css", "app.js", "engagement.js", "ads.js", "leaderboard.js",
  "data-en.js", "data-vi.js", "data-connections.js"
]);
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

mkdirSync(dataDir, { recursive: true });
const secretsPath = join(dataDir, "secrets.json");
if (!existsSync(secretsPath)) {
  const make = () => randomBytes(24).toString("hex");
  writeFileSync(secretsPath, JSON.stringify({ PUZZLE_SEED: make(), RATE_SALT: make() }));
}
const env = {
  ...JSON.parse(readFileSync(secretsPath, "utf8")),
  DB: createLocalDb(join(dataDir, "local.db"))
};

async function readRaw(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw new Error("body too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith("/api/") || url.pathname === "/healthz" || url.pathname === "/readyz") {
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
      headers.set("cf-connecting-ip", req.socket.remoteAddress || "local"); // không tin header client gửi
      const hasBody = req.method !== "GET" && req.method !== "HEAD";
      const response = await worker.fetch(
        new Request(url, { method: req.method, headers, body: hasBody ? await readRaw(req) : undefined }),
        env
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
      return;
    }

    const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    if (req.method !== "GET" || !STATIC_FILES.has(name)) {
      res.writeHead(404).end();
      return;
    }
    const content = await readFile(join(root, name));
    res.writeHead(200, { "content-type": `${TYPES[extname(name)]}; charset=utf-8`, "cache-control": "no-store" });
    res.end(content);
  } catch (error) {
    console.error(String(error && error.message));
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
});

server.listen(port, "127.0.0.1", () => console.log(`Bảng Chữ: http://localhost:${port}`));

function shutdown() {
  server.close(() => {
    env.DB.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
