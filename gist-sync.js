// Module đồng bộ tiến độ & KPI với GitHub Private Gist (0 server, bảo mật cá nhân)
window.GistSync = (function () {
  const GIST_STORAGE_KEY = "bangchu_github_gist_auth_v1";
  const GIST_FILENAME = "bangchu_office_stealth_data.json";

  function getStoredAuth() {
    try {
      const raw = localStorage.getItem(GIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function setStoredAuth(data) {
    try {
      if (data) {
        localStorage.setItem(GIST_STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(GIST_STORAGE_KEY);
      }
    } catch (_) {}
  }

  async function requestGitHub(endpoint, token, options = {}) {
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    };
    const res = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers
    });
    if (!res.ok) {
      let errMsg = `Lỗi GitHub API: HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) errMsg = errJson.message;
      } catch (_) {}
      throw new Error(errMsg);
    }
    return res.json();
  }

  async function connectWithToken(token) {
    const cleanToken = (token || "").trim();
    if (!cleanToken) throw new Error("Vui lòng nhập GitHub Personal Access Token");

    // 1. Xác thực tài khoản
    const user = await requestGitHub("/user", cleanToken);
    const username = user.login;
    const avatarUrl = user.avatar_url;

    // 2. Tìm Gist chứa file dữ liệu game
    const gists = await requestGitHub("/gists?per_page=100", cleanToken);
    let targetGist = gists.find((g) => g.files && g.files[GIST_FILENAME]);
    let remoteData = null;

    if (targetGist) {
      // Đọc dữ liệu từ file Gist đã có
      const fileMeta = targetGist.files[GIST_FILENAME];
      if (fileMeta && fileMeta.raw_url) {
        try {
          const rawRes = await fetch(fileMeta.raw_url);
          if (rawRes.ok) {
            remoteData = await rawRes.json();
          }
        } catch (_) {}
      }
    } else {
      // 3. Nếu chưa có, tạo Private Gist mới
      const newGist = await requestGitHub("/gists", cleanToken, {
        method: "POST",
        body: JSON.stringify({
          description: "Bảng Chữ - Office Stealth Game Data (Auto-sync)",
          public: false,
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify({
                createdAt: new Date().toISOString(),
                user: username,
                score: 0,
                streak: 0,
                stars: {},
                completedBatches: []
              })
            }
          }
        })
      });
      targetGist = newGist;
    }

    const authPayload = {
      token: cleanToken,
      username,
      avatarUrl,
      gistId: targetGist.id,
      gistUrl: targetGist.html_url,
      lastSync: new Date().toISOString()
    };
    setStoredAuth(authPayload);
    return { auth: authPayload, remoteData };
  }

  let syncDebounceTimer = null;

  async function syncProgress(payload) {
    const auth = getStoredAuth();
    if (!auth || !auth.token || !auth.gistId) return false;

    clearTimeout(syncDebounceTimer);
    return new Promise((resolve) => {
      syncDebounceTimer = setTimeout(async () => {
        try {
          const bodyPayload = {
            ...payload,
            updatedAt: new Date().toISOString(),
            user: auth.username
          };
          await requestGitHub(`/gists/${auth.gistId}`, auth.token, {
            method: "PATCH",
            body: JSON.stringify({
              files: {
                [GIST_FILENAME]: {
                  content: JSON.stringify(bodyPayload, null, 2)
                }
              }
            })
          });
          auth.lastSync = new Date().toISOString();
          setStoredAuth(auth);
          resolve(true);
        } catch (err) {
          console.warn("[GistSync] Đồng bộ Gist thất bại:", err);
          resolve(false);
        }
      }, 500);
    });
  }

  function logout() {
    setStoredAuth(null);
  }

  return {
    getAuth: getStoredAuth,
    isLoggedIn: () => Boolean(getStoredAuth()?.token),
    connectWithToken,
    syncProgress,
    logout
  };
})();
