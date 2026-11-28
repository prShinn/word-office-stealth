#!/usr/bin/env node
/**
 * ==============================================================================
 * FETCH & ENRICH VOCABULARY DICTIONARY
 * ------------------------------------------------------------------------------
 * Kéo dữ liệu từ điển public free từ GitHub:
 *   - Tiếng Anh: Google 10,000 English Words (No Swears)
 *   - Tiếng Việt: Hồ Ngọc Đức Open Vietnamese Wordlist (Viet11K)
 * Và cập nhật vào data-en.js, data-vi.js
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const EN_FILE = path.resolve(__dirname, "../data-en.js");
const VI_FILE = path.resolve(__dirname, "../data-vi.js");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      let raw = "";
      res.on("data", (chunk) => raw += chunk);
      res.on("end", () => resolve(raw));
    }).on("error", reject);
  });
}

function stripTones(str) {
  return (str || "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

async function run() {
  console.log("🚀 Bắt đầu truy cập và kéo dữ liệu từ điển mở trên Internet...");

  // 1. KÉO TỪ ĐIỂN TIẾNG ANH (Google 10K Words)
  console.log("📥 Đang tải Google 10,000 English Words...");
  let enWords = [];
  try {
    const rawEn = await fetchUrl("https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears-medium.txt");
    enWords = rawEn.split("\n").map(w => w.trim().toLowerCase()).filter(w => /^[a-z]{2,7}$/.test(w));
    console.log(`✅ Đã kéo về ${enWords.length} từ tiếng Anh sạch (2-7 ký tự)!`);
  } catch (err) {
    console.warn("⚠️ Không thể kéo file EN trực tuyến, sử dụng danh sách fallback.", err.message);
  }

  // 2. KÉO TỪ ĐIỂN TIẾNG VIỆT (Viet11K Hồ Ngọc Đức)
  console.log("📥 Đang tải Hồ Ngọc Đức Vietnamese Wordlist (Viet11K)...");
  let viEntries = [];
  try {
    const rawVi = await fetchUrl("https://raw.githubusercontent.com/duyet/vietnamese-wordlist/master/Viet11K.txt");
    const lines = rawVi.split("\n").map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      // Chỉ lấy từ 1 âm tiết hoặc 2 âm tiết (từ ghép)
      const parts = line.split(/\s+/);
      if (parts.length >= 1 && parts.length <= 2) {
        const cleanKey = stripTones(line);
        if (cleanKey.length >= 2 && cleanKey.length <= 8) {
          viEntries.push({ key: cleanKey, display: line, hint: `từ vựng: ${line}` });
        }
      }
    });
    console.log(`✅ Đã kéo và trích xuất ${viEntries.length} từ vựng tiếng Việt chuẩn!`);
  } catch (err) {
    console.warn("⚠️ Không thể kéo file VI trực tuyến, sử dụng danh sách fallback.", err.message);
  }

  // 3. CẬP NHẬT DATA-EN.JS
  if (enWords.length > 0 && fs.existsSync(EN_FILE)) {
    console.log("📝 Đang tích hợp từ vựng mới vào data-en.js...");
    let enCode = fs.readFileSync(EN_FILE, "utf8");
    const targetAnchor = 'elk: "nai sừng tấm"';
    const anchorIdx = enCode.indexOf(targetAnchor);

    if (anchorIdx !== -1) {
      // Thu thập các key đã có
      const existingKeys = new Set();
      const regex = /([a-z]+):/g;
      let m;
      while ((m = regex.exec(enCode.slice(0, anchorIdx + 200))) !== null) {
        existingKeys.add(m[1]);
      }

      // Lọc các từ mới chưa có trong từ điển
      const newItems = [];
      enWords.forEach(w => {
        if (!existingKeys.has(w) && w.length >= 2 && w.length <= 7) {
          existingKeys.add(w);
          newItems.push(`    ${w}: "từ tiếng Anh thông dụng (${w})"`);
        }
      });

      if (newItems.length > 0) {
        const insertText = targetAnchor + ",\n    // Bổ sung kho từ điển mở rộng (Google 10,000 Words public)\n" + newItems.join(",\n");
        enCode = enCode.replace(targetAnchor, insertText);
        fs.writeFileSync(EN_FILE, enCode, "utf8");
        console.log(`🎉 Đã bổ sung thành công ${newItems.length} từ tiếng Anh mới vào data-en.js!`);
      }
    }
  }

  // 4. CẬP NHẬT DATA-VI.JS
  if (viEntries.length > 0 && fs.existsSync(VI_FILE)) {
    console.log("📝 Đang tích hợp từ vựng mới vào data-vi.js...");
    let viCode = fs.readFileSync(VI_FILE, "utf8");
    const targetAnchorVi = '["dungmay", "dừng máy", "tạm ngưng để bảo trì"]';
    const anchorIdxVi = viCode.indexOf(targetAnchorVi);

    if (anchorIdxVi !== -1) {
      const existingKeys = new Set();
      const regex = /\["([^"]+)"/g;
      let m;
      while ((m = regex.exec(viCode.slice(0, anchorIdxVi + 200))) !== null) {
        existingKeys.add(m[1]);
      }

      const newEntries = [];
      viEntries.forEach(item => {
        if (!existingKeys.has(item.key) && item.key.length >= 2 && item.key.length <= 8) {
          existingKeys.add(item.key);
          newEntries.push(`    ["${item.key}", "${item.display}", "${item.hint}"]`);
        }
      });

      if (newEntries.length > 0) {
        const insertTextVi = targetAnchorVi + ",\n    // Bổ sung kho từ điển tiếng Việt mở Hồ Ngọc Đức (Viet11K public)\n" + newEntries.join(",\n");
        viCode = viCode.replace(targetAnchorVi, insertTextVi);
        fs.writeFileSync(VI_FILE, viCode, "utf8");
        console.log(`🎉 Đã bổ sung thành công ${newEntries.length} từ tiếng Việt mới vào data-vi.js!`);
      }
    }
  }

  console.log("✨ Hoàn tất cập nhật kho từ điển cho cả Tiếng Anh và Tiếng Việt!");
}

run().catch(console.error);
