// Cơ chế giữ chân: chuỗi ngày chơi, nhiệm vụ ngày, tiến trình cấp bậc (chạy offline)
window.Engagement = (function () {
  const KEY = "word_office_stealth_engage_v1";
  const AUTH_KEY = "word_office_current_user";
  const MAX_FREEZE = 2;
  const ALL_QUESTS_HINT = 1;

  function getAuthUser() {
    try {
      const u = (localStorage.getItem(AUTH_KEY) || "").trim();
      return u || null;
    } catch (_) {
      return null;
    }
  }

  function createDefaultData() {
    return {
      lastDay: null,
      dayStreak: 0,
      bestStreak: 0,
      freezes: 0,
      questDay: null,
      quests: [],
      topRank: null
    };
  }

  const RANKS_TECH = [
    { name: "Intern", min: 0 },
    { name: "Junior", min: 200 },
    { name: "Senior", min: 600 },
    { name: "Tech Lead", min: 1200 },
    { name: "Manager", min: 2200 },
    { name: "Director", min: 4000 }
  ];

  const RANKS_LADY = [
    { name: "Thực tập bánh bèo 🌸", min: 0 },
    { name: "Chiến thần săn Sale 🛍️", min: 200 },
    { name: "Bà hoàng Trà sữa 🧋", min: 600 },
    { name: "Trùm Phong thủy bàn 💅", min: 1200 },
    { name: "Hoa khôi Phòng họp 👑", min: 2200 },
    { name: "Nữ hoàng Công sở 💎", min: 4000 }
  ];

  function getRanks() {
    try {
      if (localStorage.getItem("stealth_rank_theme") === "lady") return RANKS_LADY;
    } catch (_) {}
    return RANKS_TECH;
  }

  const QUEST_POOL = {
    answers: { title: "Giải đúng 12 mục", goal: 12, kpi: 50 },
    batches: { title: "Hoàn tất 2 Phiên", goal: 2, kpi: 60 },
    combo: { title: "Đạt Combo 5", goal: 5, kpi: 40 },
    clean: { title: "Hoàn tất 1 Phiên không lỗi, không gợi ý", goal: 1, kpi: 70 },
    extra: { title: "Tìm 3 Extra Refs", goal: 3, kpi: 40 },
    daily: { title: "Hoàn tất 1 Phiên ★ hôm nay", goal: 1, kpi: 60 }
  };

  function toDayNumber(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  // "answers" luôn có; 2 nhiệm vụ còn lại xoay vòng theo ngày
  function questIdsFor(day) {
    const rest = Object.keys(QUEST_POOL).filter((id) => id !== "answers");
    return ["answers", rest[day % rest.length], rest[(day + 2) % rest.length]];
  }

  let data = createDefaultData();

  function loadFromStorage() {
    data = createDefaultData();
    const user = getAuthUser();
    if (!user) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`${KEY}_${user}`) || "{}");
      if (Number.isInteger(saved.lastDay)) data.lastDay = saved.lastDay;
      ["dayStreak", "bestStreak", "freezes"].forEach((k) => {
        if (Number.isInteger(saved[k]) && saved[k] >= 0) data[k] = saved[k];
      });
      if (Number.isInteger(saved.topRank)) data.topRank = saved.topRank;
      if (Number.isInteger(saved.questDay) && Array.isArray(saved.quests)) {
        data.questDay = saved.questDay;
        data.quests = saved.quests.filter((q) => q && QUEST_POOL[q.id]);
      }
    } catch (_) {}
  }

  function save() {
    const user = getAuthUser();
    if (!user) return;
    try {
      localStorage.setItem(`${KEY}_${user}`, JSON.stringify(data));
    } catch (_) {}
  }

  loadFromStorage();

  function ensureToday() {
    const today = toDayNumber(new Date());
    // Chỉ làm mới khi sang ngày mới; chỉnh lùi đồng hồ không được cấp lại nhiệm vụ
    if (data.questDay === null || today > data.questDay) {
      data.questDay = today;
      data.quests = questIdsFor(today).map((id) => ({ id, progress: 0, done: false }));
      save();
    }
    return today;
  }

  // Chuỗi còn cứu được không nếu hôm nay chơi
  function liveStreak(today) {
    if (data.lastDay === null) return 0;
    const gap = today - data.lastDay;
    if (gap <= 1 || (gap === 2 && data.freezes > 0)) return data.dayStreak;
    return 0;
  }

  function checkIn(today, reward) {
    if (data.lastDay !== null && today <= data.lastDay) return;
    const kept = liveStreak(today);
    if (kept > 0 && today - data.lastDay === 2) {
      data.freezes -= 1;
      reward.notices.push("Đã dùng 1 phép nghỉ để giữ chuỗi");
    }
    data.dayStreak = kept + 1;
    data.bestStreak = Math.max(data.bestStreak, data.dayStreak);
    data.lastDay = today;

    const kpi = Math.min(data.dayStreak, 7) * 10;
    reward.kpi += kpi;
    reward.notices.push(`Chuyên cần ngày ${data.dayStreak}: +${kpi} KPI`);

    if (data.dayStreak % 7 === 0) {
      reward.hints += 1;
      data.freezes = Math.min(MAX_FREEZE, data.freezes + 1);
      reward.notices.push("Mốc 7 ngày: +1 Gợi ý, +1 phép nghỉ");
    }
  }

  function advanceQuest(id, value, isMax, reward) {
    const quest = data.quests.find((q) => q.id === id);
    if (!quest || quest.done) return;
    const def = QUEST_POOL[id];
    quest.progress = Math.min(def.goal, isMax ? Math.max(quest.progress, value) : quest.progress + value);
    if (quest.progress < def.goal) return;

    quest.done = true;
    reward.kpi += def.kpi;
    reward.notices.push(`Xong nhiệm vụ "${def.title}": +${def.kpi} KPI`);
    if (data.quests.every((q) => q.done)) {
      reward.hints += ALL_QUESTS_HINT;
      reward.notices.push(`Đủ nhiệm vụ ngày: +${ALL_QUESTS_HINT} Gợi ý`);
    }
  }

  // type: "answer" | "extra" | "batch"
  function track(type, info) {
    const today = ensureToday();
    const reward = { kpi: 0, hints: 0, notices: [] };
    if (type === "answer" || type === "extra") {
      checkIn(today, reward);
      advanceQuest("answers", 1, false, reward);
      advanceQuest("combo", info.combo, true, reward);
      if (type === "extra") advanceQuest("extra", 1, false, reward);
    } else if (type === "batch") {
      advanceQuest("batches", 1, false, reward);
      if (info.clean) advanceQuest("clean", 1, false, reward);
      if (info.isDaily) advanceQuest("daily", 1, false, reward);
    }
    save();
    return reward;
  }

  function getRankIndex(score) {
    const list = getRanks();
    let idx = 0;
    list.forEach((r, i) => {
      if (score >= r.min) idx = i;
    });
    return idx;
  }

  function getRankName(score) {
    return getRanks()[getRankIndex(score)].name;
  }

  // Trả về tên cấp mới nếu vừa thăng cấp (mỗi cấp chỉ báo 1 lần)
  function checkPromotion(score) {
    const idx = getRankIndex(score);
    if (data.topRank !== null && idx <= data.topRank) return null;
    const first = data.topRank === null;
    data.topRank = idx;
    save();
    return first ? null : getRanks()[idx].name;
  }

  function getSummary() {
    const today = ensureToday();
    const streak = liveStreak(today);
    return {
      streak,
      best: data.bestStreak,
      freezes: data.freezes,
      checkedIn: data.lastDay !== null && data.lastDay >= today,
      questsDone: data.quests.filter((q) => q.done).length,
      quests: data.quests.map((q) => ({ ...QUEST_POOL[q.id], progress: q.progress, done: q.done }))
    };
  }

  function renderPanel(score) {
    const s = getSummary();
    const list = getRanks();
    const idx = getRankIndex(score);
    const cur = list[idx];
    const next = list[idx + 1];
    const pct = next ? Math.round(((score - cur.min) / (next.min - cur.min)) * 100) : 100;
    const rankText = next
      ? `${cur.name} → ${next.name}: còn ${next.min - score} KPI`
      : `${cur.name}: cấp cao nhất`;

    const questRows = s.quests
      .map(
        (q) => `
        <div class="quest-row ${q.done ? "done" : ""}">
          <span>${q.done ? "✓" : "○"} ${q.title}</span>
          <span>${q.progress}/${q.goal} · +${q.kpi} KPI</span>
        </div>`
      )
      .join("");

    return `
      <div class="rank-line">${rankText}</div>
      <div class="excel-databar-track"><div class="excel-databar-fill" style="width: ${pct}%"></div></div>
      <div class="rank-line">Chuyên cần: ${s.streak} ngày · Kỷ lục: ${s.best} · Phép nghỉ: ${s.freezes}/${MAX_FREEZE}</div>
      <h4 class="modal-subtitle">Nhiệm vụ hôm nay (đủ 3 việc: +${ALL_QUESTS_HINT} Gợi ý)</h4>
      ${questRows}
    `;
  }

  function reloadAuth() {
    loadFromStorage();
    ensureToday();
  }

  ensureToday();

  return { toDayNumber, track, getRankName, checkPromotion, getSummary, renderPanel, reloadAuth };
})();
