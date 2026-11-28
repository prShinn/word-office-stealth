// Bộ điều phối Quảng cáo có thưởng (Rewarded Ad Adapter)
// Hỗ trợ: "adsense_h5" (Google AdSense H5 Games Ads), "crazygames", "poki", hoặc "mock" (thử nghiệm/fallback).
// Giao ước: window.RewardedAd.show() -> Promise<boolean> (true = xem đủ, được nhận +1 Gợi ý)
window.AD_CONFIG = window.AD_CONFIG || {
  provider: "auto", // "auto" tự nhận diện SDK thật nếu đã nhúng, không có thì fallback về "mock"
  mockSeconds: 5
};

window.RewardedAd = (function () {
  let finish = null;
  let lastOpenedAt = 0;

  function detectProvider() {
    const cfg = window.AD_CONFIG?.provider || "auto";
    if (cfg !== "auto") return cfg;
    if (typeof window.adBreak === "function") return "adsense_h5";
    if (window.CrazyGames?.SDK?.ad?.requestAd) return "crazygames";
    if (window.PokiSDK?.rewardedBreak) return "poki";
    return "mock";
  }

  function showAdSenseH5() {
    return new Promise((resolve) => {
      if (typeof window.adBreak !== "function") return resolve(false);
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      try {
        window.adBreak({
          type: "reward",
          name: "extra_hint",
          beforeReward: (showAdFn) => {
            showAdFn();
          },
          adDismissed: () => done(false),
          adViewed: () => done(true),
          adBreakDone: (placementInfo) => {
            if (!settled && placementInfo && placementInfo.breakStatus !== "viewed") {
              done(false);
            }
          }
        });
      } catch (_) {
        done(false);
      }
    });
  }

  function showCrazyGames() {
    return new Promise((resolve) => {
      try {
        window.CrazyGames.SDK.ad.requestAd("rewarded", {
          adFinished: () => resolve(true),
          adError: () => resolve(false),
          adStarted: () => {}
        });
      } catch (_) {
        resolve(false);
      }
    });
  }

  async function showPoki() {
    try {
      return Boolean(await window.PokiSDK.rewardedBreak());
    } catch (_) {
      return false;
    }
  }

  function showMock() {
    if (finish) return Promise.resolve(false);
    const watchSeconds = Math.max(1, Number(window.AD_CONFIG?.mockSeconds) || 5);

    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-backdrop";
      overlay.innerHTML = `
        <div class="office-modal ad-modal" role="dialog" aria-label="Tra cứu cơ sở dữ liệu tham chiếu">
          <div class="modal-head"><strong>TRA CỨU CƠ SỞ DỮ LIỆU THAM CHIẾU</strong></div>
          <div class="modal-body">
            <div class="ad-placeholder doc-sync-placeholder">
              <div class="doc-sync-icon">📁</div>
              <div class="doc-sync-title">Đang đồng bộ dữ liệu tham chiếu từ máy chủ nội bộ...</div>
              <div class="doc-sync-desc">Vui lòng chờ xác thực danh mục nghiệp vụ để nhận thêm gợi ý giải trình.</div>
            </div>
            <div class="ad-actions">
              <button class="office-btn ghost" data-ad="close">Hủy bỏ</button>
              <button class="office-btn" data-ad="claim" disabled></button>
            </div>
          </div>
        </div>`;
      const claim = overlay.querySelector('[data-ad="claim"]');
      let left = watchSeconds;
      const render = () => {
        claim.textContent = left > 0 ? `Đang đồng bộ ${left}s...` : "Xác nhận (+1 Gợi ý)";
        claim.disabled = left > 0;
      };
      render();
      const timer = setInterval(() => {
        left -= 1;
        render();
        if (left <= 0) clearInterval(timer);
      }, 1000);

      finish = (rewarded) => {
        finish = null;
        clearInterval(timer);
        overlay.remove();
        resolve(rewarded);
      };
      claim.addEventListener("click", () => left <= 0 && finish && finish(true));
      overlay.querySelector('[data-ad="close"]').addEventListener("click", () => finish && finish(false));
      document.body.appendChild(overlay);
    });
  }

  async function show() {
    const now = Date.now();
    if (finish || now - lastOpenedAt < 1500) return false;
    lastOpenedAt = now;

    const provider = detectProvider();
    if (provider === "adsense_h5") {
      const ok = await showAdSenseH5();
      return ok;
    }
    if (provider === "crazygames") return showCrazyGames();
    if (provider === "poki") return showPoki();
    return showMock();
  }

  function cancel() {
    if (finish) finish(false);
  }

  function isOpen() {
    return finish !== null;
  }

  return { show, cancel, isOpen, detectProvider };
})();
