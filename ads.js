// Quảng cáo có thưởng. HIỆN LÀ BẢN GIẢ LẬP để chơi thử, chưa gắn mạng quảng cáo nào.
// Khi được duyệt, chỉ cần thay phần thân show()/cancel(), giữ nguyên giao ước:
//   show() -> Promise<boolean>  (true = xem đủ, được nhận thưởng)
window.RewardedAd = (function () {
  const WATCH_SECONDS = 5;
  let finish = null; // khác null khi đang mở

  function show() {
    if (finish) return Promise.resolve(false);

    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-backdrop";
      overlay.innerHTML = `
        <div class="office-modal ad-modal" role="dialog" aria-label="Quảng cáo">
          <div class="modal-head"><strong>QUẢNG CÁO (BẢN THỬ NGHIỆM)</strong></div>
          <div class="modal-body">
            <div class="ad-placeholder">Vị trí quảng cáo</div>
            <div class="ad-actions">
              <button class="office-btn ghost" data-ad="close">Đóng (không nhận)</button>
              <button class="office-btn" data-ad="claim" disabled></button>
            </div>
          </div>
        </div>`;
      const claim = overlay.querySelector('[data-ad="claim"]');
      let left = WATCH_SECONDS;
      const render = () => {
        claim.textContent = left > 0 ? `Chờ ${left}s` : "Nhận +1 Gợi ý";
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

  function cancel() {
    if (finish) finish(false);
  }

  function isOpen() {
    return finish !== null;
  }

  return { show, cancel, isOpen };
})();
