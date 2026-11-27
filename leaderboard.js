// Giao diện BXH thời gian ghép. Cần máy chủ (server/); chơi thường vẫn offline.
// Mọi dữ liệu động đều gán bằng textContent (biệt danh do người dùng nhập).
window.Leaderboard = (function () {
  const AUTH_KEY = "bangchu_bxh_v1";
  const TIMEOUT_MS = 10000;

  let overlay = null;
  let body = null;
  let auth = loadAuth();
  let lang = "vi";
  let run = null;
  let selected = null;
  let timerId = null;
  let busy = false;
  let renderId = 0; // bỏ kết quả của màn hình đã rời đi

  function loadAuth() {
    try {
      const saved = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
      return saved && typeof saved.token === "string" ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function setAuth(next) {
    auth = next;
    try {
      if (next) localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      else localStorage.removeItem(AUTH_KEY);
    } catch (_) {}
  }

  async function api(method, path, payload) {
    const headers = {};
    if (auth) headers.authorization = `Bearer ${auth.token}`;
    if (method !== "GET") headers["content-type"] = "application/json";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    let data;
    try {
      res = await fetch(path, {
        method,
        headers,
        body: method === "GET" ? undefined : JSON.stringify(payload || {}),
        signal: controller.signal
      });
      data = await res.json();
    } catch (_) {
      throw Object.assign(new Error("Không kết nối được máy chủ BXH"), { code: "OFFLINE" });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      const error = data.error || {};
      throw Object.assign(new Error(error.message || "Lỗi máy chủ"), { code: error.code, status: res.status });
    }
    return data;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(label, onClick, ghost) {
    const node = el("button", "office-btn" + (ghost ? " ghost" : ""), label);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function row(...children) {
    const node = el("div", "bxh-row");
    node.append(...children);
    return node;
  }

  const formatTime = (ms) => `${(ms / 1000).toFixed(1)}s`;

  function screen(...children) {
    if (!body) return -1; // bảng đã đóng trong lúc chờ máy chủ
    stopTimer();
    renderId += 1;
    body.replaceChildren(...children);
    return renderId;
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }

  // Gọi API từ nút bấm: chặn bấm trùng, xử lý lỗi tập trung
  async function act(message, task) {
    if (busy) return;
    busy = true;
    try {
      await task();
    } catch (error) {
      if (error.status === 401 && error.code === "UNAUTHORIZED") {
        setAuth(null);
        if (overlay) showAuth(error.message);
      } else if (message && message.isConnected) {
        message.textContent = error.message;
      }
    } finally {
      busy = false;
    }
  }

  // ---------- Đăng ký / khôi phục ----------
  function showAuth(notice) {
    const message = el("div", "bxh-msg", notice || "");
    const name = el("input", "bxh-input");
    name.placeholder = "Biệt danh (3-20 ký tự, đừng dùng tên thật)";
    name.maxLength = 20;
    const code = el("input", "bxh-input");
    code.placeholder = "Mã khôi phục (chỉ khi đã có tài khoản)";
    code.maxLength = 24;

    const create = () =>
      act(message, async () => {
        const data = await api("POST", "/api/register", { nickname: name.value });
        // Giữ mã tới khi người chơi xác nhận đã lưu, kể cả khi bảng bị đóng giữa chừng
        setAuth({ token: data.token, nickname: data.nickname, pendingCode: data.recoveryCode });
        showHome();
      });
    const restore = () =>
      act(message, async () => {
        const data = await api("POST", "/api/recover", { nickname: name.value, code: code.value });
        setAuth({ token: data.token, nickname: data.nickname });
        showHome();
      });

    screen(
      el("p", "bxh-note", "Chỉ cần biệt danh, không email, không mật khẩu. Máy chủ lưu biệt danh và kết quả thi."),
      name,
      row(button("Tạo biệt danh mới", create)),
      code,
      row(button("Đăng nhập bằng mã", restore, true), button("Xem BXH", () => showHome(), true)),
      message
    );
    name.focus();
  }

  function showRecoveryCode() {
    const code = el("input", "bxh-input bxh-code");
    code.value = auth.pendingCode;
    code.readOnly = true;
    screen(
      el("p", "bxh-note", "Mã khôi phục chỉ hiện MỘT lần. Hãy chép lại để đăng nhập ở máy khác. Mất cả máy lẫn mã là mất tài khoản."),
      code,
      row(button("Tôi đã lưu mã", () => {
        setAuth({ token: auth.token, nickname: auth.nickname });
        showHome();
      }))
    );
    code.select();
  }

  // ---------- Bảng xếp hạng ----------
  function showHome(notice) {
    if (!body) return;
    if (auth && auth.pendingCode) {
      showRecoveryCode();
      return;
    }
    const message = el("div", "bxh-msg", notice || "");
    const boardBox = el("div", "bxh-board", "Đang tải...");
    const tabs = ["vi", "en"].map((code) =>
      button(code === "vi" ? "Tiếng Việt" : "Tiếng Anh", () => {
        lang = code;
        showHome();
      }, lang !== code)
    );

    const actions = auth
      ? [button("Thi đề hôm nay", () => act(message, startRun)), ...accountButtons(message)]
      : [button("Tạo biệt danh / đăng nhập", () => showAuth())];

    const id = screen(
      el("p", "bxh-note", auth ? `Xin chào ${auth.nickname}` : "Bạn đang xem với tư cách khách"),
      el("p", "bxh-note", "Mỗi ngày 1 lượt, không gợi ý. Mỗi lần sai +5s, sai 10 lần bị loại. Đồng hồ chạy ở máy chủ, đóng bảng này vẫn tính giờ."),
      row(...tabs),
      boardBox,
      row(...actions),
      message
    );

    api("GET", `/api/leaderboard?lang=${lang}`)
      .then((data) => {
        if (id === renderId) renderBoard(boardBox, data);
      })
      .catch((error) => {
        if (id !== renderId) return;
        boardBox.textContent =
          error.code === "OFFLINE"
            ? "BXH cần máy chủ. Chơi thử trên máy: chạy server/dev-server.mjs bằng Node 24 rồi mở http://localhost:8787"
            : error.message;
      });
  }

  function accountButtons(message) {
    let confirmDelete = false;
    const remove = button("Xóa tài khoản", () => {
      if (!confirmDelete) {
        confirmDelete = true;
        remove.textContent = "Bấm lần nữa để xóa vĩnh viễn";
        return;
      }
      act(message, async () => {
        await api("DELETE", "/api/me");
        setAuth(null);
        showHome("Đã xóa tài khoản và toàn bộ kết quả");
      });
    }, true);
    let confirmLogout = false;
    const logout = button("Đăng xuất", () => {
      if (!confirmLogout) {
        confirmLogout = true;
        logout.textContent = "Cần mã để vào lại. Bấm lần nữa";
        return;
      }
      act(message, async () => {
        await api("POST", "/api/logout");
        setAuth(null);
        showHome("Đã đăng xuất. Cần mã khôi phục để vào lại.");
      });
    }, true);
    return [logout, remove];
  }

  function renderBoard(box, data) {
    if (!data.entries.length) {
      box.textContent = `Ngày ${data.day}: chưa có ai hoàn thành.`;
      return;
    }
    const table = el("table", "office-table");
    const addRow = (cells, tag, className) => {
      const tr = el("tr", className);
      cells.forEach((text) => tr.appendChild(el(tag, "", String(text))));
      table.appendChild(tr);
    };
    addRow(["Hạng", "Biệt danh", "Thời gian", "Lần sai"], "th");
    const mineClass = (entry) => (data.me && entry.rank === data.me.rank ? "row-focused" : "");
    data.entries.forEach((e) => addRow([e.rank, e.nickname, formatTime(e.scoreMs), e.mistakes], "td", mineClass(e)));
    if (data.me && data.me.rank > data.entries.length) {
      const m = data.me;
      addRow([m.rank, m.nickname, formatTime(m.scoreMs), m.mistakes], "td", "row-focused");
    }
    box.replaceChildren(table);
  }

  // ---------- Lượt thi ----------
  async function startRun() {
    const id = renderId;
    const view = await api("POST", "/api/run/start", { lang });
    if (id !== renderId) {
      // Người chơi đã chuyển màn: không kéo vào lượt thi, chỉ báo đồng hồ đang chạy
      const note = body && body.querySelector(".bxh-msg");
      if (note) note.textContent = 'Lượt thi đã bắt đầu, đồng hồ đang chạy. Bấm "Thi đề hôm nay" để vào.';
      return;
    }
    selected = null;
    showRun(view);
  }

  function showRun(view, notice) {
    run = view;
    if (view.finished) {
      showHome(
        view.scoreMs === null
          ? "Lượt hôm nay đã bị loại do sai quá số lần. Mai thi lại nhé."
          : `Lượt hôm nay: ${formatTime(view.scoreMs)} (sai ${view.mistakes} lần)`
      );
      return;
    }

    const clockText = el("span", "draft-word");
    const base = performance.now() - view.elapsedMs;
    const tick = () => (clockText.textContent = formatTime(performance.now() - base + view.mistakes * view.penaltyMs));
    const message = el("div", "bxh-msg", notice || "Chọn 2 mảnh để ghép thành từ");
    const grid = el("div", "merge-tiles-grid");

    view.tiles.forEach((tile) => {
      const node = el("button", "merge-tile" + (tile.used ? " used" : ""), tile.text);
      node.type = "button";
      node.disabled = tile.used;
      node.classList.toggle("selected", selected === tile.id);
      node.addEventListener("click", () => pick(tile.id, grid, message));
      grid.appendChild(node);
    });

    screen(
      row(el("span", "", `${view.topic} · ${view.solved.length}/${view.pairCount} cặp · Sai ${view.mistakes}/${view.maxMistakes}`), clockText),
      grid,
      el("div", "bxh-note", view.solved.length ? `Đã ghép: ${view.solved.join(", ")}` : ""),
      message,
      row(button("Về BXH (vẫn tính giờ)", () => showHome(), true))
    );
    tick();
    timerId = setInterval(tick, 100);
  }

  function pick(tileId, grid, message) {
    if (busy) return;
    if (selected === null || selected === tileId) {
      selected = selected === tileId ? null : tileId;
      [...grid.children].forEach((node, i) => node.classList.toggle("selected", i === selected));
      return;
    }
    const first = selected;
    selected = null;
    [...grid.children].forEach((node) => node.classList.remove("selected"));
    const current = run;
    const id = renderId;
    act(message, async () => {
      try {
        const view = await api("POST", "/api/run/guess", { lang: current.lang, day: current.day, a: first, b: tileId });
        if (id === renderId) showRun(view, view.correct ? `Đúng: ${view.merged}` : "Chưa đúng (+5s)");
      } catch (error) {
        // Lệch trạng thái (2 tab, mất phản hồi): đọc lại trạng thái thật, KHÔNG tạo lượt mới
        if (!["RUN_CONFLICT", "RUN_FINISHED", "BAD_TILE", "OFFLINE"].includes(error.code)) throw error;
        if (id !== renderId) return;
        const view = await api("GET", `/api/run?lang=${current.lang}&day=${current.day}`);
        if (id === renderId) showRun(view, error.message);
      }
    });
  }

  // ---------- Khung ----------
  function open() {
    if (overlay) return;
    overlay = el("div", "modal-backdrop");
    const modal = el("div", "office-modal bxh-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Bảng xếp hạng thời gian");
    const head = el("div", "modal-head");
    const closeButton = el("button", "modal-close", "✕");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Đóng");
    closeButton.addEventListener("click", close);
    head.append(el("strong", "", "BẢNG XẾP HẠNG THỜI GIAN GHÉP"), closeButton);
    body = el("div", "modal-body");
    modal.append(head, body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    showHome();
  }

  function close() {
    if (!overlay) return;
    stopTimer();
    renderId += 1;
    selected = null;
    overlay.remove();
    overlay = null;
    body = null;
  }

  const isOpen = () => overlay !== null;

  return { open, close, isOpen };
})();
