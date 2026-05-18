# Buổi thực hành 6 - Bài tổng hợp

## Ứng dụng GitHub Copilot hoặc công nghệ tương đương

## Xây dựng 30 yêu cầu phát triển cho phần mềm quản lý đăng ký môn học

Phần mềm được xây dựng cho môi trường trường đại học/cao đẳng, hỗ trợ ba nhóm người dùng chính: quản trị viên, sinh viên và giảng viên. Hệ thống giúp quản lý chương trình đào tạo, môn học, lớp học phần, đăng ký môn học, thời khóa biểu, điểm số và thông báo học vụ.

---

## Nhóm 1: Yêu cầu chức năng (Functional Requirements - 20 yêu cầu)

### 1. Quản lý tài khoản và hồ sơ người dùng

1. **Quản lý tài khoản người dùng:** Cho phép quản trị viên tạo mới, cập nhật, khóa hoặc mở khóa tài khoản sinh viên và giảng viên.
2. **Quản lý hồ sơ sinh viên:** Cho phép lưu trữ và cập nhật thông tin sinh viên như mã sinh viên, họ tên, ngành học, khóa học, năm nhập học, số điện thoại và email.
3. **Quản lý hồ sơ giảng viên:** Cho phép lưu trữ và cập nhật thông tin giảng viên như mã giảng viên, họ tên, khoa/bộ môn, học hàm, học vị và thông tin liên hệ.
4. **Tra cứu người dùng:** Cho phép tìm kiếm nhanh sinh viên hoặc giảng viên theo mã, họ tên, ngành, khoa hoặc trạng thái tài khoản.

### 2. Quản lý dữ liệu đào tạo

5. **Quản lý ngành đào tạo:** Cho phép quản trị viên thêm, sửa, xóa hoặc ngừng sử dụng thông tin ngành đào tạo.
6. **Quản lý chương trình đào tạo:** Cho phép thiết lập chương trình đào tạo theo ngành và khóa tuyển sinh, bao gồm danh sách môn học bắt buộc, môn tự chọn và tổng số tín chỉ yêu cầu.
7. **Quản lý môn học:** Cho phép thêm, sửa, xóa môn học với các thông tin như mã môn, tên môn, số tín chỉ, số tiết lý thuyết, số tiết thực hành và trạng thái hoạt động.
8. **Quản lý môn tiên quyết:** Cho phép khai báo các môn học tiên quyết để hệ thống kiểm tra điều kiện trước khi sinh viên đăng ký.

### 3. Quản lý học kỳ, lớp học phần và thời khóa biểu

9. **Quản lý học kỳ:** Cho phép quản trị viên tạo học kỳ, thiết lập năm học, thời gian bắt đầu, thời gian kết thúc và thời gian mở đăng ký môn học.
10. **Mở lớp học phần:** Cho phép tạo lớp học phần cho từng môn học trong từng học kỳ, gán giảng viên phụ trách, nhập sĩ số tối đa và trạng thái lớp.
11. **Quản lý lịch học:** Cho phép thiết lập lịch học cho lớp học phần theo thứ, buổi học, tiết bắt đầu, tiết kết thúc và phòng học.
12. **Kiểm tra trùng lịch:** Hệ thống tự động phát hiện và cảnh báo khi lịch học bị trùng phòng, trùng giảng viên hoặc trùng thời khóa biểu của sinh viên.

### 4. Đăng ký môn học của sinh viên

13. **Đăng ký môn học:** Cho phép sinh viên đăng ký các lớp học phần đang mở trong thời gian đăng ký hợp lệ.
14. **Kiểm tra điều kiện đăng ký:** Hệ thống tự động kiểm tra điều kiện tiên quyết, sĩ số lớp, trạng thái lớp, thời gian đăng ký và trùng lịch trước khi xác nhận đăng ký.
15. **Hủy đăng ký môn học:** Cho phép sinh viên hủy môn đã đăng ký trong thời hạn cho phép; hệ thống lưu lại lịch sử hủy để phục vụ quản lý.
16. **Tạo thời khóa biểu tự động:** Cho phép sinh viên chọn danh sách môn muốn học, sau đó hệ thống gợi ý tổ hợp lớp học phần phù hợp, không trùng lịch.

### 5. Quản lý học tập, điểm số và thông báo

17. **Xem thời khóa biểu:** Cho phép sinh viên và giảng viên xem thời khóa biểu cá nhân theo tuần, học kỳ hoặc từng lớp học phần.
18. **Nhập và xem điểm:** Cho phép giảng viên nhập điểm cho lớp học phần được phân công; sinh viên chỉ được xem điểm của chính mình.
19. **Gửi thông báo:** Cho phép quản trị viên và giảng viên gửi thông báo học vụ đến toàn trường, từng nhóm người dùng hoặc sinh viên trong lớp học phần.
20. **Báo cáo và thống kê:** Cho phép quản trị viên thống kê số lượng sinh viên đăng ký theo môn, theo lớp học phần, theo ngành, tình trạng lớp đầy/chưa đầy và xuất dữ liệu ra Excel hoặc PDF.

---

## Nhóm 2: Yêu cầu phi chức năng (Non-Functional Requirements - 10 yêu cầu)

### 1. Hiệu năng và khả năng mở rộng (Performance & Scalability)

21. **Tốc độ phản hồi:** Thời gian tải danh sách lớp học phần hoặc danh sách đăng ký không được quá 2 giây trong điều kiện mạng ổn định.
22. **Tải cao điểm:** Hệ thống phải chịu được tối thiểu 5.000 người dùng truy cập đồng thời, đặc biệt trong thời gian mở đăng ký môn học.

### 2. An toàn và bảo mật (Security)

23. **Mã hóa mật khẩu:** Toàn bộ mật khẩu tài khoản phải được mã hóa bằng thuật toán an toàn như BCrypt trước khi lưu vào cơ sở dữ liệu.
24. **Phân quyền truy cập:** Hệ thống phải phân quyền rõ ràng theo vai trò: quản trị viên được quản lý toàn hệ thống, giảng viên được quản lý lớp phụ trách, sinh viên chỉ thao tác trên dữ liệu của mình.
25. **Tự động hết phiên đăng nhập:** Hệ thống tự động yêu cầu đăng nhập lại khi người dùng không tương tác trong một khoảng thời gian quy định nhằm giảm nguy cơ lộ tài khoản.

### 3. Độ tin cậy và khả năng sử dụng (Reliability & Usability)

26. **Sao lưu dữ liệu:** Hệ thống phải tự động sao lưu cơ sở dữ liệu định kỳ mỗi ngày để tránh mất dữ liệu đăng ký, điểm số và hồ sơ người dùng.
27. **Thời gian hoạt động:** Hệ thống phải đảm bảo độ ổn định tối thiểu 99.5% mỗi năm, hạn chế gián đoạn trong các giai đoạn đăng ký học phần.
28. **Giao diện thân thiện:** Giao diện phải rõ ràng, dễ thao tác, cỡ chữ tối thiểu 14px, phù hợp với sinh viên, giảng viên và cán bộ phòng đào tạo.

### 4. Tương thích, bảo trì và pháp lý (Maintainability & Legal)

29. **Tương thích thiết bị:** Hệ thống phải hoạt động tốt trên các trình duyệt phổ biến như Chrome, Edge, Safari và có giao diện responsive trên điện thoại, máy tính bảng, máy tính bàn.
30. **Bảo mật thông tin cá nhân:** Hệ thống phải bảo vệ dữ liệu cá nhân, dữ liệu học tập và dữ liệu đăng ký môn học của sinh viên; không chia sẻ cho bên thứ ba nếu không có quyền hợp lệ.
