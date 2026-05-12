# Mục Lục SRS - Hệ Thống Đăng Ký Môn Học

## 1. Giới Thiệu

### 1.1. Mục đích tài liệu

### 1.2. Phạm vi hệ thống

### 1.3. Đối tượng sử dụng

- Admin
- Sinh viên
- Giáo viên

### 1.4. Thuật ngữ và định nghĩa

### 1.5. Tài liệu tham khảo

## 2. Tổng Quan Hệ Thống

### 2.1. Bối cảnh hệ thống

### 2.2. Mục tiêu hệ thống

### 2.3. Chức năng tổng quát

### 2.4. Phân quyền người dùng

### 2.5. Quy trình nghiệp vụ chính

- Quản lý tài khoản
- Quản lý chương trình đào tạo
- Quản lý môn học
- Quản lý học kỳ
- Mở đăng ký môn học
- Sinh viên đăng ký môn học
- Tự động gợi ý thời khóa biểu phù hợp
- Giáo viên quản lý lớp học phần

## 3. Tech Stack Đề Xuất

### 3.1. Frontend

- Framework: ReactJS / Next.js
- UI Library: Ant Design / Material UI / Tailwind CSS
- State Management: Redux Toolkit / Zustand

### 3.2. Backend

- Framework: Node.js Express / NestJS / Spring Boot
- API: RESTful API
- Authentication: JWT, refresh token
- Authorization: Role-based access control

### 3.3. Database

- Hệ quản trị CSDL: PostgreSQL / MySQL / SQL Server
- ORM: Prisma / TypeORM / Hibernate

### 3.4. Công cụ hỗ trợ

- Version Control: Git, GitHub
- API Testing: Postman / Insomnia
- Documentation: Swagger / OpenAPI
- Deployment: Docker, Nginx

## 4. Yêu Cầu Chức Năng

### 4.1. Chức năng chung

#### 4.1.1. Đăng nhập

#### 4.1.2. Đăng xuất

#### 4.1.3. Đổi mật khẩu

#### 4.1.4. Quên mật khẩu

#### 4.1.5. Xem và cập nhật thông tin cá nhân

## 5. Chức Năng Role Admin

### 5.1. Quản lý tài khoản

#### 5.1.1. Tạo tài khoản admin, sinh viên, giáo viên

#### 5.1.2. Cập nhật thông tin tài khoản

#### 5.1.3. Khóa / mở khóa tài khoản

#### 5.1.4. Phân quyền người dùng

#### 5.1.5. Tìm kiếm và lọc danh sách tài khoản

### 5.2. Quản lý ngành đào tạo

#### 5.2.1. Thêm ngành đào tạo

#### 5.2.2. Cập nhật thông tin ngành đào tạo

#### 5.2.3. Xóa / ngừng sử dụng ngành đào tạo

#### 5.2.4. Danh sách ngành: CNTT, KTPM, HTTT, KHMT, ATTT,...

### 5.3. Quản lý chương trình đào tạo

#### 5.3.1. Tạo chương trình đào tạo cho từng ngành

#### 5.3.2. Cập nhật chương trình đào tạo

#### 5.3.3. Gán môn học vào chương trình đào tạo

#### 5.3.4. Quản lý môn bắt buộc và môn tự chọn

#### 5.3.5. Quản lý số tín chỉ yêu cầu

### 5.4. Quản lý môn học

#### 5.4.1. Thêm môn học

#### 5.4.2. Cập nhật thông tin môn học

#### 5.4.3. Xóa / ngừng mở môn học

#### 5.4.4. Quản lý số tín chỉ

#### 5.4.5. Quản lý môn học tiên quyết

### 5.5. Quản lý học kỳ

#### 5.5.1. Tạo học kỳ

#### 5.5.2. Cập nhật thời gian học kỳ

#### 5.5.3. Mở / đóng học kỳ

#### 5.5.4. Cấu hình thời gian đăng ký môn học

### 5.6. Quản lý lớp học phần

#### 5.6.1. Tạo lớp học phần cho môn học

#### 5.6.2. Gán giáo viên giảng dạy

#### 5.6.3. Thiết lập lịch học

#### 5.6.4. Thiết lập phòng học

#### 5.6.5. Thiết lập số lượng sinh viên tối đa

### 5.7. Quản lý đăng ký môn học

#### 5.7.1. Mở đợt đăng ký môn học

#### 5.7.2. Đóng đợt đăng ký môn học

#### 5.7.3. Theo dõi số lượng đăng ký

#### 5.7.4. Xử lý đăng ký bị trùng lịch

#### 5.7.5. Hủy đăng ký môn học cho sinh viên khi cần

#### 5.7.6. Xuất danh sách đăng ký môn học

### 5.8. Báo cáo và thống kê

#### 5.8.1. Thống kê số lượng sinh viên đăng ký theo môn

#### 5.8.2. Thống kê số lượng sinh viên đăng ký theo ngành

#### 5.8.3. Thống kê lớp học phần đầy / còn chỗ

#### 5.8.4. Xuất báo cáo Excel / PDF

## 6. Chức Năng Role Sinh Viên

### 6.1. Xem thông tin cá nhân

### 6.2. Xem chương trình đào tạo

#### 6.2.1. Xem danh sách môn học theo ngành

#### 6.2.2. Xem môn bắt buộc và môn tự chọn

#### 6.2.3. Xem tiến độ hoàn thành chương trình đào tạo

### 6.3. Xem danh sách môn học được đăng ký

#### 6.3.1. Lọc môn học theo học kỳ

#### 6.3.2. Lọc môn học theo ngành

#### 6.3.3. Xem thông tin môn học, số tín chỉ, điều kiện tiên quyết

### 6.4. Đăng ký môn học

#### 6.4.1. Chọn môn học muốn đăng ký

#### 6.4.2. Chọn lớp học phần

#### 6.4.3. Chọn giáo viên của môn học nếu có nhiều lớp

#### 6.4.4. Chọn ngày học / ca học mong muốn

#### 6.4.5. Kiểm tra trùng lịch

#### 6.4.6. Kiểm tra điều kiện môn tiên quyết

#### 6.4.7. Kiểm tra giới hạn số tín chỉ

#### 6.4.8. Xác nhận đăng ký môn học

#### 6.4.9. Hủy đăng ký môn học trong thời gian cho phép

### 6.5. Tự động tạo thời khóa biểu

#### 6.5.1. Chọn danh sách môn học cần đăng ký

#### 6.5.2. Chọn giáo viên ưu tiên

#### 6.5.3. Chọn ngày học ưu tiên

#### 6.5.4. Chọn ca học ưu tiên

#### 6.5.5. Tự động tìm kiếm thời khóa biểu phù hợp

#### 6.5.6. Gợi ý nhiều phương án thời khóa biểu

#### 6.5.7. Sắp xếp phương án theo mức độ phù hợp

#### 6.5.8. Cảnh báo khi không tìm được thời khóa biểu hợp lệ

#### 6.5.9. Xác nhận đăng ký từ thời khóa biểu được gợi ý

### 6.6. Xem thời khóa biểu

#### 6.6.1. Xem thời khóa biểu theo tuần

#### 6.6.2. Xem thời khóa biểu theo học kỳ

#### 6.6.3. Xuất thời khóa biểu

### 6.7. Xem lịch sử đăng ký môn học

### 6.8. Nhận thông báo

#### 6.8.1. Thông báo mở / đóng đăng ký môn học

#### 6.8.2. Thông báo thay đổi lịch học

#### 6.8.3. Thông báo lớp học phần bị hủy

## 7. Chức Năng Role Giáo Viên

### 7.1. Xem thông tin cá nhân

### 7.2. Xem danh sách lớp học phần được phân công

### 7.3. Xem lịch giảng dạy

### 7.4. Xem danh sách sinh viên trong lớp học phần

### 7.5. Quản lý thông tin lớp học phần

#### 7.5.1. Xem sĩ số lớp

#### 7.5.2. Xem lịch học và phòng học

#### 7.5.3. Gửi thông báo cho sinh viên trong lớp

### 7.6. Đề xuất thay đổi lịch dạy

### 7.7. Xuất danh sách sinh viên

## 8. Yêu Cầu Phi Chức Năng

### 8.1. Hiệu năng

### 8.2. Bảo mật

### 8.3. Khả dụng

### 8.4. Dễ sử dụng

### 8.5. Khả năng mở rộng

### 8.6. Sao lưu và phục hồi dữ liệu

### 8.7. Tương thích trình duyệt

## 9. Quy Tắc Nghiệp Vụ

### 9.1. Quy định số tín chỉ tối đa / tối thiểu mỗi học kỳ

### 9.2. Quy định môn học tiên quyết

### 9.3. Quy định điều kiện đăng ký môn học

### 9.4. Quy định trùng lịch học

### 9.5. Quy định số lượng sinh viên tối đa trong lớp học phần

### 9.6. Quy định thời gian mở / đóng đăng ký

### 9.7. Quy định hủy đăng ký môn học

## 10. Mô Hình Dữ Liệu Dự Kiến

### 10.1. User

### 10.2. Role

### 10.3. Student

### 10.4. Teacher

### 10.5. Major

### 10.6. Curriculum

### 10.7. Course

### 10.8. Prerequisite

### 10.9. Semester

### 10.10. ClassSection

### 10.11. Schedule

### 10.12. Room

### 10.13. Registration

### 10.14. Notification

## 11. Giao Diện Người Dùng

### 11.1. Giao diện đăng nhập

### 11.2. Dashboard Admin

### 11.3. Dashboard Sinh viên

### 11.4. Dashboard Giáo viên

### 11.5. Giao diện quản lý tài khoản

### 11.6. Giao diện quản lý chương trình đào tạo

### 11.7. Giao diện quản lý môn học

### 11.8. Giao diện quản lý học kỳ

### 11.9. Giao diện đăng ký môn học

### 11.10. Giao diện tạo thời khóa biểu tự động

### 11.11. Giao diện xem thời khóa biểu

## 12. Use Case

### 12.1. Use case Admin quản lý tài khoản

### 12.2. Use case Admin quản lý chương trình đào tạo

### 12.3. Use case Admin quản lý môn học

### 12.4. Use case Admin quản lý học kỳ

### 12.5. Use case Admin quản lý đăng ký môn học

### 12.6. Use case Sinh viên đăng ký môn học thủ công

### 12.7. Use case Sinh viên tạo thời khóa biểu tự động

### 12.8. Use case Sinh viên hủy đăng ký môn học

### 12.9. Use case Giáo viên xem lớp học phần

### 12.10. Use case Giáo viên gửi thông báo cho sinh viên

## 13. Ràng Buộc Hệ Thống

### 13.1. Ràng buộc công nghệ

### 13.2. Ràng buộc dữ liệu

### 13.3. Ràng buộc bảo mật

### 13.4. Ràng buộc vận hành

## 14. Kiểm Thử

### 14.1. Unit Test

### 14.2. Integration Test

### 14.3. API Test

### 14.4. UI Test

### 14.5. Test chức năng đăng ký môn học

### 14.6. Test thuật toán tạo thời khóa biểu tự động

### 14.7. Test phân quyền theo role

## 15. Phụ Lục

### 15.1. Sơ đồ use case

### 15.2. Sơ đồ ERD

### 15.3. Sơ đồ luồng xử lý đăng ký môn học

### 15.4. Sơ đồ thuật toán tạo thời khóa biểu tự động

### 15.5. Mẫu báo cáo và biểu mẫu
