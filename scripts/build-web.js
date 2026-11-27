// Đóng gói bản web CHỈ CHƠI THƯỜNG vào dist/ (không máy chủ, không quảng cáo).
//   node scripts/build-web.js --contact=email@cua-ban      bản dùng để phát hành
//   node scripts/build-web.js --preview                    bản xem thử (chặn công cụ tìm kiếm)
// Chỉ chép đúng danh sách bên dưới, nên server/ (đề thi, khóa bí mật, dữ liệu) không bao giờ lọt ra web.
// Đóng gói được KHÔNG có nghĩa là được phép phát hành: xem docs/phat-hanh.md.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "dist");
const preview = process.argv.includes("--preview");
const contact = (process.argv.find((a) => a.startsWith("--contact=")) || "").slice("--contact=".length).trim();

if (!preview && !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(contact)) {
  console.error("Thiếu email liên hệ hợp lệ: --contact=...  (hoặc dùng --preview để xem thử)");
  process.exit(1);
}

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

// Thay đúng 1 chỗ; mã nguồn đổi làm lệch thì dừng ngay thay vì tạo bản sai
function replaceOnce(source, from, to, file) {
  const count = typeof from === "string" ? source.split(from).length - 1 : (source.match(new RegExp(from, "g")) || []).length;
  if (count !== 1) throw new Error(`${file}: cần khớp đúng 1 chỗ, đang khớp ${count}: ${from}`);
  return source.replace(from, () => to);
}

const files = {};
for (const name of ["styles.css", "data-en.js", "data-vi.js", "data-connections.js", "engagement.js"]) {
  files[name] = read(name);
}

// BXH và quảng cáo tắt trong bản này: thay bằng bản rỗng cùng giao ước
files["leaderboard.js"] = "window.Leaderboard = { open() {}, close() {}, isOpen: () => false };\n";
files["ads.js"] = "window.RewardedAd = { show: () => Promise.resolve(false), cancel() {}, isOpen: () => false };\n";

let app = read("app.js");
app = replaceOnce(app, '"Xem quảng cáo +1 gợi ý"', '"Hết gợi ý · mai +1"', "app.js");
app = replaceOnce(app, '"Hết lượt gợi ý. Chỉ mở quảng cáo khi bạn bấm nút này"', '"Hết lượt gợi ý. Mỗi ngày được thêm lượt mới"', "app.js");
app = replaceOnce(app, `'Hết lượt gợi ý · Bấm nút "Xem quảng cáo" nếu muốn thêm'`, '"Hết lượt gợi ý · Mỗi ngày được thêm lượt mới"', "app.js");
files["app.js"] = app;

let html = read("index.html");
// Ẩn chứ không xóa: app.js vẫn gắn sự kiện vào nút này, xóa đi game sẽ dừng khi khởi tạo
html = replaceOnce(html, 'id="btn-leaderboard"', 'id="btn-leaderboard" hidden style="display: none"', "index.html");
html = replaceOnce(
  html,
  '<span id="stat-daily">',
  '<a href="gioi-thieu.html" target="_blank" rel="noopener">Hướng dẫn</a> <a href="quyen-rieng-tu.html" target="_blank" rel="noopener">Quyền riêng tư</a> <a href="lien-he.html" target="_blank" rel="noopener">Liên hệ</a>\n      <span id="stat-daily">',
  "index.html"
);
if (preview) html = replaceOnce(html, "<head>", '<head>\n  <meta name="robots" content="noindex" />', "index.html");
files["index.html"] = html;

const contactHtml = contact
  ? `<a href="mailto:${contact}">${contact}</a>`
  : "<strong>[CHƯA ĐIỀN EMAIL LIÊN HỆ - bản xem thử]</strong>";
for (const name of fs.readdirSync(path.join(root, "web-pages"))) {
  files[name] = read(path.join("web-pages", name)).split("{{CONTACT}}").join(contactHtml);
}

// Header bảo mật cơ bản (định dạng của Cloudflare Pages / Workers static assets)
files["_headers"] = "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n";

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(out, name), content);

console.log(`Đã tạo dist/ (${Object.keys(files).length} file)${preview ? " - BẢN XEM THỬ" : ""}`);
console.log("LƯU Ý: chưa được đưa lên mạng khi chưa giải quyết giấy phép game (docs/phat-hanh.md).");
