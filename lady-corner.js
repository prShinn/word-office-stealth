// lady-corner.js - Góc Chị Em Công Sở: Trưa nay ăn gì, Quẻ trà sữa, Bói vui công sở & Theme ngụy trang
window.LadyCorner = (function () {
  const THEME_KEY = "stealth_app_theme";
  const RANK_THEME_KEY = "stealth_rank_theme";

  const LUNCH_MENU = [
    { name: "Cơm Tấm Sườn Bì Chả", tag: "No nê: 10/10", sleepRisk: "Rất cao lúc 2h chiều", note: "Món tủ cứu rỗi tâm hồn sau một buổi sáng cày task mệt mỏi. Nhớ xin thêm chén mỡ hành tóp mỡ giòn rụm!" },
    { name: "Bún Đậu Mắm Tôm", tag: "Gây nghiện: 10/10", sleepRisk: "Trung bình", note: "Siêu ngon đậm đà nhưng CHỐNG CHỈ ĐỊNH ăn tại bàn làm việc nếu chiều nay có lịch họp kín với Sếp hoặc Đối tác!" },
    { name: "Phở Bò Tái Lăn", tag: "Ấm bụng: 9/10", sleepRisk: "Vừa phải", note: "Nước dùng thơm lừng hương gừng hành lá, gọi thêm 2 cái quẩy giòn tan đập tan mọi cơn đau đầu vì deadline." },
    { name: "Bún Bò Huế Chả Cua", tag: "Đậm đà: 10/10", sleepRisk: "Cao", note: "Nước dùng cay nồng thơm mùi sả ruốc, sa tế kích thích mọi giác quan. Ăn xong tỉnh táo ngay tức khắc." },
    { name: "Bún Chả Hà Nội", tag: "Thơm nức: 9/10", sleepRisk: "Vừa phải", note: "Chả nướng than hoa thơm lừng chấm cùng nước mắm chua ngọt và đĩa rau sống tươi roi rói mát lành." },
    { name: "Cơm Gà Xối Mỡ Da Giòn", tag: "Đầy đặn: 9/10", sleepRisk: "Rất cao", note: "Da gà giòn rụm màu cánh gián, cơm chiên hạt vàng ươm. Ăn xong khả năng cao gật gù trước màn hình vi tính." },
    { name: "Salad Ức Gà Sốt Mè Rang (Healthy)", tag: "Giữ dáng: 10/10", sleepRisk: "Bằng 0", note: "Bữa trưa thanh đạm nhẹ nhàng, không sợ mỡ bụng, không lo buồn ngủ, chuẩn phong cách sống healthy." },
    { name: "Bánh Mì Chảo Đầy Đủ", tag: "Nhanh gọn: 8/10", sleepRisk: "Vừa phải", note: "Xíu mại, pate béo ngậy, trứng ốp la lòng đào chấm bánh mì giòn rụm nóng hổi thơm phức." },
    { name: "Hủ Tiếu Nam Vang Sườn Tôm", tag: "Thanh ngọt: 9/10", sleepRisk: "Vừa phải", note: "Nước lèo hầm xương trong vắt, tôm tươi giòn sần sật, ăn khô hay ăn nước đều ngon đỉnh chóp." },
    { name: "Bún Riêu Cua Bắp Bò", tag: "Chua thanh: 10/10", sleepRisk: "Thấp", note: "Vị chua thanh mát của giấm bỗng và cà chua, riêu cua mềm thơm béo ngậy tan ngay trong miệng." },
    { name: "Cơm Niêu / Cơm Thố Cháy", tag: "Giòn rụm: 9/10", sleepRisk: "Cao", note: "Lớp cháy vàng ươm dưới đáy niêu quyện với sốt thịt kho tộ đậm vị thơm lừng nức mũi." },
    { name: "Gỏi Cuốn Tôm Thịt & Bì Cuốn", tag: "Nhẹ bụng: 8/10", sleepRisk: "Bằng 0", note: "Chấm tương bơ đậu phộng béo ngậy hoặc mắm nêm đậm đà, ăn 4-5 cuốn là no vừa vặn dễ chịu." },
    { name: "Mì Quảng Tôm Thịt Trứng Cút", tag: "Đậm vị miền Trung: 9/10", sleepRisk: "Vừa phải", note: "Sợi mì vàng óng dai mềm, đậu phộng rang giòn và bánh tráng mè nướng giòn tan bẻ vụn." },
    { name: "Cơm Văn Phòng 35k Tự Chọn", tag: "Tiết kiệm ví tiền: 10/10", sleepRisk: "Trung bình", note: "2 món mặn 1 món xào kèm chén canh thanh nhiệt, chuẩn tiêu chí ngon - bổ - rẻ lúc cuối tháng." },
    { name: "Bún Thịt Nướng Chả Giò", tag: "Hài hòa: 9/10", sleepRisk: "Vừa phải", note: "Thịt nướng thơm lừng, chả giò chiên giòn rụm chan nước mắm chua ngọt cay cay ăn mãi không ngán." }
  ];

  const DRINK_MENU = [
    { name: "Trà Sữa Ô Long Nướng (50% Đường · 70% Đá)", tag: "Quốc dân: 10/10", effect: "Giảm 99% stress", note: "Vị trà ô long rang đậm đà béo ngậy, ngọt thanh vừa phải, nạp lại 200% năng lượng chiến đấu." },
    { name: "Trà Sen Vàng Củ Năng Macchiato", tag: "Sang chảnh: 10/10", effect: "Thanh mát giải nhiệt", note: "Hạt sen bùi bùi, thạch củ năng giòn ngọt quyện lớp kem cheese béo mặn thơm nức mũi." },
    { name: "Cà Phê Muối Ít Ngọt", tag: "Trendy: 10/10", effect: "Tỉnh ngủ tức thì", note: "Vị mặn mòi cân bằng độ đắng của cà phê phin, đánh thức mọi giác quan đang uể oải lúc 1h30 chiều." },
    { name: "Matcha Latte Cốt Dừa", tag: "Thơm béo: 9/10", effect: "Tập trung cao độ", note: "Trà xanh Uji Nhật Bản thanh mát kết hợp cốt dừa béo ngậy, visual màu xanh cực bắt mắt." },
    { name: "Trà Mãng Cầu Xiêm Trân Châu Trắng", tag: "Chua ngọt: 9/10", effect: "Giải nhiệt mát lành", note: "Thịt mãng cầu xé mọng nước, chua ngọt sảng khoái nhai cùng trân châu trắng giòn tan." },
    { name: "Nước Ép Cần Tây Táo Xanh Detox", tag: "Healthy: 10/10", effect: "Đẹp da giữ dáng", note: "Không đường, giàu vitamin và chất xơ, rửa trôi hết lượng dầu mỡ thừa của bữa trưa." },
    { name: "Trà Đào Cam Sả Thạch Đào", tag: "Kinh điển: 9/10", effect: "Thư giãn tinh thần", note: "Hương sả thoang thoảng, miếng đào giòn ngọt nhai ngập miệng, vị chua dịu xua tan mệt mỏi." },
    { name: "Cà Phê Sữa Tươi Sương Sáo", tag: "Lạ miệng: 9/10", effect: "Êm bụng tỉnh táo", note: "Sữa tươi béo nhẹ kết hợp thạch sương sáo mềm mượt thanh nhiệt, vừa no vừa đã khát." }
  ];

  const ORACLE_QUOTES = [
    { title: "Quẻ Đại Cát: Sếp Chuẩn Bị Tán Dương", text: "Hôm nay những nỗ lực thầm lặng bấy lâu của bạn sẽ được ghi nhận. Đừng ngại chia sẻ ý kiến trong buổi họp, lời nói của bạn mang trọng lượng lớn!", color: "#10b981" },
    { title: "Quẻ Cảnh Báo: Tránh Xa Máy In Văn Phòng", text: "Máy in hôm nay mang năng lượng xung khắc. Khả năng cao nó sẽ kẹt giấy ngay khi bạn cần in gấp hoặc bắn mực lên áo sơ mi trắng!", color: "#ef4444" },
    { title: "Quẻ Thần Tài: Đột Kích Trà Sữa Miễn Phí", text: "Chiều nay lúc 3h15 có điềm báo phòng bên cạnh hoặc một vị sếp tốt bụng sẽ bao trà sữa toàn công ty. Hãy chuẩn bị sẵn topping ưa thích!", color: "#f59e0b" },
    { title: "Quẻ Tình Duyên: Crush Liếc Nhìn Ở Cây Nước", text: "Cây nước nóng lạnh và khu pantry hôm nay là tọa độ đào hoa của bạn. Uống nước nhớ giữ nụ cười thật tươi và phong thái tự tin nhé!", color: "#ec4899" },
    { title: "Quẻ An Lành: Deadline Tự Động Được Dời", text: "Đầu mối bên đối tác chưa kịp phản hồi, bạn sẽ có thêm 24 giờ quý báu để hoàn thiện báo cáo mà không cần vắt chân lên cổ chạy việc.", color: "#3b82f6" },
    { title: "Quẻ Tránh Hạn: Đừng Bắt Đầu Drama Lúc Ăn Trưa", text: "Hôm nay tường có tai, vách có mắt. Hạn chế thì thầm to nhỏ chuyện phòng khác kẻo nghiệp quật bất ngờ sau lưng.", color: "#8b5cf6" },
    { title: "Quẻ Săn Sale: Voucher 50% Rơi Trúng Đầu", text: "Mở app Shopee/TikTok lúc 12h trưa nay bạn sẽ săn được món đồ mỹ phẩm ưng ý với giá hời chưa từng thấy. Chúc mừng chiến thần săn sale!", color: "#f97316" },
    { title: "Quẻ Phong Thủy: Dọn Dẹp Bàn Làm Việc", text: "Vứt ngay đống giấy note từ tháng trước và tưới nước cho chậu sen đá. Khí lưu thông tốt sẽ mang lại nguồn năng lượng tích cực tức thì.", color: "#06b6d4" },
    { title: "Quẻ Quý Nhân: Đồng Nghiệp Gánh Team", text: "Hôm nay một người đồng nghiệp đáng yêu sẽ chủ động hỗ trợ giải quyết phần việc khó nhằn nhất giúp bạn tan làm đúng giờ 5h30 chiều!", color: "#6366f1" },
    { title: "Quẻ Tự Thưởng: Chiều Nay Cho Phép Mình Ăn Ngon", text: "Cả tuần vất vả rồi! Chiều nay tan làm hãy ghé quán trà bánh quen thuộc hoặc rủ hội bạn thân làm một bữa lẩu thả ga nhé.", color: "#d946ef" }
  ];

  function applyTheme(theme) {
    document.body.classList.remove("theme-word", "theme-pastel");
    if (theme === "word") {
      document.body.classList.add("theme-word");
    } else if (theme === "pastel") {
      document.body.classList.add("theme-pastel");
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_) {}
  }

  function initTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY) || "excel";
      applyTheme(saved);
    } catch (_) {}
  }

  function open() {
    const modal = document.getElementById("modal-lady-corner");
    if (!modal) return;
    modal.classList.remove("hidden");
    renderActiveTab();
  }

  function close() {
    const modal = document.getElementById("modal-lady-corner");
    if (modal) modal.classList.add("hidden");
  }

  let activeTab = "lunch";

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll(".lady-tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    renderActiveTab();
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function renderLunch(dish) {
    const box = document.getElementById("lady-tab-content");
    if (!box) return;
    box.innerHTML = `
      <div style="text-align: center; margin-bottom: 14px;">
        <button class="game-btn game-btn-lady" id="btn-spin-lunch" style="font-size: 13px; padding: 8px 18px; border-radius: 20px;">
          🎲 Bốc Ngẫu Nhiên Món Trưa Khác
        </button>
      </div>
      <div class="lady-result-card" style="border: 2px dashed #f472b6; background: #fff5f8; border-radius: 8px; padding: 14px; text-align: center;">
        <div style="font-size: 11.5px; color: #db2777; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Gợi ý bữa trưa hoàng gia hôm nay</div>
        <h3 style="font-size: 20px; color: #9d174d; margin: 8px 0 6px;">🍱 ${dish.name}</h3>
        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 10px; font-size: 11.5px;">
          <span style="background: #fce7f3; color: #be185d; padding: 3px 8px; border-radius: 12px; font-weight: 600;">${dish.tag}</span>
          <span style="background: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 12px; font-weight: 600;">😴 ${dish.sleepRisk}</span>
        </div>
        <p style="font-size: 12.5px; color: #4b5563; line-height: 1.5; margin: 0; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #fbcfe8;">
          💡 <em>"${dish.note}"</em>
        </p>
      </div>
    `;
    document.getElementById("btn-spin-lunch")?.addEventListener("click", () => {
      renderLunch(pickRandom(LUNCH_MENU));
    });
  }

  function renderDrink(drink) {
    const box = document.getElementById("lady-tab-content");
    if (!box) return;
    box.innerHTML = `
      <div style="text-align: center; margin-bottom: 14px;">
        <button class="game-btn game-btn-lady" id="btn-spin-drink" style="font-size: 13px; padding: 8px 18px; border-radius: 20px;">
          🧋 Bốc Quẻ Đồ Uống Khác
        </button>
      </div>
      <div class="lady-result-card" style="border: 2px dashed #fb923c; background: #fff7ed; border-radius: 8px; padding: 14px; text-align: center;">
        <div style="font-size: 11.5px; color: #c2410c; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Cứu tinh năng lượng buổi chiều</div>
        <h3 style="font-size: 19px; color: #9a3412; margin: 8px 0 6px;">🧋 ${drink.name}</h3>
        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 10px; font-size: 11.5px;">
          <span style="background: #ffedd5; color: #c2410c; padding: 3px 8px; border-radius: 12px; font-weight: 600;">${drink.tag}</span>
          <span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 12px; font-weight: 600;">⚡ ${drink.effect}</span>
        </div>
        <p style="font-size: 12.5px; color: #4b5563; line-height: 1.5; margin: 0; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #fed7aa;">
          ✨ <em>"${drink.note}"</em>
        </p>
      </div>
    `;
    document.getElementById("btn-spin-drink")?.addEventListener("click", () => {
      renderDrink(pickRandom(DRINK_MENU));
    });
  }

  function renderOracle(orc) {
    const box = document.getElementById("lady-tab-content");
    if (!box) return;
    box.innerHTML = `
      <div style="text-align: center; margin-bottom: 14px;">
        <button class="game-btn game-btn-lady" id="btn-spin-oracle" style="font-size: 13px; padding: 8px 18px; border-radius: 20px;">
          🔮 Bốc Thêm Quẻ Chiêm Tinh Khác
        </button>
      </div>
      <div class="lady-result-card" style="border: 2px solid ${orc.color}; background: #faf5ff; border-radius: 8px; padding: 16px; text-align: center;">
        <div style="font-size: 11px; color: #7e22ce; font-weight: 700; text-transform: uppercase;">Thông điệp Vũ trụ gửi tới bạn</div>
        <h3 style="font-size: 17px; color: ${orc.color}; margin: 8px 0 10px;">✨ ${orc.title}</h3>
        <p style="font-size: 13px; color: #374151; line-height: 1.6; margin: 0; background: #ffffff; padding: 10px 14px; border-radius: 6px; border: 1px solid #e9d5ff; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
          "${orc.text}"
        </p>
      </div>
    `;
    document.getElementById("btn-spin-oracle")?.addEventListener("click", () => {
      renderOracle(pickRandom(ORACLE_QUOTES));
    });
  }

  function renderSettings() {
    const box = document.getElementById("lady-tab-content");
    if (!box) return;
    const curTheme = localStorage.getItem(THEME_KEY) || "excel";
    const curRank = localStorage.getItem(RANK_THEME_KEY) || "tech";

    box.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
          <h4 style="margin: 0 0 8px; font-size: 13px; color: #1e293b;">🎨 Đổi Giao Diện Ngụy Trang Công Sở</h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            <button class="game-btn theme-choice-btn ${curTheme === 'excel' ? 'active-theme' : ''}" data-theme="excel" style="padding: 8px; text-align: center; border-radius: 6px;">
              🟢 <strong>Excel</strong><br><small style="color: #64748b;">Kế toán cổ điển</small>
            </button>
            <button class="game-btn theme-choice-btn ${curTheme === 'word' ? 'active-theme' : ''}" data-theme="word" style="padding: 8px; text-align: center; border-radius: 6px;">
              🔵 <strong>Word</strong><br><small style="color: #64748b;">Soạn văn bản</small>
            </button>
            <button class="game-btn theme-choice-btn ${curTheme === 'pastel' ? 'active-theme' : ''}" data-theme="pastel" style="padding: 8px; text-align: center; border-radius: 6px;">
              🌸 <strong>Pastel</strong><br><small style="color: #64748b;">Dịu mắt phái nữ</small>
            </button>
          </div>
        </div>

        <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 6px; padding: 12px;">
          <h4 style="margin: 0 0 8px; font-size: 13px; color: #9d174d;">💅 Bộ Danh Xưng Hiển Thị (Status Bar & KPI)</h4>
          <div style="display: flex; gap: 8px;">
            <button class="game-btn rank-choice-btn ${curRank === 'tech' ? 'active-theme' : ''}" data-rank="tech" style="flex: 1; padding: 8px;">
              💻 <strong>Hệ Kỹ Thuật</strong><br><small style="font-size: 11px; color: #64748b;">Intern ➔ Tech Lead ➔ Director</small>
            </button>
            <button class="game-btn rank-choice-btn ${curRank === 'lady' ? 'active-theme' : ''}" data-rank="lady" style="flex: 1; padding: 8px;">
              🌸 <strong>Hệ Chị Em Công Sở</strong><br><small style="font-size: 11px; color: #64748b;">Bánh bèo ➔ Bà hoàng trà sữa</small>
            </button>
          </div>
        </div>
      </div>
    `;

    box.querySelectorAll(".theme-choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const theme = btn.dataset.theme;
        applyTheme(theme);
        renderSettings();
      });
    });

    box.querySelectorAll(".rank-choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const rTheme = btn.dataset.rank;
        localStorage.setItem(RANK_THEME_KEY, rTheme);
        const rankEl = document.getElementById("stat-rank");
        if (rankEl && window.Engagement) {
          rankEl.textContent = `Cấp bậc: ${window.Engagement.getRankName(window.__LAST_SCORE || 0)}`;
        }
        renderSettings();
      });
    });
  }

  function renderActiveTab() {
    if (activeTab === "lunch") renderLunch(pickRandom(LUNCH_MENU));
    else if (activeTab === "drink") renderDrink(pickRandom(DRINK_MENU));
    else if (activeTab === "oracle") renderOracle(pickRandom(ORACLE_QUOTES));
    else if (activeTab === "settings") renderSettings();
  }

  function init() {
    initTheme();
    document.getElementById("btn-lady-corner")?.addEventListener("click", open);
    document.getElementById("btn-close-lady-corner")?.addEventListener("click", close);
    document.querySelectorAll(".lady-tab-btn").forEach((b) => {
      b.addEventListener("click", () => switchTab(b.dataset.tab));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { open, close, applyTheme };
})();
