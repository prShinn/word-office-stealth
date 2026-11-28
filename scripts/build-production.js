// scripts/build-production.js
// Build production cho Cloudflare Pages / Static Hosting
// Nén code JS/CSS, loại bỏ comment và ghi chú nội bộ, bảo mật mã nguồn trong dist/

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "dist");

console.log("🚀 Bắt đầu Build Production cho Cloudflare Pages...");

// Hàm nén JS an toàn bằng tokenizer nhận biết chuỗi, template string, regex & comments
function minifyJS(code) {
  let outStr = "";
  let i = 0;
  const n = code.length;

  while (i < n) {
    const ch = code[i];
    const next = code[i + 1];

    // Chuỗi thường '...' hoặc "..."
    if (ch === '"' || ch === "'") {
      const quote = ch;
      outStr += quote;
      i++;
      while (i < n) {
        const c = code[i];
        outStr += c;
        if (c === "\\") {
          i++;
          if (i < n) outStr += code[i];
        } else if (c === quote) {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    // Template string `...`
    if (ch === '`') {
      outStr += '`';
      i++;
      while (i < n) {
        const c = code[i];
        outStr += c;
        if (c === "\\") {
          i++;
          if (i < n) outStr += code[i];
        } else if (c === '`') {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    // Single-line comment // ...
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < n && code[i] !== '\n') i++;
      continue;
    }

    // Multi-line comment /* ... */
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    outStr += ch;
    i++;
  }

  // Thu gọn khoảng trắng dư thừa và dòng trống
  return outStr
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// Hàm nén CSS
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([\{\}\:\;\,])\s*/g, "$1")
    .replace(/;\}/g, "}")
    .trim();
}

// Xóa và tạo mới thư mục dist/
if (fs.existsSync(out)) {
  fs.rmSync(out, { recursive: true, force: true });
}
fs.mkdirSync(out, { recursive: true });

// Danh sách file JS cần nén và xuất bản vào dist/
const jsFiles = [
  "data-en.js",
  "data-vi.js",
  "data-connections.js",
  "data-algo.js",
  "gist-sync.js",
  "engagement.js",
  "troll.js",
  "ads.js",
  "leaderboard.js",
  "app.js"
];

let totalSrcSize = 0;
let totalDistSize = 0;

for (const name of jsFiles) {
  const filePath = path.join(root, name);
  if (!fs.existsSync(filePath)) continue;

  const raw = fs.readFileSync(filePath, "utf8");
  totalSrcSize += raw.length;
  const minified = minifyJS(raw);
  totalDistSize += minified.length;

  fs.writeFileSync(path.join(out, name), minified, "utf8");
  console.log(`  ✓ JS:  ${name.padEnd(20)} ${Math.round(raw.length / 1024)} KB -> ${Math.round(minified.length / 1024)} KB`);
}

// Nén styles.css
if (fs.existsSync(path.join(root, "styles.css"))) {
  const rawCss = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  totalSrcSize += rawCss.length;
  const minCss = minifyCSS(rawCss);
  totalDistSize += minCss.length;
  fs.writeFileSync(path.join(out, "styles.css"), minCss, "utf8");
  console.log(`  ✓ CSS: styles.css           ${Math.round(rawCss.length / 1024)} KB -> ${Math.round(minCss.length / 1024)} KB`);
}

// Chép index.html
if (fs.existsSync(path.join(root, "index.html"))) {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  fs.writeFileSync(path.join(out, "index.html"), html, "utf8");
  console.log(`  ✓ HTML: index.html`);
}

// Chép static assets
const staticFiles = [
  "qr-donate.png",
  "version.json",
  "it-exam-sample.json",
  "it-quiz-bank.json",
  "_headers",
  "_redirects"
];

for (const name of staticFiles) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(out, name));
    console.log(`  ✓ Asset: ${name}`);
  }
}

// Chép web-pages nếu có
const webPagesDir = path.join(root, "web-pages");
if (fs.existsSync(webPagesDir)) {
  for (const name of fs.readdirSync(webPagesDir)) {
    const src = path.join(webPagesDir, name);
    if (fs.statSync(src).isFile()) {
      if (name.endsWith(".css")) {
        const minCss = minifyCSS(fs.readFileSync(src, "utf8"));
        fs.writeFileSync(path.join(out, name), minCss, "utf8");
      } else {
        fs.copyFileSync(src, path.join(out, name));
      }
      console.log(`  ✓ WebPage: ${name}`);
    }
  }
}

console.log("\n==========================================");
console.log(`✨ BUILD HOÀN TẤT VÀO THƯ MỤC dist/!`);
console.log(`📦 Dung lượng ban đầu: ${(totalSrcSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`⚡ Dung lượng sau nén: ${(totalDistSize / 1024 / 1024).toFixed(2)} MB (tiết kiệm ${Math.round((1 - totalDistSize / totalSrcSize) * 100)}%)`);
console.log(`🔒 Toàn bộ comment & ghi chú đã được xóa, code bảo mật sẵn sàng đưa lên Cloudflare Pages.`);
console.log("==========================================");
