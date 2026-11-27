// Kho đề XẾP HẠNG, chỉ nằm trên máy chủ. KHÔNG được đưa thư mục server/ ra web tĩnh.
// Quy tắc khi thêm cặp: dùng từ mà từng mảnh đứng riêng hầu như không ghép được với mảnh khác
// (tiếng Việt: từ láy; tiếng Anh: một từ đơn bị cắt đôi). KHÔNG dùng từ ghép kiểu "Work + flow"
// vì ghép chéo ra từ thật sẽ phạt oan người chơi. Mỗi mảnh chỉ xuất hiện 1 lần.
export const POOLS = {
  vi: {
    topic: "Từ láy tiếng Việt",
    pairs: [
      ["Bâng", "khuâng"], ["Lẩm", "cẩm"], ["Hí", "hửng"], ["Tủm", "tỉm"], ["Xôn", "xao"],
      ["Ngổn", "ngang"], ["Chênh", "vênh"], ["Mênh", "mông"], ["Lủng", "lẳng"], ["Khúc", "khích"],
      ["Lác", "đác"], ["Ngậm", "ngùi"], ["Thong", "thả"], ["Rộn", "ràng"], ["Hớn", "hở"],
      ["Lom", "khom"], ["Nhí", "nhảnh"], ["Tha", "thiết"], ["Lấp", "lánh"], ["Vội", "vã"]
    ],
    decoys: ["Chuối", "Rổ", "Voi", "Gối", "Ớt"],
    join: " "
  },
  en: {
    topic: "Split words",
    pairs: [
      ["Pump", "kin"], ["Pen", "guin"], ["Gir", "affe"], ["Dol", "phin"], ["Umbr", "ella"],
      ["Volc", "ano"], ["Pyra", "mid"], ["Croco", "dile"], ["Kanga", "roo"], ["Choco", "late"],
      ["Elep", "hant"], ["Broc", "coli"], ["Octo", "pus"], ["Hamb", "urger"]
    ],
    decoys: ["Banana", "Pillow", "Spoon", "Tiger", "Lemon"],
    join: ""
  }
};

export const PAIRS_PER_PUZZLE = 8;
export const DECOYS_PER_PUZZLE = 3;
