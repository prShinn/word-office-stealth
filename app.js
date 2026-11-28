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
  const FEVER_SECONDS = 20;
  const FEVER_EVERY = 5; // combo đạt bội số này thì vào Giờ cao điểm
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
    tierFilter: (function() { try { return localStorage.getItem("stealth_tier_filter") || "all"; } catch (_) { return "all"; } })(),
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
    timerEnabled: (() => {
      try {
        const saved = localStorage.getItem("bangchu_timer_enabled");
        return saved === null ? true : saved === "true";
      } catch (_) {
        return true;
      }
    })(),
    timeLeft: DEFAULT_TIME_LIMIT,
    timerId: null,
    timeoutResetId: null,
    timerWaiting: false,  // sau khi tự reset: chờ người dùng thao tác mới tính giờ

    // Economy & Persistence
    usedHintInBatch: false,
    fever: 0,             // số giây còn lại của Giờ cao điểm
    stars: {},            // { levelId: bitmask 3 mục tiêu sao đã đạt }
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
    tierSelect: $("tier-select"),
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
    btnToggleTimer: $("btn-toggle-timer"),
    btnToggleTimerText: $("btn-toggle-timer-text"),
    btnRetryBatch: $("btn-retry-batch"),
    btnRetryMerge: $("btn-retry-merge"),
    hudCombo: $("hud-combo"),
    hudMistakes: $("hud-mistakes"),
    hudTimer: $("hud-timer"),
    hudFever: $("hud-fever"),
    connTopicTitle: $("conn-topic-title"),
    connTierBadge: $("conn-tier-badge"),
    connProgressFill: $("conn-progress-fill"),
    connSolvedList: $("conn-solved-list"),
    connGrid: $("conn-grid"),
    btnConnSubmit: $("btn-conn-submit"),
    btnConnDeselect: $("btn-conn-deselect"),
    btnConnRetry: $("btn-conn-retry"),
    algoView: $("algo-view"),
    algoTopicTitle: $("algo-topic-title"),
    algoTierBadge: $("algo-tier-badge"),
    algoProblemDesc: $("algo-problem-desc"),
    algoCodeSnippet: $("algo-code-snippet"),
    algoQuestionText: $("algo-question-text"),
    algoOptionsList: $("algo-options-list"),
    btnAlgoSubmit: $("btn-algo-submit"),
    btnAlgoNext: $("btn-algo-next"),
    btnAlgoRetry: $("btn-algo-retry"),
    algoExplanationBox: $("algo-explanation-box"),
    algoExplainContent: $("algo-explain-content"),
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
    const gistAuth = window.GistSync?.getAuth?.();
    if (gistAuth && gistAuth.username) return gistAuth.username;
    try {
      const u = (localStorage.getItem(AUTH_KEY) || "").trim();
      return u || null;
    } catch (_) {
      return null;
    }
  }

  function updateAuthUI() {
    const gistAuth = window.GistSync?.getAuth?.();
    const user = gistAuth?.username || getAuthUser();
    const btnAuth = $("btn-auth");
    const saveStateEl = $("save-state");
    const authLoggedInView = $("auth-logged-in-view");
    const authGuestView = $("auth-guest-view");
    const avatarImg = $("github-user-avatar");
    const loginText = $("github-user-login");
    const gistStatus = $("github-gist-status");
    const btnViewGist = $("btn-view-gist");

    if (btnAuth) {
      if (gistAuth?.username) {
        btnAuth.textContent = `🐙 @${gistAuth.username}`;
        btnAuth.classList.add("active");
        btnAuth.title = `Đã kết nối GitHub Gist (@${gistAuth.username}) · Click để quản lý`;
      } else if (user) {
        btnAuth.textContent = `👤 ${user}`;
        btnAuth.classList.add("active");
        btnAuth.title = `Tài khoản: ${user} · Click để kết nối GitHub Gist`;
      } else {
        btnAuth.textContent = "Đăng nhập";
        btnAuth.classList.remove("active");
        btnAuth.title = "Đăng nhập GitHub Gist để lưu tiến độ đám mây";
      }
    }
    if (saveStateEl) {
      if (gistAuth?.username) {
        saveStateEl.textContent = `GitHub Gist: @${gistAuth.username} (Sync ✓)`;
      } else if (user) {
        saveStateEl.textContent = `Đã lưu (${user})`;
      } else {
        saveStateEl.textContent = "Chế độ Khách (Chưa lưu)";
      }
    }
    if (authLoggedInView && authGuestView) {
      if (gistAuth?.username) {
        authLoggedInView.classList.remove("hidden");
        authGuestView.classList.add("hidden");
        if (avatarImg && gistAuth.avatarUrl) avatarImg.src = gistAuth.avatarUrl;
        if (loginText) loginText.textContent = `@${gistAuth.username}`;
        if (gistStatus) gistStatus.textContent = `Private Gist: ${gistAuth.gistId ? gistAuth.gistId.slice(0, 10) + '...' : 'Tự động đồng bộ'}`;
        if (btnViewGist && gistAuth.gistUrl) btnViewGist.href = gistAuth.gistUrl;
      } else {
        authLoggedInView.classList.add("hidden");
        authGuestView.classList.remove("hidden");
      }
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
    state.stars = {};
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
      if (saved.tierFilter) state.tierFilter = saved.tierFilter;
      else {
        try { state.tierFilter = localStorage.getItem("stealth_tier_filter") || "all"; } catch (_) {}
      }
      if (saved.progress && typeof saved.progress === "object") state.progress = saved.progress;
      if (saved.stars && typeof saved.stars === "object") state.stars = saved.stars;
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
        tierFilter: state.tierFilter,
        progress: state.progress,
        stars: state.stars,
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
      if (window.GistSync?.isLoggedIn?.()) {
        window.GistSync.syncProgress(trimmed);
      }
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
    if (state.mode === "algo") {
      return window.ALGO_DATA?.ALGO_LEVELS || [];
    }
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
    els.btnDeadlineMode.disabled = !state.timerEnabled;
    els.btnDeadlineMode.title = state.timerEnabled
      ? "Bật/tắt Tăng tốc: thời gian còn một nửa, thưởng hoàn tất Phiên x1.5 KPI"
      : "Đang tắt đếm giờ · Bật đếm giờ để sử dụng Tăng tốc";

    if (els.btnToggleTimer) {
      els.btnToggleTimer.classList.toggle("off", !state.timerEnabled);
      if (els.btnToggleTimerText) {
        els.btnToggleTimerText.textContent = state.timerEnabled ? "⏱ Giờ: Bật" : "⏱ Tắt giờ (Max 2★)";
      }
      els.btnToggleTimer.title = state.timerEnabled
        ? "Bật/tắt tính thời gian (Tắt giờ: tối đa 2 sao/phiên)"
        : "Tính thời gian đang TẮT (Tối đa 2 sao/phiên). Click để bật lại";
    }

    els.hudTimer.classList.remove("hidden");
    if (!state.timerEnabled) {
      els.hudTimer.textContent = "⏱ Vô hạn";
      els.hudTimer.title = "Đã tắt tính thời gian (Tối đa 2 sao/phiên) · Click để bật lại";
      els.hudTimer.classList.remove("urgent");
      els.hudTimer.classList.add("hud-timer-off");
    } else {
      const mm = String(Math.floor(state.timeLeft / 60)).padStart(2, "0");
      const ss = String(state.timeLeft % 60).padStart(2, "0");
      els.hudTimer.textContent = `⏱ ${mm}:${ss}`;
      els.hudTimer.title = "Thời gian còn lại · Click để tắt tính thời gian";
      els.hudTimer.classList.remove("hud-timer-off");
      els.hudTimer.classList.toggle("urgent", state.timeLeft <= 15);
    }

    els.hudFever.classList.toggle("hidden", !state.fever);
    els.hudFever.textContent = `🔥 x2 KPI · ${state.fever}s`;
    renderStarGoals();
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
      els.btnHintText.textContent = "fx Tra cứu +1 gợi ý";
      els.btnHint.title = "Hết lượt gợi ý có sẵn · Bấm để tra cứu thêm gợi ý";
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
      setStatus("Chưa hoàn tất tra cứu dữ liệu", "warn");
      return;
    }
    state.hintQuota += 1;
    saveProgress();
    trackEvent("ad_hint_rewarded", { mode: state.mode, lang: state.lang });
    setStatus("Đã nhận +1 Gợi ý", "ok");
    updateStatsUI();
  }

  function matchesTier(tier, filter) {
    if (!filter || filter === "all") return true;
    if (filter === "Trung bình" || filter === "Thông thường") {
      return tier === "Trung bình" || tier === "Thông thường";
    }
    return tier === filter;
  }

  function getAdjacentLevelIndex(delta) {
    const levels = getLevels();
    if (!state.tierFilter || state.tierFilter === "all") {
      return (state.levelIndex + delta + levels.length) % levels.length;
    }
    const matchingIndices = levels
      .map((lvl, idx) => matchesTier(lvl.tier, state.tierFilter) ? idx : -1)
      .filter((idx) => idx !== -1);
    if (matchingIndices.length === 0) return 0;
    const curPos = matchingIndices.indexOf(state.levelIndex);
    if (curPos === -1) return matchingIndices[0];
    const nextPos = (curPos + delta + matchingIndices.length) % matchingIndices.length;
    return matchingIndices[nextPos];
  }

  function populateLevelDropdown() {
    const levels = getLevels();
    const dailyIdx = getDailyIndex(levels.length);
    if (els.tierSelect) {
      els.tierSelect.value = state.tierFilter || "all";
    }
    const filtered = [];
    levels.forEach((lvl, idx) => {
      if (!matchesTier(lvl.tier, state.tierFilter)) return;
      const mask = state.stars[lvl.id];
      const done = mask !== undefined ? ` ${starText(mask)}` : state.completedBatches.has(lvl.id) ? " ✓" : "";
      const star = idx === dailyIdx ? "◆ " : "";
      filtered.push(`<option value="${idx}">${star}${lvl.id} [${lvl.tier}]: ${lvl.topic}${done}</option>`);
    });
    els.levelSelect.innerHTML = filtered.join("");
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

  // ================= 3 SAO MỖI PHIÊN =================
  function getStarGoals() {
    const limit = getTimeLimit();
    const isTimerOff = !state.timerEnabled;
    const speedGoal = (bit, ratio) => ({
      bit,
      label: isTimerOff ? "Thời gian (Khóa khi tắt giờ)" : `Còn ≥ ${Math.round(ratio * 100)}% thời gian`,
      met: () => (!isTimerOff && state.timeLeft >= limit * ratio),
      locked: isTimerOff
    });
    if (state.mode === "algo") {
      return [
        { bit: 1, label: "Đúng ngay lần đầu", met: () => state.mistakes === 0 },
        speedGoal(2, 0.5),
        { bit: 4, label: "Hoàn tất giải đố", met: () => isBatchDone() }
      ];
    }
    return [
      { bit: 1, label: "Không sai lần nào", met: () => state.mistakes === 0 },
      speedGoal(2, 0.5),
      // 4x4 không có gợi ý nên thay bằng mốc tốc độ cao hơn (khi tắt giờ: thay bằng tối đa 1 lỗi sai)
      state.mode === "connections"
        ? (isTimerOff
            ? { bit: 4, label: "Tối đa 1 lỗi sai", met: () => state.mistakes <= 1 }
            : speedGoal(4, 0.7))
        : { bit: 4, label: "Không dùng gợi ý", met: () => !state.usedHintInBatch }
    ];
  }

  function starText(mask) {
    const count = [1, 2, 4].filter((bit) => mask & bit).length;
    return "★".repeat(count) + "☆".repeat(3 - count);
  }

  // Chỉ gọi khi hoàn tất Phiên; sao cộng dồn qua các lần chơi lại
  function earnStars(lvl) {
    const mask = getStarGoals().reduce((m, g) => (g.met() ? m | g.bit : m), 0);
    // Khi tắt tính thời gian: tuyệt đối loại trừ bit 2 (sao thời gian), tối đa đạt 2 sao/phiên
    const effectiveMask = state.timerEnabled ? mask : (mask & ~2);
    state.stars[lvl.id] = (state.stars[lvl.id] || 0) | effectiveMask;
    return starText(effectiveMask);
  }

  function renderStarGoals() {
    const lvl = getCurrentLevel();
    const earned = state.stars[lvl.id] || 0;
    const playing = !state.batchFailed && !isBatchDone();
    const isTimerOff = !state.timerEnabled;
    const starCount = (earned & 1 ? 1 : 0) + (earned & 2 ? 1 : 0) + (earned & 4 ? 1 : 0);
    const maxStars = isTimerOff ? 2 : 3;
    const displayCount = isTimerOff ? Math.min(starCount, 2) : starCount;
    const badgeHtml = `<span class="star-badge-summary"><span class="star-icon">⭐</span> ${displayCount}/${maxStars} SAO${isTimerOff ? ' (Tắt giờ)' : ''}</span>`;
    const goalsHtml = getStarGoals()
      .map((g) => {
        if (g.locked) {
          return `<span class="star-goal locked" title="Khóa khi tắt tính thời gian (Tối đa 2 sao/phiên)"><span class="star-icon">⊘</span> ${g.label}</span>`;
        }
        const got = Boolean(earned & g.bit);
        const missed = !got && (state.batchFailed || (playing && !g.met()));
        const cls = got ? "star-goal got" : missed ? "star-goal missed" : "star-goal";
        return `<span class="${cls}"><span class="star-icon">${got ? "★" : "☆"}</span> ${g.label}</span>`;
      })
      .join("");
    const html = `${badgeHtml}${goalsHtml}`;
    document.querySelectorAll(".star-goals").forEach((el) => {
      if (el.dataset.html === html) return;
      el.dataset.html = html;
      el.innerHTML = html;
    });
  }

  // ================= LỜI NHẮC CHƠI TIẾP =================
  function cheerCompletion(lvl) {
    const allStars = (state.stars[lvl.id] || 0) === 7;
    const levels = getLevels();
    const nextIdx = (state.levelIndex + 1) % levels.length;
    const quests = window.Engagement.getSummary().quests;
    const questLeft = quests.filter((q) => !q.done).length;
    const extra = [
      `Tiếp theo: ${levels[nextIdx].topic}`,
      questLeft ? `còn ${questLeft} nhiệm vụ ngày` : ""
    ].filter(Boolean).join(" · ");
    window.Troll.say(allStars ? "done" : "doneNoStar", {
      extra,
      action: allStars
        ? { label: "Làm phiên tiếp ▶", run: () => loadLevel(nextIdx, true) }
        : { label: "Làm lại lấy đủ sao ↻", run: () => loadLevel(state.levelIndex, true) }
    });
  }

  // Gọi sau khi giải đúng 1 mục: báo khi chỉ còn đúng 1 mục
  function nudgeNearDone(lvl) {
    const total = state.mode === "connect" ? lvl.targets.length : state.mode === "merge" ? lvl.pairs.length : 4;
    const done =
      state.mode === "connect"
        ? state.solvedTargets.size
        : state.mode === "merge"
          ? state.solvedPairs.size
          : state.connSolvedLevels.length;
    if (total - done === 1) window.Troll.say("nearDone");
  }

  // ================= GIỜ CAO ĐIỂM =================
  // Gọi sau khi đã đánh dấu mục vừa giải, trước khi tính KPI
  function bumpCombo() {
    state.combo += 1;
    if (state.combo > state.maxComboEver) state.maxComboEver = state.combo;
    if (state.combo >= 5) unlockAchievement("combo_5");
    if (state.combo % FEVER_EVERY === 0 && !state.fever && !isBatchDone()) {
      state.fever = FEVER_SECONDS;
      document.body.classList.add("fever");
      state.notices.push(`🔥 Giờ cao điểm: x2 KPI trong ${FEVER_SECONDS}s`);
      window.Troll.say("fever");
    }
  }

  function endFever() {
    state.fever = 0;
    document.body.classList.remove("fever");
  }

  // ================= HIỆU ỨNG PHẢN HỒI =================
  function prefersReducedMotion() {
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }

  function replayClass(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // ép trình duyệt chạy lại animation
    el.classList.add(cls);
    el.addEventListener("animationend", () => el.classList.remove(cls), { once: true });
  }

  function spawnFx(className, text, x, y) {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = text;
    el.setAttribute("aria-hidden", "true");
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
    return el;
  }

  // Từ vừa giải "bay" từ vùng chơi sang dòng đối soát, kèm điểm nổi lên
  function celebrate(sourceEl, targetEl, label, pts) {
    replayClass(targetEl, "fx-flash");
    if (!sourceEl || prefersReducedMotion()) return;
    const from = sourceEl.getBoundingClientRect();
    const x = from.left + from.width / 2;
    const y = from.top + from.height / 2;
    if (pts) spawnFx(state.fever ? "fx-points fever-points" : "fx-points", `+${pts}`, x, y);
    if (!targetEl) return;
    const to = targetEl.getBoundingClientRect();
    const chip = spawnFx("fx-chip", label, x, y);
    chip.animate?.(
      [
        { transform: "translate(-50%, -50%)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${to.left + 90 - x}px), calc(-50% + ${to.top + to.height / 2 - y}px)) scale(0.8)`,
          opacity: 0.2
        }
      ],
      { duration: 550, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
    );
    setTimeout(() => chip.remove(), 560);
  }

  function shakeStage() {
    const stage =
      state.mode === "connect" ? els.wheelWrap : state.mode === "merge" ? els.mergeTilesGrid : els.connGrid;
    replayClass(stage, "fx-shake");
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

  function toggleTimerEnabled() {
    state.timerEnabled = !state.timerEnabled;
    try {
      localStorage.setItem("bangchu_timer_enabled", String(state.timerEnabled));
    } catch (_) {}
    if (!state.timerEnabled) {
      if (state.deadlineMode) state.deadlineMode = false;
      stopTimer();
      state.timeLeft = 9999;
      setStatus("Đã tắt tính thời gian · Tối đa 2 sao mỗi Phiên!", "warn");
    } else {
      setStatus("Đã bật lại tính thời gian · Có thể đạt tối đa 3 sao!", "ok");
      startTimer();
    }
    updateHudUI();
    renderStarGoals();
  }

  function startTimer() {
    stopTimer();
    state.timeLeft = state.timerEnabled ? getTimeLimit() : 9999;
    updateHudUI();
    if (state.batchFailed || isBatchDone()) return;

    state.timerId = setInterval(() => {
      if (state.batchFailed || isBatchDone() || isTimerPaused()) return;
      if (state.timerEnabled) {
        state.timeLeft -= 1;
      }
      if (state.fever > 0) {
        state.fever -= 1;
        if (!state.fever) endFever();
      }
      updateHudUI();
      if (state.timerEnabled && state.timeLeft <= 0) {
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
    if (!lvl) return false;
    if (state.mode === "algo") return state.completedBatches.has(lvl.id);
    if (state.mode === "connect") return state.solvedTargets.size === lvl.targets.length;
    if (state.mode === "merge") return state.solvedPairs.size === lvl.pairs.length;
    return state.connSolvedLevels.length === 4;
  }

  function registerMistake(msg) {
    state.combo = 0;
    state.mistakes += 1;
    endFever();
    shakeStage();
    updateHudUI();
    if (state.mistakes >= state.maxMistakes) {
      failCurrentBatch(`${msg} — Đã quá giới hạn ${state.maxMistakes} lỗi!`);
    } else {
      window.Troll.say(state.mistakes === state.maxMistakes - 1 ? "danger" : "mistake");
      setStatus(`${msg} (Lỗi ${state.mistakes}/${state.maxMistakes})`, "err");
      saveProgress();
    }
  }

  function failCurrentBatch(reason) {
    state.batchFailed = true;
    state.streak = 0;
    stopTimer();
    endFever();
    window.Troll.say(state.timeLeft <= 0 ? "timeout" : "fail");
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
      let totalInter = 0;
      // Lặp đến khi không móc nối thêm được từ nào nữa
      let progress = true;
      while (progress && remaining.length > 0) {
        progress = false;
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
          if (best) {
            put(w, best.r, best.c, best.dir);
            totalInter += best.inter;
            progress = true;
          } else {
            nextRemaining.push(w);
          }
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

        const isGolden = cellData.owners && cellData.owners.length >= 2;
        const solvedOwner = cellData.owners.find((o) => state.solvedTargets.has(o.word));
        const hintedOwner = cellData.owners.find(
          (o) => (state.revealedHints[o.word] || 0) > o.charIndex
        );
        const focusedOwner = cellData.owners.find((o) => o.word === state.focusedTargetKey);

        div.className = "cw-cell box";
        if (isGolden) div.classList.add("golden");
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

  // ================= ALGORITHM QUIZ MODE =================
  state.selectedAlgoOption = null;

  function renderAlgoLevel(lvl) {
    if (!els.algoView || !lvl) return;
    if (els.algoTopicTitle) els.algoTopicTitle.textContent = `Thuật toán: ${lvl.topic}`;
    if (els.algoTierBadge) updateTierBadge(els.algoTierBadge, lvl.tier || "Cơ bản");
    if (els.algoProblemDesc) els.algoProblemDesc.textContent = lvl.problem || "";
    if (els.algoCodeSnippet) els.algoCodeSnippet.textContent = lvl.snippet || "";
    if (els.algoQuestionText) els.algoQuestionText.textContent = lvl.question || "";
    state.selectedAlgoOption = null;
    if (els.btnAlgoSubmit) els.btnAlgoSubmit.disabled = true;

    const isSolved = state.completedBatches.has(lvl.id);
    if (els.btnAlgoNext) els.btnAlgoNext.classList.toggle("hidden", !isSolved);
    if (els.btnAlgoRetry) els.btnAlgoRetry.classList.add("hidden");
    if (els.algoExplanationBox) els.algoExplanationBox.classList.toggle("hidden", !isSolved);
    if (els.algoExplainContent) els.algoExplainContent.textContent = lvl.explanation || "";

    if (els.algoOptionsList) {
      els.algoOptionsList.innerHTML = "";
      (lvl.options || []).forEach((optText, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "algo-opt-btn";
        btn.dataset.idx = String(idx);
        btn.textContent = optText;
        if (isSolved && idx === lvl.correctIndex) {
          btn.classList.add("correct");
        }
        btn.addEventListener("click", () => {
          if (state.batchFailed || isBatchDone()) return;
          document.querySelectorAll(".algo-opt-btn").forEach((b) => b.classList.remove("selected"));
          btn.classList.add("selected");
          state.selectedAlgoOption = idx;
          if (els.btnAlgoSubmit) els.btnAlgoSubmit.disabled = false;
        });
        els.algoOptionsList.appendChild(btn);
      });
    }
  }

  function submitAlgoAnswer() {
    if (state.selectedAlgoOption === null || state.batchFailed) return;
    const lvl = getCurrentLevel();
    if (!lvl) return;
    const idx = state.selectedAlgoOption;
    const buttons = document.querySelectorAll(".algo-opt-btn");

    if (idx === lvl.correctIndex) {
      if (buttons[idx]) buttons[idx].classList.add("correct");
      if (els.btnAlgoSubmit) els.btnAlgoSubmit.disabled = true;
      if (els.algoExplanationBox) els.algoExplanationBox.classList.remove("hidden");
      if (els.algoExplainContent) els.algoExplainContent.textContent = lvl.explanation;
      if (els.btnAlgoNext) els.btnAlgoNext.classList.remove("hidden");
      if (els.btnAlgoRetry) els.btnAlgoRetry.classList.add("hidden");

      if (!state.completedBatches.has(lvl.id)) {
        state.completedBatches.add(lvl.id);
        state.streak += 1;
        const bonus = lvl.tier === "Nâng cao" ? 120 : lvl.tier === "Trung bình" ? 90 : 60;
        state.score += bonus;
        bumpCombo();
        const roundStars = earnStars(lvl);
        setStatus(`Chính xác! (+${bonus} KPI) · ${roundStars}`, "ok");
        saveProgress();
        populateLevelDropdown();
        updateStatsUI();
        cheerCompletion(lvl);
      } else {
        setStatus("Chính xác! Bạn đã hoàn thành câu hỏi này trước đó.", "ok");
      }
    } else {
      if (buttons[idx]) buttons[idx].classList.add("wrong");
      registerMistake(`Đáp án ${String.fromCharCode(65 + idx)} chưa chính xác!`);
      if (els.btnAlgoRetry) els.btnAlgoRetry.classList.remove("hidden");
      if (els.algoExplanationBox) els.algoExplanationBox.classList.remove("hidden");
      if (els.algoExplainContent) els.algoExplainContent.textContent = "💡 Gợi ý: " + (lvl.hint || lvl.explanation);
    }
  }

  // ================= LOAD LEVEL =================
  function loadLevel(index, fresh) {
    const levels = getLevels();
    state.levelIndex = (index + levels.length) % levels.length;
    if (state.tierFilter && state.tierFilter !== "all") {
      const cur = levels[state.levelIndex];
      if (cur && !matchesTier(cur.tier, state.tierFilter)) {
        const matchIdx = levels.findIndex((lvl) => matchesTier(lvl.tier, state.tierFilter));
        if (matchIdx !== -1) {
          state.levelIndex = matchIdx;
        }
      }
    }
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
      if (state.mode === "merge") {
        // Bốc lại bộ cặp mới từ kho mở rộng của phiên, ưu tiên cặp chưa gặp lượt trước
        const mergePack = state.lang === "en" ? window.EN_DATA : window.VI_DATA;
        const curMerge = levels[state.levelIndex];
        if (curMerge && mergePack && typeof mergePack.reshuffleMergeLevel === "function") {
          mergePack.reshuffleMergeLevel(curMerge.id, (curMerge.pairs || []).map((p) => p[2]));
        }
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
    state.claimedGoldenCells = new Set();
    state.hadBossInspection = false;
    state.bossAlertActive = false;
    const oldBossBanner = $("boss-inspection-banner");
    if (oldBossBanner) oldBossBanner.remove();
    state.selectedTileId = null;
    state.solvedPairs = new Set();
    state.connSelected = [];
    state.connSolvedLevels = [];
    state.mistakes = 0;
    state.maxMistakes = state.mode === "connections" ? 3 : state.mode === "merge" ? 4 : 5;
    state.batchFailed = false;
    state.usedHintInBatch = false;
    endFever();
    window.Troll.dismiss();
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

    if (state.mode === "algo") {
      els.standardGrid?.classList.add("hidden");
      els.connectionsView?.classList.add("hidden");
      els.algoView?.classList.remove("hidden");
      renderAlgoLevel(lvl);
    } else if (state.mode === "connections") {
      els.standardGrid?.classList.add("hidden");
      els.connectionsView?.classList.remove("hidden");
      els.algoView?.classList.add("hidden");
      els.connTopicTitle.textContent = `Chủ đề: ${lvl.topic}`;
      updateTierBadge(els.connTierBadge, lvl.tier);
      const flat = [];
      lvl.groups.forEach((g) => {
        g.words.forEach((w) => flat.push({ word: w, level: g.level, title: g.title }));
      });
      state.connTiles = shuffleArray(flat);
      renderConnections();
    } else {
      els.standardGrid?.classList.remove("hidden");
      els.connectionsView?.classList.add("hidden");
      els.algoView?.classList.add("hidden");
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
  function getNodeLayout(total) {
    const rawW = els.wheelWrap ? els.wheelWrap.clientWidth : 320;
    const width = Math.max(280, Math.min(360, rawW || 320));
    if (total >= 10) {
      const cols = total > 24 ? 6 : (total > 16 ? 5 : 4);
      const rows = Math.ceil(total / cols);
      const stepX = Math.min(72, Math.floor((width - 16) / cols));
      const stepY = Math.min(total > 12 ? 54 : 70, Math.max(38, Math.floor(236 / rows)));
      const height = Math.max(250, rows * stepY + 16);
      const size = Math.max(30, Math.min(52, Math.min(stepX, stepY) - 5));
      return { width, height, cols, rows, stepX, stepY, size };
    }
    const height = 250;
    if (total >= 7) {
      const cols = 3;
      const rows = Math.ceil(total / cols);
      const stepX = Math.min(80, Math.floor((width - 24) / cols));
      return { width, height, cols, rows, stepX, stepY: 76, size: 52 };
    }
    const radius = Math.min(94, Math.floor(width / 2) - 34);
    return { width, height, cols: total, rows: 1, stepX: 72, stepY: 72, size: 54, radius };
  }

  function getNodePosition(idx, total) {
    const layout = getNodeLayout(total);
    const cx = layout.width / 2;
    const cy = layout.height / 2;

    if (total >= 7) {
      const col = idx % layout.cols;
      const row = Math.floor(idx / layout.cols);
      return {
        x: Math.round(cx - ((layout.cols - 1) * layout.stepX) / 2 + col * layout.stepX),
        y: Math.round(cy - ((layout.rows - 1) * layout.stepY) / 2 + row * layout.stepY)
      };
    }

    const radius = layout.radius || (total <= 5 ? 88 : 94);
    const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle))
    };
  }

  function renderConnectWheel() {
    els.nodesLayer.innerHTML = "";
    const total = state.letters.length;
    const layout = getNodeLayout(total);
    els.wheelWrap.style.height = layout.height + "px";
    const half = Math.round(layout.size / 2);
    const fontSize = layout.size <= 38 ? 15 : layout.size <= 46 ? 17 : 19;
    state.letters.forEach((ch, idx) => {
      const pos = getNodePosition(idx, total);
      const node = document.createElement("div");
      node.className = "letter-node";
      node.dataset.index = String(idx);
      node.textContent = ch;
      node.style.left = pos.x + "px";
      node.style.top = pos.y + "px";
      node.style.width = layout.size + "px";
      node.style.height = layout.size + "px";
      node.style.marginLeft = -half + "px";
      node.style.marginTop = -half + "px";
      node.style.fontSize = fontSize + "px";
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
    const mult = getComboMultiplier() * (isCurrentDaily() ? 2 : 1) * (state.fever ? 2 : 1);
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
    let entry = dict[wordKey];

    // Với Tiếng Việt: nếu từ ghép chưa có sẵn trong DICT nhưng tách được thành 2 tiếng đơn hợp lệ trong DICT -> vẫn nhận Extra Ref
    if (!entry && state.lang === "vi" && wordKey.length >= 4) {
      for (let i = 2; i <= wordKey.length - 2; i++) {
        const p1 = wordKey.slice(0, i);
        const p2 = wordKey.slice(i);
        if (dict[p1] && dict[p2]) {
          entry = { word: `${p1} ${p2}`, meaning: "Từ ghép Tiếng Việt hợp lệ" };
          break;
        }
      }
    }

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
      bumpCombo();

      // Thưởng Ô Chữ Vàng (Giao điểm giữa các từ)
      state.claimedGoldenCells = state.claimedGoldenCells || new Set();
      let goldenBonus = 0;
      const coords = state.crossword?.placements?.[wordKey]?.coords || [];
      coords.forEach(([r, c]) => {
        const cell = state.crossword.cells[r]?.[c];
        if (cell && cell.owners.length >= 2) {
          const k = `${r},${c}`;
          if (!state.claimedGoldenCells.has(k)) {
            state.claimedGoldenCells.add(k);
            goldenBonus += 25;
          }
        }
      });
      if (goldenBonus > 0) {
        state.score += goldenBonus;
      }

      const pts = awardOnce(lvl, wordKey, wordKey.length * 10);
      const goldenNote = goldenBonus > 0 ? ` · ✨ Ô Vàng +${goldenBonus} KPI!` : "";
      setStatus(`OK: ${kpiNote(pts)}${goldenNote} (Combo ${state.combo})`, "ok");
      trackEngagement("answer", { combo: state.combo });
      renderCrosswordGrid();
      renderTargetsTable();
      celebrate(els.draftWord, els.targetsTbody.children[lvl.targets.indexOf(wordKey)], wordKey.toUpperCase(), pts);
      nudgeNearDone(lvl);
      checkBossInspection();
      checkBatchCompletion(lvl);
      updateStatsUI();
      return;
    }

    if (state.bonusWords.some((b) => b.key === wordKey)) {
      setStatus(`Extra Ref "${wordKey.toUpperCase()}" đã ghi nhận`, "warn");
      return;
    }

    state.bonusWords.unshift(makeBonusEntry(wordKey));
    bumpCombo();
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
    celebrate(els.draftWord, els.bonusList.firstElementChild, wordKey.toUpperCase(), pts);
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
    const roundStars = earnStars(lvl);
    endFever();
    saveProgress();
    populateLevelDropdown();
    showRetryButtons();
    setStatus(`${msg} · ${roundStars}`, "ok");
    cheerCompletion(lvl);
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
    let pts = 0;
    if (byHint) {
      // Gợi ý: không KPI, không combo; mục này cũng không được trả thưởng về sau
      claimReward(lvl, `p${pairIdx}`);
    } else {
      bumpCombo();

      pts = awardOnce(lvl, `p${pairIdx}`, 20);
      setStatus(`OK: "${pair[2]}" (${kpiNote(pts)})`, "ok");
      trackEngagement("answer", { combo: state.combo });
    }
    renderMergeTiles();
    renderTargetsTable();
    celebrate(els.mergePreview, els.targetsTbody.children[pairIdx], pair[2], pts);
    if (!byHint) nudgeNearDone(lvl);
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
      bumpCombo();
      const pts = awardOnce(lvl, `g${topLevel}`, topLevel * 25);
      setStatus(`Chuẩn nhóm! ${kpiNote(pts)}`, "ok");
      trackEngagement("answer", { combo: state.combo });
      renderConnections();
      const banner = els.connSolvedList.lastElementChild;
      celebrate(els.btnConnSubmit, banner, `Nhóm ${state.connSolvedLevels.length}/4`, pts);
      nudgeNearDone(lvl);
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

  function sanitizeClueMeaning(meaningText, wordKey, topic, entryWord, forbiddenWords = []) {
    if (!meaningText) return topic ? `Chủ đề: ${topic}` : "";
    let firstSense = String(meaningText).split(/[\/;]/)[0].trim().replace(/\([^\)]*\)/g, "").trim();

    // Loại bỏ cụm từ trùng với bất kỳ đáp án nào đang có trong đề bài
    if (Array.isArray(forbiddenWords) && forbiddenWords.length > 0) {
      for (const fw of forbiddenWords) {
        if (!fw || fw.length < 2) continue;
        const fwNorm = normalizeForClueCheck(fw);
        if (!fwNorm) continue;
        const words = firstSense.split(/\s+/);
        for (let len = Math.min(3, words.length); len >= 1; len--) {
          for (let start = 0; start <= words.length - len; start++) {
            const sub = words.slice(start, start + len).join(" ");
            if (normalizeForClueCheck(sub) === fwNorm) {
              words.splice(start, len);
              start--;
            }
          }
        }
        firstSense = words.join(" ").trim();
      }
    }

    const normKey = normalizeForClueCheck(wordKey);
    const syllables = new Set();
    if (entryWord) {
      String(entryWord).split(/\s+/).forEach((p) => {
        const np = normalizeForClueCheck(p);
        if (np && np.length >= 2) syllables.add(np);
      });
    }
    if (normKey) syllables.add(normKey);

    const tokens = firstSense.split(/\s+/).filter(Boolean);
    const cleaned = [];
    for (const tok of tokens) {
      const n = normalizeForClueCheck(tok);
      let isMatch = false;
      for (const syl of syllables) {
        if (syl.length >= 2 && (n === syl || (syl.length >= 4 && n.includes(syl)))) {
          isMatch = true;
          break;
        }
      }
      if (!isMatch) {
        cleaned.push(tok);
      }
    }

    if (cleaned.length === 0) {
      return topic ? `Chủ đề: ${topic}` : "Gợi mở liên quan";
    }

    // Rút gọn gợi ý vừa vặn, gợi mở ngữ cảnh nhưng không lộ đáp án
    const maxWords = cleaned.length >= 4 ? 2 : (cleaned.length >= 3 ? 2 : cleaned.length);
    let slice = cleaned.slice(0, maxWords).join(" ").trim();
    if (tokens.length > maxWords && !slice.endsWith("...")) {
      slice += "...";
    }
    return slice;
  }

  function renderTargetsTable() {
    const lvl = getCurrentLevel();
    els.targetsTbody.innerHTML = "";

    if (state.mode === "connect") {
      const dict = state.lang === "en" ? window.EN_DATA.DICT : window.VI_DATA.DICT;
      const forbiddenWords = lvl.targets.flatMap((w) => {
        const e = dict[w];
        return e && e.word ? [w, e.word] : [w];
      });
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
          const senses = String(meaningText || "")
            .split("/")
            .map((s) => s.trim())
            .filter(Boolean);
          const meaningTags = senses.length > 1
            ? senses.map((s) => `<span class="meaning-chip">${escapeHtml(s)}</span>`).join("")
            : `<span class="solved-meaning">${escapeHtml(meaningText)}</span>`;
          wordCellHtml = `<span class="solved-word">✓ ${escapeHtml(displayWord)}</span>`;
          statusHtml = `<span class="badge-status badge-ok">Verified</span>`;
          meaningHtml = `<span class="solved-meta">${dirLabel} · ${wordKey.length}c</span> ${meaningTags}`;
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
          const lenUnit = state.lang === "en" ? "ký tự" : "chữ";
          const meaningText = state.lang === "en" ? entry : entry?.meaning;
          const entryWord = state.lang === "en" ? wordKey : entry?.word;
          const subtleClue = sanitizeClueMeaning(meaningText, wordKey, lvl.topic, entryWord, forbiddenWords);
          const clueText = subtleClue ? ` · Gợi ý: ${escapeHtml(subtleClue)}` : "";
          meaningHtml = `<span class="masked-word">${dirLabel} · ${wordKey.length} ${lenUnit}${clueText}</span>`;
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
          ? `<span class="solved-word">✓ ${escapeHtml(pair[2])}</span>`
          : `<span class="masked-word">[ ? ] + [ ? ]</span>`;
        const statusHtml = solved
          ? `<span class="badge-status badge-ok">Matched</span>`
          : `<span class="badge-status badge-pending">Pending</span>`;
        const subtleClue = sanitizeClueMeaning(pair[3], pair[2], lvl.topic, pair[2]);
        const meaningHtml = solved
          ? `<span class="solved-formula">${escapeHtml(pair[0])} + ${escapeHtml(pair[1])}</span> <span class="solved-meaning">${escapeHtml(pair[3])}</span>`
          : `<span class="masked-word">Gợi ý: ${escapeHtml(subtleClue || "—")}</span>`;

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
    // F2 không tự mở modal, tránh bật nhầm
    setStatus('Hết lượt gợi ý · Bấm nút "Tra cứu +1 gợi ý" trên thanh công cụ', "warn");
    return false;
  }

  function triggerHint() {
    if (state.batchFailed || state.mode === "connections") return;
    const lvl = getCurrentLevel();
    if (!lvl) return;

    if (state.mode === "algo") {
      if (!consumeHint()) return;
      state.usedHintInBatch = true;
      if (els.algoExplanationBox) els.algoExplanationBox.classList.remove("hidden");
      if (els.algoExplainContent) els.algoExplainContent.textContent = "💡 Gợi ý giải: " + (lvl.hint || lvl.explanation);
      setStatus(`Đã mở gợi ý giải thuật toán (còn ${state.hintQuota} lượt)`, "warn");
      return;
    }

    if (state.mode === "connect") {
      const targetWord =
        state.focusedTargetKey && !state.solvedTargets.has(state.focusedTargetKey)
          ? state.focusedTargetKey
          : lvl.targets.find((w) => !state.solvedTargets.has(w));
      if (!targetWord) return;

      if (!consumeHint()) return;
      state.usedHintInBatch = true;
      window.Troll.say("hint");

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
      window.Troll.say("hint");

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

      const itAlgo = window.ALGO_DATA?.ALGO_LEVELS || [];
      const countDone = (list) => list.filter((l) => state.completedBatches.has(l.id)).length;
      const rows = [
        { label: "Nối chữ (EN + VI)", done: countDone(enConn) + countDone(viConn), total: enConn.length + viConn.length },
        { label: "Ghép từ (EN + VI)", done: countDone(enMerge) + countDone(viMerge), total: enMerge.length + viMerge.length },
        { label: "Phân nhóm 4x4 (EN + VI)", done: countDone(enGrp) + countDone(viGrp), total: enGrp.length + viGrp.length },
        { label: "IT Thuật toán", done: countDone(itAlgo), total: itAlgo.length }
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

  // ================= BOSS INSPECTION EVENT (SẾP ĐI TUẦN) =================
  function checkBossInspection() {
    if (state.bossAlertActive || state.bossMode || state.batchFailed || isBatchDone() || state.hadBossInspection) return;
    if (state.solvedTargets.size >= 2 && Math.random() < 0.45) {
      state.hadBossInspection = true;
      triggerBossInspection();
    }
  }

  function triggerBossInspection() {
    state.bossAlertActive = true;
    const banner = document.createElement("div");
    banner.id = "boss-inspection-banner";
    banner.className = "boss-inspection-banner";
    banner.innerHTML = `<span>🚨 <strong>SẾP ĐI TUẦN!</strong> Nhấn <strong>Esc</strong> (Xem Báo Cáo) ngay: <strong id="boss-countdown">4</strong>s</span>`;
    document.body.appendChild(banner);

    let left = 4;
    const cd = banner.querySelector("#boss-countdown");
    const interval = setInterval(() => {
      left--;
      if (cd) cd.textContent = String(left);
      if (left <= 0 || state.bossMode) {
        clearInterval(interval);
        state.bossAlertActive = false;
        banner.remove();
        if (state.bossMode) {
          state.escapedBoss = true;
        } else {
          setStatus("👁 Sếp vừa liếc qua bàn làm việc! Nhớ tập trung nhé!", "warn");
        }
      }
    }, 1000);
  }

  function toggleBossMode(force) {
    state.bossMode = typeof force === "boolean" ? force : !state.bossMode;
    els.bossScreen.classList.toggle("hidden", !state.bossMode);
    els.mainWorkspace.classList.toggle("hidden", state.bossMode);
    $("btn-panic").textContent = state.bossMode ? "Quay lại (Esc)" : "Xem Báo Cáo (Esc)";
    if (state.bossMode) {
      window.Troll.dismiss();
      if (state.bossAlertActive) {
        state.escapedBoss = true;
        state.bossAlertActive = false;
        const b = $("boss-inspection-banner");
        if (b) b.remove();
      }
    } else {
      window.Troll.say("bossBack");
      if (state.escapedBoss) {
        state.escapedBoss = false;
        state.score += 50;
        setStatus("✓ Đã né Sếp thành công! Thưởng: +50 KPI (Nhân viên gương mẫu)", "ok");
        updateStatsUI();
      }
    }
  }

  function updateTrollButtonUI() {
    const on = window.Troll.isEnabled();
    const btn = $("btn-troll");
    btn.textContent = on ? "😜 Troll: Bật" : "😶 Troll: Tắt";
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
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

    $("btn-troll").addEventListener("click", () => {
      window.Troll.setEnabled(!window.Troll.isEnabled());
      updateTrollButtonUI();
    });

    if (els.btnToggleTimer) {
      els.btnToggleTimer.addEventListener("click", toggleTimerEnabled);
    }
    if (els.hudTimer) {
      els.hudTimer.addEventListener("click", toggleTimerEnabled);
    }

    els.btnDeadlineMode.addEventListener("click", () => {
      if (!state.timerEnabled) {
        setStatus("Vui lòng bật tính thời gian để sử dụng chế độ Tăng tốc!", "warn");
        return;
      }
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

    $("btn-prev-level").addEventListener("click", () => loadLevel(getAdjacentLevelIndex(-1), true));
    $("btn-next-level").addEventListener("click", () => loadLevel(getAdjacentLevelIndex(1), true));

    if (els.tierSelect) {
      els.tierSelect.addEventListener("change", (e) => {
        state.tierFilter = e.target.value;
        try { localStorage.setItem("stealth_tier_filter", state.tierFilter); } catch (_) {}
        const levels = getLevels();
        const curLvl = levels[state.levelIndex];
        if (state.tierFilter !== "all" && curLvl && !matchesTier(curLvl.tier, state.tierFilter)) {
          const firstMatch = levels.findIndex((lvl) => matchesTier(lvl.tier, state.tierFilter));
          if (firstMatch !== -1) {
            loadLevel(firstMatch, true);
            return;
          }
        }
        populateLevelDropdown();
      });
    }

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
    const githubPatInput = $("github-pat-input");
    const btnSubmitAuth = $("btn-submit-auth");
    const btnContinueGuest = $("btn-continue-guest");
    const btnManualSync = $("btn-manual-sync");
    const btnLogout = $("btn-logout");

    $("btn-auth")?.addEventListener("click", () => {
      updateAuthUI();
      authModal?.classList.remove("hidden");
      if (githubPatInput && !window.GistSync?.getAuthUser?.()) {
        githubPatInput.focus();
      }
    });
    $("btn-close-auth")?.addEventListener("click", () => {
      authModal?.classList.add("hidden");
    });
    btnContinueGuest?.addEventListener("click", () => {
      authModal?.classList.add("hidden");
      setStatus("Tiếp tục ở Chế độ Khách (Chưa đăng nhập)", "ok");
    });

    authForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = (githubPatInput?.value || "").trim();
      if (!token) {
        setStatus("Vui lòng nhập GitHub Personal Access Token (scope gist)", "err");
        return;
      }
      if (btnSubmitAuth) {
        btnSubmitAuth.disabled = true;
        btnSubmitAuth.textContent = "Đang kết nối GitHub...";
      }
      try {
        const result = await window.GistSync.connectWithToken(token);
        if (result && result.remoteData) {
          const remoteData = result.remoteData;
          if (typeof remoteData.score === "number") state.score = Math.max(state.score, remoteData.score);
          if (typeof remoteData.streak === "number") state.streak = Math.max(state.streak, remoteData.streak);
          if (remoteData.stars && typeof remoteData.stars === "object") state.stars = { ...state.stars, ...remoteData.stars };
          if (Array.isArray(remoteData.completedBatches)) {
            remoteData.completedBatches.forEach((b) => state.completedBatches.add(b));
          }
        }
        saveProgress();
        updateAuthUI();
        updateStatsUI();
        populateLevelDropdown();
        authModal?.classList.add("hidden");
        setStatus(`Đã kết nối GitHub Gist: @${result.auth.username}! Tự động đồng bộ tiến độ.`, "ok");
      } catch (err) {
        setStatus(`Lỗi kết nối GitHub: ${err.message}`, "err");
      } finally {
        if (btnSubmitAuth) {
          btnSubmitAuth.disabled = false;
          btnSubmitAuth.textContent = "Kết nối Gist";
        }
      }
    });

    btnManualSync?.addEventListener("click", async () => {
      setStatus("Đang đồng bộ lên GitHub Gist...", "");
      saveProgress();
      setStatus("Đã gửi yêu cầu đồng bộ lên GitHub Gist thành công!", "ok");
    });

    btnLogout?.addEventListener("click", () => {
      window.GistSync?.logout?.();
      try { localStorage.removeItem(AUTH_KEY); } catch (_) {}
      updateAuthUI();
      authModal?.classList.add("hidden");
      setStatus("Đã ngắt kết nối GitHub và quay về Chế độ Khách", "warn");
    });

    // ALGORITHM MODE ACTIONS
    els.btnAlgoSubmit?.addEventListener("click", submitAlgoAnswer);
    els.btnAlgoNext?.addEventListener("click", () => {
      loadLevel(getAdjacentLevelIndex(1), true);
    });
    els.btnAlgoRetry?.addEventListener("click", () => {
      loadLevel(state.levelIndex, true);
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
      // Đang mở popup tra cứu dữ liệu: Esc đóng ngay và ẩn màn hình, phím khác không tác động vào game
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

  const isModalOpen = () => Boolean(document.querySelector(".modal-backdrop:not(.hidden)"));
  window.Troll.init({
    isBlocked: () => state.bossMode || document.hidden || isModalOpen() || Boolean(window.RewardedAd?.isOpen?.()) || Boolean(window.Leaderboard?.isOpen?.()),
    canIdle: () => !state.batchFailed && !isBatchDone()
  });
  updateTrollButtonUI();

  // Nhắc giữ chuỗi khi mở game mà hôm nay chưa chơi
  const daily = window.Engagement.getSummary();
  window.Troll.say("welcome", {
    extra: daily.streak > 0 ? `Chuỗi ${daily.streak} ngày · kỷ lục ${daily.best} ngày` : ""
  });
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

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (state.mode === "connect") renderConnectWheel();
    }, 120);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkAppVersionUpdate();
  });
  document.addEventListener("levelloaded", () => checkAppVersionUpdate());
  checkAppVersionUpdate();
})();
