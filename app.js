(function () {
  const STORAGE_KEY = "word_office_stealth_v3";
  const AUTH_KEY = "word_office_current_user";
  const DAILY_HINT_GRANT = 0;

  function trackEvent(name, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, params || {});
      }
    } catch (_) {}
  }
  const INITIAL_HINT_QUOTA = 1;
  // Giới hạn thời gian mỗi Phiên: 10 phút (600s); chế độ Tăng tốc còn một nửa (5 phút)
  const TIME_LIMITS = { "Cơ bản": 600, "Trung bình": 600, "Nâng cao": 600, "Sưu tầm": 600 };
  const DEFAULT_TIME_LIMIT = 600;
  const TIMEOUT_RESET_MS = 3000;

  const ACHIEVEMENTS = [
    { id: "first_batch", title: "Khởi động suôn sẻ", desc: "Hoàn thành Phiên đầu tiên" },
    { id: "clean_sheet", title: "Clean Sheet", desc: "Hoàn thành 1 Phiên với 0 lỗi sai" },
    { id: "combo_5", title: "Chuỗi Đỉnh Cao", desc: "Đạt Combo x5 liên tiếp" },
    { id: "deadline_win", title: "Vượt mốc Deadline", desc: "Hoàn thành Phiên khi bật chế độ Tăng tốc" },
    { id: "conn_master", title: "Phân loại thành thạo", desc: "Giải xong 1 Phiên Phân Nhóm 4x4" },
    { id: "extra_ref", title: "Mắt Diều Hâu", desc: "Tìm 3 Extra Refs trong cùng 1 Phiên" }
  ];

  const state = {
    theme: "excel",       // "excel" | "docs"
    lang: "en",           // "en" | "vi"
    mode: "connect",      // "connect" | "merge" | "connections"
    levelIndex: 0,
    bossMode: false,

    // Crossword & Connect state
    letters: [],
    selectedIndices: [],
    isDragging: false,
    hasDraggedAcross: false,
    dragStartIdx: null,
    solvedTargets: new Set(),
    revealedHints: {},
    focusedTargetKey: null,
    crossword: null,      // { rows, cols, cells, placements }
    bonusWords: [],
    progress: {},         // { levelId: { paid: [], bonusPaid: 0 } }

    // Merge state
    mergeTiles: [],
    selectedTileId: null,
    solvedPairs: new Set(),

    // Phân nhóm 4x4
    connTiles: [],        // [{ word, level, groupTitle }]
    connSelected: [],     // indices in connTiles
    connSolvedLevels: [], // [level]

    // Risk, Combo & Deadline Timer
    mistakes: 0,
    maxMistakes: 5,
    batchFailed: false,
    combo: 0,
    maxComboEver: 0,
    deadlineMode: false,
    timeLeft: DEFAULT_TIME_LIMIT,
    timerId: null,
    timeoutResetId: null,
    timerWaiting: false,  // sau khi tự reset: chờ người dùng thao tác mới tính giờ

    // Economy & Persistence
    usedHintInBatch: false,
    hintQuota: INITIAL_HINT_QUOTA,
    hintDay: null,        // ngày gần nhất đã xét quà gợi ý
    score: 0,
    streak: 0,
    completedBatches: new Set(),
    unlockedAch: new Set(),
    collectedWords: { vi: [], en: [] },
    notices: []           // thông báo thưởng chờ hiển thị
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    pageTitle: $("page-title"),
    appBadge: $("app-badge"),
    docName: $("doc-name"),
    batchLabel: $("batch-label"),
    dailyTag: $("daily-tag"),
    levelSelect: $("level-select"),
    keyboardInput: $("keyboard-input"),
    formulaStatus: $("formula-status"),
    topicTitle: $("topic-title"),
    tierBadge: $("tier-badge"),
    modeHint: $("mode-hint"),
    standardGrid: $("standard-grid"),
    connectionsView: $("connections-view"),
    connectStage: $("connect-stage"),
    mergeStage: $("merge-stage"),
    draftWord: $("draft-word"),
    wheelWrap: $("wheel-wrap"),
    connectSvg: $("connect-svg"),
    nodesLayer: $("nodes-layer"),
    mergePreview: $("merge-preview"),
    mergeTilesGrid: $("merge-tiles-grid"),
    crosswordWrap: $("crossword-wrap"),
    crosswordGrid: $("crossword-grid"),
    outputPanelTitle: $("output-panel-title"),
    targetsTbody: $("targets-tbody"),
    bonusSection: $("bonus-section"),
    progressSummary: $("progress-summary"),
    progressBarFill: $("progress-bar-fill"),
    bonusCount: $("bonus-count"),
    bonusList: $("bonus-list"),
    kpiFooter: $("kpi-footer"),
    statRank: $("stat-rank"),
    statDaily: $("stat-daily"),
    engagePanel: $("engage-panel"),
    statStreak: $("stat-streak"),
    statScore: $("stat-score"),
    btnHint: $("btn-hint"),
    btnHintText: $("btn-hint-text"),
    btnDeadlineMode: $("btn-deadline-mode"),
    btnRetryBatch: $("btn-retry-batch"),
    btnRetryMerge: $("btn-retry-merge"),
    hudCombo: $("hud-combo"),
    hudMistakes: $("hud-mistakes"),
    hudTimer: $("hud-timer"),
    connTopicTitle: $("conn-topic-title"),
    connTierBadge: $("conn-tier-badge"),
    connProgressFill: $("conn-progress-fill"),
    connSolvedList: $("conn-solved-list"),
    connGrid: $("conn-grid"),
    btnConnSubmit: $("btn-conn-submit"),
    btnConnDeselect: $("btn-conn-deselect"),
    btnConnRetry: $("btn-conn-retry"),
    achModal: $("achievements-modal"),
    kpiOverviewCards: $("kpi-overview-cards"),
    achGrid: $("ach-grid"),
    mainWorkspace: $("main-workspace"),
    bossScreen: $("boss-screen"),
    bossExcelContent: $("boss-excel-content"),
    bossDocsContent: $("boss-docs-content"),
    rowHeaders: $("excel-row-headers")
  };

  function getAuthUser() {
    try {
      const u = (localStorage.getItem(AUTH_KEY) || "").trim();
      return u || null;
    } catch (_) {
      return null;
    }
  }

  function updateAuthUI() {
    const user = getAuthUser();
    const btnAuth = $("btn-auth");
    const saveStateEl = $("save-state");
    const btnLogout = $("btn-logout");
    const inputUser = $("auth-username");
    if (btnAuth) {
      btnAuth.textContent = user ? `👤 ${user}` : "Đăng nhập";
      btnAuth.classList.toggle("active", Boolean(user));
    }
    if (saveStateEl) {
      saveStateEl.textContent = user ? `Đã lưu (${user})` : "Chế độ Khách (Chưa lưu)";
    }
    if (btnLogout) {
      btnLogout.classList.toggle("hidden", !user);
    }
    if (inputUser) {
      inputUser.value = user || "";
    }
  }

  // Đồng bộ nhẹ hồ sơ với Worker (/api/profile) nếu người chơi đã có phiên BXH (bangchu_bxh_v1)
  let profileVersion = 0;
  let profileSyncTimer = null;

  function getBxhToken() {
    try {
      const saved = JSON.parse(localStorage.getItem("bangchu_bxh_v1") || "null");
      return saved && typeof saved.token === "string" ? saved.token : null;
    } catch (_) {
      return null;
    }
  }

  async function pullProfileFromServer() {
    const token = getBxhToken();
    if (!token || !getAuthUser()) return;
    try {
      const res = await fetch("/api/profile", { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const remote = await res.json();
      if (Number.isInteger(remote.version)) profileVersion = remote.version;
    } catch (_) {}
  }

  function scheduleProfileSync(payload) {
    const token = getBxhToken();
    if (!token || !getAuthUser()) return;
    clearTimeout(profileSyncTimer);
    profileSyncTimer = setTimeout(async () => {
      try {
        const engage = window.Engagement?.getSummary?.() || {};
        const res = await fetch("/api/profile", {
          method: "PUT",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ state: payload, engage, expectedVersion: profileVersion })
        });
        if (res.ok) {
          const data = await res.json();
          if (Number.isInteger(data.version)) profileVersion = data.version;
        } else if (res.status === 409) {
          await pullProfileFromServer();
        }
      } catch (_) {}
    }, 1200);
  }

  function resetUserProgressState() {
    state.score = 0;
    state.streak = 0;
    state.hintQuota = INITIAL_HINT_QUOTA;
    state.hintDay = null;
    state.maxComboEver = 0;
    state.completedBatches = new Set();
    state.unlockedAch = new Set();
    state.collectedWords = { vi: [], en: [] };
    state.levelIndex = 0;
    state.progress = {};
    customLevelsCache = { vi: [], en: [] };
  }

  const MAX_LOCAL_BYTES = 128 * 1024; // Trần 128KB mỗi tài khoản trong localStorage
  const MAX_LOCAL_ACCOUNTS = 5;       // Tối đa 5 tài khoản lưu trên 1 trình duyệt
  const ACCOUNT_TTL_MS = 30 * 86400000; // Tự động xóa tài khoản không hoạt động > 30 ngày
  const MAX_COLLECTED_PER_LANG = 120;
  const MAX_PROGRESS_ENTRIES = 40;
  const ENGAGE_KEY_PREFIX = "word_office_stealth_engage_v1_";

  function cleanupStaleLocalAccounts(activeUser) {
    try {
      const prefix = `${STORAGE_KEY}_`;
      const now = Date.now();
      const entries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(prefix)) continue;
        const uname = key.slice(prefix.length);
        let lastActiveAt = 0;
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || "{}");
          lastActiveAt = typeof parsed.lastActiveAt === "number" ? parsed.lastActiveAt : 0;
        } catch (_) {}
        if (uname !== activeUser && lastActiveAt > 0 && now - lastActiveAt > ACCOUNT_TTL_MS) {
          localStorage.removeItem(key);
          localStorage.removeItem(`${ENGAGE_KEY_PREFIX}${uname}`);
          i -= 1;
          continue;
        }
        entries.push({ key, uname, lastActiveAt });
      }
      if (entries.length > MAX_LOCAL_ACCOUNTS) {
        entries
          .filter((e) => e.uname !== activeUser)
          .sort((a, b) => a.lastActiveAt - b.lastActiveAt)
          .slice(0, entries.length - MAX_LOCAL_ACCOUNTS)
          .forEach((e) => {
            localStorage.removeItem(e.key);
            localStorage.removeItem(`${ENGAGE_KEY_PREFIX}${e.uname}`);
          });
      }
    } catch (_) {}
  }

  function compactPayloadForStorage(payload) {
    const trimmed = {
      ...payload,
      collectedWords: {
        vi: (payload.collectedWords?.vi || []).slice(-MAX_COLLECTED_PER_LANG),
        en: (payload.collectedWords?.en || []).slice(-MAX_COLLECTED_PER_LANG)
      }
    };
    const progEntries = Object.entries(payload.progress || {});
    if (progEntries.length > MAX_PROGRESS_ENTRIES) {
      trimmed.progress = Object.fromEntries(progEntries.slice(-MAX_PROGRESS_ENTRIES));
    }
    let json = JSON.stringify(trimmed);
    const byteLen = (s) => (typeof TextEncoder !== "undefined" ? new TextEncoder().encode(s).byteLength : s.length * 2);
    if (byteLen(json) > MAX_LOCAL_BYTES) {
      // Cắt bớt lịch sử từng phiên nếu vẫn vượt ngưỡng 128KB
      const slimProg = Object.entries(trimmed.progress || {}).slice(-15);
      trimmed.progress = Object.fromEntries(slimProg);
      json = JSON.stringify(trimmed);
    }
    if (byteLen(json) > MAX_LOCAL_BYTES) {
      trimmed.progress = {};
      json = JSON.stringify(trimmed);
    }
    return { trimmed, json };
  }

  function loadProgress() {
    resetUserProgressState();
    const user = getAuthUser();
    cleanupStaleLocalAccounts(user);
    if (!user) {
      updateAuthUI();
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${user}`) || "{}");
      if (typeof saved.score === "number") state.score = saved.score;
      if (typeof saved.streak === "number") state.streak = saved.streak;
      if (typeof saved.hintQuota === "number") state.hintQuota = saved.hintQuota;
      if (Number.isInteger(saved.hintDay)) state.hintDay = saved.hintDay;
      if (typeof saved.maxComboEver === "number") state.maxComboEver = saved.maxComboEver;
      if (Array.isArray(saved.completedBatches)) state.completedBatches = new Set(saved.completedBatches);
      if (Array.isArray(saved.unlockedAch)) state.unlockedAch = new Set(saved.unlockedAch);
      if (saved.collectedWords && typeof saved.collectedWords === "object") {
        // Bỏ từ không có trong từ điển (cụm tự ghép từng được lưu) để bộ đếm Sưu Tầm đúng
        const keepKnown = (list, data) => (Array.isArray(list) ? list.filter((w) => data?.DICT?.[w]) : []);
        state.collectedWords = {
          vi: keepKnown(saved.collectedWords.vi, window.VI_DATA),
          en: keepKnown(saved.collectedWords.en, window.EN_DATA)
        };
      }
      if (saved.theme === "docs" || saved.theme === "excel") state.theme = saved.theme;
      if (saved.lang === "vi" || saved.lang === "en") state.lang = saved.lang;
      if (["connect", "merge", "connections"].includes(saved.mode)) state.mode = saved.mode;
      if (Number.isInteger(saved.levelIndex) && saved.levelIndex >= 0) state.levelIndex = saved.levelIndex;
      if (saved.progress && typeof saved.progress === "object") state.progress = saved.progress;
    } catch (_) {}
    updateAuthUI();
  }

  function saveProgress() {
    const user = getAuthUser();
    if (!user) return; // Chỉ lưu tiến độ khi đã đăng nhập
    try {
      const rawPayload = {
        score: state.score,
        streak: state.streak,
        hintQuota: state.hintQuota,
        hintDay: state.hintDay,
        maxComboEver: state.maxComboEver,
        completedBatches: Array.from(state.completedBatches),
        unlockedAch: Array.from(state.unlockedAch),
        collectedWords: state.collectedWords,
        theme: state.theme,
        lang: state.lang,
        mode: state.mode,
        levelIndex: state.levelIndex,
        progress: state.progress,
        lastActiveAt: Date.now()
      };
      const { trimmed, json } = compactPayloadForStorage(rawPayload);
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user}`, json);
      } catch (_) {
        // QuotaExceededError: dọn tài khoản cũ & thử lưu bản gọn
        cleanupStaleLocalAccounts(user);
        try {
          localStorage.setItem(`${STORAGE_KEY}_${user}`, JSON.stringify({ ...trimmed, progress: {} }));
        } catch (__) {}
      }
      scheduleProfileSync(trimmed);
    } catch (_) {}
  }

  // ================= TIẾN ĐỘ TỪNG PHIÊN =================
  function getAllSolvedKeys(lvl) {
    if (state.mode === "connect") return lvl.targets;
    if (state.mode === "merge") return lvl.pairs.map((_, i) => i);
    return lvl.groups.map((g) => g.level);
  }

  // Mã trả thưởng: từ (connect), p<idx> (merge), g<level> (4x4)
  function toPaidKey(solvedKey) {
    if (state.mode === "connect") return solvedKey;
    return (state.mode === "merge" ? "p" : "g") + solvedKey;
  }

  function getRecord(lvl) {
    let rec = state.progress[lvl.id];
    if (!rec || !Array.isArray(rec.paid)) {
      // Dữ liệu cũ: Phiên đã hoàn tất coi như đã nhận KPI
      const done = state.completedBatches.has(lvl.id);
      rec = { paid: done ? getAllSolvedKeys(lvl).map(toPaidKey) : [], bonusPaid: 0, board: null };
      state.progress[lvl.id] = rec;
    }
    return rec;
  }

  // true nếu mục này chưa từng được trả thưởng (đánh dấu luôn)
  function claimReward(lvl, paidKey) {
    const rec = getRecord(lvl);
    if (rec.paid.includes(paidKey)) return false;
    rec.paid.push(paidKey);
    return true;
  }

  function awardOnce(lvl, paidKey, basePts) {
    return claimReward(lvl, paidKey) ? addKpiScore(basePts) : 0;
  }

  function kpiNote(pts) {
    return pts ? `+${pts} KPI` : "đã nhận KPI trước đó";
  }

  function makeBonusEntry(wordKey) {
    const dict = state.lang === "en" ? window.EN_DATA.DICT : window.VI_DATA.DICT;
    const entry = dict[wordKey];
    if (!entry) return null;
    return {
      key: wordKey,
      word: state.lang === "en" ? wordKey.toUpperCase() : entry.word,
      meaning: state.lang === "en" ? entry : entry.meaning
    };
  }

  function restoreBoard(lvl, fresh) {
    if (fresh || !state.completedBatches.has(lvl.id)) return;
    const solved = getAllSolvedKeys(lvl);
    if (state.mode === "connect") state.solvedTargets = new Set(solved);
    else if (state.mode === "merge") state.solvedPairs = new Set(solved);
    else state.connSolvedLevels = solved.slice();
  }

  function showRetryButtons() {
    els.btnRetryBatch.classList.remove("hidden");
    els.btnRetryMerge.classList.remove("hidden");
    els.btnConnRetry.classList.remove("hidden");
  }

  function unlockAchievement(id) {
    if (!state.unlockedAch.has(id)) {
      state.unlockedAch.add(id);
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) state.notices.push(`🏅 Thành tựu "${ach.title}"`);
      saveProgress();
    }
  }

  // ================= GIỮ CHÂN NGƯỜI CHƠI =================
  function trackEngagement(type, info) {
    const reward = window.Engagement.track(type, info || {});
    state.score += reward.kpi;
    state.hintQuota += reward.hints;
    state.notices.push(...reward.notices);
  }

  // Nối thông báo thưởng vào thanh công thức (giữ vỏ bọc, không bật popup)
  function flushNotices() {
    const promoted = window.Engagement.checkPromotion(state.score);
    if (promoted) state.notices.unshift(`🎉 Thăng cấp ${promoted}`);
    if (state.notices.length) {
      const text = [els.formulaStatus.textContent, ...state.notices].join(" · ");
      state.notices = [];
      setStatus(text, "ok");
    }
    const s = window.Engagement.getSummary();
    els.statDaily.textContent = `Chuyên cần: ${s.streak} ngày · NV ${s.questsDone}/${s.quests.length}`;
  }

  function buildRowHeaders() {
    let html = "";
    for (let i = 1; i <= 30; i++) html += `<div class="row-h">${i}</div>`;
    els.rowHeaders.innerHTML = html;
  }

  // ================= KHO TỪ SƯU TẦM -> PHIÊN MỚI =================
  const COLLECT_THRESHOLD = 6;
  let customLevelsCache = { vi: [], en: [] };

  function buildUnionLettersLocal(words) {
    const maxCount = {};
    words.forEach((w) => {
      const c = {};
      for (const ch of w) c[ch] = (c[ch] || 0) + 1;
      Object.entries(c).forEach(([k, v]) => {
        maxCount[k] = Math.max(maxCount[k] || 0, v);
      });
    });
    const arr = [];
    Object.entries(maxCount).forEach(([ch, cnt]) => {
      for (let i = 0; i < cnt; i++) arr.push(ch.toUpperCase());
    });
    return arr;
  }

  function shuffleLocal(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildCustomLevelsForLang(lang) {
    const data = lang === "en" ? window.EN_DATA : window.VI_DATA;
    const dict = data?.DICT || {};
    const maxLetters = lang === "vi" ? 16 : 12;
    const rawPool = (state.collectedWords[lang] || []).filter((w) => dict[w]);
    if (rawPool.length < COLLECT_THRESHOLD) return [];

    const shuffled = shuffleLocal(rawPool);
    const levels = [];
    let remaining = shuffled.slice();
    let idx = 1;

    while (remaining.length >= COLLECT_THRESHOLD) {
      const picked = [];
      const nextRemaining = [];
      for (const w of remaining) {
        if (picked.length < 8 && buildUnionLettersLocal([...picked, w]).length <= maxLetters) {
          picked.push(w);
        } else {
          nextRemaining.push(w);
        }
      }
      if (picked.length < 5) break;
      const validTargets = picked.sort((a, b) => a.length - b.length || a.localeCompare(b));
      levels.push({
        id: `${lang.toUpperCase()}-U${String(idx).padStart(2, "0")}`,
        tier: "Sưu tầm",
        topic: `Kho từ mở rộng #${idx}`,
        isCustom: true,
        letters: shuffleLocal(buildUnionLettersLocal(validTargets)),
        targets: validTargets
      });
      remaining = nextRemaining;
      idx += 1;
    }
    return levels;
  }

  function getCustomConnectLevels(lang, forceRebuild) {
    if (forceRebuild || !customLevelsCache[lang]?.length) {
      const expectedMin = Math.floor((state.collectedWords[lang] || []).length / COLLECT_THRESHOLD);
      if (forceRebuild || (expectedMin > 0 && customLevelsCache[lang].length === 0)) {
        customLevelsCache[lang] = buildCustomLevelsForLang(lang);
      }
    }
    return customLevelsCache[lang] || [];
  }

  function collectExtraWord(wordKey) {
    const list = state.collectedWords[state.lang] || (state.collectedWords[state.lang] = []);
    if (list.includes(wordKey)) return null;
    const prevCount = getCustomConnectLevels(state.lang).length;
    list.push(wordKey);
    const nextLevels = buildCustomLevelsForLang(state.lang);
    if (nextLevels.length > prevCount) {
      customLevelsCache[state.lang] = nextLevels;
      populateLevelDropdown();
      const newest = nextLevels[nextLevels.length - 1];
      trackEvent("custom_level_unlocked", { lang: state.lang, level_id: newest.id, total_collected: list.length });
      return newest;
    }
    return null;
  }

  function getLevels() {
    if (state.mode === "connections") {
      return state.lang === "en" ? window.CONN_DATA.EN_LEVELS : window.CONN_DATA.VI_LEVELS;
    }
    const data = state.lang === "en" ? window.EN_DATA : window.VI_DATA;
    if (state.mode === "connect") {
      return [...data.CONNECT_LEVELS, ...getCustomConnectLevels(state.lang)];
    }
    return data.MERGE_LEVELS;
  }

  function getDailyIndex(levelsLen) {
    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return seed % Math.max(1, levelsLen);
  }

  function isCurrentDaily() {
    const levels = getLevels();
    return state.levelIndex === getDailyIndex(levels.length);
  }

  function getCurrentLevel() {
    const levels = getLevels();
    if (state.levelIndex >= levels.length) state.levelIndex = 0;
    if (state.levelIndex < 0) state.levelIndex = levels.length - 1;
    return levels[state.levelIndex];
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.body.classList.toggle("theme-docs", theme === "docs");
    document.body.classList.toggle("theme-excel", theme === "excel");
    $("btn-theme-excel").classList.toggle("active", theme === "excel");
    $("btn-theme-docs").classList.toggle("active", theme === "docs");

    if (theme === "excel") {
      els.docName.textContent = "Bao_Cao_Kinh_Doanh_Q4";
      els.pageTitle.textContent = "Bao_Cao_Kinh_Doanh_Q4 - Bảng Chữ";
      els.bossExcelContent.classList.remove("hidden");
      els.bossDocsContent.classList.add("hidden");
    } else {
      els.docName.textContent = "Tai_Lieu_Ra_Soat_Du_Lieu";
      els.pageTitle.textContent = "Tai_Lieu_Ra_Soat_Du_Lieu - Bảng Chữ";
      els.bossExcelContent.classList.add("hidden");
      els.bossDocsContent.classList.remove("hidden");
    }
    saveProgress();
  }

  function setStatus(text, type) {
    els.formulaStatus.textContent = text;
    els.formulaStatus.title = text; // xem đủ nội dung khi bị cắt ngắn
    els.formulaStatus.className = "formula-status" + (type ? " " + type : "");
  }

  function updateToolbarActiveStates() {
    document.querySelectorAll(".sheet-tab").forEach((tab) => {
      const match = tab.dataset.lang === state.lang && tab.dataset.mode === state.mode;
      tab.classList.toggle("active", match);
    });
    $("btn-lang-vi")?.classList.toggle("active", state.lang === "vi");
    $("btn-lang-en")?.classList.toggle("active", state.lang === "en");
  }

  function updateHudUI() {
    const mult = getComboMultiplier();
    els.hudCombo.textContent = state.combo >= 2 ? `Combo ${state.combo} (x${mult})` : `Combo x1`;
    els.hudCombo.classList.toggle("combo-hot", state.combo >= 2);

    els.hudMistakes.textContent = `Lỗi: ${state.mistakes}/${state.maxMistakes}`;
    els.hudMistakes.classList.toggle("danger", state.mistakes >= state.maxMistakes - 1);

    els.btnDeadlineMode.classList.toggle("active", state.deadlineMode);
    els.hudTimer.classList.remove("hidden");
    const mm = String(Math.floor(state.timeLeft / 60)).padStart(2, "0");
    const ss = String(state.timeLeft % 60).padStart(2, "0");
    els.hudTimer.textContent = `⏱ ${mm}:${ss}`;
    els.hudTimer.classList.toggle("urgent", state.timeLeft <= 15);
  }

  function getComboMultiplier() {
    if (state.combo >= 6) return 2.5;
    if (state.combo >= 4) return 2;
    if (state.combo >= 2) return 1.5;
    return 1;
  }

  function updateHintButtonUI() {
    if (state.batchFailed || state.mode === "connections") {
      els.btnHint.disabled = true;
      els.btnHintText.textContent =
        state.mode === "connections" ? "Không hỗ trợ ở 4x4" : "Đã thất bại Phiên";
      return;
    }
    els.btnHint.disabled = false;
    if (state.hintQuota > 0) {
      els.btnHintText.textContent = `Gợi ý: ${state.hintQuota} (F2)`;
      els.btnHint.title = `Còn ${state.hintQuota} lượt gợi ý (F2) · Mỗi ngày thêm ${DAILY_HINT_GRANT} lượt`;
    } else {
      els.btnHintText.textContent = "Xem quảng cáo +1 gợi ý";
      els.btnHint.title = "Hết lượt gợi ý. Chỉ mở quảng cáo khi bạn bấm nút này";
    }
  }

  // Mỗi ngày mở game được thêm lượt; không cộng bù ngày vắng, chỉnh lùi đồng hồ không được thêm
  function grantDailyHint() {
    if (DAILY_HINT_GRANT <= 0) return;
    const today = window.Engagement.toDayNumber(new Date());
    if (state.hintDay === null) {
      state.hintDay = today;
    } else if (today > state.hintDay) {
      state.hintDay = today;
      state.hintQuota += DAILY_HINT_GRANT;
      state.notices.push(`Quà mỗi ngày: +${DAILY_HINT_GRANT} Gợi ý`);
    }
  }

  async function requestHintByAd() {
    if (window.RewardedAd.isOpen()) return;
    trackEvent("ad_hint_click", { mode: state.mode, lang: state.lang });
    const rewarded = await window.RewardedAd.show();
    if (!rewarded) {
      setStatus("Chưa hoàn tất xem quảng cáo để nhận gợi ý", "warn");
      return;
    }
    state.hintQuota += 1;
    saveProgress();
    trackEvent("ad_hint_rewarded", { mode: state.mode, lang: state.lang });
    setStatus("Đã nhận +1 Gợi ý", "ok");
    updateStatsUI();
  }

  function populateLevelDropdown() {
    const levels = getLevels();
    const dailyIdx = getDailyIndex(levels.length);
    els.levelSelect.innerHTML = levels
      .map((lvl, idx) => {
        const done = state.completedBatches.has(lvl.id) ? " ✓" : "";
        const star = idx === dailyIdx ? "★ " : "";
        return `<option value="${idx}">${star}${lvl.id} [${lvl.tier}]: ${lvl.topic}${done}</option>`;
      })
      .join("");
    els.levelSelect.value = String(state.levelIndex);
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function updateTierBadge(el, tier) {
    el.textContent = tier;
    el.className = "tier-badge";
    if (tier === "Trung bình") el.classList.add("tier-mid");
    if (tier === "Nâng cao") el.classList.add("tier-hard");
  }

  // ================= DEADLINE TIMER =================
  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    // Người dùng đã tự chuyển/làm lại Phiên thì hủy lượt tự reset đang chờ
    if (state.timeoutResetId) {
      clearTimeout(state.timeoutResetId);
      state.timeoutResetId = null;
    }
  }

  function getTimeLimit() {
    const limit = TIME_LIMITS[getCurrentLevel().tier] || DEFAULT_TIME_LIMIT;
    return state.deadlineMode ? Math.round(limit / 2) : limit;
  }

  // Đồng hồ đứng khi người dùng không ở màn luyện tập
  function isTimerPaused() {
    return (
      state.bossMode ||
      state.timerWaiting ||
      document.hidden ||
      window.RewardedAd?.isOpen?.() ||
      window.Leaderboard?.isOpen?.() ||
      ["achievements-modal", "auth-modal", "legal-modal"].some((id) => {
        const el = $(id);
        return el && !el.classList.contains("hidden");
      })
    );
  }

  function startTimer() {
    stopTimer();
    state.timeLeft = getTimeLimit();
    updateHudUI();
    if (state.batchFailed || isBatchDone()) return;

    state.timerId = setInterval(() => {
      if (state.batchFailed || isBatchDone() || isTimerPaused()) return;
      state.timeLeft -= 1;
      updateHudUI();
      if (state.timeLeft <= 0) {
        failCurrentBatch("#TIMEOUT! Hết thời gian · Phiên sẽ reset sau 3 giây");
        state.timeoutResetId = setTimeout(() => {
          state.timeoutResetId = null;
          state.timerWaiting = true;
          // Giống nút "Làm lại Phiên": đổi đề để không dò đáp án
          loadLevel(state.levelIndex, true);
          setStatus("Đã reset do hết giờ · Chạm hoặc bấm phím để bắt đầu tính giờ", "warn");
        }, TIMEOUT_RESET_MS);
      }
    }, 1000);
  }

  function isBatchDone() {
    const lvl = getCurrentLevel();
    if (state.mode === "connect") return state.solvedTargets.size === lvl.targets.length;
    if (state.mode === "merge") return state.solvedPairs.size === lvl.pairs.length;
    return state.connSolvedLevels.length === 4;
  }

  function registerMistake(msg) {
    state.combo = 0;
    state.mistakes += 1;
    updateHudUI();
    if (state.mistakes >= state.maxMistakes) {
      failCurrentBatch(`${msg} — Đã quá giới hạn ${state.maxMistakes} lỗi!`);
    } else {
      setStatus(`${msg} (Lỗi ${state.mistakes}/${state.maxMistakes})`, "err");
      saveProgress();
    }
  }

  function failCurrentBatch(reason) {
    state.batchFailed = true;
    state.streak = 0;
    stopTimer();
    setStatus(reason, "err");
    showRetryButtons();
    if (state.mode === "connections") {
      // Lộ toàn bộ đáp án để học hỏi
      const lvl = getCurrentLevel();
      state.connSolvedLevels = lvl.groups.map((g) => g.level);
      state.connSelected = [];
      renderConnections();
    }
    updateStatsUI();
  }

  // ================= CROSSWORD GENERATOR =================
  function buildCrosswordLayout(words) {
    if (!words || words.length === 0) return { rows: 0, cols: 0, cells: [], placements: {} };

    function tryBuild(orderedWords) {
      const grid = new Map();
      const placed = [];
      const key = (r, c) => r + "," + c;

      function canPlace(word, r, c, dir) {
        const dr = dir === "V" ? 1 : 0;
        const dc = dir === "H" ? 1 : 0;
        if (grid.has(key(r - dr, c - dc))) return -1;
        if (grid.has(key(r + dr * word.length, c + dc * word.length))) return -1;
        let inter = 0;
        for (let i = 0; i < word.length; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          const existing = grid.get(key(rr, cc));
          if (existing) {
            if (existing !== word[i]) return -1;
            inter++;
          } else {
            const pr = dir === "H" ? 1 : 0;
            const pc = dir === "V" ? 1 : 0;
            if (grid.has(key(rr + pr, cc + pc)) || grid.has(key(rr - pr, cc - pc))) return -1;
          }
        }
        return inter;
      }

      function put(word, r, c, dir) {
        const dr = dir === "V" ? 1 : 0;
        const dc = dir === "H" ? 1 : 0;
        for (let i = 0; i < word.length; i++) {
          grid.set(key(r + dr * i, c + dc * i), word[i]);
        }
        placed.push({ word, r, c, dir });
      }

      put(orderedWords[0], 0, 0, "H");
      let remaining = orderedWords.slice(1);
      // Chạy 2 pass để từ trước chưa khớp có cơ hội cắt từ mới đặt sau
      for (let pass = 0; pass < 2; pass++) {
        const nextRemaining = [];
        for (const w of remaining) {
          let best = null;
          for (const p of placed) {
            const tryDir = p.dir === "H" ? "V" : "H";
            const pdr = p.dir === "V" ? 1 : 0;
            const pdc = p.dir === "H" ? 1 : 0;
            const tdr = tryDir === "V" ? 1 : 0;
            const tdc = tryDir === "H" ? 1 : 0;
            for (let pi = 0; pi < p.word.length; pi++) {
              for (let wi = 0; wi < w.length; wi++) {
                if (p.word[pi] !== w[wi]) continue;
                const r = p.r + pdr * pi - tdr * wi;
                const c = p.c + pdc * pi - tdc * wi;
                const inter = canPlace(w, r, c, tryDir);
                if (inter > 0 && (!best || inter > best.inter)) {
                  best = { r, c, dir: tryDir, inter };
                }
              }
            }
          }
          if (best) put(w, best.r, best.c, best.dir);
          else nextRemaining.push(w);
        }
        remaining = nextRemaining;
      }

      let minR = 0, maxR = 0, minC = 0, maxC = 0;
      for (const k of grid.keys()) {
        const [r, c] = k.split(",").map(Number);
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }

      // Đặt các từ chưa cắt được (nếu có) thành hàng ngang gọn phía dưới bảng
      let extraRow = maxR + 2;
      let curCol = minC;
      for (const w of remaining) {
        if (curCol + w.length - minC > 12 && curCol > minC) {
          extraRow += 2;
          curCol = minC;
        }
        put(w, extraRow, curCol, "H");
        maxR = Math.max(maxR, extraRow);
        maxC = Math.max(maxC, curCol + w.length - 1);
        curCol += w.length + 1;
      }

      return {
        unplacedCount: remaining.length,
        area: (maxR - minR + 1) * (maxC - minC + 1),
        minR, maxR, minC, maxC, placed
      };
    }

    // Thử nhiều thứ tự khác nhau (giữ deterministic) để chọn layout nhiều giao điểm nhất
    const base = words.slice().sort((a, b) => b.length - a.length || a.localeCompare(b));
    let bestLayout = tryBuild(base);
    for (let shift = 1; shift < Math.min(base.length, 6); shift++) {
      const alt = [base[shift], ...base.slice(0, shift), ...base.slice(shift + 1)];
      const res = tryBuild(alt);
      if (
        res.unplacedCount < bestLayout.unplacedCount ||
        (res.unplacedCount === bestLayout.unplacedCount && res.area < bestLayout.area)
      ) {
        bestLayout = res;
      }
    }

    const rows = bestLayout.maxR - bestLayout.minR + 1;
    const cols = bestLayout.maxC - bestLayout.minC + 1;
    const cells = Array.from({ length: rows }, () => Array(cols).fill(null));
    const placements = {};

    bestLayout.placed.forEach((p) => {
      const dr = p.dir === "V" ? 1 : 0;
      const dc = p.dir === "H" ? 1 : 0;
      const numIdx = words.indexOf(p.word) + 1;
      const coords = [];
      for (let i = 0; i < p.word.length; i++) {
        const rr = p.r - bestLayout.minR + dr * i;
        const cc = p.c - bestLayout.minC + dc * i;
        if (!cells[rr][cc]) {
          cells[rr][cc] = { ch: p.word[i], owners: [], num: null };
        }
        cells[rr][cc].owners.push({ word: p.word, charIndex: i });
        if (i === 0 && !cells[rr][cc].num) {
          cells[rr][cc].num = numIdx;
        }
        coords.push([rr, cc]);
      }
      placements[p.word] = { dir: p.dir, coords, num: numIdx };
    });

    return { rows, cols, cells, placements };
  }

  function renderCrosswordGrid() {
    if (state.mode !== "connect" || !state.crossword) {
      els.crosswordWrap.classList.add("hidden");
      return;
    }
    els.crosswordWrap.classList.remove("hidden");
    const cw = state.crossword;
    els.crosswordGrid.style.gridTemplateColumns = `repeat(${cw.cols}, 24px)`;
    els.crosswordGrid.innerHTML = "";

    for (let r = 0; r < cw.rows; r++) {
      for (let c = 0; c < cw.cols; c++) {
        const cellData = cw.cells[r][c];
        const div = document.createElement("div");
        if (!cellData) {
          div.className = "cw-cell empty";
          els.crosswordGrid.appendChild(div);
          continue;
        }

        const solvedOwner = cellData.owners.find((o) => state.solvedTargets.has(o.word));
        const hintedOwner = cellData.owners.find(
          (o) => (state.revealedHints[o.word] || 0) > o.charIndex
        );
        const focusedOwner = cellData.owners.find((o) => o.word === state.focusedTargetKey);

        div.className = "cw-cell box";
        if (solvedOwner) div.classList.add("solved");
        else if (hintedOwner) div.classList.add("hinted");
        if (focusedOwner && !solvedOwner) div.classList.add("focused");

        if (cellData.num) {
          const numSpan = document.createElement("span");
          numSpan.className = "cw-num";
          numSpan.textContent = String(cellData.num);
          div.appendChild(numSpan);
        }

        const charSpan = document.createElement("span");
        charSpan.textContent = solvedOwner || hintedOwner ? cellData.ch.toUpperCase() : "";
        div.appendChild(charSpan);

        // Click vào ô chữ chưa giải để chọn dòng mục tiêu khi bấm Gợi ý
        const unsolvedOwner = cellData.owners.find((o) => !state.solvedTargets.has(o.word));
        if (unsolvedOwner) {
          div.title = "Click để ưu tiên gợi ý từ này (F2)";
          div.addEventListener("click", () => {
            state.focusedTargetKey =
              state.focusedTargetKey === unsolvedOwner.word ? null : unsolvedOwner.word;
            renderCrosswordGrid();
            renderTargetsTable();
          });
        }

        els.crosswordGrid.appendChild(div);
      }
    }
  }

  // ================= LOAD LEVEL =================
  function loadLevel(index, fresh) {
    const levels = getLevels();
    state.levelIndex = (index + levels.length) % levels.length;
    if (fresh) {
      if (state.mode === "connect") {
        const cur = levels[state.levelIndex];
        if (cur && cur.isCustom) {
          getCustomConnectLevels(state.lang, true);
        } else {
          const dataPack = state.lang === "en" ? window.EN_DATA : window.VI_DATA;
          if (dataPack && typeof dataPack.reshuffleLevel === "function") {
            dataPack.reshuffleLevel(cur.id, cur.targets || []);
          }
        }
      } else if (state.batchFailed && levels.length > 1) {
        // Khi thất bại ở chế độ Ghép từ / Phân nhóm, chuyển sang phiên khác tránh làm bài dò lại đề cũ
        state.levelIndex = (state.levelIndex + 1) % levels.length;
      }
    }
    const lvl = getCurrentLevel();
    trackEvent("level_start", { level_id: lvl.id, mode: state.mode, lang: state.lang, tier: lvl.tier });

    els.batchLabel.textContent = lvl.id;
    els.dailyTag.classList.toggle("hidden", !isCurrentDaily());
    populateLevelDropdown();
    updateToolbarActiveStates();

    // Reset round state
    state.selectedIndices = [];
    state.solvedTargets = new Set();
    state.revealedHints = {};
    state.focusedTargetKey = null;
    state.bonusWords = [];
    state.selectedTileId = null;
    state.solvedPairs = new Set();
    state.connSelected = [];
    state.connSolvedLevels = [];
    state.mistakes = 0;
    state.maxMistakes = state.mode === "connections" ? 3 : state.mode === "merge" ? 4 : 5;
    state.batchFailed = false;
    state.usedHintInBatch = false;
    els.keyboardInput.value = "";
    els.btnRetryBatch.classList.add("hidden");
    els.btnRetryMerge.classList.add("hidden");
    els.btnConnRetry.classList.add("hidden");
    setStatus("Ready", "");
    restoreBoard(lvl, fresh);
    if (isBatchDone()) {
      showRetryButtons();
      setStatus('Phiên đã hoàn tất · "Làm lại Phiên" để luyện lại', "ok");
    }

    if (state.mode === "connections") {
      els.standardGrid.classList.add("hidden");
      els.connectionsView.classList.remove("hidden");
      els.connTopicTitle.textContent = `Chủ đề: ${lvl.topic}`;
      updateTierBadge(els.connTierBadge, lvl.tier);
      const flat = [];
      lvl.groups.forEach((g) => {
        g.words.forEach((w) => flat.push({ word: w, level: g.level, title: g.title }));
      });
      state.connTiles = shuffleArray(flat);
      renderConnections();
    } else {
      els.standardGrid.classList.remove("hidden");
      els.connectionsView.classList.add("hidden");
      els.topicTitle.textContent = `Chủ đề: ${lvl.topic}`;
      updateTierBadge(els.tierBadge, lvl.tier || "Cơ bản");

      if (state.mode === "connect") {
        els.connectStage.classList.remove("hidden");
        els.mergeStage.classList.add("hidden");
        els.bonusSection.classList.remove("hidden");
        els.outputPanelTitle.textContent = "Bảng Ô Chữ & Manh Mối";
        els.modeHint.textContent =
          "Kéo nối hoặc gõ chữ · Giải từ sẽ tự mở giao điểm trên Ô chữ";
        state.letters = shuffleArray(lvl.letters);
        state.crossword = buildCrosswordLayout(lvl.targets);
        renderConnectWheel();
        updateDraftWord();
        renderCrosswordGrid();
      } else {
        els.connectStage.classList.add("hidden");
        els.mergeStage.classList.remove("hidden");
        els.crosswordWrap.classList.add("hidden");
        els.bonusSection.classList.add("hidden");
        els.outputPanelTitle.textContent = "Bảng Đối Soát Từ Ghép";
        els.modeHint.textContent =
          "Chọn 2 mảnh ghép đúng chủ đề Phiên (bỏ qua các mảnh bẫy nhiễu)";
        const tiles = [];
        lvl.pairs.forEach((p, idx) => {
          tiles.push({ id: `L-${idx}`, text: p[0], pairIdx: idx, side: 0, used: false });
          tiles.push({ id: `R-${idx}`, text: p[1], pairIdx: idx, side: 1, used: false });
        });
        if (Array.isArray(lvl.decoys)) {
          lvl.decoys.forEach((d, idx) => {
            tiles.push({ id: `D-${idx}`, text: d, pairIdx: -1, side: -1, used: false });
          });
        }
        tiles.forEach((t) => (t.used = state.solvedPairs.has(t.pairIdx)));
        state.mergeTiles = shuffleArray(tiles);
        els.mergePreview.textContent = "Chọn ô thứ nhất...";
        renderMergeTiles();
      }

      renderTargetsTable();
      renderBonusList();
    }

    startTimer();
    updateStatsUI();
    document.dispatchEvent(new Event("levelloaded"));
  }

  // ================= CONNECT MODE =================
  function getNodePosition(idx, total) {
    const width = 300;
    const height = 244;
    const cx = width / 2;
    const cy = height / 2;

    if (total >= 10) {
      const cols = 4;
      const rows = Math.ceil(total / cols);
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const stepX = 68;
      const stepY = total > 12 ? 55 : 68;
      return {
        x: Math.round(cx - ((cols - 1) * stepX) / 2 + col * stepX),
        y: Math.round(cy - ((rows - 1) * stepY) / 2 + row * stepY)
      };
    }

    if (total >= 7) {
      const cols = 3;
      const rows = Math.ceil(total / cols);
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const stepX = 76;
      const stepY = 72;
      return {
        x: Math.round(cx - ((cols - 1) * stepX) / 2 + col * stepX),
        y: Math.round(cy - ((rows - 1) * stepY) / 2 + row * stepY)
      };
    }

    const radius = total <= 5 ? 82 : 88;
    const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle))
    };
  }

  function renderConnectWheel() {
    els.nodesLayer.innerHTML = "";
    const total = state.letters.length;
    state.letters.forEach((ch, idx) => {
      const pos = getNodePosition(idx, total);
      const node = document.createElement("div");
      node.className = "letter-node";
      node.dataset.index = String(idx);
      node.textContent = ch;
      node.style.left = pos.x + "px";
      node.style.top = pos.y + "px";
      els.nodesLayer.appendChild(node);
    });
    redrawConnectLines();
  }

  function redrawConnectLines(pointerPt) {
    const total = state.letters.length;
    const pts = state.selectedIndices.map((idx) => getNodePosition(idx, total));
    const accentColor = state.theme === "excel" ? "#0f766e" : "#5b4a8b";

    els.nodesLayer.querySelectorAll(".letter-node").forEach((el) => {
      const idx = Number(el.dataset.index);
      el.classList.toggle("selected", state.selectedIndices.includes(idx));
    });

    if (pts.length === 0) {
      els.connectSvg.innerHTML = "";
      return;
    }

    const linePts = pts.map((p) => `${p.x},${p.y}`);
    if (pointerPt && state.isDragging) linePts.push(`${pointerPt.x},${pointerPt.y}`);
    els.connectSvg.innerHTML = `<polyline points="${linePts.join(" ")}" fill="none" stroke="${accentColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.65" />`;
  }

  function getSelectedString() {
    return state.selectedIndices.map((i) => state.letters[i]).join("");
  }

  function updateDraftWord() {
    const raw = getSelectedString();
    els.draftWord.textContent = raw || "—";
    if (document.activeElement !== els.keyboardInput) {
      if (raw) {
        const quoted = raw.split("").map((c) => `"${c}"`).join(",");
        els.keyboardInput.value = `=CONCAT(${quoted})`;
      } else {
        els.keyboardInput.value = "";
      }
    }
  }

  function canBuildFromPool(wordKey, letters) {
    const pool = {};
    letters.forEach((l) => {
      const ch = l.toLowerCase();
      pool[ch] = (pool[ch] || 0) + 1;
    });
    for (const ch of wordKey) {
      if (!pool[ch]) return false;
      pool[ch]--;
    }
    return true;
  }

  function addKpiScore(basePts) {
    const mult = getComboMultiplier() * (isCurrentDaily() ? 2 : 1);
    const totalPts = Math.round(basePts * mult);
    state.score += totalPts;
    return totalPts;
  }

  function submitConnectWord(rawInput) {
    if (state.batchFailed) return;
    const lvl = getCurrentLevel();
    let wordKey = (rawInput || "").trim().toLowerCase();

    if (state.lang === "vi") {
      wordKey = window.VI_DATA.stripTones(wordKey);
    } else {
      wordKey = wordKey.replace(/[^a-z]/g, "");
    }

    state.selectedIndices = [];
    redrawConnectLines();
    updateDraftWord();
    els.keyboardInput.value = "";

    if (wordKey.length < 2) {
      setStatus("Tối thiểu 2 ký tự", "warn");
      return;
    }

    if (!canBuildFromPool(wordKey, lvl.letters)) {
      registerMistake("#VALUE! Ký tự không thuộc tập đầu vào");
      return;
    }

    const dict = state.lang === "en" ? window.EN_DATA.DICT : window.VI_DATA.DICT;
    // Chỉ nhận từ có trong từ điển: không tự ghép tiếng, vì sẽ ra cụm vô nghĩa. Thiếu từ thì bổ sung vào data
    const entry = dict[wordKey];

    if (!entry) {
      registerMistake(`"${wordKey.toUpperCase()}" sai từ điển`);
      return;
    }

    if (lvl.targets.includes(wordKey)) {
      if (state.solvedTargets.has(wordKey)) {
        setStatus(`"${wordKey.toUpperCase()}" đã đối soát rồi`, "warn");
        return;
      }
      state.solvedTargets.add(wordKey);
      if (state.focusedTargetKey === wordKey) state.focusedTargetKey = null;
      state.combo += 1;
      if (state.combo > state.maxComboEver) state.maxComboEver = state.combo;
      if (state.combo >= 5) unlockAchievement("combo_5");

      const pts = awardOnce(lvl, wordKey, wordKey.length * 10);
      setStatus(`OK: ${kpiNote(pts)} (Combo ${state.combo})`, "ok");
      trackEngagement("answer", { combo: state.combo });
      renderCrosswordGrid();
      renderTargetsTable();
      checkBatchCompletion(lvl);
      updateStatsUI();
      return;
    }

    if (state.bonusWords.some((b) => b.key === wordKey)) {
      setStatus(`Extra Ref "${wordKey.toUpperCase()}" đã ghi nhận`, "warn");
      return;
    }

    state.bonusWords.unshift(makeBonusEntry(wordKey));
    state.combo += 1;
    const pts = awardOnce(lvl, `b:${wordKey}`, 15);
    const unlockedCustom = collectExtraWord(wordKey);

    let bonusMsg = `Extra Ref: ${kpiNote(pts)}`;
    const rec = getRecord(lvl);
    if (state.bonusWords.length >= 6 && !(rec.bonusPaid > 0)) {
      rec.bonusPaid = 1;
      state.hintQuota += 1;
      unlockAchievement("extra_ref");
      bonusMsg = `Extra Ref +${pts} KPI · Thưởng +1 Gợi ý!`;
    }
    if (unlockedCustom) {
      bonusMsg = `✨ Đã mở Phiên Sưu Tầm mới: ${unlockedCustom.id}!`;
    } else {
      const totalCol = (state.collectedWords[state.lang] || []).length;
      const mod = totalCol % COLLECT_THRESHOLD;
      if (mod > 0) {
        bonusMsg += ` · Sưu tầm ${mod}/${COLLECT_THRESHOLD} từ mở Phiên mới`;
      }
    }

    setStatus(bonusMsg, "ok");
    trackEngagement("extra", { combo: state.combo });
    renderBonusList();
    updateStatsUI();
  }

  function checkBatchCompletion(lvl) {
    if (!isBatchDone() || state.batchFailed) return;
    stopTimer();
    unlockAchievement("first_batch");
    if (state.mistakes === 0) unlockAchievement("clean_sheet");
    if (state.deadlineMode) unlockAchievement("deadline_win");
    if (state.mode === "connections") unlockAchievement("conn_master");

    let msg = `Hoàn tất ${lvl.id}! Bấm "Tiếp" sang Phiên mới`;
    if (!state.completedBatches.has(lvl.id)) {
      state.completedBatches.add(lvl.id);
      trackEvent("level_complete", { level_id: lvl.id, mode: state.mode, lang: state.lang, mistakes: state.mistakes });
      state.streak += 1;
      let clearBonus = lvl.tier === "Nâng cao" ? 120 : lvl.tier === "Sưu tầm" ? 100 : lvl.tier === "Trung bình" ? 80 : 60;
      if (state.deadlineMode) clearBonus = Math.round(clearBonus * 1.5);
      if (isCurrentDaily()) clearBonus *= 2;
      state.score += clearBonus;

      if (!state.usedHintInBatch && state.mode !== "connections") {
        state.hintQuota += 1;
        msg = `Hoàn tất ${lvl.id} (+${clearBonus} KPI, +1 Gợi ý!)`;
      } else {
        msg = `Hoàn tất ${lvl.id} (+${clearBonus} KPI)!`;
      }
    }
    saveProgress();
    populateLevelDropdown();
    showRetryButtons();
    setStatus(msg, "ok");
    trackEngagement("batch", {
      clean: state.mistakes === 0 && !state.usedHintInBatch,
      isDaily: isCurrentDaily()
    });
  }

  // ================= MERGE MODE =================
  function renderMergeTiles() {
    els.mergeTilesGrid.innerHTML = "";
    state.mergeTiles.forEach((tile) => {
      const btn = document.createElement("button");
      btn.className = "merge-tile";
      if (tile.used) btn.classList.add("used");
      if (tile.id === state.selectedTileId) btn.classList.add("selected");
      btn.textContent = tile.text;
      btn.disabled = tile.used || state.batchFailed;
      btn.addEventListener("click", () => handleMergeTileClick(tile));
      els.mergeTilesGrid.appendChild(btn);
    });
  }

  function handleMergeTileClick(tile) {
    if (tile.used || state.batchFailed) return;
    if (!state.selectedTileId) {
      state.selectedTileId = tile.id;
      els.mergePreview.textContent = `${tile.text} + ...`;
      renderMergeTiles();
      return;
    }

    if (state.selectedTileId === tile.id) {
      state.selectedTileId = null;
      els.mergePreview.textContent = "Chọn ô thứ nhất...";
      renderMergeTiles();
      return;
    }

    const first = state.mergeTiles.find((t) => t.id === state.selectedTileId);
    const lvl = getCurrentLevel();

    const matchedPairIdx =
      first && first.pairIdx === tile.pairIdx && first.side !== tile.side && first.pairIdx >= 0
        ? first.pairIdx
        : findMatchingPairIndex(first.text, tile.text, lvl);

    state.selectedTileId = null;

    if (matchedPairIdx !== -1) {
      markPairSolved(matchedPairIdx, lvl);
    } else {
      els.mergePreview.textContent = `${first.text} + ${tile.text} (#N/A)`;
      registerMistake("#N/A Ghép sai cặp");
      renderMergeTiles();
    }
  }

  function findMatchingPairIndex(textA, textB, lvl) {
    for (let i = 0; i < lvl.pairs.length; i++) {
      if (state.solvedPairs.has(i)) continue;
      const [left, right] = lvl.pairs[i];
      if (
        (left.toLowerCase() === textA.toLowerCase() && right.toLowerCase() === textB.toLowerCase()) ||
        (left.toLowerCase() === textB.toLowerCase() && right.toLowerCase() === textA.toLowerCase())
      ) {
        return i;
      }
    }
    return -1;
  }

  function markPairSolved(pairIdx, lvl, byHint) {
    state.solvedPairs.add(pairIdx);
    let usedLeft = false;
    let usedRight = false;
    state.mergeTiles.forEach((t) => {
      if (t.pairIdx === pairIdx && t.side === 0 && !usedLeft) {
        t.used = true;
        usedLeft = true;
      } else if (t.pairIdx === pairIdx && t.side === 1 && !usedRight) {
        t.used = true;
        usedRight = true;
      }
    });

    const pair = lvl.pairs[pairIdx];
    els.mergePreview.textContent = `${pair[2]} — (${pair[3]})`;
    if (byHint) {
      // Gợi ý: không KPI, không combo; mục này cũng không được trả thưởng về sau
      claimReward(lvl, `p${pairIdx}`);
    } else {
      state.combo += 1;
      if (state.combo > state.maxComboEver) state.maxComboEver = state.combo;
      if (state.combo >= 5) unlockAchievement("combo_5");

      const pts = awardOnce(lvl, `p${pairIdx}`, 20);
      setStatus(`OK: "${pair[2]}" (${kpiNote(pts)})`, "ok");
      trackEngagement("answer", { combo: state.combo });
    }
    renderMergeTiles();
    renderTargetsTable();
    checkBatchCompletion(lvl);
    updateStatsUI();
  }

  function submitMergeKeyboard(rawInput) {
    if (state.batchFailed) return;
    const lvl = getCurrentLevel();
    const cleaned = (rawInput || "").trim().toLowerCase();
    els.keyboardInput.value = "";
    if (!cleaned) return;

    const normInput =
      state.lang === "vi" ? window.VI_DATA.stripTones(cleaned) : cleaned.replace(/\s+/g, "");

    for (let i = 0; i < lvl.pairs.length; i++) {
      if (state.solvedPairs.has(i)) continue;
      const full = lvl.pairs[i][2].toLowerCase();
      const normFull =
        state.lang === "vi" ? window.VI_DATA.stripTones(full) : full.replace(/\s+/g, "");
      if (normInput === normFull) {
        state.selectedTileId = null;
        markPairSolved(i, lvl);
        return;
      }
    }
    registerMistake(`Không khớp "${cleaned}"`);
  }

  // ================= PHÂN NHÓM 4x4 =================
  function renderConnections() {
    const lvl = getCurrentLevel();
    els.connSolvedList.innerHTML = "";

    // Hiện các nhóm đã giải
    state.connSolvedLevels.forEach((solvedLvl) => {
      const grp = lvl.groups.find((g) => g.level === solvedLvl);
      if (!grp) return;
      const div = document.createElement("div");
      div.className = `conn-group-banner lvl-${grp.level}`;
      div.innerHTML = `
        <div class="conn-group-title">${grp.title}</div>
        <div class="conn-group-words">${grp.words.join(" · ")}</div>
      `;
      els.connSolvedList.appendChild(div);
    });

    // Lưới các ô còn lại
    els.connGrid.innerHTML = "";
    state.connTiles.forEach((tile, idx) => {
      if (state.connSolvedLevels.includes(tile.level)) return;
      const btn = document.createElement("button");
      btn.className = "conn-tile";
      if (state.connSelected.includes(idx)) btn.classList.add("selected");
      btn.textContent = tile.word;
      btn.disabled = state.batchFailed;
      btn.addEventListener("click", () => toggleConnTile(idx));
      els.connGrid.appendChild(btn);
    });

    els.btnConnSubmit.textContent = `Xác nhận nhóm (${state.connSelected.length}/4)`;
    els.btnConnSubmit.disabled = state.connSelected.length !== 4 || state.batchFailed;

    const pct = Math.round((state.connSolvedLevels.length / 4) * 100);
    els.connProgressFill.style.width = `${pct}%`;
  }

  function toggleConnTile(idx) {
    if (state.batchFailed) return;
    const pos = state.connSelected.indexOf(idx);
    if (pos !== -1) {
      state.connSelected.splice(pos, 1);
    } else if (state.connSelected.length < 4) {
      state.connSelected.push(idx);
    }
    renderConnections();
  }

  function submitConnectionsGroup() {
    if (state.connSelected.length !== 4 || state.batchFailed) return;
    const lvl = getCurrentLevel();
    const chosen = state.connSelected.map((i) => state.connTiles[i]);
    const counts = {};
    chosen.forEach((t) => {
      counts[t.level] = (counts[t.level] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topLevel = Number(entries[0][0]);
    const topCount = entries[0][1];

    if (topCount === 4) {
      state.connSolvedLevels.push(topLevel);
      state.connSelected = [];
      state.combo += 1;
      if (state.combo > state.maxComboEver) state.maxComboEver = state.combo;
      if (state.combo >= 5) unlockAchievement("combo_5");
      const pts = awardOnce(lvl, `g${topLevel}`, topLevel * 25);
      setStatus(`Chuẩn nhóm! ${kpiNote(pts)}`, "ok");
      trackEngagement("answer", { combo: state.combo });
      renderConnections();
      checkBatchCompletion(lvl);
      updateStatsUI();
      return;
    }

    if (topCount === 3) {
      registerMistake("Gần đúng! Lệch 1 ô!");
    } else {
      registerMistake("Nhóm chưa đúng quy luật");
    }
    renderConnections();
  }

  // ================= TABLES & STATS =================
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeForClueCheck(str) {
    return (str || "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function sanitizeClueMeaning(meaningText, wordKey, topic) {
    const targetNorm = normalizeForClueCheck(wordKey);
    if (!meaningText || !targetNorm) return topic ? `Chủ đề: ${topic}` : "";
    const parts = meaningText.split(/(\s+|\/|,|;|\(|\))/);
    const masked = parts
      .map((part) => {
        const norm = normalizeForClueCheck(part);
        return norm && norm === targetNorm ? "___" : part;
      })
      .join("")
      .replace(/\s{2,}/g, " ")
      .trim();
    const remainingNorm = normalizeForClueCheck(masked);
    if (!remainingNorm || remainingNorm.length < 3 || (targetNorm.length >= 4 && remainingNorm.includes(targetNorm))) {
      return `Chủ đề: ${topic}`;
    }
    return masked;
  }

  function renderTargetsTable() {
    const lvl = getCurrentLevel();
    els.targetsTbody.innerHTML = "";

    if (state.mode === "connect") {
      const dict = state.lang === "en" ? window.EN_DATA.DICT : window.VI_DATA.DICT;
      lvl.targets.forEach((wordKey, idx) => {
        const solved = state.solvedTargets.has(wordKey);
        const hintCount = state.revealedHints[wordKey] || 0;
        const entry = dict[wordKey];
        const placement = state.crossword?.placements?.[wordKey];
        const dirLabel = placement ? (placement.dir === "H" ? "Ngang" : "Dọc") : "";

        const tr = document.createElement("tr");
        if (solved) {
          tr.className = "row-solved";
        } else {
          tr.className = "row-pending" + (state.focusedTargetKey === wordKey ? " row-focused" : "");
          tr.title = "Click để chọn dòng này khi bấm Gợi ý (F2)";
          tr.addEventListener("click", () => {
            state.focusedTargetKey = state.focusedTargetKey === wordKey ? null : wordKey;
            renderCrosswordGrid();
            renderTargetsTable();
          });
        }

        let wordCellHtml = "";
        let statusHtml = `<span class="badge-status badge-pending">Pending</span>`;
        let meaningHtml = "";

        if (solved) {
          const displayWord = state.lang === "en" ? wordKey.toUpperCase() : entry.word;
          const meaningText = state.lang === "en" ? entry : entry.meaning;
          wordCellHtml = `<span class="solved-word">${displayWord}</span>`;
          statusHtml = `<span class="badge-status badge-ok">Verified</span>`;
          meaningHtml = escapeHtml(meaningText);
        } else {
          // Hiển thị các ô đã lộ từ gợi ý HOẶC từ giao điểm Crossword đã mở!
          const coords = placement?.coords || [];
          const chars = wordKey
            .toUpperCase()
            .split("")
            .map((c, ci) => {
              let revealedByCross = false;
              if (coords[ci] && state.crossword) {
                const [rr, cc] = coords[ci];
                const cell = state.crossword.cells[rr][cc];
                if (cell && cell.owners.some((o) => state.solvedTargets.has(o.word))) {
                  revealedByCross = true;
                }
              }
              return ci < hintCount || revealedByCross ? c : "_";
            })
            .join(" ");
          wordCellHtml = `<span class="masked-word">${chars}</span>`;
          // Hiển thị gợi ý nghĩa cho cả 2 ngôn ngữ, mọi tier; che bớt từ trùng đáp án qua sanitizeClueMeaning
          const meaningText = state.lang === "en" ? entry : entry.meaning;
          const safeClue = escapeHtml(sanitizeClueMeaning(meaningText, wordKey, lvl.topic));
          const lenUnit = state.lang === "en" ? "ký tự" : "chữ";
          meaningHtml = `<span class="masked-word">${dirLabel} · ${wordKey.length} ${lenUnit} (${safeClue})</span>`;
        }

        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${wordCellHtml}</td>
          <td>${statusHtml}</td>
          <td>${meaningHtml}</td>
        `;
        els.targetsTbody.appendChild(tr);
      });
      const pct = Math.round((state.solvedTargets.size / Math.max(1, lvl.targets.length)) * 100);
      els.progressSummary.textContent = `${state.solvedTargets.size} / ${lvl.targets.length} mục (${pct}%)`;
      els.progressBarFill.style.width = `${pct}%`;
    } else if (state.mode === "merge") {
      lvl.pairs.forEach((pair, idx) => {
        const solved = state.solvedPairs.has(idx);
        const tr = document.createElement("tr");
        if (solved) tr.className = "row-solved";

        const wordCellHtml = solved
          ? `<span class="solved-word">${pair[2]}</span>`
          : `<span class="masked-word">[ ${pair[0]} ] + [ ? ]</span>`;
        const statusHtml = solved
          ? `<span class="badge-status badge-ok">Matched</span>`
          : `<span class="badge-status badge-pending">Pending</span>`;
        const meaningHtml = solved ? pair[3] : `<span class="masked-word">Theo chủ đề: ${lvl.topic}</span>`;

        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td>${wordCellHtml}</td>
          <td>${statusHtml}</td>
          <td>${meaningHtml}</td>
        `;
        els.targetsTbody.appendChild(tr);
      });
      const pct = Math.round((state.solvedPairs.size / Math.max(1, lvl.pairs.length)) * 100);
      els.progressSummary.textContent = `${state.solvedPairs.size} / ${lvl.pairs.length} mục (${pct}%)`;
      els.progressBarFill.style.width = `${pct}%`;
    }
  }

  function renderBonusList() {
    els.bonusCount.textContent = `${state.bonusWords.length} mục`;
    if (state.bonusWords.length === 0) {
      els.bonusList.innerHTML = `<span class="bonus-empty">Tìm từ hợp lệ ngoài danh sách (3 Extra Refs = +1 Gợi ý).</span>`;
      return;
    }
    els.bonusList.innerHTML = state.bonusWords
      .map(
        (b) => `<span class="bonus-chip" title="${b.meaning}"><strong>${b.word}</strong>: ${b.meaning}</span>`
      )
      .join("");
  }

  function updateStatsUI() {
    const lvl = getCurrentLevel();
    const total =
      state.mode === "connect"
        ? lvl.targets.length
        : state.mode === "merge"
          ? lvl.pairs.length
          : 4;
    const done =
      state.mode === "connect"
        ? state.solvedTargets.size
        : state.mode === "merge"
          ? state.solvedPairs.size
          : state.connSolvedLevels.length;

    els.kpiFooter.textContent = `Valid Rows: ${done}/${total} | Batch hoàn thành: ${state.completedBatches.size}`;
    grantDailyHint();
    flushNotices();
    els.statRank.textContent = `Cấp bậc: ${window.Engagement.getRankName(state.score)}`;
    els.statStreak.textContent = `Chuỗi hoàn thành: ${state.streak}`;
    els.statScore.textContent = `Tổng KPI: ${state.score}`;
    updateHudUI();
    updateHintButtonUI();
    saveProgress();
  }

  function consumeHint() {
    if (state.hintQuota > 0) {
      state.hintQuota -= 1;
      return true;
    }
    // F2 không tự mở quảng cáo, tránh bật nhầm
    setStatus('Hết lượt gợi ý · Bấm nút "Xem quảng cáo" nếu muốn thêm', "warn");
    return false;
  }

  function triggerHint() {
    if (state.batchFailed || state.mode === "connections") return;
    const lvl = getCurrentLevel();

    if (state.mode === "connect") {
      const targetWord =
        state.focusedTargetKey && !state.solvedTargets.has(state.focusedTargetKey)
          ? state.focusedTargetKey
          : lvl.targets.find((w) => !state.solvedTargets.has(w));
      if (!targetWord) return;

      if (!consumeHint()) return;
      state.usedHintInBatch = true;

      const cur = state.revealedHints[targetWord] || 0;
      const costNote = ` (còn ${state.hintQuota} lượt)`;

      if (cur + 1 >= targetWord.length) {
        state.solvedTargets.add(targetWord);
        claimReward(lvl, targetWord);
        if (state.focusedTargetKey === targetWord) state.focusedTargetKey = null;
        setStatus(`Auto-Fill hoàn tất "${targetWord.toUpperCase()}"${costNote}`, "warn");
        checkBatchCompletion(lvl);
      } else {
        state.revealedHints[targetWord] = cur + 1;
        setStatus(`Gợi ý ký tự ${cur + 1}/${targetWord.length}${costNote}`, "warn");
      }
      renderCrosswordGrid();
      renderTargetsTable();
      updateStatsUI();
    } else if (state.mode === "merge") {
      const idx = lvl.pairs.findIndex((_, i) => !state.solvedPairs.has(i));
      if (idx === -1) return;
      if (!consumeHint()) return;
      state.usedHintInBatch = true;

      state.selectedTileId = null;
      markPairSolved(idx, lvl, true);
      const costNote = ` (còn ${state.hintQuota} lượt)`;
      // Giữ thông báo hoàn tất Phiên nếu đây là cặp cuối
      if (!isBatchDone()) setStatus(`Gợi ý ghép "${lvl.pairs[idx][2]}"${costNote}`, "warn");
      updateStatsUI();
    }
  }

  function renderAchievementsModal() {
    els.kpiOverviewCards.innerHTML = `
      <div class="kpi-card"><div class="kpi-card-label">Tổng KPI</div><div class="kpi-card-val">${state.score}</div></div>
      <div class="kpi-card"><div class="kpi-card-label">Cấp bậc</div><div class="kpi-card-val">${window.Engagement.getRankName(state.score)}</div></div>
      <div class="kpi-card"><div class="kpi-card-label">Phiên xong</div><div class="kpi-card-val">${state.completedBatches.size}</div></div>
      <div class="kpi-card"><div class="kpi-card-label">Max Combo</div><div class="kpi-card-val">x${state.maxComboEver}</div></div>
    `;

    const breakdownEl = $("kpi-mode-breakdown");
    if (breakdownEl) {
      const enConn = window.EN_DATA?.CONNECT_LEVELS || [];
      const viConn = window.VI_DATA?.CONNECT_LEVELS || [];
      const enMerge = window.EN_DATA?.MERGE_LEVELS || [];
      const viMerge = window.VI_DATA?.MERGE_LEVELS || [];
      const enGrp = window.CONN_DATA?.EN_LEVELS || [];
      const viGrp = window.CONN_DATA?.VI_LEVELS || [];

      const countDone = (list) => list.filter((l) => state.completedBatches.has(l.id)).length;
      const rows = [
        { label: "Nối chữ (EN + VI)", done: countDone(enConn) + countDone(viConn), total: enConn.length + viConn.length },
        { label: "Ghép từ (EN + VI)", done: countDone(enMerge) + countDone(viMerge), total: enMerge.length + viMerge.length },
        { label: "Phân nhóm 4x4 (EN + VI)", done: countDone(enGrp) + countDone(viGrp), total: enGrp.length + viGrp.length }
      ];
      const viCol = (state.collectedWords?.vi || []).length;
      const enCol = (state.collectedWords?.en || []).length;

      breakdownEl.innerHTML = `
        <h4 class="modal-subtitle">Tiến độ theo học phần &amp; Kho từ sưu tầm</h4>
        ${rows
          .map((r) => {
            const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
            return `
              <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0 2px;">
                <span>${r.label}</span>
                <strong>${r.done}/${r.total} (${pct}%)</strong>
              </div>
              <div class="excel-databar-track"><div class="excel-databar-fill" style="width:${pct}%"></div></div>
            `;
          })
          .join("")}
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">
          Từ sưu tầm (Extra Refs): <strong>VI: ${viCol} từ</strong> · <strong>EN: ${enCol} từ</strong> (đủ 6 từ/ngôn ngữ mở Phiên Sưu Tầm mới)
        </div>
      `;
    }
    els.engagePanel.innerHTML = window.Engagement.renderPanel(state.score);
    els.achGrid.innerHTML = ACHIEVEMENTS.map((a) => {
      const ok = state.unlockedAch.has(a.id);
      return `
        <div class="ach-item ${ok ? "unlocked" : ""}">
          <div class="ach-title">${ok ? "✓ " : "○ "}${a.title}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
      `;
    }).join("");
  }

  function toggleBossMode(force) {
    state.bossMode = typeof force === "boolean" ? force : !state.bossMode;
    els.bossScreen.classList.toggle("hidden", !state.bossMode);
    els.mainWorkspace.classList.toggle("hidden", state.bossMode);
    $("btn-panic").textContent = state.bossMode ? "Quay lại (Esc)" : "Xem Báo Cáo (Esc)";
  }

  // ================= POINTER EVENTS CHO WHEEL =================
  function findNodeAtPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const node = el.closest(".letter-node");
    return node ? Number(node.dataset.index) : null;
  }

  function getRelativePoint(clientX, clientY) {
    const rect = els.wheelWrap.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function setupWheelEvents() {
    els.wheelWrap.addEventListener("pointerdown", (e) => {
      if (state.mode !== "connect" || state.batchFailed) return;
      const idx = findNodeAtPoint(e.clientX, e.clientY);
      if (idx === null) return;

      e.preventDefault();
      state.isDragging = true;
      state.hasDraggedAcross = false;
      state.dragStartIdx = idx;
      els.wheelWrap.setPointerCapture(e.pointerId);

      if (!state.selectedIndices.includes(idx)) {
        state.selectedIndices.push(idx);
      } else if (
        state.selectedIndices.length >= 1 &&
        state.selectedIndices[state.selectedIndices.length - 1] === idx
      ) {
        state.selectedIndices.pop();
      }
      redrawConnectLines(getRelativePoint(e.clientX, e.clientY));
      updateDraftWord();
    });

    els.wheelWrap.addEventListener("pointermove", (e) => {
      if (!state.isDragging) return;
      const idx = findNodeAtPoint(e.clientX, e.clientY);
      if (idx !== null && idx !== state.dragStartIdx) {
        state.hasDraggedAcross = true;
      }
      if (idx !== null) {
        const len = state.selectedIndices.length;
        if (!state.selectedIndices.includes(idx)) {
          state.selectedIndices.push(idx);
          updateDraftWord();
        } else if (len >= 2 && state.selectedIndices[len - 2] === idx) {
          state.selectedIndices.pop();
          updateDraftWord();
        }
      }
      redrawConnectLines(getRelativePoint(e.clientX, e.clientY));
    });

    const endDrag = () => {
      if (!state.isDragging) return;
      state.isDragging = false;
      redrawConnectLines();
      if (state.hasDraggedAcross && state.selectedIndices.length >= 2) {
        submitConnectWord(getSelectedString());
      }
      state.hasDraggedAcross = false;
      state.dragStartIdx = null;
    };

    els.wheelWrap.addEventListener("pointerup", endDrag);
    els.wheelWrap.addEventListener("pointercancel", endDrag);
  }

  function handleLetterTypingFromKeyboard(ch) {
    if (state.mode !== "connect" || state.batchFailed) return;
    const upper = ch.toUpperCase();
    const availableIdx = state.letters.findIndex(
      (l, i) => l.toUpperCase() === upper && !state.selectedIndices.includes(i)
    );
    if (availableIdx !== -1) {
      state.selectedIndices.push(availableIdx);
      redrawConnectLines();
      updateDraftWord();
    }
  }

  function setupEvents() {
    setupWheelEvents();

    $("btn-theme-excel").addEventListener("click", () => applyTheme("excel"));
    $("btn-theme-docs").addEventListener("click", () => applyTheme("docs"));
    $("btn-panic").addEventListener("click", () => toggleBossMode());

    document.querySelectorAll(".sheet-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.lang = tab.dataset.lang;
        state.mode = tab.dataset.mode;
        loadLevel(0, true);
      });
    });

    $("btn-lang-vi")?.addEventListener("click", () => {
      if (state.lang === "vi") return;
      state.lang = "vi";
      loadLevel(0, true);
    });
    $("btn-lang-en")?.addEventListener("click", () => {
      if (state.lang === "en") return;
      state.lang = "en";
      loadLevel(0, true);
    });

    $("btn-shuffle").addEventListener("click", () => {
      if (state.mode === "connect") {
        state.letters = shuffleArray(state.letters);
        state.selectedIndices = [];
        renderConnectWheel();
        updateDraftWord();
      } else if (state.mode === "merge") {
        state.mergeTiles = shuffleArray(state.mergeTiles);
        renderMergeTiles();
      } else {
        state.connTiles = shuffleArray(state.connTiles);
        state.connSelected = [];
        renderConnections();
      }
    });

    $("btn-hint").addEventListener("click", () => {
      if (state.hintQuota > 0) triggerHint();
      else requestHintByAd();
    });

    const resumeTimer = () => {
      state.timerWaiting = false;
    };
    document.addEventListener("pointerdown", resumeTimer, true);
    document.addEventListener("keydown", resumeTimer, true);

    els.btnDeadlineMode.addEventListener("click", () => {
      state.deadlineMode = !state.deadlineMode;
      const hasProgress =
        state.solvedTargets.size > 0 || state.solvedPairs.size > 0 || state.connSolvedLevels.length > 0;
      loadLevel(state.levelIndex, hasProgress);
      if (hasProgress) {
        setStatus(
          state.deadlineMode
            ? "Đã bật Tăng tốc x1.5 KPI · Bắt đầu Phiên mới!"
            : "Đã tắt Tăng tốc · Bắt đầu Phiên mới!",
          "warn"
        );
      }
    });

    $("btn-prev-level").addEventListener("click", () => loadLevel(state.levelIndex - 1, true));
    $("btn-next-level").addEventListener("click", () => loadLevel(state.levelIndex + 1, true));

    els.levelSelect.addEventListener("change", (e) => {
      loadLevel(Number(e.target.value), true);
    });

    $("btn-submit-word").addEventListener("click", () => {
      const raw = getSelectedString() || els.keyboardInput.value;
      submitConnectWord(raw);
    });

    $("btn-reset-pick").addEventListener("click", () => {
      state.selectedIndices = [];
      redrawConnectLines();
      updateDraftWord();
    });

    [els.btnRetryBatch, els.btnRetryMerge, els.btnConnRetry].forEach((btn) => {
      btn.addEventListener("click", () => loadLevel(state.levelIndex, true));
    });

    els.btnConnSubmit.addEventListener("click", submitConnectionsGroup);
    els.btnConnDeselect.addEventListener("click", () => {
      state.connSelected = [];
      renderConnections();
    });

    $("btn-leaderboard").addEventListener("click", () => window.Leaderboard.open());
    $("btn-achievements").addEventListener("click", () => {
      renderAchievementsModal();
      els.achModal.classList.remove("hidden");
    });
    $("btn-close-modal").addEventListener("click", () => {
      els.achModal.classList.add("hidden");
    });

    const legalModal = $("legal-modal");
    $("btn-open-legal")?.addEventListener("click", () => {
      els.achModal.classList.add("hidden");
      legalModal?.classList.remove("hidden");
    });
    $("btn-close-legal")?.addEventListener("click", () => {
      legalModal?.classList.add("hidden");
    });
    $("btn-share-kpi")?.addEventListener("click", async () => {
      const lvl = getCurrentLevel();
      const dailyInfo = window.Engagement?.getSummary?.() || { streak: 0 };
      const text = [
        `📊 Bảng Chữ KPI · ${lvl.id} (${lvl.topic})`,
        `✅ Tổng KPI: ${state.score} | Chuỗi ngày: ${dailyInfo.streak} | Max Combo: x${state.maxComboEver}`,
        `🏆 Đã hoàn tất: ${state.completedBatches.size} phiên`
      ].join("\n");
      try {
        await navigator.clipboard.writeText(text);
        trackEvent("share_kpi", { level_id: lvl.id, score: state.score });
        setStatus("Đã copy Báo Cáo KPI vào clipboard!", "ok");
      } catch (_) {
        setStatus("Không thể truy cập clipboard trên trình duyệt này", "warn");
      }
    });

    const authModal = $("auth-modal");
    const authForm = $("auth-form");
    const authInput = $("auth-username");
    const btnLogout = $("btn-logout");

    $("btn-auth")?.addEventListener("click", () => {
      updateAuthUI();
      authModal?.classList.remove("hidden");
      authInput?.focus();
    });
    $("btn-close-auth")?.addEventListener("click", () => {
      authModal?.classList.add("hidden");
    });
    authForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const rawName = (authInput?.value || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
      if (rawName.length < 2) {
        setStatus("Tên tài khoản tối thiểu 2 ký tự (chữ/số)", "err");
        return;
      }
      try {
        localStorage.setItem(AUTH_KEY, rawName.toLowerCase());
      } catch (_) {}
      window.Engagement?.reloadAuth?.();
      loadProgress();
      applyTheme(state.theme);
      loadLevel(state.levelIndex);
      authModal?.classList.add("hidden");
      trackEvent("auth_login", { method: "local" });
      setStatus(`Đã đăng nhập: ${rawName.toLowerCase()} · Tiến độ sẽ được lưu`, "ok");
    });
    btnLogout?.addEventListener("click", () => {
      try {
        localStorage.removeItem(AUTH_KEY);
      } catch (_) {}
      window.Engagement?.reloadAuth?.();
      loadProgress();
      loadLevel(0, true);
      authModal?.classList.add("hidden");
      setStatus("Đã chuyển sang chế độ Khách (không lưu tiến độ)", "warn");
    });
    els.achModal.addEventListener("click", (e) => {
      if (e.target === els.achModal) els.achModal.classList.add("hidden");
    });

    els.keyboardInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        let val = els.keyboardInput.value.trim();
        if (val.startsWith("=CONCAT(")) val = getSelectedString();
        if (state.mode === "connect") submitConnectWord(val);
        else if (state.mode === "merge") submitMergeKeyboard(val);
      }
    });

    document.addEventListener("keydown", (e) => {
      // Đang mở BXH: Esc đóng và ẩn màn hình; phím khác để ô nhập/nút trong bảng tự xử lý
      if (window.Leaderboard.isOpen()) {
        if (e.key === "Escape") {
          e.preventDefault();
          window.Leaderboard.close();
          toggleBossMode(true);
        }
        return;
      }
      // Đang mở quảng cáo: Esc đóng ngay và ẩn màn hình, phím khác không tác động vào game
      if (window.RewardedAd.isOpen()) {
        if (e.key === "Escape") {
          e.preventDefault();
          window.RewardedAd.cancel();
          toggleBossMode(true);
        }
        return;
      }
      const authModalEl = $("auth-modal");
      const legalModalEl = $("legal-modal");
      const anyModalOpen =
        !els.achModal.classList.contains("hidden") ||
        (authModalEl && !authModalEl.classList.contains("hidden")) ||
        (legalModalEl && !legalModalEl.classList.contains("hidden"));

      if (e.key === "Escape") {
        e.preventDefault();
        if (!els.achModal.classList.contains("hidden")) {
          els.achModal.classList.add("hidden");
        } else if (authModalEl && !authModalEl.classList.contains("hidden")) {
          authModalEl.classList.add("hidden");
        } else if (legalModalEl && !legalModalEl.classList.contains("hidden")) {
          legalModalEl.classList.add("hidden");
        } else {
          toggleBossMode();
        }
        return;
      }

      if (state.bossMode || anyModalOpen) return;

      if (e.key === "F2") {
        e.preventDefault();
        if (state.hintQuota > 0) triggerHint();
        else requestHintByAd();
        return;
      }

      if (document.activeElement === els.keyboardInput) return;

      if (e.key === " ") {
        e.preventDefault();
        $("btn-shuffle").click();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (state.mode === "connect") submitConnectWord(getSelectedString());
        else if (state.mode === "connections") submitConnectionsGroup();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (state.mode === "connect" && state.selectedIndices.length > 0) {
          state.selectedIndices.pop();
          redrawConnectLines();
          updateDraftWord();
        }
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (state.mode === "connect") handleLetterTypingFromKeyboard(e.key);
        else if (state.mode === "merge") els.keyboardInput.focus();
      }
    });
  }

  loadProgress();
  buildRowHeaders();
  applyTheme(state.theme);
  setupEvents();
  loadLevel(state.levelIndex);

  // Nhắc giữ chuỗi khi mở game mà hôm nay chưa chơi
  const daily = window.Engagement.getSummary();
  if (daily.streak > 0 && !daily.checkedIn) {
    // Không đè thông báo quà gợi ý vừa hiện lúc mở game
    const shown = els.formulaStatus.textContent;
    const reminder = `Giải 1 mục hôm nay để giữ chuỗi ${daily.streak} ngày`;
    setStatus(shown.includes("Quà mỗi ngày") ? `${shown} · ${reminder}` : reminder, "warn");
  }

  // Tự cập nhật: so phiên bản ĐANG CHẠY (?v của app.js) với ?v trong index.html mới nhất trên máy chủ.
  // So với mã đang chạy nên tab mở từ bản lưu tạm cũ vẫn nhận ra. Mỗi lần phát hành phải tăng ?v trong index.html.
  // Kiểm tra khi mở trang, quay lại tab và đổi Phiên (không chạy định kỳ).
  const runningVersion = new URL(document.currentScript.src).searchParams.get("v");
  let pendingVersion = null;
  let lastVersionCheckAt = 0;

  // Chỉ tải lại khi không làm mất gì đang dở (mỗi Phiên không lưu bàn dở)
  function canReloadNow() {
    if (window.RewardedAd.isOpen() || window.Leaderboard.isOpen()) return false;
    if (document.querySelector(".modal-backdrop:not(.hidden)")) return false;
    if (state.batchFailed || isBatchDone()) return true;
    return !(
      state.solvedTargets.size ||
      state.solvedPairs.size ||
      state.connSolvedLevels.length ||
      state.bonusWords.length ||
      state.mistakes ||
      state.usedHintInBatch
    );
  }

  function applyPendingUpdate() {
    if (!pendingVersion || !canReloadNow()) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("_v") === pendingVersion) return; // Đã thử tải bản này: tránh lặp vô hạn
    url.searchParams.set("_v", pendingVersion);
    saveProgress();
    window.location.replace(url.toString());
  }

  async function checkAppVersionUpdate() {
    if (pendingVersion) return applyPendingUpdate();
    const now = Date.now();
    if (!runningVersion || now - lastVersionCheckAt < 30000) return;
    lastVersionCheckAt = now;
    try {
      const res = await fetch(`./index.html?t=${now}`, { cache: "no-store" });
      if (!res.ok) return;
      const match = (await res.text()).match(/app\.js\?v=([\w.-]+)/);
      if (!match || match[1] === runningVersion) return;
      pendingVersion = match[1];
      applyPendingUpdate();
    } catch (_) {}
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkAppVersionUpdate();
  });
  document.addEventListener("levelloaded", () => checkAppVersionUpdate());
  checkAppVersionUpdate();
})();
