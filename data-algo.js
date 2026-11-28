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

  function getAllLevels() {
    return [...BASE_LEVELS, ...getCustomLevels()];
  }

  return {
    ALGO_LEVELS: BASE_LEVELS,
    getAllLevels,
    getCustomLevels,
    addCustomLevel
  };
})();
