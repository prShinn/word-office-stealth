// Kho câu đố Thuật toán & Cấu trúc dữ liệu IT thực chiến dành cho dân công sở / dev ôn tập
window.ALGO_DATA = (function () {
  const ALGO_LEVELS = [
    {
      id: "IT-01",
      tier: "Cơ bản",
      topic: "Two Pointers · Cặp số có tổng đích",
      problem: "Cho một mảng số nguyên đã sắp xếp tăng dần nums và một số target. Cần tìm 2 vị trí sao cho tổng nums[left] + nums[right] == target bằng kỹ thuật 2 con trỏ.",
      snippet: `def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        curr_sum = nums[left] + nums[right]
        if curr_sum == target:
            return [left, right]
        elif curr_sum < target:
            left += 1
        else:
            right -= 1
    return []`,
      question: "Độ phức tạp thời gian (Time Complexity) và không gian (Space Complexity) của thuật toán này là gì?",
      options: [
        "A. O(N) thời gian · O(1) không gian",
        "B. O(N log N) thời gian · O(N) không gian",
        "C. O(N²) thời gian · O(1) không gian",
        "D. O(log N) thời gian · O(N) không gian"
      ],
      correctIndex: 0,
      explanation: "Kỹ thuật Two Pointers duyệt từ 2 đầu mảng, mỗi bước tăng left hoặc giảm right nên chỉ duyệt qua mảng đúng 1 lần (tối đa N bước) -> Time O(N). Thuật toán chỉ dùng 2 biến con trỏ chỉ số -> Space O(1).",
      hint: "Mỗi vòng lặp while chỉ dịch chuyển con trỏ 1 bước và không cấp phát thêm bộ nhớ phụ."
    },
    {
      id: "IT-02",
      tier: "Cơ bản",
      topic: "Binary Search · Tìm kiếm nhị phân",
      problem: "Tìm kiếm phần tử target trong mảng đã sắp xếp có kích thước N = 1,000,000 phần tử bằng Binary Search.",
      snippet: `function binarySearch(arr, target) {
    let low = 0, high = arr.length - 1;
    while (low <= high) {
        const mid = Math.floor(low + (high - low) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
      question: "Trong trường hợp xấu nhất (Worst Case), thuật toán cần tối đa khoảng bao nhiêu phép so sánh?",
      options: [
        "A. Khoảng 20 phép so sánh (log₂ 1,000,000)",
        "B. Khoảng 1,000 phép so sánh",
        "C. Khoảng 500,000 phép so sánh",
        "D. Đúng 1,000,000 phép so sánh"
      ],
      correctIndex: 0,
      explanation: "Binary Search chia đôi không gian tìm kiếm sau mỗi bước. log₂(1,000,000) ≈ 19.93, do đó trong trường hợp xấu nhất chỉ cần tối đa khoảng 20 phép so sánh.",
      hint: "2 mũ 10 = 1,024, 2 mũ 20 = 1,048,576."
    },
    {
      id: "IT-03",
      tier: "Cơ bản",
      topic: "Stack · Kiểm tra ngoặc hợp lệ (Valid Parentheses)",
      problem: "Cho chuỗi s chỉ chứa các ký tự '(', ')', '{', '}', '[', ']'. Cần kiểm tra xem chuỗi ngoặc có đóng mở hợp lệ và đúng thứ tự hay không.",
      snippet: `function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const char of s) {
        if (char in map) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}`,
      question: "Cấu trúc dữ liệu nào giúp giải bài toán này với nguyên lý LIFO (Last In First Out)?",
      options: [
        "A. Ngăn xếp (Stack)",
        "B. Hàng đợi (Queue)",
        "C. Cây nhị phân (Binary Tree)",
        "D. Hàng đợi ưu tiên (Priority Queue)"
      ],
      correctIndex: 0,
      explanation: "Dấu ngoặc mở gần nhất phải được đóng trước tiên. Cấu trúc dữ liệu Ngăn xếp (Stack) tuân theo nguyên lý LIFO (Vào sau ra trước) là lựa chọn chuẩn mực cho bài toán này.",
      hint: "Nguyên tắc: Dấu ngoặc mở vào sau cùng thì phải gặp ngoặc đóng tương ứng đầu tiên."
    },
    {
      id: "IT-04",
      tier: "Cơ bản",
      topic: "Hash Table · Tra cứu và trùng khóa (Collisions)",
      problem: "Bảng băm (Hash Table) lưu trữ cặp Key-Value. Trong trường hợp lý tưởng, các thao tác Insert, Search, Delete đạt độ phức tạp O(1).",
      snippet: `// Insert: map.set(key, value)
// Lookup: map.get(key)
// Delete: map.delete(key)`,
      question: "Nếu tất cả các Key đều bị băm vào cùng 1 bucket (Hash Collision trầm trọng), độ phức tạp tìm kiếm của Separate Chaining sẽ bị suy biến thành gì?",
      options: [
        "A. O(N) - Tương đương duyệt danh sách liên kết",
        "B. O(1) - Vẫn giữ nguyên tức thì",
        "C. O(log N) - Tương đương cây nhị phân",
        "D. O(N²) - Tương đương vét cạn"
      ],
      correctIndex: 0,
      explanation: "Khi mọi phần tử đều rơi vào cùng một bucket, bảng băm bị thoái hóa thành một danh sách liên kết đơn dài N phần tử, dẫn tới thời gian tra cứu suy biến thành O(N).",
      hint: "Nhiều phần tử cùng nằm trong 1 chuỗi liên kết tuyến tính."
    },
    {
      id: "IT-05",
      tier: "Trung bình",
      topic: "Sliding Window · Chuỗi con không trùng ký tự",
      problem: "Tìm độ dài chuỗi con dài nhất không chứa ký tự lặp lại (Longest Substring Without Repeating Characters).",
      snippet: `function lengthOfLongestSubstring(s) {
    let maxLen = 0, left = 0;
    const seen = new Map();
    for (let right = 0; right < s.length; right++) {
        const c = s[right];
        if (seen.has(c) && seen.get(c) >= left) {
            left = seen.get(c) + 1;
        }
        seen.set(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}`,
      question: "Tại sao kỹ thuật Sliding Window lại tối ưu hơn thuật toán vét cạn (Brute Force)?",
      options: [
        "A. Giảm độ phức tạp từ O(N³) hoặc O(N²) xuống O(N) nhờ dịch chuyển 2 con trỏ liên tục",
        "B. Giảm bộ nhớ từ O(N) xuống O(1) mà không cần lưu index",
        "C. Biến bài toán thành sắp xếp mảng trước khi tìm",
        "D. Giúp code chạy song song trên nhiều CPU core"
      ],
      correctIndex: 0,
      explanation: "Thay vì duyệt tất cả cặp điểm đầu-cuối (O(N²)) rồi kiểm tra trùng lặp (O(N)), Sliding Window chỉ mở rộng con trỏ phải và co con trỏ trái khi gặp trùng lặp, mỗi ký tự duyệt tối đa 2 lần -> O(N).",
      hint: "Con trỏ left và right đều chỉ tiến về phía trước, không bao giờ quay ngược về đầu."
    },
    {
      id: "IT-06",
      tier: "Trung bình",
      topic: "Linked List · Phát hiện chu trình (Floyd's Cycle)",
      problem: "Kiểm tra xem một danh sách liên kết đơn có chứa chu trình (vòng lặp vô tận) hay không mà không được sửa mảng hay dùng thêm bộ nhớ O(N).",
      snippet: `def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next          # Đi 1 bước
        fast = fast.next.next     # Đi 2 bước
        if slow == fast:
            return True           # Gặp nhau trong vòng lặp!
    return False`,
      question: "Thuật toán con trỏ Rùa và Thỏ (Tortoise and Hare) này đạt độ phức tạp không gian (Space Complexity) là bao nhiêu?",
      options: [
        "A. O(1) - Không tốn thêm bộ nhớ lưu node",
        "B. O(N) - Lưu địa chỉ các node đã ghé thăm",
        "C. O(log N) - Gọi đệ quy chia đôi",
        "D. O(N²) - So sánh từng cặp node"
      ],
      correctIndex: 0,
      explanation: "Thuật toán Floyd chỉ sử dụng đúng 2 con trỏ `slow` và `fast` di chuyển với vận tốc khác nhau (1 bước và 2 bước). Không cấp phát thêm bất kỳ mảng băm hay cấu trúc lưu trữ nào -> Space O(1).",
      hint: "Chỉ có 2 biến tham chiếu duy nhất chạy trên danh sách."
    },
    {
      id: "IT-07",
      tier: "Trung bình",
      topic: "Graph Traversal · BFS vs DFS",
      problem: "Cho một đồ thị vô hướng không có trọng số (Unweighted Graph). Cần tìm đường đi ngắn nhất (số cạnh ít nhất) từ đỉnh Start tới đỉnh End.",
      snippet: `// Hàng đợi: queue = [start]
// Tập đã thăm: visited = {start}
// Lặp đến khi tìm thấy end hoặc queue rỗng`,
      question: "Thuật toán nào luôn bảo đảm tìm được đường đi ngắn nhất trên đồ thị không có trọng số?",
      options: [
        "A. Duyệt theo chiều rộng (BFS - Breadth-First Search)",
        "B. Duyệt theo chiều sâu (DFS - Depth-First Search)",
        "C. Duyệt cây nhị phân tiền thứ tự (Pre-order Traversal)",
        "D. Thuật toán quay lui (Backtracking)"
      ],
      correctIndex: 0,
      explanation: "BFS khám phá các đỉnh theo từng tầng khoảng cách tăng dần (tầng 1 cạnh, tầng 2 cạnh, ...). Do đó, lần đầu tiên BFS chạm tới đỉnh đích luôn đảm bảo đó là đường đi có số cạnh ít nhất.",
      hint: "Thuật toán dùng Hàng đợi (Queue) duyệt lan tỏa đều theo từng vòng sóng."
    },
    {
      id: "IT-08",
      tier: "Trung bình",
      topic: "Dynamic Programming · Tối ưu Fibonacci & Bộ nhớ",
      problem: "Tính số Fibonacci thứ N với điều kiện không bị tràn Call Stack (Maximum call stack size exceeded).",
      snippet: `function fib(n) {
    if (n <= 1) return n;
    let prev2 = 0, prev1 = 1;
    for (let i = 2; i <= n; i++) {
        const curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}`,
      question: "So với đệ quy ngây thơ fib(n-1) + fib(n-2) có thời gian O(2^N), thuật toán Quy hoạch động tối ưu này đạt thời gian và không gian là bao nhiêu?",
      options: [
        "A. O(N) thời gian · O(1) không gian",
        "B. O(N²) thời gian · O(N) không gian",
        "C. O(log N) thời gian · O(N) không gian",
        "D. O(2^N) thời gian · O(1) không gian"
      ],
      correctIndex: 0,
      explanation: "Vòng lặp chạy từ 2 đến n với n phép cộng -> Time O(N). Chỉ lưu 2 giá trị liền kề `prev1` và `prev2` thay vì lưu toàn bộ mảng -> Space O(1).",
      hint: "Một vòng lặp đơn và chỉ dùng 2 biến lưu trạng thái trước đó."
    },
    {
      id: "IT-09",
      tier: "Nâng cao",
      topic: "Caching Strategy · LRU Cache",
      problem: "Hệ thống bộ nhớ đệm LRU (Least Recently Used) cần hỗ trợ thao tác get(key) và put(key, value) đều đạt O(1) thời gian.",
      snippet: `class LRUCache {
    // get(key): O(1)
    // put(key, value): O(1)
    // Khi đầy dung lượng, xóa phần tử lâu nhất chưa dùng
}`,
      question: "Để cả 2 thao tác get và put đều đạt O(1) và dễ dàng chuyển node lên đầu/cuối, ta phải kết hợp 2 cấu trúc dữ liệu nào?",
      options: [
        "A. Hash Map + Danh sách liên kết đôi (Doubly Linked List)",
        "B. Array + Binary Search Tree",
        "C. Stack + Queue",
        "D. Hash Map + Min Heap"
      ],
      correctIndex: 0,
      explanation: "Hash Map cho phép tìm vị trí node trong O(1). Doubly Linked List cho phép xóa node ở bất kỳ vị trí nào và chèn lên đầu danh sách trong O(1) mà không cần dịch chuyển mảng.",
      hint: "Cần tra cứu key tức thì (Map) và ngắt/nối node 2 chiều cực nhanh (List)."
    },
    {
      id: "IT-10",
      tier: "Nâng cao",
      topic: "System Design · Rate Limiting (Token Bucket)",
      problem: "Thuật toán Token Bucket (Xô thẻ) được sử dụng để giới hạn tần suất gọi API (Rate Limiting) của người dùng.",
      snippet: `// Xô có dung tích tối đa C thẻ (Capacity)
// Mỗi giây bổ sung r thẻ vào xô (Refill rate)
// Mỗi request đến lấy đi 1 thẻ, nếu xô rỗng thì từ chối (HTTP 429 Too Many Requests)`,
      question: "Ưu điểm lớn nhất của Token Bucket so với Fixed Window Counter là gì?",
      options: [
        "A. Cho phép chịu tải bộc phát ngắn hạn (Burst Traffic) hợp lệ trong giới hạn dung tích xô",
        "B. Không cần lưu thời điểm request",
        "C. Đảm bảo request được xử lý với độ trễ cố định chính xác",
        "D. Tự động mã hóa dữ liệu truyền đi"
      ],
      correctIndex: 0,
      explanation: "Khi người dùng không gọi trong một khoảng thời gian, thẻ sẽ tích lũy đầy xô (tối đa Capacity C). Nhờ đó khi có đợt cao điểm ngắn (Burst), hệ thống vẫn cho phép xử lý liên tiếp C request mà không chặn oan.",
      hint: "Thẻ tích lũy khi nhàn rỗi cho phép xử lý một đợt nhiều request dồn vào cùng lúc."
    },
    {
      id: "IT-11",
      tier: "Nâng cao",
      topic: "Database Indexing · Cấu trúc B-Tree / B+Tree",
      problem: "Hầu hết các RDBMS (PostgreSQL, MySQL, Oracle) sử dụng B+Tree làm cấu trúc chỉ mục (Index) mặc định cho bảng dữ liệu.",
      snippet: `CREATE INDEX idx_user_created ON users(created_at);
-- Truy vấn: SELECT * FROM users WHERE created_at BETWEEN '2026-01-01' AND '2026-01-31';`,
      question: "Vì sao B+Tree lại tối ưu hơn Binary Search Tree khi lưu trữ trên đĩa cứng (Disk / SSD)?",
      options: [
        "A. Node có bậc phân nhánh lớn (Fan-out cao) -> Chiều cao cây cực thấp -> Giảm thiểu tối đa số lần đọc đĩa (Disk I/O)",
        "B. B+Tree không cần cân bằng cây",
        "C. B+Tree chỉ lưu trữ được kiểu dữ liệu số nguyên",
        "D. B+Tree nén dữ liệu thành file nhị phân nhỏ hơn"
      ],
      correctIndex: 0,
      explanation: "B+Tree có hệ số phân nhánh hàng trăm hoặc hàng nghìn con trên 1 node (khớp với kích thước Page đọc của đĩa, ví dụ 4KB/8KB). Với hàng triệu bản ghi, chiều cao cây chỉ khoảng 3-4 tầng, chỉ cần 3-4 lần đọc đĩa là tìm thấy dữ liệu.",
      hint: "Số lượng con của mỗi node rất lớn giúp cây lùn đi, giảm số lần I/O đọc đĩa."
    },
    {
      id: "IT-12",
      tier: "Nâng cao",
      topic: "Frontend Optimization · Debounce vs Throttle",
      problem: "Người dùng gõ liên tục vào thanh tìm kiếm văn phòng (Search input). Ta muốn chỉ kích hoạt gửi API sau khi người dùng ngừng gõ phím 300ms.",
      snippet: `function debounce(func, delay) {
    let timer = null;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}`,
      question: "Kỹ thuật trì hoãn thực thi cho tới khi sự kiện ngừng phát sinh trong một khoảng thời gian gọi là gì?",
      options: [
        "A. Debounce",
        "B. Throttle",
        "C. Memoization",
        "D. Lazy Loading"
      ],
      correctIndex: 0,
      explanation: "Debounce reset lại timer mỗi khi có sự kiện mới và chỉ kích hoạt khi người dùng dừng thao tác đủ khoảng delay (thường dùng cho ô search, resize). Khác với Throttle là kích hoạt định kỳ tối đa 1 lần trong mỗi chu kỳ thời gian.",
      hint: "Mỗi lần gõ là một lần clearTimeout và đặt lại hẹn giờ mới."
    }
  ];

  return {
    ALGO_LEVELS
  };
})();
