// Kho câu đố Thuật toán & Kỹ năng Dev thực chiến đa lĩnh vực (DSA, JS/TS, Java, Python, SQL, System Design)
// Hỗ trợ cả 2 hình thức: Trắc nghiệm phân tích (choice) và Tự nhập kết quả đầu ra (input output)
window.ALGO_DATA = (function () {
  const CUSTOM_KEY = "stealth_custom_algo";

  const BASE_LEVELS = [
    // ================= DSA (CẤU TRÚC DỮ LIỆU & GIẢI THUẬT) =================
    {
      id: "IT-01",
      domain: "dsa",
      domainLabel: "DSA & Giải thuật",
      tier: "Cơ bản",
      topic: "Two Pointers · Cặp số có tổng đích",
      langTag: "Python",
      type: "choice",
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
      explanation: "Kỹ thuật Two Pointers duyệt từ 2 đầu mảng, mỗi bước tăng left hoặc giảm right nên chỉ duyệt qua mảng tối đa N bước -> Time O(N). Thuật toán chỉ dùng 2 biến con trỏ chỉ số -> Space O(1).",
      hint: "Mỗi vòng lặp while chỉ dịch chuyển con trỏ 1 bước và không cấp phát thêm bộ nhớ phụ."
    },
    {
      id: "IT-02",
      domain: "dsa",
      domainLabel: "DSA & Giải thuật",
      tier: "Cơ bản",
      topic: "Binary Search · Tìm kiếm nhị phân",
      langTag: "JavaScript",
      type: "choice",
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
      domain: "dsa",
      domainLabel: "DSA & Giải thuật",
      tier: "Cơ bản",
      topic: "Stack · Kiểm tra ngoặc hợp lệ (Valid Parentheses)",
      langTag: "TypeScript",
      type: "choice",
      problem: "Cho một chuỗi s chỉ gồm các ký tự '()[]{}'. Dùng cấu trúc dữ liệu Stack để kiểm tra các dấu ngoặc có đóng mở đúng thứ tự hay không.",
      snippet: `function isValid(s: string): boolean {
    const stack: string[] = [];
    const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
    for (const ch of s) {
        if (ch in map) {
            if (stack.pop() !== map[ch]) return false;
        } else {
            stack.push(ch);
        }
    }
    return stack.length === 0;
}`,
      question: "Vì sao cấu trúc dữ liệu Stack (LIFO - Last In First Out) lại là lựa chọn tối ưu nhất cho bài toán này?",
      options: [
        "A. Ngoặc mở gần nhất bắt buộc phải được đóng trước (vào sau ra trước)",
        "B. Stack giúp tìm kiếm nhị phân các ký tự ngoặc nhanh hơn",
        "C. Queue (FIFO) cũng cho kết quả tương tự mà tiết kiệm bộ nhớ hơn",
        "D. Stack tự động sắp xếp các ký tự ngoặc theo thứ tự bảng chữ cái"
      ],
      correctIndex: 0,
      explanation: "Quy tắc lồng ngoặc đòi hỏi dấu ngoặc mở xuất hiện sau cùng (trong cùng) phải được đóng trước tiên. Đặc tính Last-In First-Out của Stack phản ánh chính xác cấu trúc ngữ cảnh lồng nhau này.",
      hint: "Ngoặc trong cùng phải khớp trước rồi mới đến ngoặc ngoài cùng."
    },
    {
      id: "IT-04",
      domain: "dsa",
      domainLabel: "DSA & Giải thuật",
      tier: "Trung bình",
      topic: "Sliding Window · Chuỗi con không lặp ký tự",
      langTag: "Java",
      type: "choice",
      problem: "Tìm độ dài chuỗi con liên tiếp dài nhất không chứa ký tự lặp lại (Longest Substring Without Repeating Characters) bằng kỹ thuật Cửa sổ trượt.",
      snippet: `public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>();
    int maxLen = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (lastSeen.containsKey(c)) {
            left = Math.max(left, lastSeen.get(c) + 1);
        }
        lastSeen.put(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}`,
      question: "Tại sao con trỏ left phải cập nhật bằng Math.max(left, lastSeen.get(c) + 1) thay vì gán thẳng left = lastSeen.get(c) + 1?",
      options: [
        "A. Để tránh kéo lùi con trỏ left khi ký tự lặp nằm bên ngoài cửa sổ hiện tại",
        "B. Để đảm bảo mảng không bị lỗi OutOfMemory",
        "C. Để con trỏ right không bao giờ vượt quá chiều dài chuỗi",
        "D. Để tự động chuyển đổi ký tự hoa thành ký tự thường"
      ],
      correctIndex: 0,
      explanation: "Map lưu vị trí xuất hiện cuối cùng của mọi ký tự. Nếu ký tự 'c' đã xuất hiện trước đó nhưng ở vị trí nhỏ hơn con trỏ left hiện tại (đã nằm ngoài cửa sổ trượt), việc gán thẳng sẽ làm con trỏ left nhảy lùi về quá khứ, phá vỡ tính hợp lệ của cửa sổ.",
      hint: "Cửa sổ trượt chỉ được phép thu hẹp hoặc tiến lên, không bao giờ mở rộng lùi lại phía trước con trỏ trái."
    },
    {
      id: "IT-05",
      domain: "dsa",
      domainLabel: "DSA & Giải thuật",
      tier: "Trung bình",
      topic: "Dynamic Programming · Bài toán leo cầu thang",
      langTag: "Python",
      type: "input",
      problem: "Bạn đang leo một cầu thang gồm n bậc. Mỗi lần bạn có thể bước 1 bậc hoặc 2 bậc. Có bao nhiêu cách khác nhau để leo lên đỉnh n = 5 bậc?",
      snippet: `def climb_stairs(n):
    if n <= 2:
        return n
    dp = [0] * (n + 1)
    dp[1], dp[2] = 1, 2
    for i in range(3, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]

print(climb_stairs(5))`,
      question: "Kết quả in ra màn hình của print(climb_stairs(5)) là bao nhiêu?",
      expectedAnswers: ["8", "dp[5]=8"],
      explanation: "Công thức quy hoạch động: dp[i] = dp[i-1] + dp[i-2] (dãy Fibonacci). dp[1]=1, dp[2]=2, dp[3]=3, dp[4]=5, dp[5]=8. Vậy có đúng 8 cách leo lên đỉnh 5 bậc.",
      hint: "Dãy số: 1, 2, 3, 5, ... số tiếp theo là tổng của 2 số liền trước."
    },
    {
      id: "IT-06",
      domain: "dsa",
      domainLabel: "DSA & Giải thuật",
      tier: "Trung bình",
      topic: "Graph · BFS tìm đường đi ngắn nhất",
      langTag: "Pseudocode",
      type: "choice",
      problem: "Trên đồ thị vô hướng không có trọng số (Unweighted Graph), giải thuật nào đảm bảo tìm được đường đi ngắn nhất (ít cạnh nhất) từ đỉnh nguồn S đến đỉnh đích T nhanh nhất?",
      snippet: `BFS(Graph, start_node):
    queue.push(start_node)
    visited.add(start_node)
    while queue is not empty:
        curr = queue.pop()
        for neighbor in Graph.adjacent(curr):
            if neighbor not in visited:
                queue.push(neighbor)
                visited.add(neighbor)`,
      question: "Thuật toán tối ưu nhất là gì?",
      options: [
        "A. Breadth-First Search (BFS) vì duyệt theo từng lớp khoảng cách lan dần",
        "B. Depth-First Search (DFS) vì luôn đi sâu hết mức có thể",
        "C. Bellman-Ford vì hỗ trợ trọng số âm",
        "D. Floyd-Warshall vì tính toán đường đi giữa mọi cặp đỉnh"
      ],
      correctIndex: 0,
      explanation: "Với đồ thị không trọng số, BFS duyệt theo từng lớp (level/layer). Bất kỳ đỉnh nào được BFS thăm đầu tiên đều được đảm bảo đạt được qua số cạnh ít nhất.",
      hint: "Duyệt theo chiều rộng dùng Queue tỏa ra như vòng sóng nước."
    },

    // ================= JAVASCRIPT / TYPESCRIPT =================
    {
      id: "IT-07",
      domain: "js",
      domainLabel: "JavaScript / TS",
      tier: "Cơ bản",
      topic: "Event Loop · Thứ tự Microtask vs Macrotask",
      langTag: "JavaScript",
      type: "input",
      problem: "Xem xét đoạn mã JavaScript bất đồng bộ dưới đây và dự đoán chính xác thứ tự các số được in ra trong Console.",
      snippet: `console.log(1);

setTimeout(() => {
    console.log(2);
}, 0);

Promise.resolve().then(() => {
    console.log(3);
});

console.log(4);`,
      question: "Nhập các số được in ra console theo đúng thứ tự (cách nhau bởi dấu cách):",
      expectedAnswers: ["1 4 3 2", "1, 4, 3, 2", "1432", "1\n4\n3\n2"],
      explanation: "1) Đồng bộ: in 1 rồi in 4. 2) setTimeout đưa callback vào Macrotask Queue. 3) Promise.then đưa callback vào Microtask Queue. 4) Sau khi Call Stack trống, Event Loop ưu tiên vét sạch Microtask Queue (in 3) rồi mới lấy Macrotask tiếp theo (in 2). Kết quả: 1 4 3 2.",
      hint: "Đồng bộ chạy trước -> Hàng đợi Microtask (Promise) chạy tiếp theo -> Macrotask (setTimeout) chạy cuối cùng."
    },
    {
      id: "IT-08",
      domain: "js",
      domainLabel: "JavaScript / TS",
      tier: "Cơ bản",
      topic: "Closure & Scope · Vòng lặp var vs setTimeout",
      langTag: "JavaScript",
      type: "input",
      problem: "Đoạn code sau đây sử dụng biến var trong vòng lặp for và setTimeout. Hãy dự đoán giá trị được in ra console.",
      snippet: `for (var i = 0; i < 3; i++) {
    setTimeout(() => {
        console.log(i);
    }, 0);
}`,
      question: "Kết quả in ra console là gì? (Nhập các số cách nhau bởi dấu cách):",
      expectedAnswers: ["3 3 3", "3, 3, 3", "333", "3\n3\n3"],
      explanation: "Từ khóa 'var' có function-scope, không có block-scope. Cả 3 callback setTimeout đều tham chiếu chung tới một biến 'i'. Khi vòng for kết thúc, i = 3. Khi các callback chạy, chúng đều in ra giá trị hiện tại của i là 3. (Nếu dùng 'let' sẽ in ra 0 1 2).",
      hint: "Vòng for chạy xong i bằng mấy? Cả 3 hàm callback đều nhìn vào chung một biến i."
    },
    {
      id: "IT-09",
      domain: "js",
      domainLabel: "JavaScript / TS",
      tier: "Trung bình",
      topic: "Type Coercion & Quirks · Phép toán lạ trong JS",
      langTag: "JavaScript",
      type: "choice",
      problem: "Trong JavaScript, các phép cộng mảng và object sau đây sẽ trả về kết quả gì?",
      snippet: `console.log([] + []);
console.log([] + {});
console.log([1, 2] + [3, 4]);`,
      question: "Kết quả in ra tương ứng là gì?",
      options: [
        'A. "" (chuỗi rỗng), "[object Object]", "1,23,4"',
        'B. [], {}, [1, 2, 3, 4]',
        'C. NaN, undefined, NaN',
        'D. 0, 0, [1, 2, 3, 4]'
      ],
      correctIndex: 0,
      explanation: "Toán tử '+' kích hoạt ép kiểu: [].toString() là '', [].toString() + [].toString() = ''. [].toString() + {}.toString() = '' + '[object Object]'. [1, 2].toString() + [3, 4].toString() = '1,2' + '3,4' = '1,23,4'.",
      hint: "Toán tử + với mảng sẽ ép kiểu mảng về chuỗi qua hàm toString()."
    },
    {
      id: "IT-10",
      domain: "js",
      domainLabel: "JavaScript / TS",
      tier: "Trung bình",
      topic: "Arrow Function & this Context",
      langTag: "JavaScript",
      type: "choice",
      problem: "Điểm khác biệt cốt lõi nhất về ngữ cảnh 'this' giữa Regular Function (function() {}) và Arrow Function (() => {}) trong JavaScript là gì?",
      snippet: `const user = {
    name: "Alex",
    regular: function() { return this.name; },
    arrow: () => { return this.name; }
};`,
      question: "Nhận định nào sau đây là chính xác?",
      options: [
        "A. Arrow Function không có 'this' riêng; nó bắt (capture) 'this' từ phạm vi từ vựng (lexical scope) nơi nó được định nghĩa",
        "B. Arrow Function luôn tự động bind 'this' vào object bao bọc gần nhất",
        "C. Arrow Function có thể đổi 'this' bằng cách gọi .bind(), .call() hoặc .apply()",
        "D. Regular Function không bao giờ bị mất 'this' khi truyền vào làm callback"
      ],
      correctIndex: 0,
      explanation: "Arrow Function không có ràng buộc 'this' của riêng mình. Giá trị của 'this' bên trong arrow function hoàn toàn phụ thuộc vào 'this' của môi trường bao bọc bên ngoài tại thời điểm khai báo (lexical scoping). Gọi .bind/.call/.apply lên arrow function sẽ không thay đổi được 'this'.",
      hint: "Arrow function kế thừa this từ scope cha bên ngoài."
    },

    // ================= JAVA & BACKEND SPRING =================
    {
      id: "IT-11",
      domain: "java",
      domainLabel: "Java & Spring",
      tier: "Cơ bản",
      topic: "String Pool · Toán tử == vs equals()",
      langTag: "Java",
      type: "input",
      problem: "Xem xét đoạn mã Java sau liên quan đến String Constant Pool và từ khóa new.",
      snippet: `String s1 = "Hello";
String s2 = "Hello";
String s3 = new String("Hello");

System.out.print((s1 == s2) + " " + (s1 == s3));`,
      question: "Kết quả in ra màn hình là gì? (Nhập chính xác 2 giá trị boolean cách nhau bởi dấu cách):",
      expectedAnswers: ["true false", "true, false", "true/false"],
      explanation: "s1 và s2 cùng trỏ vào 1 object trong String Constant Pool nên s1 == s2 là true. s3 được tạo bằng từ khóa 'new' nên cấp phát một object riêng trên Heap, do đó s1 == s3 là false (dù s1.equals(s3) vẫn là true).",
      hint: "Toán tử == trong Java so sánh địa chỉ ô nhớ tham chiếu, không so sánh nội dung chuỗi."
    },
    {
      id: "IT-12",
      domain: "java",
      domainLabel: "Java & Spring",
      tier: "Trung bình",
      topic: "Spring Boot · Cơ chế Rollback của @Transactional",
      langTag: "Java",
      type: "choice",
      problem: "Trong Spring Framework, khi một phương thức được đánh dấu @Transactional ném ra ngoại lệ (Exception), trường hợp mặc định nào sẽ kích hoạt Rollback transaction?",
      snippet: `@Transactional
public void processOrder(Order order) throws Exception {
    orderRepo.save(order);
    if (order.isInvalid()) {
        throw new IOException("Lỗi I/O!"); // Checked Exception
    }
}`,
      question: "Mặc định @Transactional rollback khi gặp ngoại lệ nào?",
      options: [
        "A. Chỉ tự động rollback với RuntimeException (Unchecked) và Error, KHÔNG rollback với Checked Exception",
        "B. Tự động rollback với mọi loại Exception kể cả Checked Exception",
        "C. Chỉ rollback khi có ngoại lệ NullPointerException",
        "D. Không bao giờ tự động rollback, lập trình viên phải gọi TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()"
      ],
      correctIndex: 0,
      explanation: "Quy ước mặc định của Spring Transaction: chỉ rollback khi gặp RuntimeException hoặc Error. Để rollback cả Checked Exception (như IOException, SQLException), phải khai báo tường minh: @Transactional(rollbackFor = Exception.class).",
      hint: "Checked Exception không kích hoạt rollback mặc định nếu không khai báo rollbackFor."
    },
    {
      id: "IT-13",
      domain: "java",
      domainLabel: "Java & Spring",
      tier: "Trung bình",
      topic: "Java Memory · Pass-by-Value",
      langTag: "Java",
      type: "input",
      problem: "Đoạn mã Java sau truyền đối tượng vào một hàm để thay đổi tham chiếu. Dự đoán giá trị in ra của sb.toString().",
      snippet: `public static void modify(StringBuilder sb) {
    sb.append("-world");
    sb = new StringBuilder("new-data");
}

public static void main(String[] args) {
    StringBuilder sb = new StringBuilder("hello");
    modify(sb);
    System.out.println(sb.toString());
}`,
      question: "Kết quả in ra của sb.toString() là gì?",
      expectedAnswers: ["hello-world", "hello-world\n"],
      explanation: "Java hoàn toàn là Pass-by-Value. Khi truyền sb vào modify, Java copy giá trị của biến tham chiếu. Lệnh sb.append() thay đổi đối tượng thực tế trên heap. Nhưng lệnh sb = new StringBuilder() chỉ gán lại bản copy tham chiếu cục bộ trong hàm, không làm thay đổi biến sb ở hàm main. Kết quả là hello-world.",
      hint: "append làm thay đổi nội dung đối tượng, nhưng gán sb = new... chỉ đổi biến cục bộ trong hàm."
    },
    {
      id: "IT-14",
      domain: "java",
      domainLabel: "Java & Spring",
      tier: "Nâng cao",
      topic: "ConcurrentHashMap · Cơ chế khóa luồng an toàn",
      langTag: "Java",
      type: "choice",
      problem: "Vì sao ConcurrentHashMap trong Java 8+ lại có hiệu năng đọc/ghi đồng thời vượt trội hơn hẳn so với Hashtable hoặc Collections.synchronizedMap()?",
      snippet: `ConcurrentMap<String, Object> cache = new ConcurrentHashMap<>();`,
      question: "Cơ chế đồng bộ hóa cốt lõi của ConcurrentHashMap là gì?",
      options: [
        "A. Sử dụng CAS (Compare-And-Swap) và chỉ khóa (synchronized) trên từng node đầu bucket thay vì khóa toàn bộ Map",
        "B. Tạo một bản copy toàn bộ dữ liệu mỗi khi có thao tác ghi (Copy-On-Write)",
        "C. Khóa toàn bộ bảng bằng ReentrantLock mỗi khi có thread đọc hoặc ghi",
        "D. Tự động chuyển các thao tác ghi vào một hàng đợi đơn luồng (Single-thread Event Loop)"
      ],
      correctIndex: 0,
      explanation: "Hashtable khóa toàn bộ Map (monolithic lock) khiến mọi thao tác bị nghẽn cổ chai. Java 8 ConcurrentHashMap sử dụng CAS không khóa cho thao tác chèn node đầu tiên, và chỉ synchronized trên node đầu của bucket khi giải quyết xung đột hash, cho phép hàng trăm luồng đọc/ghi đồng thời trên các bucket khác nhau.",
      hint: "Khóa cục bộ trên từng node/bucket thay vì khóa cả bảng."
    },

    // ================= PYTHON =================
    {
      id: "IT-15",
      domain: "python",
      domainLabel: "Python",
      tier: "Cơ bản",
      topic: "Mutable Default Argument · Bẫy tham số mặc định",
      langTag: "Python",
      type: "input",
      problem: "Trong Python, danh sách mặc định được khởi tạo một lần duy nhất khi định nghĩa hàm. Dự đoán kết quả in ra của lần gọi thứ hai.",
      snippet: `def append_to(item, target=[]):
    target.append(item)
    return target

print(append_to(1))
print(append_to(2))`,
      question: "Kết quả in ra của print(append_to(2)) là gì? (Nhập định dạng mảng [x, y]):",
      expectedAnswers: ["[1, 2]", "[1,2]", "[1, 2]\n"],
      explanation: "Tham số mặc định 'target=[]' được đánh giá duy nhất một lần khi module được load/định nghĩa hàm, KHÔNG phải mỗi lần gọi hàm. Lần gọi 1 append 1 -> target=[1]. Lần gọi 2 tiếp tục dùng chung list đó và append 2 -> kết quả là [1, 2]. Cách chuẩn: gán target=None và khởi tạo target=[] bên trong thân hàm.",
      hint: "Default argument dạng mutable (list, dict) trong Python được dùng chung qua mọi lần gọi hàm."
    },
    {
      id: "IT-16",
      domain: "python",
      domainLabel: "Python",
      tier: "Cơ bản",
      topic: "Toán tử is vs == trong Python",
      langTag: "Python",
      type: "input",
      problem: "Xem xét sự khác nhau giữa so sánh giá trị và so sánh định danh ô nhớ (Identity) trong Python.",
      snippet: `a = [1, 2, 3]
b = [1, 2, 3]

print(f"{a == b} {a is b}")`,
      question: "Kết quả in ra là gì? (Nhập 2 giá trị boolean cách nhau bởi dấu cách):",
      expectedAnswers: ["True False", "True, False", "True/False", "true false"],
      explanation: "Toán tử '==' so sánh giá trị (value equality) -> hai list có cùng phần tử nên a == b là True. Toán tử 'is' so sánh địa chỉ định danh vùng nhớ id(a) == id(b) -> hai list là 2 object độc lập trên bộ nhớ nên a is b là False.",
      hint: "== so sánh giá trị bên trong, is so sánh hai biến có cùng trỏ tới 1 ô nhớ hay không."
    },
    {
      id: "IT-17",
      domain: "python",
      domainLabel: "Python",
      tier: "Trung bình",
      topic: "Generator vs List Comprehension",
      langTag: "Python",
      type: "choice",
      problem: "Khi cần xử lý 10,000,000 dòng log từ file để tính tổng, cú pháp nào sau đây tiết kiệm RAM nhất và tránh bị tràn bộ nhớ (OOM)?",
      snippet: `# Cú pháp A:
sum([len(line) for line in log_file])

# Cú pháp B:
sum(len(line) for line in log_file)`,
      question: "Cú pháp nào tối ưu bộ nhớ hơn và vì sao?",
      options: [
        "A. Cú pháp B (Generator Expression) vì sinh từng phần tử theo nhu cầu (lazy evaluation), RAM tiêu tốn O(1)",
        "B. Cú pháp A (List Comprehension) vì nạp toàn bộ danh sách vào RAM một lần sẽ chạy nhanh hơn",
        "C. Cả hai cú pháp đều tiêu tốn dung lượng RAM bằng nhau",
        "D. Cú pháp B sẽ gây lỗi cú pháp (SyntaxError)"
      ],
      correctIndex: 0,
      explanation: "Cú pháp A tạo ra một List chứa toàn bộ 10 triệu số nguyên trong RAM cùng lúc. Cú pháp B là Generator Expression, chỉ tính toán và giữ 1 phần tử tại một thời điểm rồi ném đi, giúp tiết kiệm bộ nhớ gần như tuyệt đối (O(1) memory).",
      hint: "Generator biểu thức ngoặc tròn sinh dữ liệu dạng luồng (lazy) thay vì tạo cả mảng."
    },

    // ================= SQL & DATABASE =================
    {
      id: "IT-18",
      domain: "sql",
      domainLabel: "SQL & Database",
      tier: "Cơ bản",
      topic: "B-Tree Index · Điều kiện làm vô hiệu hóa Index",
      langTag: "SQL",
      type: "choice",
      problem: "Bảng orders có 10,000,000 dòng và cột created_at đã được đánh B-Tree Index. Câu truy vấn nào sau đây sẽ BỎ QUA INDEX và quét toàn bộ bảng (Full Table Scan)?",
      snippet: `-- Query 1:
SELECT * FROM orders WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01';

-- Query 2:
SELECT * FROM orders WHERE YEAR(created_at) = 2026;`,
      question: "Câu query nào làm mất index?",
      options: [
        "A. Query 2 vì dùng hàm YEAR() bọc ngoài cột indexed khiến database không thể tìm kiếm nhị phân trên cây B-Tree",
        "B. Query 1 vì toán tử >= không bao giờ dùng được index",
        "C. Cả hai query đều sử dụng index bình thường",
        "D. Cả hai query đều quét toàn bộ bảng"
      ],
      correctIndex: 0,
      explanation: "Khi áp dụng hàm hoặc biểu thức toán học lên cột được đánh chỉ mục (vd: YEAR(col), LOWER(col), col + 1), database phải tính toán giá trị hàm cho từng dòng trong bảng, dẫn đến Full Table Scan. Query 1 sử dụng khoảng giá trị (range scan) tận dụng index cực kỳ hiệu quả.",
      hint: "Không bao giờ bọc hàm lên cột indexed ở vế WHERE."
    },
    {
      id: "IT-19",
      domain: "sql",
      domainLabel: "SQL & Database",
      tier: "Cơ bản",
      topic: "COUNT(*) vs COUNT(column)",
      langTag: "SQL",
      type: "input",
      problem: "Bảng employees có 5 nhân viên với lương như sau: [1000, 2000, NULL, 3000, NULL]. Dự đoán kết quả in ra của câu lệnh SQL sau:",
      snippet: `SELECT COUNT(*), COUNT(salary) FROM employees;`,
      question: "Nhập kết quả của COUNT(*) và COUNT(salary) cách nhau bởi dấu cách (ví dụ: x y):",
      expectedAnswers: ["5 3", "5, 3", "5,3", "5/3"],
      explanation: "COUNT(*) đếm toàn bộ số dòng trong bảng bất kể có giá trị NULL hay không -> trả về 5. COUNT(column) chỉ đếm các dòng có giá trị KHÁC NULL tại cột đó -> có 3 dòng có lương -> trả về 3. Kết quả: 5 3.",
      hint: "COUNT(*) đếm dòng, COUNT(cột) bỏ qua các ô có giá trị NULL."
    },
    {
      id: "IT-20",
      domain: "sql",
      domainLabel: "SQL & Database",
      tier: "Trung bình",
      topic: "N+1 Query Problem trong ORM",
      langTag: "SQL",
      type: "choice",
      problem: "Khi dùng Hibernate / JPA hoặc Prisma / TypeORM, ta lấy ra 100 tác giả (Authors) và lặp qua từng tác giả để in ra danh sách sách (Books) của họ. Hiện tượng N+1 Query xảy ra như thế nào?",
      snippet: `List<Author> authors = authorRepo.findAll(); // 1 query
for (Author a : authors) {
    System.out.println(a.getBooks().size()); // N query con!
}`,
      question: "Giải pháp kiến trúc chuẩn mực để loại bỏ hoàn toàn vấn đề N+1 là gì?",
      options: [
        "A. Sử dụng JOIN FETCH (hoặc Eager loading with join) để lấy toàn bộ dữ liệu trong đúng 1 query duy nhất",
        "B. Tăng dung lượng bộ nhớ RAM của database server",
        "C. Chuyển cơ sở dữ liệu sang MongoDB",
        "D. Đặt thuộc tính fetch = FetchType.EAGER trên mối quan hệ @OneToMany mà không cần sửa query"
      ],
      correctIndex: 0,
      explanation: "N+1 Query xảy ra khi phát sinh 1 query ban đầu để lấy danh sách cha (N phần tử) và thêm N query con để lấy danh sách con của từng cha. Giải pháp triệt để là sử dụng JOIN FETCH hoặc batch fetch/subselect để gộp việc truy vấn trong 1 câu SQL duy nhất.",
      hint: "JOIN FETCH gom cha và con về cùng một câu lệnh truy vấn."
    },

    // ================= SYSTEM DESIGN & ARCHITECTURE =================
    {
      id: "IT-21",
      domain: "system",
      domainLabel: "System Design",
      tier: "Trung bình",
      topic: "Rate Limiting · Thuật toán Token Bucket",
      langTag: "Architecture",
      type: "choice",
      problem: "Hệ thống API Gateway cần giới hạn tốc độ truy cập (Rate Limit) cho phép chịu được các đợt lưu lượng bùng nổ ngắn (burst traffic) nhưng vẫn kiểm soát tốc độ trung bình ổn định theo thời gian.",
      snippet: `TokenBucket:
- Dung lượng tối đa (Capacity): B token
- Tốc độ nạp (Refill Rate): R token / giây
Mỗi request tiêu thụ 1 token. Nếu không còn token -> 429 Too Many Requests.`,
      question: "Ưu điểm vượt trội của Token Bucket so với Fixed Window Counter là gì?",
      options: [
        "A. Cho phép xử lý lưu lượng bùng nổ (burst) hợp lệ và không bị lỗi nghẽn lưu lượng gấp đôi ở biên cửa sổ (boundary problem)",
        "B. Không cần lưu trữ trạng thái vào bộ nhớ Redis",
        "C. Tự động mã hóa dữ liệu request trước khi chuyển vào backend",
        "D. Có thể thay thế hoàn toàn Web Application Firewall (WAF)"
      ],
      correctIndex: 0,
      explanation: "Fixed Window có nhược điểm chí mạng: 100 req ở cuối phút thứ 1 và 100 req ở đầu phút thứ 2 khiến hệ thống nhận 200 req trong vài giây (vượt ngưỡng cho phép). Token Bucket cho phép burst tối đa dung lượng B và bổ sung token đều đặn theo tốc độ R, giải quyết triệt để vấn đề biên.",
      hint: "Bình token có thể chứa sẵn một lượng token để xả nhanh khi có lượng truy cập đột biến."
    },
    {
      id: "IT-22",
      domain: "system",
      domainLabel: "System Design",
      tier: "Nâng cao",
      topic: "Cache Breakdown vs Cache Avalanche",
      langTag: "Architecture",
      type: "choice",
      problem: "Trong kiến trúc Caching phân tán (Redis), hiện tượng 'Cache Avalanche' (Tuyết lở bộ nhớ đệm) xảy ra khi nào và giải pháp phòng thủ hiệu quả nhất là gì?",
      snippet: `Kịch bản: Hàng triệu key cache đồng loạt hết hạn (expire) cùng một thời điểm...`,
      question: "Nguyên nhân và giải pháp chuẩn xác là gì?",
      options: [
        "A. Xảy ra khi số lượng lớn key hết hạn cùng lúc khiến toàn bộ request đổ thẳng vào DB; giải pháp là thêm thời gian ngẫu nhiên (Jitter/Random TTL) vào thời gian hết hạn",
        "B. Xảy ra khi Redis bị mất kết nối mạng; giải pháp là tắt cache và đọc trực tiếp từ DB",
        "C. Xảy ra khi client gửi request rác liên tục; giải pháp là dùng Bloom Filter",
        "D. Xảy ra khi DB bị đầy ổ cứng; giải pháp là nâng cấp ổ cứng SSD"
      ],
      correctIndex: 0,
      explanation: "Cache Avalanche xảy ra khi lượng lớn key cache có cùng TTL và cùng hết hạn một lúc (hoặc Redis node sập), khiến toàn bộ request chọc thủng thẳng xuống DB làm DB quá tải và sập dây chuyền. Giải pháp kinh điển là cộng thêm một khoảng thời gian ngẫu nhiên (vd: TTL = 3600s + random(0, 300s)) để thời điểm hết hạn rải đều.",
      hint: "Tránh để hàng triệu key cùng hết hạn đúng một giây: thêm thời gian ngẫu nhiên (jitter)."
    },
    {
      id: "IT-23",
      domain: "system",
      domainLabel: "System Design",
      tier: "Trung bình",
      topic: "Định lý CAP · Tính nhất quán vs Tính sẵn sàng",
      langTag: "Architecture",
      type: "choice",
      problem: "Theo định lý CAP (Consistency, Availability, Partition Tolerance), trong một hệ thống phân tán khi xảy ra đứt gãy mạng giữa các phân vùng (Network Partition - P), kiến trúc sư bắt buộc phải lựa chọn giữa hai yếu tố nào?",
      snippet: `CAP Theorem:
- C: Mọi node đều đọc được dữ liệu mới nhất giống nhau
- A: Mọi request đều nhận được phản hồi không lỗi
- P: Hệ thống vẫn hoạt động dù mất kết nối giữa các node`,
      question: "Lựa chọn thực tế khi có Network Partition là gì?",
      options: [
        "A. Hoặc chọn Consistency (từ chối request nếu dữ liệu chưa đồng bộ) hoặc chọn Availability (trả lời dữ liệu có thể cũ)",
        "B. Có thể chọn cả 3 yếu tố C, A và P nếu dùng phần cứng mạng cao cấp",
        "C. Chỉ cần cài đặt Redis Cluster là tự động đạt cả C, A và P",
        "D. Định lý CAP chỉ áp dụng cho hệ thống blockchain, không áp dụng cho web backend"
      ],
      correctIndex: 0,
      explanation: "Trong hệ thống mạng phân tán, sự cố đứt gãy mạng (P) là điều không thể tránh khỏi. Khi P xảy ra, nếu muốn đảm bảo Tính nhất quán (C), hệ thống phải từ chối ghi/đọc ở node bị cô lập (mất A). Nếu muốn tiếp tục phục vụ (A), node bị cô lập phải chấp nhận xử lý với dữ liệu có thể đã cũ (mất C). Không bao giờ có hệ thống CA tồn tại khi có P.",
      hint: "Khi đứt mạng: Hoặc khóa hệ thống chờ đồng bộ (C), hoặc cho chạy tiếp với rủi ro lệch số (A)."
    },
    {
      id: "IT-24",
      domain: "system",
      domainLabel: "System Design",
      tier: "Trung bình",
      topic: "Idempotency · Tính lũy thừa trong API Thanh toán",
      langTag: "Architecture",
      type: "choice",
      problem: "Tại sao các API thanh toán (Payment Gateway như Stripe, VNPay) hoặc webhook luôn bắt buộc sử dụng Idempotency-Key trong header của request?",
      snippet: `POST /api/v1/payments/charge
Header: Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`,
      question: "Mục đích cốt lõi của Idempotency Key là gì?",
      options: [
        "A. Đảm bảo nếu client gửi lại request nhiều lần do timeout mạng, tài khoản khách hàng chỉ bị trừ tiền đúng 1 lần duy nhất",
        "B. Dùng để mã hóa số thẻ ngân hàng của khách hàng theo chuẩn PCI-DSS",
        "C. Giúp request chạy nhanh hơn nhờ tính năng nén dữ liệu gzip",
        "D. Tự động kiểm tra số dư trong tài khoản người nhận"
      ],
      correctIndex: 0,
      explanation: "Mạng internet không tin cậy: client có thể gửi request trừ tiền, server trừ tiền thành công nhưng phản hồi bị drop trên đường truyền. Khi client retry request, server dùng Idempotency-Key để nhận diện giao dịch này đã được thực hiện, trả về kết quả cũ mà KHÔNG trừ tiền thêm lần nữa.",
      hint: "Idempotent: Thực hiện 1 lần hay 100 lần thì kết quả và tác dụng phụ (trừ tiền) vẫn như nhau."
    },

    // ================= ANGULAR =================
    {
      id: "IT-25",
      domain: "angular",
      domainLabel: "Angular",
      tier: "Cơ bản",
      topic: "RxJS · BehaviorSubject vs Subject",
      langTag: "TypeScript",
      type: "input",
      problem: "Xem xét đoạn mã Angular / RxJS sau khi một subscriber đăng ký lắng nghe BehaviorSubject sau khi đã có dữ liệu được phát trước đó.",
      snippet: `import { BehaviorSubject } from 'rxjs';

const state$ = new BehaviorSubject<string>("init");
state$.next("logged-in");

// Subscriber lắng nghe:
state$.subscribe(val => {
    console.log(val);
});

state$.next("profile-loaded");`,
      question: "Nhập các chuỗi được in ra console theo đúng thứ tự (cách nhau bởi dấu cách):",
      expectedAnswers: ["logged-in profile-loaded", "logged-in, profile-loaded", "logged-in\nprofile-loaded"],
      explanation: "BehaviorSubject luôn lưu trữ một giá trị hiện tại (current value). Khi có một subscriber mới đăng ký, nó ngay lập tức phát ra giá trị gần nhất đó ('logged-in'), sau đó tiếp tục nhận các giá trị phát tiếp theo ('profile-loaded'). Giá trị 'init' ban đầu đã bị 'logged-in' ghi đè.",
      hint: "BehaviorSubject nhớ giá trị gần nhất và phát ngay cho người đăng ký mới."
    },
    {
      id: "IT-26",
      domain: "angular",
      domainLabel: "Angular",
      tier: "Trung bình",
      topic: "ChangeDetection · OnPush & Object Mutation",
      langTag: "TypeScript",
      type: "choice",
      problem: "Một component Angular cấu hình ChangeDetectionStrategy.OnPush nhận input @Input() user = { name: 'Nam', age: 20 }. Khi cha chạy lệnh 'this.user.age = 21' mà không đổi tham chiếu đối tượng, vì sao component con KHÔNG re-render?",
      snippet: `@Component({
    selector: 'app-user-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<div>{{ user.age }}</div>'
})
export class UserCardComponent {
    @Input() user!: { name: string; age: number };
}`,
      question: "Cơ chế kiểm tra thay đổi của OnPush hoạt động như thế nào?",
      options: [
        "A. OnPush so sánh tham chiếu đối tượng qua phép so sánh bằng ba (===); sửa thuộc tính bên trong không đổi địa chỉ ô nhớ nên Angular bỏ qua Change Detection",
        "B. OnPush tự động đóng băng (Object.freeze) toàn bộ dữ liệu @Input()",
        "C. OnPush chỉ chạy trên server-side rendering (SSR), không hoạt động trên trình duyệt",
        "D. Angular tự động chuyển mọi Object thành Immutable.js nên lệnh gán bị lỗi runtime"
      ],
      correctIndex: 0,
      explanation: "Với OnPush, Angular chỉ kích hoạt Change Detection cho component khi phát hiện tham chiếu @Input() thay đổi (shallow comparison ===). Việc gán thuộc tính 'this.user.age = 21' chỉ thay đổi nội dung bên trong vùng nhớ cũ, tham chiếu đối tượng không đổi -> Angular coi như không có gì thay đổi. Giải pháp chuẩn: this.user = { ...this.user, age: 21 }.",
      hint: "OnPush so sánh địa chỉ tham chiếu (===), không quét đệ quy các trường bên trong object."
    },
    {
      id: "IT-27",
      domain: "angular",
      domainLabel: "Angular",
      tier: "Cơ bản",
      topic: "Angular Signals · Tính toán phản ứng (Reactivity)",
      langTag: "TypeScript",
      type: "input",
      problem: "Từ Angular 16+, Signals được giới thiệu làm mô hình phản ứng mới. Hãy dự đoán giá trị in ra màn hình của hàm computed double() sau khi cập nhật signal count.",
      snippet: `import { signal, computed } from '@angular/core';

const count = signal(3);
const double = computed(() => count() * 2);

count.set(7);
console.log(double());`,
      question: "Giá trị in ra console của double() là bao nhiêu?",
      expectedAnswers: ["14", "14\n"],
      explanation: "Signal 'count' có giá trị ban đầu là 3. Sau khi gọi count.set(7), giá trị của count trở thành 7. Hàm computed 'double' tự động nhận biết dependency của nó đã đổi và tính toán lại: 7 * 2 = 14.",
      hint: "Lấy giá trị mới của count (7) nhân 2."
    },

    // ================= REACT =================
    {
      id: "IT-28",
      domain: "react",
      domainLabel: "React",
      tier: "Cơ bản",
      topic: "React 18 State Batching & Functional Updates",
      langTag: "JavaScript",
      type: "input",
      problem: "Trong component React sau, khi người dùng click nút một lần, hàm handleClick() được thực thi. Dự đoán giá trị của count ở lần render tiếp theo.",
      snippet: `const [count, setCount] = useState(0);

const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(prev => prev + 1);
};`,
      question: "Giá trị cuối cùng của count là bao nhiêu?",
      expectedAnswers: ["2", "2\n"],
      explanation: "Trong lần render hiện tại, count = 0. Lệnh 1: setCount(0 + 1) lên lịch gán count = 1. Lệnh 2: setCount(0 + 1) vẫn đọc count = 0 từ closure hiện tại, lên lịch gán count = 1 (ghi đè lệnh 1). Lệnh 3 dùng updater function (prev => prev + 1), nhận giá trị mới nhất đang chờ là 1 và cộng 1 -> kết quả cuối cùng là 2.",
      hint: "Hai lệnh đầu đọc chung count = 0 trong closure, lệnh thứ 3 nhận prev đã được tính."
    },
    {
      id: "IT-29",
      domain: "react",
      domainLabel: "React",
      tier: "Trung bình",
      topic: "useEffect · Stale Closure trong setInterval",
      langTag: "JavaScript",
      type: "input",
      problem: "Xem xét đoạn mã React Hooks sau. Component tăng count sau mỗi lần re-render, nhưng useEffect có dependency array rỗng [].",
      snippet: `const [count, setCount] = useState(0);

useEffect(() => {
    const timer = setInterval(() => {
        console.log(count);
    }, 1000);
    return () => clearInterval(timer);
}, []);`,
      question: "Sau 3 giây (khi count bên ngoài đã tăng lên 3), hàm setInterval trong effect sẽ in ra số mấy?",
      expectedAnswers: ["0", "0\n"],
      explanation: "Hiện tượng Stale Closure: Do dependency array là [] rỗng, effect chỉ chạy một lần duy nhất lúc component mount. Hàm callback trong setInterval bị đóng băng và 'bắt giữ' giá trị của biến count tại thời điểm mount đó (count = 0). Dù state bên ngoài có tăng lên bao nhiêu, hàm setInterval vẫn luôn nhìn thấy count = 0.",
      hint: "Dependency array rỗng khiến closure giữ nguyên giá trị state tại render đầu tiên."
    },
    {
      id: "IT-30",
      domain: "react",
      domainLabel: "React",
      tier: "Nâng cao",
      topic: "React Fiber Architecture",
      langTag: "Architecture",
      type: "choice",
      problem: "Kiến trúc React Fiber (từ React 16+) được thiết kế lại để giải quyết nhược điểm cốt lõi nào của Stack Reconciler cũ?",
      snippet: `Fiber = Unit of Work (Virtual Stack Frame)`,
      question: "Mục đích lớn nhất của React Fiber là gì?",
      options: [
        "A. Cho phép chia nhỏ công việc điều hòa (Reconciliation) thành các phần việc có thể tạm dừng, ưu tiên và tiếp tục lại để không làm nghẽn luồng UI chính (Main Thread)",
        "B. Loại bỏ hoàn toàn Virtual DOM để tương tác trực tiếp với Real DOM như Svelte",
        "C. Tự động chuyển code React thành WebAssembly để chạy nhanh gấp 10 lần",
        "D. Ngăn cản việc component con bị re-render khi component cha đổi state"
      ],
      correctIndex: 0,
      explanation: "Stack Reconciler cũ xử lý cây DOM đệ quy đồng bộ: một khi đã bắt đầu render cây lớn, JavaScript chiếm toàn bộ main thread cho đến khi xong, khiến animation giật lag và click bị trễ. React Fiber biến cây component thành danh sách liên kết các Fiber node (đơn vị công việc), cho phép engine tạm dừng khi có thao tác người dùng quan trọng và resume lại sau.",
      hint: "Fiber cho phép ngắt quãng, chia nhỏ thời gian (time-slicing) và ưu tiên công việc render."
    },

    // ================= NODE.JS =================
    {
      id: "IT-31",
      domain: "nodejs",
      domainLabel: "Node.js",
      tier: "Trung bình",
      topic: "Node.js Event Loop · process.nextTick vs setImmediate",
      langTag: "JavaScript",
      type: "input",
      problem: "Dự đoán chính xác thứ tự in ra console trong môi trường Node.js runtime của đoạn mã sau:",
      snippet: `setImmediate(() => console.log("immediate"));
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));
console.log("sync");`,
      question: "Nhập các từ in ra console theo đúng thứ tự (cách nhau bởi dấu cách):",
      expectedAnswers: ["sync nextTick promise immediate", "sync, nextTick, promise, immediate", "sync\nnextTick\npromise\nimmediate"],
      explanation: "1) 'sync' chạy ngay lập tức đồng bộ trên Call Stack. 2) 'process.nextTick' nằm trong nextTickQueue có độ ưu tiên cao nhất, chạy ngay khi Call Stack trống trước mọi microtask khác. 3) 'promise' nằm trong Promise Microtask Queue chạy tiếp theo. 4) 'immediate' nằm trong Check Phase của libuv Event Loop, chạy sau cùng.",
      hint: "Đồng bộ -> process.nextTick -> Promise -> setImmediate (Check phase)."
    },
    {
      id: "IT-32",
      domain: "nodejs",
      domainLabel: "Node.js",
      tier: "Nâng cao",
      topic: "Node.js Streams · Xử lý hiện tượng Backpressure",
      langTag: "JavaScript",
      type: "choice",
      problem: "Khi đọc một file dung lượng 10GB bằng fs.createReadStream và ghi vào socket mạng fs.createWriteStream, nếu tốc độ đọc nhanh hơn nhiều so với tốc độ ghi, hiện tượng gì xảy ra và làm sao phòng ngừa?",
      snippet: `// Đoạn mã chuẩn phòng ngừa Backpressure:
readable.pipe(writable);`,
      question: "Cơ chế điều tiết Backpressure hoạt động như thế nào?",
      options: [
        "A. Khi bộ nhớ đệm (internal buffer) của Writable Stream đầy, hàm .write() trả về false; Readable Stream tạm dừng đọc cho đến khi Writable Stream phát ra sự kiện 'drain'",
        "B. Node.js tự động nén dữ liệu bằng thuật toán zip trước khi gửi qua socket",
        "C. Writable Stream tự động hủy (drop) các gói tin đến sau nếu bộ đệm bị tràn",
        "D. Node.js sẽ tự động tạo thêm một process con mới để chia tải ghi file"
      ],
      correctIndex: 0,
      explanation: "Nếu ghi mà không điều tiết, RAM sẽ phình to cho đến khi Node.js bị crash vì lỗi heap out of memory. Khi buffer đạt ngưỡng highWaterMark, write() trả về false báo hiệu 'quá tải' (backpressure). Readable stream sẽ pause() và chỉ resume() khi Writable phát sự kiện 'drain' (đã tiêu thụ bớt buffer). Hàm .pipe() tự động quản lý vòng đời này.",
      hint: "Buffer đầy -> trả về false -> dừng đọc -> đợi sự kiện 'drain' xả bộ đệm."
    },
    {
      id: "IT-33",
      domain: "nodejs",
      domainLabel: "Node.js",
      tier: "Cơ bản",
      topic: "Node.js Module Caching",
      langTag: "JavaScript",
      type: "input",
      problem: "Trong Node.js, hàm require() có cơ chế lưu cache kết quả xuất ra (module caching). Xem xét file counter.js và app.js sau:",
      snippet: `// counter.js
let count = 0;
module.exports = { getCount: () => ++count };

// app.js
const c1 = require('./counter');
c1.getCount();
const c2 = require('./counter');
console.log(c2.getCount());`,
      question: "Kết quả in ra của c2.getCount() là bao nhiêu?",
      expectedAnswers: ["2", "2\n"],
      explanation: "Lần require('./counter') đầu tiên thực thi file và lưu kết quả vào require.cache. Lần require thứ hai lấy thẳng đối tượng đã cache trong bộ nhớ (singleton), chia sẻ chung biến 'count'. Do c1.getCount() đã tăng count từ 0 lên 1, nên c2.getCount() tiếp tục tăng count lên 2.",
      hint: "Node.js cache module sau lần require đầu tiên, cả c1 và c2 đều trỏ tới chung 1 instance."
    },

    // ================= VŨ TRỤ CHỊ EM CÔNG SỞ: CUNG HOÀNG ĐẠO & TAROT =================
    {
      id: "LADY-01",
      domain: "zodiac",
      domainLabel: "Cung Hoàng Đạo & Tarot",
      tier: "Cơ bản",
      topic: "Bốn nhóm nguyên tố Hoàng Đạo",
      type: "choice",
      problem: "Chiêm tinh học 12 cung hoàng đạo phân chia các chòm sao thành 4 nhóm nguyên tố đại diện cho tính cách: Lửa, Nước, Khí và Đất.",
      question: "Bộ 3 cung hoàng đạo nào sau đây cùng thuộc nhóm nguyên tố Lửa (Fire Signs) - nổi tiếng nhiệt huyết, thẳng thắn, tràn đầy năng lượng nhưng đôi khi nóng tính?",
      options: [
        "A. Bạch Dương (Aries) · Sư Tử (Leo) · Nhân Mã (Sagittarius)",
        "B. Kim Ngưu (Taurus) · Xử Nữ (Virgo) · Ma Kết (Capricorn)",
        "C. Song Tử (Gemini) · Thiên Bình (Libra) · Bảo Bình (Aquarius)",
        "D. Cự Giải (Cancer) · Bọ Cạp (Scorpio) · Song Ngư (Pisces)"
      ],
      correctIndex: 0,
      explanation: "Nhóm Lửa gồm Bạch Dương, Sư Tử, Nhân Mã. Nhóm Đất gồm Kim Ngưu, Xử Nữ, Ma Kết. Nhóm Khí gồm Song Tử, Thiên Bình, Bảo Bình. Nhóm Nước gồm Cự Giải, Bọ Cạp, Song Ngư.",
      hint: "Nhóm nguyên tố này tượng trưng cho ngọn lửa bùng cháy, đam mê và tính cách hướng ngoại bộc trực."
    },
    {
      id: "LADY-02",
      domain: "zodiac",
      domainLabel: "Cung Hoàng Đạo & Tarot",
      tier: "Cơ bản",
      topic: "Đoán tính cách cung hoàng đạo qua công việc",
      type: "choice",
      problem: "Trong môi trường công sở, mỗi cung hoàng đạo có một phong cách giải quyết công việc và deadline rất riêng biệt.",
      question: "Cung hoàng đạo nào được mệnh danh là 'chúa tể cầu toàn', hay soi từng dấu chấm phẩy, chuẩn bị báo cáo hoàn hảo đến từng pixel và ghét sự bừa bộn nhất văn phòng?",
      options: [
        "A. Xử Nữ (Virgo)",
        "B. Song Ngư (Pisces)",
        "C. Nhân Mã (Sagittarius)",
        "D. Song Tử (Gemini)"
      ],
      correctIndex: 0,
      explanation: "Xử Nữ (Virgo) nổi tiếng là cung hoàng đạo tỉ mỉ, chu đáo, có tiêu chuẩn cực kỳ cao và khả năng phân tích chi tiết sắc bén nhất trong 12 chòm sao.",
      hint: "Biểu tượng của cung này là một trinh nữ cầm bó lúa, luôn theo đuổi sự hoàn mỹ tuyệt đối."
    },
    {
      id: "LADY-03",
      domain: "zodiac",
      domainLabel: "Cung Hoàng Đạo & Tarot",
      tier: "Trung bình",
      topic: "Ý nghĩa lá bài Tarot khởi đầu",
      type: "input",
      problem: "Bộ bài Tarot truyền thống chuẩn Rider-Waite gồm 78 lá (22 lá Ẩn chính Major Arcana và 56 lá Ẩn phụ Minor Arcana).",
      question: "Lá bài số 0 trong bộ Ẩn chính tượng trưng cho bước chân vô tư, sự khởi đầu ngây thơ và hành trình phiêu lưu mới có tên tiếng Anh là gì? (Gợi ý: The F...)",
      expectedAnswers: ["The Fool", "Fool", "the fool"],
      explanation: "The Fool (Chàng Khờ) mang số 0, là biểu tượng của sự thuần khiết, can đảm bước về phía trước vào thế giới vô định với niềm tin lạc quan.",
      hint: "Người đứng ở mép vách đá với chú cún trắng trung thành."
    },
    {
      id: "LADY-04",
      domain: "zodiac",
      domainLabel: "Cung Hoàng Đạo & Tarot",
      tier: "Cơ bản",
      topic: "Lá bài The Empress trong Tarot",
      type: "choice",
      problem: "Lá bài The Empress (Lá số III) là một trong những lá bài tích cực nhất về cảm xúc và sáng tạo.",
      question: "Trong một trải bài công việc và cuộc sống, lá bài The Empress thường báo hiệu điều gì nổi bật nhất?",
      options: [
        "A. Sự màu mỡ, tài lộc trù phú, năng lượng sáng tạo và thấu cảm được nuôi dưỡng dồi dào",
        "B. Một sự đổ vỡ đột ngột đòi hỏi xây dựng lại từ đầu",
        "C. Bẫy cám dỗ vật chất và sự trói buộc tâm lý",
        "D. Sự lưỡng lự chưa đưa ra được quyết định dứt khoát"
      ],
      correctIndex: 0,
      explanation: "The Empress đại diện cho Nữ Hoàng Mẹ Thiên Nhiên, mang năng lượng của sự nuôi nấng, sung túc, đón nhận thành quả ngọt ngào và hòa hợp cảm xúc.",
      hint: "Hình ảnh một người phụ nữ quyền quý ngồi giữa cánh đồng lúa chín và thiên nhiên tươi tốt."
    },
    {
      id: "LADY-05",
      domain: "zodiac",
      domainLabel: "Cung Hoàng Đạo & Tarot",
      tier: "Cơ bản",
      topic: "Thần số học: Tính Con số chủ đạo (Life Path)",
      type: "input",
      problem: "Theo trường phái Thần số học Pitago, con số chủ đạo được tính bằng cách cộng tất cả các con số trong ngày tháng năm sinh (rút gọn về từ 2 đến 11).",
      question: "Một bạn nữ sinh ngày 15/08/1998 có Con số chủ đạo là bao nhiêu? (Cách tính: 1+5 + 0+8 + 1+9+9+8 = 6 + 8 + 27 = 41 -> 4+1 = ?)",
      expectedAnswers: ["5", "số 5", "so 5"],
      explanation: "Ngày 15 (1+5=6), Tháng 8, Năm 1998 (1+9+9+8=27 -> 2+7=9). Tổng: 6 + 8 + 9 = 23 -> 2+3 = 5 (hoặc 41 -> 4+1=5). Người mang số 5 là người yêu tự do, thích dịch chuyển và sáng tạo.",
      hint: "4 + 1 bằng mấy?"
    },

    // ================= VŨ TRỤ CHỊ EM CÔNG SỞ: SKINCARE & MỸ PHẨM =================
    {
      id: "LADY-06",
      domain: "skincare",
      domainLabel: "Skincare & Mỹ Phẩm",
      tier: "Cơ bản",
      topic: "Phân biệt tẩy tế bào chết hóa học AHA và BHA",
      type: "choice",
      problem: "Trong routine chăm sóc da của dân văn phòng ngồi máy lạnh thường xuyên bị bít tắc lỗ chân lông và mụn đầu đen.",
      question: "Hoạt chất nào tan trong dầu (lipid-soluble), có khả năng thấm sâu vào lỗ chân lông để hòa tan bã nhờn, trị mụn đầu đen và mụn ẩn hiệu quả?",
      options: [
        "A. BHA (Salicylic Acid)",
        "B. AHA (Glycolic Acid)",
        "C. Hyaluronic Acid (HA)",
        "D. L-Ascorbic Acid (Vitamin C)"
      ],
      correctIndex: 0,
      explanation: "BHA (Salicylic Acid) tan trong dầu nên làm sạch sâu trong lỗ chân lông. Trong khi đó AHA tan trong nước, chủ yếu hoạt động trên bề mặt da để tẩy da chết và làm sáng đều màu da.",
      hint: "Chữ 'B' viết tắt của Beta Hydroxy Acid."
    },
    {
      id: "LADY-07",
      domain: "skincare",
      domainLabel: "Skincare & Mỹ Phẩm",
      tier: "Cơ bản",
      topic: "Quy tắc thoa dưỡng da buổi tối chuẩn",
      type: "choice",
      problem: "Một routine dưỡng da buổi tối gồm nhiều sản phẩm: Nước hoa hồng (Toner), Tinh chất (Serum), Kem dưỡng ẩm (Cream), Tẩy trang và Sữa rửa mặt.",
      question: "Nguyên tắc vàng về kết cấu khi thoa các bước dưỡng da (Skincare Layering) là gì để dưỡng chất hấp thụ tốt nhất?",
      options: [
        "A. Lỏng trước · Đặc sau (Từ lỏng như nước, dạng gel rồi đến kem đặc khóa ẩm)",
        "B. Đặc trước · Lỏng sau (Bôi kem đặc trước rồi mới vỗ toner)",
        "C. Thoa dầu dưỡng ẩm (Face Oil) đầu tiên rồi mới thoa serum gốc nước",
        "D. Trộn lẫn tất cả các loại vào lòng bàn tay rồi thoa một lượt"
      ],
      correctIndex: 0,
      explanation: "Quy tắc chuẩn luôn là 'Lỏng trước - Đặc sau': Sản phẩm mỏng nhẹ thấm sâu trước, sản phẩm đậm đặc giàu chất dưỡng và khóa ẩm ở bước cuối cùng.",
      hint: "Sản phẩm dạng nước như toner/lotion luôn đi trước kem đặc."
    },
    {
      id: "LADY-08",
      domain: "skincare",
      domainLabel: "Skincare & Mỹ Phẩm",
      tier: "Cơ bản",
      topic: "Cấp cứu và phục hồi hàng rào bảo vệ da (Skin Barrier)",
      type: "choice",
      problem: "Khi da bị kích ứng, đỏ rát hoặc bong tróc do dùng hoạt chất treatment nồng độ cao (Retinol, BHA...).",
      question: "Bộ đôi thành phần lành tính nào sau đây được coi là 'vị cứu tinh' hàng đầu để làm dịu và củng cố màng lipid bảo vệ da?",
      options: [
        "A. Vitamin B5 (Panthenol) & Ceramide",
        "B. Cồn khô (Alcohol Denat) & Hương liệu nồng độ cao",
        "C. Tretinoin 0.1% & Tẩy da chết hạt scrub to",
        "D. Tinh dầu tràm trà nguyên chất chưa pha loãng"
      ],
      correctIndex: 0,
      explanation: "B5 (Panthenol) giúp làm dịu, giảm đỏ rát tức thì, kết hợp cùng Ceramide tái tạo và lấp đầy các liên kết lipid của hàng rào bảo vệ da.",
      hint: "Vitamin B5 và thành phần màng lipid tự nhiên của tế bào da."
    },
    {
      id: "LADY-09",
      domain: "skincare",
      domainLabel: "Skincare & Mỹ Phẩm",
      tier: "Cơ bản",
      topic: "Chỉ số bảo vệ tia UVA văn phòng",
      type: "input",
      problem: "Dù ngồi trong phòng làm việc, tia UVA từ ánh sáng mặt trời vẫn có thể xuyên qua cửa kính gây lão hóa, nhăn nheo và đứt gãy collagen.",
      question: "Chỉ số trên kem chống nắng thể hiện khả năng lọc tia UVA (gây lão hóa) được ký hiệu bằng 2 chữ cái nào kèm theo các dấu cộng (ví dụ: +++)?",
      expectedAnswers: ["PA", "pa", "PA+++", "PA++++"],
      explanation: "PA (Protection Grade of UVA) là chỉ số đo lường khả năng chống tia UVA theo thang điểm từ PA+ đến PA++++ của Hiệp hội Mỹ phẩm Nhật Bản.",
      hint: "Chữ cái P đứng trước, chữ A đứng sau."
    },
    {
      id: "LADY-10",
      domain: "skincare",
      domainLabel: "Skincare & Mỹ Phẩm",
      tier: "Trung bình",
      topic: "Lưu ý sống còn khi dùng Retinol",
      type: "choice",
      problem: "Retinol là tiêu chuẩn vàng chống lão hóa nhưng cũng là con dao hai lưỡi nếu dùng sai cách.",
      question: "Nguyên tắc quan trọng nhất cho người mới bắt đầu đưa Retinol vào routine dưỡng da là gì?",
      options: [
        "A. Bắt đầu từ nồng độ thấp (0.1% - 0.3%), dùng 1-2 lần/tuần kèm dưỡng ẩm kỹ và BẮT BUỘC dùng kem chống nắng phổ rộng ban ngày",
        "B. Thoa ngay Retinol 1.0% mỗi tối liên tục để nhanh bong da",
        "C. Ban ngày không cần bôi kem chống nắng vì Retinol chỉ thoa buổi tối",
        "D. Thoa Retinol trực tiếp lên vùng da mắt ướt để tăng độ thẩm thấu"
      ],
      correctIndex: 0,
      explanation: "Retinol làm tăng tốc độ chu chuyển tế bào khiến da nhạy cảm hơn với tia cực tím, do đó phải làm quen từ từ (low & slow), cấp ẩm phục hồi và bôi kem chống nắng nghiêm ngặt vào ban ngày.",
      hint: "Chậm mà chắc, bắt đầu từ nồng độ thấp và chống nắng cẩn thận."
    },

    // ================= VŨ TRỤ CHỊ EM CÔNG SỞ: TRÀ SỮA & ẨM THỰC =================
    {
      id: "LADY-11",
      domain: "food",
      domainLabel: "Trà Sữa & Ẩm Thực",
      tier: "Cơ bản",
      topic: "Công thức order trà sữa 'chuẩn healthy' của chị em",
      type: "choice",
      problem: "Chị em văn phòng thèm trà sữa lúc 3h chiều nhưng vẫn muốn giữ dáng và tránh quá ngọt ngấy.",
      question: "Tỉ lệ mức đường và đá nào sau đây được coi là công thức 'order quốc dân' quen thuộc nhất của chị em?",
      options: [
        "A. 50% đường · 70% đá",
        "B. 100% đường · 0% đá",
        "C. 150% đường · Nóng",
        "D. 0% đường · 0% đá"
      ],
      correctIndex: 0,
      explanation: "Mức 50% đường giúp giảm bớt vị ngọt gắt và lượng calo, trong khi 70% đá giữ độ lạnh vừa đủ mà không làm nhạt mất hương thơm đậm đà của trà.",
      hint: "Nửa đường và đá vừa phải mát lạnh."
    },
    {
      id: "LADY-12",
      domain: "food",
      domainLabel: "Trà Sữa & Ẩm Thực",
      tier: "Cơ bản",
      topic: "Topping trà sữa giòn ngọt tự nhiên",
      type: "input",
      problem: "Trong các loại topping trà sữa, có một loại topping được làm từ củ gọt vỏ cắt hạt lựu, áo một lớp bột năng mỏng rồi luộc chín, ăn giòn sần sật mọng nước.",
      question: "Loại thạch giòn sần sật này được làm từ củ gì? (Gợi ý: Củ N...)",
      expectedAnswers: ["củ năng", "thạch củ năng", "cu nang", "thach cu nang"],
      explanation: "Thạch củ năng giòn rụm bên trong, dai dẻo lớp bột năng bên ngoài là topping cực kỳ được ưa chuộng trong các món trà trái cây và trà sữa truyền thống.",
      hint: "Củ có ruột màu trắng ngà, vỏ đen sẫm, hay trồng ở miền Tây."
    },
    {
      id: "LADY-13",
      domain: "food",
      domainLabel: "Trà Sữa & Ẩm Thực",
      tier: "Cơ bản",
      topic: "Món ăn trưa 'chia rẽ nội bộ' công sở",
      type: "choice",
      problem: "Trưa nay ăn gì luôn là câu hỏi gây đau đầu nhất cho hội chị em công sở.",
      question: "Món ăn trưa nào siêu ngon và đậm đà nhưng thường bị 'cấm mang vào phòng họp máy lạnh kín' vì mùi hương bám dai dẳng suốt buổi chiều?",
      options: [
        "A. Bún đậu mắm tôm",
        "B. Salad ức gà sốt mè rang",
        "C. Cơm cuộn Kimbap rong biển",
        "D. Sandwich bơ trứng"
      ],
      correctIndex: 0,
      explanation: "Bún đậu mắm tôm là món ăn quốc dân gây nghiện cực độ, nhưng chén mắm tôm thơm lừng sẽ lan tỏa khắp không gian phòng kín nếu ăn tại bàn làm việc!",
      hint: "Món ăn kèm chả cốm, nem rán, thịt luộc và chén nước chấm màu tím than."
    },
    {
      id: "LADY-14",
      domain: "food",
      domainLabel: "Trà Sữa & Ẩm Thực",
      tier: "Cơ bản",
      topic: "Món ăn vặt cứu đói 3h chiều của văn phòng",
      type: "choice",
      problem: "Tầm 3h - 3h30 chiều là lúc năng lượng tụt giảm và các hội nhóm bắt đầu mở app đặt đồ ăn vặt.",
      question: "Món ăn vặt đặc sản có nguồn gốc từ Tây Ninh làm mưa làm gió trong các hộc bàn của chị em công sở là món gì?",
      options: [
        "A. Bánh tráng phơi sương cuộn muối tôm nhuyễn và bơ hành phi",
        "B. Kẹo cu đơ Hà Tĩnh",
        "C. Bánh cáy Thái Bình",
        "D. Chè lam Bắc Giang"
      ],
      correctIndex: 0,
      explanation: "Bánh tráng phơi sương dẻo quánh chấm cùng sốt bơ béo ngậy và muối tôm nhuyễn cay nồng là món ăn vặt 'gây nghiện' hàng đầu của các bạn nữ văn phòng.",
      hint: "Bánh tráng để qua đêm ngoài sương sớm Trảng Bàng."
    },
    {
      id: "LADY-15",
      domain: "food",
      domainLabel: "Trà Sữa & Ẩm Thực",
      tier: "Cơ bản",
      topic: "Cà phê trend đập tan cơn buồn ngủ",
      type: "input",
      problem: "Một thức uống cà phê nổi tiếng bắt nguồn từ cố đô Huế, kết hợp giữa vị đắng của cà phê phin và lớp kem mặn béo ngậy phía trên, tạo nên cơn sốt khắp các văn phòng.",
      question: "Thức uống cà phê này có tên gọi là Cà phê gì?",
      expectedAnswers: ["cà phê muối", "muối", "ca phe muoi", "cafe muoi", "muoi"],
      explanation: "Cà phê muối với lớp kem béo mằn mặn hòa quyện vị đắng ngọt giúp cân bằng vị giác hoàn hảo, là thức uống 'ruột' buổi sáng của rất nhiều bạn trẻ.",
      hint: "Vị mặn của biển cả hòa cùng cà phê."
    },

    // ================= VŨ TRỤ CHỊ EM CÔNG SỞ: DRAMA & TIẾNG LÓNG GEN Z =================
    {
      id: "LADY-16",
      domain: "office_life",
      domainLabel: "Drama & Tiếng Lóng Công Sở",
      tier: "Cơ bản",
      topic: "Dấu hiệu 'Red Flag' trong môi trường làm việc",
      type: "choice",
      problem: "Chọn công ty văn minh là ưu tiên hàng đầu để bảo vệ sức khỏe tinh thần (Mental Health) của chị em.",
      question: "Câu nói nào của nhà tuyển dụng được cộng đồng mạng coi là 'Red Flag' (báo động đỏ) điển hình nhất của văn hóa bóc lột?",
      options: [
        "A. 'Ở đây chúng tôi xem nhân viên như một gia đình' (kèm yêu cầu OT không lương và cống hiến hết mình)",
        "B. 'Công ty có chính sách làm việc linh hoạt Hybrid và hỗ trợ trang thiết bị'",
        "C. 'Bảo hiểm và phúc lợi được đóng đầy đủ trên 100% lương thực nhận'",
        "D. 'Mỗi năm có 14-16 ngày phép và review lương định kỳ 2 lần/năm'"
      ],
      correctIndex: 0,
      explanation: "Khái niệm 'coi nhau như gia đình' thường bị lạm dụng để xóa nhòa ranh giới công việc - đời sống cá nhân, bắt nhân viên làm thêm giờ không lương hoặc làm những việc ngoài phạm vi trách nhiệm.",
      hint: "Gia đình thì không tính tiền công làm việc."
    },
    {
      id: "LADY-17",
      domain: "office_life",
      domainLabel: "Drama & Tiếng Lóng Công Sở",
      tier: "Cơ bản",
      topic: "Tiếng lóng Gen Z: Khoe thành tích",
      type: "input",
      problem: "Từ lóng tiếng Anh gồm 4 chữ cái, vốn xuất phát từ giới hip-hop nhưng nay được dùng để chỉ hành vi khoe khoang của cải, thành tích học tập hoặc sự may mắn một cách đầy tự tin.",
      question: "Từ lóng này là gì? (Gợi ý: F...)",
      expectedAnswers: ["flex", "Flex", "FLEX"],
      explanation: "Flex là từ lóng chỉ hành động khoe mẽ khéo léo hoặc trực diện, từng tạo nên trào lưu 'Flex đến hơi thở cuối cùng' trên mạng xã hội.",
      hint: "Bắt đầu bằng chữ F, kết thúc bằng chữ X."
    },
    {
      id: "LADY-18",
      domain: "office_life",
      domainLabel: "Drama & Tiếng Lóng Công Sở",
      tier: "Cơ bản",
      topic: "Tiếng lóng kiểm tra tính xác thực",
      type: "choice",
      problem: "Khi có một tin đồn hoặc phát ngôn chưa được kiểm chứng lan truyền trong hội hóng drama công sở.",
      question: "Cụm từ nào bắt nguồn từ công nghệ video hỗ trợ trọng tài bóng đá được giới trẻ dùng với nghĩa 'yêu cầu đưa bằng chứng xác thực lời nói'?",
      options: [
        "A. Check VAR",
        "B. Penalty",
        "C. Việt vị (Off-side)",
        "D. Ném biên (Throw-in)"
      ],
      correctIndex: 0,
      explanation: "'Check VAR' là hành động soi xét lại bằng chứng, tin nhắn, hình ảnh hoặc camera để xác định sự thật một vụ việc.",
      hint: "Công nghệ hỗ trợ trọng tài xem lại video quay chậm."
    },
    {
      id: "LADY-19",
      domain: "office_life",
      domainLabel: "Drama & Tiếng Lóng Công Sở",
      tier: "Trung bình",
      topic: "Nghệ thuật từ chối nhận thêm task ngoài giờ",
      type: "choice",
      problem: "Sếp hoặc đồng nghiệp gửi thêm một task gấp vào lúc 5h45 chiều trong khi bạn đã có lịch trình cá nhân quan trọng.",
      question: "Cách phản hồi nào sau đây vừa thể hiện tính chuyên nghiệp, khéo léo vừa bảo vệ được ranh giới cá nhân?",
      options: [
        "A. 'Dạ em đã nhận được thông tin. Vì hiện tại đã hết giờ làm việc và em đang có lịch trình cố định, em sẽ ưu tiên xử lý task này vào đầu giờ sáng mai lúc 8h30 để đảm bảo kết quả tốt nhất ạ.'",
        "B. 'Seen không trả lời, tắt máy về thẳng.'",
        "C. 'Sao lúc nào cũng dí việc muộn thế, ai rảnh mà làm!'",
        "D. 'Cứ nhận lời bừa rồi để đó không làm.'"
      ],
      correctIndex: 0,
      explanation: "Xác nhận đã nhận thông tin, nêu rõ mốc thời gian sẽ xử lý và cam kết chất lượng vào ca làm việc tiếp theo là kỹ năng giao tiếp công sở đỉnh cao giúp giữ vững sự tôn trọng hai chiều.",
      hint: "Lịch sự, rõ ràng về mốc thời gian hoàn thành vào ngày hôm sau."
    },
    {
      id: "LADY-20",
      domain: "office_life",
      domainLabel: "Drama & Tiếng Lóng Công Sở",
      tier: "Trung bình",
      topic: "Thuật ngữ tâm lý độc hại nơi công sở",
      type: "choice",
      problem: "Một hiện tượng tâm lý độc hại khi một người liên tục bóp méo sự thật, nói rằng 'Tôi có nói thế đâu' hoặc 'Em nhạy cảm quá đấy' khiến nạn nhân nghi ngờ chính trí nhớ và năng lực của mình.",
      question: "Thuật ngữ tâm lý học phổ biến này được gọi là gì?",
      options: [
        "A. Gaslighting (Thao túng tâm lý)",
        "B. Micromanagement (Quản lý vi mô)",
        "C. Brainstorming (Động não sáng tạo)",
        "D. Team building (Gắn kết đội ngũ)"
      ],
      correctIndex: 0,
      explanation: "Gaslighting là hành vi thao túng tâm lý tinh vi làm cho đối phương nghi ngờ sự tỉnh táo, khả năng phán đoán hoặc ký ức của chính mình.",
      hint: "Thuật ngữ bắt nguồn từ một vở kịch và bộ phim cổ điển về chiếc đèn ga bị chỉnh sáng tối."
    },

    // ================= VŨ TRỤ CHỊ EM CÔNG SỞ: KỸ NĂNG HR & KẾ TOÁN & MKT =================
    {
      id: "LADY-21",
      domain: "workplace",
      domainLabel: "Kỹ Năng HR & Kế Toán & MKT",
      tier: "Cơ bản",
      topic: "Luật Lao động: Thời gian thử việc tối đa",
      type: "choice",
      problem: "Mọi bạn nữ khi bắt đầu nhận việc mới tại các công ty đều cần nắm vững quyền lợi thử việc của mình.",
      question: "Theo Bộ luật Lao động Việt Nam hiện hành, thời gian thử việc tối đa đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn, kỹ thuật từ cao đẳng trở lên là bao nhiêu ngày?",
      options: [
        "A. Không quá 60 ngày",
        "B. Không quá 30 ngày",
        "C. Không quá 90 ngày",
        "D. Không quá 180 ngày"
      ],
      correctIndex: 0,
      explanation: "Theo Điều 25 Bộ luật Lao động 2019: Thời gian thử việc tối đa là 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ từ cao đẳng trở lên (chỉ người quản lý doanh nghiệp mới thử việc tới 180 ngày).",
      hint: "Tương đương với khoảng 2 tháng làm việc."
    },
    {
      id: "LADY-22",
      domain: "workplace",
      domainLabel: "Kỹ Năng HR & Kế Toán & MKT",
      tier: "Cơ bản",
      topic: "Quyền lợi nghỉ phép năm hưởng nguyên lương",
      type: "input",
      problem: "Ngày phép năm là quyền lợi thiết yếu để chị em nghỉ ngơi, đi du lịch hoặc chăm sóc gia đình.",
      question: "Người lao động làm việc đủ 12 tháng cho một người sử dụng lao động trong điều kiện bình thường được nghỉ tối thiểu bao nhiêu ngày phép năm hưởng nguyên lương? (Điền số)",
      expectedAnswers: ["12", "12 ngày", "12 ngay"],
      explanation: "Theo Điều 113 Bộ luật Lao động, người làm việc đủ 12 tháng trong điều kiện bình thường được nghỉ 12 ngày làm việc hưởng nguyên lương (cứ 5 năm làm việc lại được cộng thêm 1 ngày).",
      hint: "Mỗi tháng tích lũy được 1 ngày phép."
    },
    {
      id: "LADY-23",
      domain: "workplace",
      domainLabel: "Kỹ Năng HR & Kế Toán & MKT",
      tier: "Trung bình",
      topic: "Kế toán: Tiêu chí hóa đơn điện tử hợp lệ",
      type: "choice",
      problem: "Chị em kế toán hoặc nhân viên khi đi ăn uống tiếp khách, mua sắm văn phòng phẩm cần lấy hóa đơn về thanh toán chi phí công ty.",
      question: "Khi nhận hóa đơn điện tử có mã của Cơ quan Thuế, điều kiện bắt buộc để hóa đơn có giá trị pháp lý kê khai thuế là gì?",
      options: [
        "A. Hóa đơn có đầy đủ định dạng file XML gốc và đã được cấp 'Mã của cơ quan thuế' cùng chữ ký số của người bán",
        "B. Chỉ cần bản in PDF chụp ảnh lại lưu vào điện thoại",
        "C. Có dấu mộc đỏ tròn đóng bằng tay lên bản giấy in ra",
        "D. Chỉ cần biên lai thu tiền viết tay từ quán ăn"
      ],
      correctIndex: 0,
      explanation: "Theo Nghị định 123/2020/NĐ-CP, hóa đơn điện tử hợp pháp phải lưu trữ file dữ liệu gốc XML, chứa chữ ký số và được hệ thống Cơ quan Thuế tiếp nhận cấp mã.",
      hint: "Định dạng dữ liệu gốc chuẩn của hóa đơn điện tử là file XML có chữ ký số."
    },
    {
      id: "LADY-24",
      domain: "workplace",
      domainLabel: "Kỹ Năng HR & Kế Toán & MKT",
      tier: "Cơ bản",
      topic: "Marketing: Mô hình AIDA kinh điển trong viết Content",
      type: "choice",
      problem: "Khi viết bài PR, caption bán hàng hoặc kịch bản video TikTok cho thương hiệu, công thức AIDA luôn là kim chỉ nam.",
      question: "Các chữ cái trong công thức AIDA đại diện cho quy trình tâm lý khách hàng theo thứ tự nào?",
      options: [
        "A. Attention (Gây chú ý) -> Interest (Tạo hứng thú) -> Desire (Khơi gợi khao khát) -> Action (Kêu gọi hành động)",
        "B. Analyze (Phân tích) -> Implement (Thực thi) -> Design (Thiết kế) -> Approve (Duyệt)",
        "C. Awareness (Nhận biết) -> Interaction (Tương tác) -> Demand (Nhu cầu) -> Agreement (Đồng thuận)",
        "D. Action (Hành động) -> Interest (Hứng thú) -> Desire (Khao khát) -> Attention (Chú ý)"
      ],
      correctIndex: 0,
      explanation: "AIDA là mô hình phễu marketing kinh điển: Bắt đầu bằng việc giật tít gây chú ý (Attention), giữ chân bằng nội dung thú vị (Interest), kích thích ham muốn sở hữu (Desire) và kết thúc bằng lời kêu gọi mua hàng (Action).",
      hint: "Đầu tiên phải làm người ta 'chú ý' trước rồi mới thuyết phục hành động."
    },
    {
      id: "LADY-25",
      domain: "workplace",
      domainLabel: "Kỹ Năng HR & Kế Toán & MKT",
      tier: "Cơ bản",
      topic: "Chỉ số hiệu quả quảng cáo ROAS",
      type: "input",
      problem: "Trong Digital Marketing, ROAS (Return On Ad Spend) là thước đo hiệu quả của chiến dịch quảng cáo được tính bằng: Doanh thu tạo ra chia cho Chi phí quảng cáo đã tiêu.",
      question: "Nếu một chiến dịch quảng cáo trên TikTok Shop chi hết 10 triệu tiền ads và mang về trực tiếp 50 triệu doanh thu, chỉ số ROAS đạt bao nhiêu lần? (Điền số)",
      expectedAnswers: ["5", "5x", "5 lần", "5 lan"],
      explanation: "ROAS = Doanh thu / Chi phí = 50.000.000 / 10.000.000 = 5 (tức cứ bỏ ra 1 đồng quảng cáo mang về 5 đồng doanh thu).",
      hint: "50 chia cho 10 bằng mấy?"
    }
  ];

  function getCustomLevels() {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveCustomLevels(list) {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  function addCustomLevel(level) {
    if (!level || !level.topic) return null;
    const customs = getCustomLevels();
    const newId = `CUSTOM-${String(customs.length + 1).padStart(2, "0")}`;
    const newLevel = {
      ...level,
      id: newId,
      domainLabel: level.domainLabel || "Tự tạo / Đóng góp",
      isCustom: true
    };
    customs.push(newLevel);
    saveCustomLevels(customs);
    return newLevel;
  }

  function addBatchCustomLevels(levelsArray) {
    if (!Array.isArray(levelsArray) || levelsArray.length === 0) return 0;
    const customs = getCustomLevels();
    let count = 0;
    levelsArray.forEach((item) => {
      if (!item || !item.topic || !item.question) return;
      const newId = `CUSTOM-${String(customs.length + 1).padStart(2, "0")}`;
      customs.push({
        ...item,
        id: newId,
        domain: item.domain || "dsa",
        domainLabel: item.domainLabel || "Đề thi nạp nhanh",
        tier: item.tier || "Cơ bản",
        type: item.type || (Array.isArray(item.options) ? "choice" : "input"),
        isCustom: true
      });
      count++;
    });
    saveCustomLevels(customs);
    return count;
  }

  function getAllLevels() {
    return [...BASE_LEVELS, ...getCustomLevels()];
  }

  return {
    ALGO_LEVELS: BASE_LEVELS,
    getAllLevels,
    getCustomLevels,
    addCustomLevel,
    addBatchCustomLevels
  };
})();
