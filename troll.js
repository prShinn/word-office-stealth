// Thông báo troll kiểu "tin nhắn công sở" + lời nhắc chơi tiếp. Người gửi đều là nhân vật hư cấu.
window.Troll = (function () {
  const PREF_KEY = "bangchu_troll_v1";
  const SHOW_MS = 5500;
  const SHOW_ACTION_MS = 10000;
  const COOLDOWN_MS = 15000; // giãn cách giữa 2 thông báo phụ, tránh làm phiền
  const IDLE_MS = 60000;

  // chance: xác suất hiện · urgent: bỏ qua giãn cách
  const EVENTS = {
    mistake: {
      chance: 0.5,
      lines: [
        ["🖥️ IT Helpdesk", "Đã thử tắt não đi bật lại chưa?"],
        ["📎 Trợ lý Ghim Giấy", "Có vẻ bạn đang đoán mò. Tôi cũng vậy."],
        ["📊 Phòng Kế toán", "Ô này sai hơn cả báo cáo quý trước."],
        ["👔 Sếp", "Anh không nói gì đâu. Anh chỉ ghi vào sổ thôi."],
        ["🤖 Bot chấm công", "Đã ghi nhận 1 pha tự tin nhưng sai."],
        ["☕ Chị tạp vụ", "Uống ngụm nước đi em, gõ từ từ."]
      ]
    },
    danger: {
      urgent: true,
      lines: [
        ["🚨 Hệ thống", "Còn đúng 1 mạng. Nghĩ kỹ rồi hẵng bấm."],
        ["👔 Sếp", "Sai thêm lần nữa là lên phòng anh uống trà."]
      ]
    },
    fail: {
      urgent: true,
      lines: [
        ["👔 Sếp", "Không sao, KPI quý sau mình gỡ. Hoặc quý sau nữa."],
        ["🧾 Phòng Nhân sự", "Chúng tôi vừa in thử một tờ đơn. Chỉ in thử thôi."],
        ["📎 Trợ lý Ghim Giấy", "Thất bại là mẹ thành công. Bạn đang đông con phết."]
      ]
    },
    timeout: {
      urgent: true,
      lines: [
        ["⏰ Lịch Outlook", "Deadline đã qua. Deadline không nhớ bạn."],
        ["👔 Sếp", "10 phút của em dài bằng 10 phút của anh đấy."]
      ]
    },
    hint: {
      chance: 0.7,
      lines: [
        ["👀 Đồng nghiệp bàn bên", "Tớ thấy cậu xem phao nhé."],
        ["🤖 Bot chấm công", "Gợi ý đã dùng. Lòng tự trọng: -1."],
        ["📎 Trợ lý Ghim Giấy", "Hỏi không có gì xấu. Hỏi hoài thì hơi xấu."]
      ]
    },
    fever: {
      urgent: true,
      lines: [
        ["🔥 Phòng Kinh doanh", "Cháy máy rồi! KPI x2, gõ nhanh lên!"],
        ["👔 Sếp", "Phong độ này mà đi làm đúng giờ nữa thì tuyệt."]
      ]
    },
    nearDone: {
      urgent: true,
      lines: [
        ["📌 Nhắc việc", "Còn đúng 1 mục nữa là chốt sổ!"],
        ["👔 Sếp", "Còn 1 dòng thôi, đừng để anh chờ."]
      ]
    },
    done: {
      urgent: true,
      lines: [
        ["👔 Sếp", "Làm tốt lắm. Thưởng cho em... thêm việc."],
        ["🧾 Phòng Nhân sự", "Năng suất bất thường. Bạn ổn chứ?"],
        ["📊 Phòng Kế toán", "Số khớp rồi. Hiếm có, làm thêm sổ nữa đi."]
      ]
    },
    doneNoStar: {
      urgent: true,
      lines: [
        ["📎 Trợ lý Ghim Giấy", "Xong thì xong, nhưng vẫn còn sao chưa lấy kìa."],
        ["👔 Sếp", "Đạt thôi chưa đủ. Anh cần đủ 3 sao."]
      ]
    },
    idle: {
      urgent: true,
      lines: [
        ["👔 Sếp", "Em còn đó không? Chuột 1 phút không nhúc nhích."],
        ["💤 Màn hình", "Tôi sắp ngủ theo bạn rồi đây."],
        ["👀 Đồng nghiệp bàn bên", "Đang nghĩ hay đang ngủ mở mắt đấy?"]
      ]
    },
    bossBack: {
      chance: 0.8,
      lines: [
        ["🕵️ Đồng nghiệp bàn bên", "Sếp đi rồi. Làm tiếp đi, tớ canh cho."],
        ["📊 Báo cáo Q4", "Cảm ơn đã ghé thăm tôi. Được đúng vài giây."]
      ]
    },
    welcome: {
      urgent: true,
      lines: [
        ["📅 Lịch công tác", "Chào buổi làm việc! Hôm nay mình giả vờ bận cùng nhau nhé."],
        ["👔 Sếp", "Đến rồi à? Anh vừa nhắc tên em xong."]
      ]
    }
  };

  let isBlocked = () => false;
  let canIdle = () => false;
  let enabled = true;
  let box = null;
  let hideTimer = null;
  let lastShownAt = 0;
  let lastActivityAt = Date.now();
  let idleSaid = false;
  const lastLine = {};

  try {
    enabled = localStorage.getItem(PREF_KEY) !== "off";
  } catch (_) {}

  function dismiss() {
    clearTimeout(hideTimer);
    if (box) box.remove();
    box = null;
  }

  function pickLine(type) {
    const { lines } = EVENTS[type];
    let idx = Math.floor(Math.random() * lines.length);
    if (lines.length > 1 && idx === lastLine[type]) idx = (idx + 1) % lines.length;
    lastLine[type] = idx;
    return lines[idx];
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // extra: dòng thông tin thật (tiến độ, chuỗi ngày) · action: { label, run }
  function say(type, { extra, action } = {}) {
    const cfg = EVENTS[type];
    if (!cfg || !enabled || isBlocked()) return false;
    const now = Date.now();
    if (!cfg.urgent && (now - lastShownAt < COOLDOWN_MS || Math.random() > (cfg.chance ?? 1))) return false;
    dismiss();
    lastShownAt = now;

    const [sender, message] = pickLine(type);
    box = el("div", "troll-toast");
    box.setAttribute("role", "status");
    const head = el("div", "troll-head");
    head.appendChild(el("strong", "", sender));
    const close = el("button", "troll-close", "✕");
    close.type = "button";
    close.setAttribute("aria-label", "Đóng thông báo");
    close.addEventListener("click", dismiss);
    head.appendChild(close);
    box.appendChild(head);
    box.appendChild(el("div", "troll-body", message));
    if (extra) box.appendChild(el("div", "troll-extra", extra));
    if (action) {
      const btn = el("button", "office-btn troll-action", action.label);
      btn.type = "button";
      btn.addEventListener("click", () => {
        dismiss();
        action.run();
      });
      box.appendChild(btn);
    }
    document.body.appendChild(box);
    hideTimer = setTimeout(dismiss, action ? SHOW_ACTION_MS : SHOW_MS);
    return true;
  }

  function setEnabled(on) {
    enabled = Boolean(on);
    if (!enabled) dismiss();
    try {
      localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
    } catch (_) {}
  }

  function init(options) {
    isBlocked = options.isBlocked || isBlocked;
    canIdle = options.canIdle || canIdle;
    const touch = () => {
      lastActivityAt = Date.now();
      idleSaid = false;
    };
    ["pointerdown", "keydown"].forEach((evt) => document.addEventListener(evt, touch, true));
    setInterval(() => {
      if (idleSaid || Date.now() - lastActivityAt < IDLE_MS || !canIdle()) return;
      // Mỗi đợt ngồi yên chỉ nhắc 1 lần
      idleSaid = say("idle");
    }, 5000);
  }

  return { init, say, dismiss, setEnabled, isEnabled: () => enabled };
})();
