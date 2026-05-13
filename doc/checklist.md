# Checklist Tiến Độ - Hệ Thống Đăng Ký Môn Học

Tham chiếu: [`plan.md`](./plan.md) (SRS-DKMH đã cập nhật §5 BR-001 → 011 và §7.2 schema).

Quy ước:

- `[ ]` = chưa làm
- `[~]` = đang làm
- `[x]` = đã xong
- `[!]` = bị block / chờ quyết định

Mỗi FR thường cần làm cả **Backend** (API + model + validation) và **Frontend** (UI + state). Cùng 1 FR-ID có thể xuất hiện ở cả 2 phần — tick độc lập theo công việc thực tế.

---

## 0. Hạ tầng & Setup

### 0.1. Backend skeleton

- [x] Khởi tạo Django REST Framework project (`backend/`)
- [x] Cấu hình PostgreSQL + Docker Compose
- [x] Cấu hình JWT auth (SimpleJWT) - access 60', refresh 7 ngày
- [x] Cấu hình Swagger / OpenAPI (drf-spectacular) tại `/api/docs/`
- [x] Cấu hình CORS cho frontend (5173, 3000)
- [x] Custom User model với role `ADMIN / STUDENT / TEACHER` + `is_locked` + `phone`
- [x] Migration đầu tiên cho app `accounts`
- [x] Endpoint login/refresh JWT
- [x] Endpoint quản lý user (Admin only) + `/me`
- [x] Chặn tạo tài khoản role ADMIN qua API (FR-ADM-ACC-006)
- [x] `StandardPagination` cho phép client override `page_size` (max 1000)
- [x] `HandleProtectedDeleteMixin` — trả 409 friendly khi xoá entity có FK PROTECT

### 0.2. Frontend skeleton

- [x] Khởi tạo project ReactJS + Vite (TypeScript)
- [x] Cấu hình Tailwind CSS + IBM Plex Sans/Mono
- [x] Cấu hình Zustand store (persist localStorage)
- [x] Setup router (react-router v6) + ProtectedRoute theo role
- [x] Service gọi API + interceptor JWT (auto refresh khi 401)
- [x] Layout chung + 3 dashboard skeleton (Admin / Sinh viên / Giáo viên)
- [x] Trang login + lưu token + refresh flow

### 0.3. DevOps

- [x] Dockerfile backend
- [x] docker-compose backend + postgres
- [ ] Dockerfile frontend
- [ ] docker-compose tích hợp full-stack
- [ ] File `.env.production.example`

### 0.4. Tài liệu

- [x] SRS (`plan.md`) — đã cập nhật §5 BR-001 → 011 và §7.2 schema
- [x] README backend
- [ ] README root project (mô tả full-stack)
- [ ] Sơ đồ ERD (TBD trong plan §13)
- [ ] Sơ đồ use case (TBD trong plan §13)
- [ ] Sơ đồ luồng đăng ký môn học (TBD trong plan §13)

---

## 1. Data Model (plan §7)

Tạo migration + model + serializer + viewset cho từng entity.

- [x] `User` (accounts) - 3 role
- [ ] `Major` - ngành đào tạo (CNTT, KTPM, HTTT, KHMT, ATTT)
- [ ] `Curriculum` - chương trình đào tạo
- [ ] `Course` - môn học
- [ ] `Prerequisite` - môn tiên quyết (self-ref qua Course)
- [ ] `Semester` - học kỳ
- [ ] `ClassSection` - lớp học phần
- [ ] `Schedule` - lịch học (bao gồm phòng học)
- [ ] `Registration` - đăng ký môn học
- [ ] `Grade` - điểm
- [ ] `Notification` - thông báo
- [ ] `Student` profile - mở rộng từ User
- [ ] `Teacher` profile - mở rộng từ User

---

## 2. Yêu cầu chung (plan §4.1)

- [x] FR-GEN-001 - Login bằng tài khoản hợp lệ
- [ ] FR-GEN-002 - Logout (blacklist refresh token)
- [ ] FR-GEN-003 - Đổi mật khẩu
- [ ] FR-GEN-004 - Quên mật khẩu (SHOULD)
- [x] FR-GEN-005 - Xem thông tin cá nhân (`/api/accounts/users/me/`)
- [ ] FR-GEN-006 - Cập nhật thông tin cá nhân
- [x] FR-GEN-007 - Phân quyền theo role (permission class)

---

## 3. Admin (plan §4.2)

### 3.1. Quản lý tài khoản

- [x] FR-ADM-ACC-001 - Tạo tài khoản SV/GV
- [ ] FR-ADM-ACC-002 - Cập nhật thông tin tài khoản
- [ ] FR-ADM-ACC-003 - Khóa / mở khóa tài khoản (toggle `is_locked`)
- [ ] FR-ADM-ACC-004 - Phân quyền theo role
- [ ] FR-ADM-ACC-005 - Tìm kiếm / lọc danh sách tài khoản
- [x] FR-ADM-ACC-006 - Chặn tạo tài khoản Admin qua API

### 1.3.1. Ngành đào tạo (FR-ADM-MAJ)

- [ ] FR-ADM-MAJ-001 - Thêm ngành
- [ ] FR-ADM-MAJ-002 - Cập nhật ngành
- [ ] FR-ADM-MAJ-003 - Xoá / ngừng ngành (soft delete)
- [ ] FR-ADM-MAJ-004 - Seed dữ liệu CNTT, KTPM, HTTT, KHMT, ATTT

### 1.3.2. Chương trình đào tạo (FR-ADM-CUR)

- [ ] FR-ADM-CUR-001 - Tạo chương trình theo ngành
- [ ] FR-ADM-CUR-002 - Cập nhật chương trình
- [ ] FR-ADM-CUR-003 - Gán môn học vào chương trình
- [ ] FR-ADM-CUR-004 - Phân loại bắt buộc / tự chọn
- [ ] FR-ADM-CUR-005 - Quản lý tổng tín chỉ yêu cầu

### 1.3.3. Môn học (FR-ADM-CRS)

- [ ] FR-ADM-CRS-001 - Thêm môn học
- [ ] FR-ADM-CRS-002 - Cập nhật môn học
- [ ] FR-ADM-CRS-003 - Xoá / ngừng mở môn học
- [ ] FR-ADM-CRS-004 - Quản lý số tín chỉ
- [ ] FR-ADM-CRS-005 - Quản lý môn tiên quyết

### 1.3.4. Học kỳ (FR-ADM-SEM)

- [ ] FR-ADM-SEM-001 - Tạo học kỳ
- [ ] FR-ADM-SEM-002 - Cập nhật thời gian học kỳ
- [ ] FR-ADM-SEM-003 - Mở / đóng học kỳ
- [ ] FR-ADM-SEM-004 - Cấu hình thời gian đăng ký

### 1.3.5. Lớp học phần (FR-ADM-CLS)

- [ ] FR-ADM-CLS-001 - Tạo lớp học phần cho môn
- [ ] FR-ADM-CLS-002 - Gán giáo viên
- [ ] FR-ADM-CLS-003 - Thiết lập lịch học
- [ ] FR-ADM-CLS-004 - Thiết lập phòng học
- [ ] FR-ADM-CLS-005 - Thiết lập sĩ số tối đa
- [ ] FR-ADM-CLS-006 - Cập nhật thông tin lớp học phần

### 1.3.6. Đăng ký môn học - Admin (FR-ADM-REG)

- [ ] FR-ADM-REG-001 - Mở đợt đăng ký
- [ ] FR-ADM-REG-002 - Đóng đợt đăng ký
- [ ] FR-ADM-REG-003 - Theo dõi số lượng SV đăng ký theo lớp
- [ ] FR-ADM-REG-004 - Phát hiện đăng ký trùng lịch
- [ ] FR-ADM-REG-005 - Hủy đăng ký cho SV (có lý do)
- [ ] FR-ADM-REG-006 - Xuất danh sách đăng ký

### 1.3.7. Báo cáo & thống kê (FR-ADM-RPT)

- [ ] FR-ADM-RPT-001 - API thống kê SV theo môn
- [ ] FR-ADM-RPT-002 - API thống kê SV theo ngành
- [ ] FR-ADM-RPT-003 - API thống kê lớp đầy / còn chỗ
- [ ] FR-ADM-RPT-004 - Xuất Excel / PDF (SHOULD)

### 3.9. Gửi thông báo

- [ ] FR-ADM-NOT-001 - Gửi thông báo cho SV
- [ ] FR-ADM-NOT-002 - Gửi thông báo cho GV

---

## 4. Sinh viên (plan §4.3)

### 4.1. Xem thông tin học tập

- [ ] FR-STU-INF-001 - Xem thông tin cá nhân
- [ ] FR-STU-CUR-001 - Xem chương trình đào tạo của ngành
- [ ] FR-STU-CUR-002 - Xem danh sách môn theo ngành
- [ ] FR-STU-CUR-003 - Phân biệt bắt buộc / tự chọn
- [ ] FR-STU-CUR-004 - Xem tiến độ hoàn thành (SHOULD)

### 1.4.2. Xem môn học được đăng ký (FR-STU-CRS)

- [ ] FR-STU-CRS-001 - Xem danh sách môn được phép đăng ký
- [ ] FR-STU-CRS-002 - Lọc theo học kỳ
- [ ] FR-STU-CRS-003 - Lọc theo ngành
- [ ] FR-STU-CRS-004 - Xem chi tiết môn, tín chỉ, tiên quyết

### 1.4.3. Đăng ký môn học thủ công (FR-STU-REG)

- [ ] FR-STU-REG-001 - Chọn môn học
- [ ] FR-STU-REG-002 - Chọn lớp học phần
- [ ] FR-STU-REG-003 - Chọn giáo viên (nếu nhiều GV)
- [ ] FR-STU-REG-004 - Chọn ngày học / ca học mong muốn
- [ ] FR-STU-REG-005 - Kiểm tra trùng lịch
- [ ] FR-STU-REG-006 - Kiểm tra môn tiên quyết
- [ ] FR-STU-REG-007 - Kiểm tra giới hạn tín chỉ
- [ ] FR-STU-REG-008 - Xác nhận đăng ký
- [ ] FR-STU-REG-009 - Hủy đăng ký trong thời gian cho phép

### 1.4.4. Tự động tạo TKB (FR-STU-TKB)

- [ ] FR-STU-TKB-001 - Chọn danh sách môn cần đăng ký
- [ ] FR-STU-TKB-002 - Chọn giáo viên ưu tiên
- [ ] FR-STU-TKB-003 - Chọn ngày học ưu tiên
- [ ] FR-STU-TKB-004 - Chọn ca học ưu tiên
- [ ] FR-STU-TKB-005 - Thuật toán tìm TKB phù hợp
- [ ] FR-STU-TKB-006 - Gợi ý nhiều phương án (SHOULD)
- [ ] FR-STU-TKB-007 - Sắp xếp phương án theo ưu tiên (SHOULD)
- [ ] FR-STU-TKB-008 - Cảnh báo không tìm được TKB hợp lệ
- [ ] FR-STU-TKB-009 - Xác nhận phương án trước khi ghi nhận

### 1.4.5. Xem TKB & lịch sử (FR-STU-SCH, FR-STU-HIS)

- [ ] FR-STU-SCH-001 - Xem TKB theo tuần
- [ ] FR-STU-SCH-002 - Xem TKB theo học kỳ
- [ ] FR-STU-SCH-003 - Xuất TKB (SHOULD)
- [ ] FR-STU-HIS-001 - Xem lịch sử đăng ký

### 1.4.6. Nhận thông báo (FR-STU-NOT)

- [ ] FR-STU-NOT-001 - Nhận thông báo mở / đóng đăng ký
- [ ] FR-STU-NOT-002 - Nhận thông báo lịch học thay đổi
- [ ] FR-STU-NOT-003 - Nhận thông báo lớp bị hủy
- [ ] FR-STU-NOT-004 - Nhận thông báo từ Admin

---

## 5. Giáo viên (plan §4.4)

### 5.1. Xem thông tin và lớp học phần

- [ ] FR-TEA-INF-001 - Xem thông tin cá nhân
- [ ] FR-TEA-CLS-001 - Xem danh sách lớp được phân công
- [ ] FR-TEA-SCH-001 - Xem TKB cá nhân
- [ ] FR-TEA-CLS-002 - Xem danh sách SV trong lớp
- [ ] FR-TEA-CLS-003 - Xem sĩ số lớp
- [ ] FR-TEA-CLS-004 - Xem lịch học và phòng học
- [ ] FR-TEA-CLS-005 - Gửi thông báo cho SV trong lớp (MAY)

### 1.5.2. Nhập điểm (FR-TEA-GRD)

- [ ] FR-TEA-GRD-001 - Nhập điểm quá trình
- [ ] FR-TEA-GRD-002 - Nhập điểm giữa kỳ
- [ ] FR-TEA-GRD-003 - Nhập điểm cuối kỳ
- [ ] FR-TEA-GRD-004 - Cập nhật điểm trong thời gian cho phép
- [ ] FR-TEA-GRD-005 - Xuất bảng điểm lớp

### 1.5.3. Khác (FR-TEA-REQ, FR-TEA-EXP, FR-TEA-NOT)

- [ ] FR-TEA-REQ-001 - Đề xuất thay đổi lịch dạy (MAY)
- [ ] FR-TEA-EXP-001 - Xuất danh sách SV trong lớp
- [ ] FR-TEA-NOT-001 - Nhận thông báo từ Admin

---

## 6. Business Rules (plan §5)

- [ ] BR-001 - Giới hạn tín chỉ tối thiểu / tối đa mỗi học kỳ
- [ ] BR-002 - Check môn tiên quyết khi đăng ký
- [ ] BR-003 - Chỉ cho đăng ký trong thời gian mở
- [ ] BR-004 - Chặn đăng ký khi trùng lịch
- [ ] BR-005 - Chặn đăng ký khi lớp đầy
- [ ] BR-006 - Áp dụng thời hạn hủy đăng ký
- [ ] BR-007 - GV chỉ nhập điểm cho lớp được phân công

[!] TBD: Số tín chỉ min/max, thời hạn hủy đăng ký, thời hạn cập nhật điểm (plan §5 TBD).

---

## 7. Non-Functional (plan §6)

- [x] NFR-SEC-001 - Xác thực trước khi truy cập (JWT)
- [x] NFR-SEC-002 - Phân quyền theo role (3 permission class)
- [x] NFR-SEC-003 - Bảo vệ dữ liệu điểm: GradeViewSet filter theo role (SV chỉ thấy điểm mình, GV chỉ lớp mình, Admin all)
- [ ] NFR-PER-001 - Phản hồi tra cứu trong thời gian chấp nhận được [!] TBD
- [ ] NFR-AVL-001 - Cơ chế sao lưu / phục hồi
- [x] NFR-USA-001 - Giao diện navy formal IBM Plex Sans, design system nhất quán
- [x] NFR-SCL-001 - Pagination 25/page, max 1000 — handle list nhiều record
- [ ] NFR-CMP-001 - Tương thích trình duyệt phổ biến (test Chrome OK, chưa test Firefox/Safari)

---

## 4. Verification / Testing (plan §11)

- [x] TEST-001 - Login, phân quyền — auth flow OK qua manual test
- [x] TEST-002 - Quản lý tài khoản (UI build OK + accounts API tests pass)
- [x] TEST-003 - Quản lý CTĐT (CRUD via UI + import xlsx)
- [x] TEST-004 - Quản lý môn học và tiên quyết (CRUD + prerequisite multi-select + filters via UI)
- [x] TEST-005 - Quản lý học kỳ và thời gian đăng ký (CRUD via UI + open/close)
- [x] TEST-006 - Quản lý lớp học phần (CRUD + schedule day/date range + scroll modal via UI)
- [ ] TEST-007 - Đăng ký môn học thủ công (BE ready, FE pending)
- [x] TEST-008 - BR-002 → BR-006 + signal (registration tests pass; full backend 33/33 pass)
- [ ] TEST-009 - Thuật toán tạo TKB tự động (chưa implement)
- [ ] TEST-010 - Xem TKB sinh viên (chưa implement)
- [ ] TEST-011 - Xem TKB giáo viên (chưa implement)
- [x] TEST-012 - Nhập điểm + BR-007/BR-008/BR-009 (pytest cases pass + auto-compute)
- [ ] TEST-013 - Gửi / nhận thông báo (chưa implement)
- [ ] TEST-014 - Báo cáo và thống kê (chưa implement)

---

## 9. Open Questions / Risks (plan §12)

- [x] OPEN - Quy định cụ thể số tín chỉ min/max, thời hạn hủy đăng ký, thời hạn cập nhật điểm
- [!] OPEN - Công thức tính điểm tổng kết (quá trình + giữa kỳ + cuối kỳ)
- [x] RISK - Độ phức tạp thuật toán TKB tự động khi quy mô tăng (tích hợp agent nâng cấp)

---

## 6. Sửa SRS

- [x] Cập nhật `plan.md` §2.2: `TypeORM` → `Django ORM` (TypeORM chỉ chạy với JS/TS, không tương thích Django)
