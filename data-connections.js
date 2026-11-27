// Kho dữ liệu Phân Nhóm 4x4 cho Tiếng Anh & Tiếng Việt
// Mỗi Phiên gồm 16 từ (4 nhóm x 4 từ) với từ bẫy giao thoa giữa các nhóm
window.CONN_DATA = (function () {
  const EN_LEVELS = [
    {
      id: "EN-C01",
      tier: "Cơ bản",
      topic: "Văn phòng & Công việc hàng ngày",
      groups: [
        { level: 1, title: "Đồ dùng trên bàn làm việc", words: ["PEN", "NOTEBOOK", "STAPLER", "CLIP"] },
        { level: 2, title: "Trạng thái Email", words: ["INBOX", "DRAFT", "SENT", "SPAM"] },
        { level: 3, title: "Từ đi với FILE (File ___ / ___ File)", words: ["UPLOAD", "DOWNLOAD", "OPEN", "SAVE"] },
        { level: 4, title: "Vừa là Danh từ vừa là Động từ Văn phòng", words: ["REPORT", "TASK", "COPY", "PRINT"] }
      ]
    },
    {
      id: "EN-C02",
      tier: "Cơ bản",
      topic: "Công nghệ & Phần mềm",
      groups: [
        { level: 1, title: "Thiết bị phần cứng", words: ["MOUSE", "KEYBOARD", "MONITOR", "PRINTER"] },
        { level: 2, title: "Phím tắt thông dụng (Ctrl + ___)", words: ["COPY", "PASTE", "UNDO", "FIND"] },
        { level: 3, title: "Thành phần Website", words: ["HEADER", "FOOTER", "SIDEBAR", "MODAL"] },
        { level: 4, title: "Từ mang nghĩa kép (IT & Đời sống)", words: ["BUG", "COOKIE", "CLOUD", "WINDOW"] }
      ]
    },
    {
      id: "EN-C03",
      tier: "Trung bình",
      topic: "Tài chính & Kinh doanh",
      groups: [
        { level: 1, title: "Các loại giấy tờ thanh toán", words: ["INVOICE", "RECEIPT", "BILL", "VOUCHER"] },
        { level: 2, title: "Thu nhập của nhân viên", words: ["SALARY", "BONUS", "WAGE", "COMMISSION"] },
        { level: 3, title: "Thuật ngữ Chứng khoán / Tiền tệ", words: ["STOCK", "SHARE", "BOND", "FUND"] },
        { level: 4, title: "Đi cùng chữ CASH (___ Cash / Cash ___)", words: ["FLOW", "BACK", "CARD", "OUT"] }
      ]
    },
    {
      id: "EN-C04",
      tier: "Trung bình",
      topic: "Bảng tính & Dữ liệu",
      groups: [
        { level: 1, title: "Hàm tính toán trong bảng tính", words: ["SUM", "AVERAGE", "COUNT", "MIN"] },
        { level: 2, title: "Thành phần của bảng dữ liệu", words: ["ROW", "COLUMN", "CELL", "SHEET"] },
        { level: 3, title: "Thao tác xử lý danh sách", words: ["SORT", "FILTER", "MERGE", "SPLIT"] },
        { level: 4, title: "Mã lỗi bảng tính quen thuộc (#___)", words: ["VALUE", "REF", "NAME", "DIV"] }
      ]
    },
    {
      id: "EN-C05",
      tier: "Trung bình",
      topic: "Cuộc họp & Quản lý Dự án",
      groups: [
        { level: 1, title: "Tài liệu cuộc họp", words: ["AGENDA", "MINUTES", "SLIDE", "BRIEF"] },
        { level: 2, title: "Vai trò trong dự án", words: ["LEAD", "OWNER", "CLIENT", "MENTOR"] },
        { level: 3, title: "Giai đoạn triển khai (Sprint)", words: ["PLAN", "BUILD", "TEST", "DEPLOY"] },
        { level: 4, title: "Đi cùng chữ DEAD / TIME (___ Line / ___ Over)", words: ["DEADLINE", "OVERTIME", "TIMELINE", "WORKLOAD"] }
      ]
    },
    {
      id: "EN-C06",
      tier: "Trung bình",
      topic: "Ẩm thực & Giờ nghỉ trưa",
      groups: [
        { level: 1, title: "Đồ uống pha chế", words: ["LATTE", "ESPRESSO", "MATCHA", "MOCHA"] },
        { level: 2, title: "Món ăn nhanh", words: ["BURGER", "PIZZA", "SANDWICH", "TACO"] },
        { level: 3, title: "Vị giác cơ bản", words: ["SWEET", "SOUR", "SALTY", "BITTER"] },
        { level: 4, title: "Từ có thể đi sau ICE (Ice ___)", words: ["CREAM", "TEA", "CUBE", "AGE"] }
      ]
    },
    {
      id: "EN-C07",
      tier: "Nâng cao",
      topic: "Ngôn từ & Bẫy đồng âm",
      groups: [
        { level: 1, title: "Đồng nghĩa với NHANH", words: ["FAST", "QUICK", "RAPID", "SWIFT"] },
        { level: 2, title: "Cấp bậc công sở", words: ["INTERN", "JUNIOR", "SENIOR", "DIRECTOR"] },
        { level: 3, title: "Các loại khóa & Bảo mật", words: ["TOKEN", "HASH", "SALT", "KEY"] },
        { level: 4, title: "Từ đứng sau HOT (Hot ___)", words: ["DOG", "MAIL", "SPOT", "KEYSTROKE"] }
      ]
    },
    {
      id: "EN-C08",
      tier: "Nâng cao",
      topic: "Du lịch & Phương tiện",
      groups: [
        { level: 1, title: "Phương tiện công cộng", words: ["BUS", "TRAIN", "TRAM", "FERRY"] },
        { level: 2, title: "Giấy tờ xuất nhập cảnh", words: ["PASSPORT", "VISA", "TICKET", "BOARDING"] },
        { level: 3, title: "Nơi lưu trú", words: ["HOTEL", "HOSTEL", "RESORT", "VILLA"] },
        { level: 4, title: "Từ ghép bắt đầu bằng AIR (Air ___)", words: ["PORT", "LINE", "CRAFT", "BAG"] }
      ]
    },
    {
      id: "EN-C09",
      tier: "Nâng cao",
      topic: "Mạng & Bảo mật nâng cao",
      groups: [
        { level: 1, title: "Giao thức mạng", words: ["HTTP", "TCP", "DNS", "SSH"] },
        { level: 2, title: "Mối nguy an ninh mạng", words: ["VIRUS", "PHISHING", "TROJAN", "WORM"] },
        { level: 3, title: "Thiết bị mạng", words: ["ROUTER", "SWITCH", "MODEM", "FIREWALL"] },
        { level: 4, title: "Đều là tên Con vật / Sinh vật ẩn dụ", words: ["PYTHON", "SPIDER", "MOUSE", "BUG"] }
      ]
    },
    {
      id: "EN-C10",
      tier: "Nâng cao",
      topic: "Tổng hợp Bẫy chữ & Thành ngữ",
      groups: [
        { level: 1, title: "Màu sắc trong giao diện", words: ["GREEN", "BLUE", "AMBER", "SLATE"] },
        { level: 2, title: "Đơn vị thời gian", words: ["SECOND", "MINUTE", "HOUR", "QUARTER"] },
        { level: 3, title: "Đứng trước BOOK (___ Book)", words: ["NOTE", "TEXT", "FACE", "YEAR"] },
        { level: 4, title: "Từ có 2 nghĩa: Cơ thể & Tổ chức/Vật dụng", words: ["HEAD", "HAND", "ARM", "BACK"] }
      ]
    }
  ];

  const VI_LEVELS = [
    {
      id: "VI-C01",
      tier: "Cơ bản",
      topic: "Đời sống Công sở",
      groups: [
        { level: 1, title: "Vật dụng bàn làm việc", words: ["Bút bi", "Sổ tay", "Kẹp giấy", "Thước kẻ"] },
        { level: 2, title: "Thức uống tỉnh táo buổi sáng", words: ["Cà phê", "Trà đá", "Bạc xỉu", "Trà sữa"] },
        { level: 3, title: "Tài liệu văn phòng quen thuộc", words: ["Báo cáo", "Hợp đồng", "Biên bản", "Công văn"] },
        { level: 4, title: "Từ có thể đứng sau chữ BÀN (Bàn ___)", words: ["Phím", "Là", "Ghế", "Bạc"] }
      ]
    },
    {
      id: "VI-C02",
      tier: "Cơ bản",
      topic: "Ẩm thực & Ăn trưa",
      groups: [
        { level: 1, title: "Món nước kinh điển", words: ["Phở bò", "Bún chả", "Hủ tiếu", "Mì Quảng"] },
        { level: 2, title: "Đồ ăn vặt chiều văn phòng", words: ["Bánh tráng", "Chè bưởi", "Nem chua", "Khoai lắc"] },
        { level: 3, title: "Gia vị trên bàn ăn", words: ["Nước mắm", "Tương ớt", "Hạt tiêu", "Chanh tươi"] },
        { level: 4, title: "Các loại BÁNH quen thuộc", words: ["Bánh mì", "Bánh cuốn", "Bánh chưng", "Bánh xèo"] }
      ]
    },
    {
      id: "VI-C03",
      tier: "Trung bình",
      topic: "Tài chính & Tiền lương",
      groups: [
        { level: 1, title: "Khoản thu của nhân viên", words: ["Lương cứng", "Thưởng Tết", "Phụ cấp", "Hoa hồng"] },
        { level: 2, title: "Hình thức thanh toán", words: ["Tiền mặt", "Chuyển khoản", "Quẹt thẻ", "Ví điện tử"] },
        { level: 3, title: "Chứng từ kế toán", words: ["Hóa đơn", "Phiếu thu", "Phiếu chi", "Sao kê"] },
        { level: 4, title: "Từ đi với chữ SỐ (Số ___)", words: ["Dư", "Liệu", "Tài khoản", "Hiệu"] }
      ]
    },
    {
      id: "VI-C04",
      tier: "Trung bình",
      topic: "Bẫy Ghép Chữ — Bóng & Máy",
      groups: [
        { level: 1, title: "Môn thể thao dùng Bóng", words: ["Đá", "Rổ", "Chuyền", "Bàn"] },
        { level: 2, title: "Đồ dùng đi với chữ MÁY (Máy ___)", words: ["Tính", "In", "Lạnh", "Ảnh"] },
        { level: 3, title: "Thành phần của CÂY", words: ["Rễ", "Thân", "Cành", "Lá"] },
        { level: 4, title: "Đi với chữ MẶT (Mặt ___)", words: ["Tiền", "Trời", "Bằng", "Hàng"] }
      ]
    },
    {
      id: "VI-C05",
      tier: "Trung bình",
      topic: "Công nghệ & Lập trình",
      groups: [
        { level: 1, title: "Kiểu dữ liệu trong lập trình", words: ["String", "Boolean", "Integer", "Array"] },
        { level: 2, title: "Cách liên lạc công sở", words: ["Email", "Họp video", "Nhắn tin", "Gọi điện"] },
        { level: 3, title: "Thao tác trên Git", words: ["Commit", "Merge", "Branch", "Push"] },
        { level: 4, title: "Từ đi với MÃ (Mã ___)", words: ["Nguồn", "Hóa", "Lỗi", "Vạch"] }
      ]
    },
    {
      id: "VI-C06",
      tier: "Trung bình",
      topic: "Gia đình & Họ hàng",
      groups: [
        { level: 1, title: "Bậc ông bà cha mẹ", words: ["Ông nội", "Bà ngoại", "Bố đẻ", "Mẹ ruột"] },
        { level: 2, title: "Chức danh trong nhà", words: ["Anh cả", "Chị hai", "Em út", "Con trưởng"] },
        { level: 3, title: "Dịp sum họp gia đình", words: ["Tết Nguyên Đán", "Giỗ tổ", "Trung thu", "Sinh nhật"] },
        { level: 4, title: "Từ đi với NHÀ (Nhà ___)", words: ["Cửa", "Bếp", "Xe", "Nước"] }
      ]
    },
    {
      id: "VI-C07",
      tier: "Nâng cao",
      topic: "Bẫy Đa Nghĩa Công sở",
      groups: [
        { level: 1, title: "Chức vụ quản lý", words: ["Trưởng phòng", "Giám đốc", "Phó phòng", "Tổ trưởng"] },
        { level: 2, title: "Trạng thái xử lý hồ sơ", words: ["Chờ duyệt", "Đang xử lý", "Hoàn tất", "Từ chối"] },
        { level: 3, title: "Từ có thể đi sau KÝ (Ký ___)", words: ["Tên", "Nháy", "Kết", "Gửi"] },
        { level: 4, title: "Từ vừa chỉ Bộ phận cơ thể vừa là Vị trí", words: ["Đầu", "Lưng", "Cổ", "Chân"] }
      ]
    },
    {
      id: "VI-C08",
      tier: "Nâng cao",
      topic: "Du lịch & Khám phá Việt Nam",
      groups: [
        { level: 1, title: "Điểm đến biển đảo", words: ["Phú Quốc", "Nha Trang", "Côn Đảo", "Cát Bà"] },
        { level: 2, title: "Điểm đến vùng núi cao", words: ["Sa Pa", "Đà Lạt", "Mộc Châu", "Hà Giang"] },
        { level: 3, title: "Giấy tờ & Đặt chỗ", words: ["Căn cước", "Vé máy bay", "Đặt phòng", "Hành lý"] },
        { level: 4, title: "Từ đi sau ĐƯỜNG (Đường ___)", words: ["Bộ", "Sắt", "Thủy", "Hàng không"] }
      ]
    },
    {
      id: "VI-C09",
      tier: "Nâng cao",
      topic: "Thiên nhiên & Thời tiết",
      groups: [
        { level: 1, title: "Hiện tượng thời tiết", words: ["Mưa rào", "Sấm chớp", "Gió mùa", "Sương mù"] },
        { level: 2, title: "Bốn mùa trong năm", words: ["Xuân", "Hạ", "Thu", "Đông"] },
        { level: 3, title: "Địa hình tự nhiên", words: ["Đồi núi", "Thung lũng", "Đồng bằng", "Hải đảo"] },
        { level: 4, title: "Từ đi với NƯỚC (Nước ___)", words: ["Ngọt", "Mặn", "Đá", "Mắt"] }
      ]
    },
    {
      id: "VI-C10",
      tier: "Nâng cao",
      topic: "Chơi chữ & Thành ngữ Việt",
      groups: [
        { level: 1, title: "Đứng sau ĐỒNG (Đồng ___)", words: ["Nghiệp", "Tiền", "Hành", "Lòng"] },
        { level: 2, title: "Đứng sau CÔNG (Công ___)", words: ["Việc", "Ty", "Trình", "Bằng"] },
        { level: 3, title: "Đứng sau HỢP (Hợp ___)", words: ["Đồng", "Tác", "Lý", "Chuẩn"] },
        { level: 4, title: "Cặp trái nghĩa thường gặp", words: ["Sáng tối", "Nhanh chậm", "Đúng sai", "Thật giả"] }
      ]
    }
  ];

  return { EN_LEVELS, VI_LEVELS };
})();
