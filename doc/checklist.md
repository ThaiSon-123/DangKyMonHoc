# Checklist Tiến Độ - Hệ Thống Đăng Ký Môn Học

Tham chiếu: [`plan.md`](./plan.md) (SRS-DKMH v0.2).

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
- [x] Custom User model với role `ADMIN / STUDENT / TEACHER`
- [x] Migration đầu tiên cho app `accounts`
- [x] Endpoint login/refresh JWT
- [x] Endpoint quản lý user (Admin only) + `/me`
- [x] Chặn tạo tài khoản role ADMIN qua API (FR-ADM-ACC-006)

### 0.2. Frontend skeleton

- [x] Khởi tạo project ReactJS + Vite (TypeScript)
- [x] Cấu hình Tailwind CSS
- [x] Cấu hình Zustand store (persist localStorage)
- [x] Setup router (react-router v6) + ProtectedRoute theo role
- [x] Service gọi API + interceptor JWT (auto refresh khi 401)
- [x] Layout chung + 3 dashboard skeleton (Admin / Sinh viên / Giáo viên)
- [x] Trang login + lưu token + refresh flow

### 0.3. DevOps

- [x] Dockerfile backend
- [x] docker-compose backend + postgres
- [x] Dockerfile frontend (multi-stage: dev / build / production nginx)
- [x] docker-compose tích hợp full-stack (`docker-compose.yml` ở root)
- [x] docker-compose production (`docker-compose.prod.yml`)
- [x] File `.env.production.example`
- [x] `.dockerignore` cho backend & frontend
- [x] `.gitignore` ở root project

### 0.4. Tài liệu

- [x] SRS v0.2 (`plan.md`)
- [x] README backend

---

# 1. Backend (Django REST Framework)

## 1.1. Data Models & Migrations (plan §7)

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

## 1.2. Auth & Account API

### 1.2.1. Auth chung (FR-GEN)

- [x] FR-GEN-001 - `POST /api/auth/login/` (JWT)
- [ ] FR-GEN-002 - `POST /api/auth/logout/` (blacklist refresh token)
- [ ] FR-GEN-003 - `POST /api/accounts/change-password/`
- [ ] FR-GEN-004 - Quên mật khẩu (gửi email reset) (SHOULD)
- [x] FR-GEN-005 - `GET /api/accounts/users/me/`
- [ ] FR-GEN-006 - `PATCH /api/accounts/users/me/`
- [x] FR-GEN-007 - Permission class theo role

### 1.2.2. Admin quản lý tài khoản (FR-ADM-ACC)

- [x] FR-ADM-ACC-001 - API tạo SV/GV
- [ ] FR-ADM-ACC-002 - API cập nhật user
- [ ] FR-ADM-ACC-003 - API khoá/mở khoá (`is_locked`)
- [ ] FR-ADM-ACC-004 - API gán/đổi role
- [ ] FR-ADM-ACC-005 - Query param search/filter users
- [x] FR-ADM-ACC-006 - Chặn role=ADMIN khi tạo qua API

## 1.3. Admin domain APIs

### 1.3.1. Ngành đào tạo (FR-ADM-MAJ)

- [ ] FR-ADM-MAJ-001 - API thêm ngành
- [ ] FR-ADM-MAJ-002 - API cập nhật ngành
- [ ] FR-ADM-MAJ-003 - API xoá / ngừng ngành (soft delete)
- [ ] FR-ADM-MAJ-004 - Seed dữ liệu CNTT, KTPM, HTTT, KHMT, ATTT

### 1.3.2. Chương trình đào tạo (FR-ADM-CUR)

- [ ] FR-ADM-CUR-001 - API tạo chương trình theo ngành
- [ ] FR-ADM-CUR-002 - API cập nhật chương trình
- [ ] FR-ADM-CUR-003 - API gán môn học vào chương trình
- [ ] FR-ADM-CUR-004 - Field `is_required` cho môn (bắt buộc/tự chọn)
- [ ] FR-ADM-CUR-005 - Field tổng tín chỉ yêu cầu

### 1.3.3. Môn học (FR-ADM-CRS)

- [ ] FR-ADM-CRS-001 - API thêm môn học
- [ ] FR-ADM-CRS-002 - API cập nhật môn học
- [ ] FR-ADM-CRS-003 - API xoá / ngừng môn học
- [ ] FR-ADM-CRS-004 - Field `credits`
- [ ] FR-ADM-CRS-005 - API gán môn tiên quyết

### 1.3.4. Học kỳ (FR-ADM-SEM)

- [ ] FR-ADM-SEM-001 - API tạo học kỳ
- [ ] FR-ADM-SEM-002 - API cập nhật thời gian học kỳ
- [ ] FR-ADM-SEM-003 - API mở / đóng học kỳ
- [ ] FR-ADM-SEM-004 - Field `registration_start/end` cho học kỳ

### 1.3.5. Lớp học phần (FR-ADM-CLS)

- [ ] FR-ADM-CLS-001 - API tạo lớp học phần
- [ ] FR-ADM-CLS-002 - API gán giáo viên
- [ ] FR-ADM-CLS-003 - API set lịch học (Schedule)
- [ ] FR-ADM-CLS-004 - Field `room` trong Schedule
- [ ] FR-ADM-CLS-005 - Field `max_students`
- [ ] FR-ADM-CLS-006 - API cập nhật lớp học phần

### 1.3.6. Đăng ký môn học - Admin (FR-ADM-REG)

- [ ] FR-ADM-REG-001 - API mở đợt đăng ký
- [ ] FR-ADM-REG-002 - API đóng đợt đăng ký
- [ ] FR-ADM-REG-003 - API thống kê SV theo lớp
- [ ] FR-ADM-REG-004 - Logic detect trùng lịch
- [ ] FR-ADM-REG-005 - API hủy đăng ký SV
- [ ] FR-ADM-REG-006 - Endpoint xuất CSV/Excel danh sách đăng ký

### 1.3.7. Báo cáo & thống kê (FR-ADM-RPT)

- [ ] FR-ADM-RPT-001 - API thống kê SV theo môn
- [ ] FR-ADM-RPT-002 - API thống kê SV theo ngành
- [ ] FR-ADM-RPT-003 - API thống kê lớp đầy / còn chỗ
- [ ] FR-ADM-RPT-004 - Xuất Excel / PDF (SHOULD)

### 1.3.8. Thông báo Admin (FR-ADM-NOT)

- [ ] FR-ADM-NOT-001 - API gửi thông báo cho SV
- [ ] FR-ADM-NOT-002 - API gửi thông báo cho GV

## 1.4. Student domain APIs

### 1.4.1. Xem thông tin học tập (FR-STU-INF, FR-STU-CUR)

- [ ] FR-STU-INF-001 - API thông tin cá nhân SV
- [ ] FR-STU-CUR-001 - API xem chương trình đào tạo của ngành mình
- [ ] FR-STU-CUR-002 - API xem danh sách môn theo ngành
- [ ] FR-STU-CUR-003 - Trả về flag bắt buộc / tự chọn
- [ ] FR-STU-CUR-004 - API tính tiến độ hoàn thành CTĐT (SHOULD)

### 1.4.2. Xem môn học được đăng ký (FR-STU-CRS)

- [ ] FR-STU-CRS-001 - API danh sách lớp học phần SV được phép đăng ký
- [ ] FR-STU-CRS-002 - Filter theo `semester_id`
- [ ] FR-STU-CRS-003 - Filter theo `major_id`
- [ ] FR-STU-CRS-004 - Detail trả về môn + tín chỉ + tiên quyết

### 1.4.3. Đăng ký môn học thủ công (FR-STU-REG)

- [ ] FR-STU-REG-001 - API chọn course
- [ ] FR-STU-REG-002 - API chọn ClassSection
- [ ] FR-STU-REG-003 - Logic lọc theo teacher (nếu có nhiều GV)
- [ ] FR-STU-REG-004 - Logic lọc theo ngày/ca học
- [ ] FR-STU-REG-005 - Validation trùng lịch trước khi commit
- [ ] FR-STU-REG-006 - Validation môn tiên quyết
- [ ] FR-STU-REG-007 - Validation giới hạn tín chỉ
- [ ] FR-STU-REG-008 - `POST /api/registrations/` xác nhận
- [ ] FR-STU-REG-009 - `DELETE /api/registrations/{id}/`

### 1.4.4. Tự động tạo TKB (FR-STU-TKB)

- [ ] FR-STU-TKB-001 - API nhận danh sách courses đăng ký
- [ ] FR-STU-TKB-002 - Input giáo viên ưu tiên
- [ ] FR-STU-TKB-003 - Input ngày học ưu tiên
- [ ] FR-STU-TKB-004 - Input ca học ưu tiên
- [ ] FR-STU-TKB-005 - Thuật toán search tổ hợp TKB không trùng
- [ ] FR-STU-TKB-006 - Trả về nhiều phương án (SHOULD)
- [ ] FR-STU-TKB-007 - Score & sort phương án (SHOULD)
- [ ] FR-STU-TKB-008 - Trả về 409/422 khi không tìm được
- [ ] FR-STU-TKB-009 - Endpoint commit phương án đã chọn

### 1.4.5. Xem TKB & lịch sử (FR-STU-SCH, FR-STU-HIS)

- [ ] FR-STU-SCH-001 - API TKB theo tuần
- [ ] FR-STU-SCH-002 - API TKB theo học kỳ
- [ ] FR-STU-SCH-003 - Endpoint xuất TKB (PDF/Excel) (SHOULD)
- [ ] FR-STU-HIS-001 - API lịch sử đăng ký

### 1.4.6. Nhận thông báo (FR-STU-NOT)

- [ ] FR-STU-NOT-001 - Sinh notification khi mở/đóng đăng ký (signal)
- [ ] FR-STU-NOT-002 - Sinh notification khi lịch học thay đổi
- [ ] FR-STU-NOT-003 - Sinh notification khi lớp bị hủy
- [ ] FR-STU-NOT-004 - API list notifications của user

## 1.5. Teacher domain APIs

### 1.5.1. Xem thông tin & lớp học phần (FR-TEA-INF, FR-TEA-CLS, FR-TEA-SCH)

- [ ] FR-TEA-INF-001 - API thông tin GV (có thể dùng chung `/me`)
- [ ] FR-TEA-CLS-001 - API danh sách lớp được phân công
- [ ] FR-TEA-SCH-001 - API TKB cá nhân GV
- [ ] FR-TEA-CLS-002 - API danh sách SV trong lớp
- [ ] FR-TEA-CLS-003 - Trường `enrolled_count` / `max_students`
- [ ] FR-TEA-CLS-004 - Detail trả lịch học + phòng
- [ ] FR-TEA-CLS-005 - API gửi thông báo cho lớp (MAY)

### 1.5.2. Nhập điểm (FR-TEA-GRD)

- [ ] FR-TEA-GRD-001 - API nhập điểm quá trình
- [ ] FR-TEA-GRD-002 - API nhập điểm giữa kỳ
- [ ] FR-TEA-GRD-003 - API nhập điểm cuối kỳ
- [ ] FR-TEA-GRD-004 - Validation thời hạn cập nhật điểm [!] TBD
- [ ] FR-TEA-GRD-005 - Endpoint xuất bảng điểm Excel

### 1.5.3. Khác (FR-TEA-REQ, FR-TEA-EXP, FR-TEA-NOT)

- [ ] FR-TEA-REQ-001 - API đề xuất thay đổi lịch dạy (MAY)
- [ ] FR-TEA-EXP-001 - Endpoint xuất danh sách SV
- [ ] FR-TEA-NOT-001 - API list notifications của GV

## 1.6. Business Rules (plan §5)

- [ ] BR-001 - Giới hạn tín chỉ tối thiểu / tối đa mỗi học kỳ (min=1, max TBD)
- [ ] BR-002 - Check môn tiên quyết khi đăng ký
- [ ] BR-003 - Chỉ cho đăng ký trong thời gian mở
- [ ] BR-004 - Chặn đăng ký khi trùng lịch
- [ ] BR-005 - Chặn đăng ký khi lớp đầy
- [ ] BR-006 - Áp dụng thời hạn hủy đăng ký
- [ ] BR-007 - GV chỉ nhập điểm cho lớp được phân công

## 1.7. Backend testing

- [ ] Setup pytest-django + factories
- [ ] Unit test cho models
- [ ] API test cho auth flow
- [ ] API test cho admin CRUD
- [ ] API test cho student registration
- [ ] API test cho TKB algorithm
- [ ] API test cho grade entry

---

# 2. Frontend (React + Vite)

## 2.1. Auth & Shared UI

- [x] **Design system** — IBM Plex Sans/Mono, navy formal palette, tailwind theme tokens
- [x] **UI primitives** — Icon (38 line-icons), Button (5 variants), Card, Badge (5 tones), Stat, Input
- [x] **Sidebar** — dark navy `#0e1c33`, section grouping, nav theo role với icon + label
- [x] **TopBar** — breadcrumb tự sinh theo URL, search bar, bell + dot, avatar dropdown logout
- [x] **Placeholder page** — dùng chung cho 22 route con (đang phát triển + FR-ID tham chiếu)
- [x] **Routing đầy đủ** — toàn bộ nav trong sidebar đều ấn được, render placeholder + highlight active
- [x] FR-GEN-001 - Trang Login 3-portal (Sinh viên navy / GV teal / Admin tím) với 2FA toggle
- [x] FR-GEN-002 - Nút Logout trong TopBar dropdown
- [ ] FR-GEN-003 - Form đổi mật khẩu
- [ ] FR-GEN-004 - Form quên mật khẩu (SHOULD)
- [x] FR-GEN-005 - Fetch `/me` khi boot + show ở sidebar
- [ ] FR-GEN-006 - Trang profile + form cập nhật
- [x] FR-GEN-007 - ProtectedRoute theo role
- [ ] Toast / notification component dùng chung
- [ ] Confirm dialog component dùng chung
- [x] Loading state cho App bootstrap (spinner ĐK)
- [ ] Skeleton loader cho list / table

### 2.1.1. Dashboard skeleton (UI mockup với dữ liệu mẫu)

- [x] Dashboard Admin — 4 KPI + tiến độ đăng ký + cần xem xét + activity feed
- [x] Dashboard Sinh viên — 4 KPI + danh sách môn đăng ký + thông báo
- [x] Dashboard Giáo viên — 4 KPI + grid 4 lớp phụ trách

## 2.2. Admin UI

> Tất cả 10 route admin (`/admin/accounts` → `/admin/settings`) đã có **placeholder** kèm FR-ID tham chiếu. Implement chi tiết theo flow: backend model → backend API → frontend page.

### 2.2.1. Quản lý tài khoản (FR-ADM-ACC)

- [x] Route placeholder `/admin/accounts`
- [ ] Trang danh sách tài khoản + table + search/filter
- [ ] Modal tạo SV/GV (chặn role ADMIN ở UI)
- [ ] Modal cập nhật tài khoản
- [ ] Toggle khoá/mở khoá
- [ ] Dropdown đổi role

### 2.2.2. Quản lý ngành đào tạo (FR-ADM-MAJ)

- [x] Route placeholder `/admin/majors`
- [ ] Trang danh sách + CRUD ngành

### 2.2.3. Quản lý chương trình đào tạo (FR-ADM-CUR)

- [x] Route placeholder `/admin/curriculum`
- [ ] Trang danh sách chương trình theo ngành
- [ ] Trang chi tiết chương trình + assign môn học
- [ ] UI phân loại bắt buộc / tự chọn
- [ ] UI quản lý tổng tín chỉ yêu cầu

### 2.2.4. Quản lý môn học (FR-ADM-CRS)

- [x] Route placeholder `/admin/courses`
- [ ] Trang danh sách + CRUD môn học
- [ ] UI quản lý tín chỉ
- [ ] UI quản lý môn tiên quyết (multi-select)

### 2.2.5. Quản lý học kỳ (FR-ADM-SEM)

- [x] Route placeholder `/admin/semesters`
- [ ] Trang danh sách + CRUD học kỳ
- [ ] UI mở/đóng học kỳ
- [ ] UI thiết lập thời gian đăng ký

### 2.2.6. Quản lý lớp học phần (FR-ADM-CLS)

- [x] Route placeholder `/admin/classes`
- [ ] Trang danh sách + CRUD lớp học phần
- [ ] UI gán GV cho lớp
- [ ] UI thiết lập lịch học + phòng
- [ ] UI thiết lập sĩ số tối đa

### 2.2.7. Quản lý đăng ký môn học (FR-ADM-REG)

- [x] Route placeholder `/admin/registrations`
- [ ] UI mở / đóng đợt đăng ký
- [ ] Trang theo dõi số SV đăng ký theo lớp
- [ ] UI hủy đăng ký cho SV (modal lý do)
- [ ] Nút xuất danh sách đăng ký

### 2.2.8. Báo cáo & thống kê (FR-ADM-RPT)

- [x] Route placeholder `/admin/reports`
- [ ] Trang dashboard biểu đồ thống kê SV theo môn
- [ ] Trang thống kê SV theo ngành
- [ ] Trang thống kê lớp đầy / còn chỗ
- [ ] Nút export Excel / PDF (SHOULD)

### 2.2.9. Gửi thông báo (FR-ADM-NOT)

- [x] Route placeholder `/admin/notifications`
- [ ] Trang soạn + gửi thông báo cho SV
- [ ] Trang soạn + gửi thông báo cho GV
- [ ] Chọn người nhận (toàn bộ / theo lớp / theo ngành)

### 2.2.10. Cấu hình hệ thống

- [x] Route placeholder `/admin/settings`
- [ ] UI cấu hình giới hạn tín chỉ min/max
- [ ] UI cấu hình thời hạn hủy đăng ký
- [ ] UI cấu hình thời hạn cập nhật điểm

## 2.3. Student UI

> Tất cả 7 route student (`/student/register` → `/student/profile`) đã có **placeholder** kèm FR-ID tham chiếu.

### 2.3.1. Xem thông tin học tập (FR-STU-INF, FR-STU-CUR)

- [x] Route placeholder `/student/curriculum`, `/student/profile`
- [ ] Trang chương trình đào tạo của ngành
- [ ] Hiển thị danh sách môn + flag bắt buộc / tự chọn
- [ ] Hiển thị tiến độ hoàn thành (SHOULD)

### 2.3.2. Xem môn học được đăng ký (FR-STU-CRS)

- [ ] Trang danh sách môn được phép đăng ký
- [ ] Filter theo học kỳ
- [ ] Filter theo ngành
- [ ] Modal chi tiết môn (tín chỉ, tiên quyết, các lớp mở)

### 2.3.3. Đăng ký môn học thủ công (FR-STU-REG)

- [x] Route placeholder `/student/register`
- [ ] UI chọn môn → chọn lớp học phần
- [ ] UI lọc theo GV (khi nhiều GV)
- [ ] UI chọn ngày / ca học mong muốn
- [ ] Hiển thị warning trùng lịch / thiếu tiên quyết / vượt tín chỉ
- [ ] Confirm modal xác nhận đăng ký
- [ ] Action hủy đăng ký

### 2.3.4. Tự động tạo TKB (FR-STU-TKB)

- [x] Route placeholder `/student/auto`
- [ ] Trang chọn danh sách môn cần đăng ký
- [ ] UI chọn GV ưu tiên
- [ ] UI chọn ngày học ưu tiên
- [ ] UI chọn ca học ưu tiên
- [ ] Hiển thị nhiều phương án TKB (SHOULD)
- [ ] Hiển thị warning khi không có phương án
- [ ] Confirm modal xác nhận phương án

### 2.3.5. Xem TKB & lịch sử (FR-STU-SCH, FR-STU-HIS)

- [x] Route placeholder `/student/schedule`, `/student/history`
- [ ] TKB view theo tuần (grid)
- [ ] TKB view theo học kỳ
- [ ] Nút xuất TKB (SHOULD)
- [ ] Trang lịch sử đăng ký

### 2.3.6. Nhận thông báo (FR-STU-NOT)

- [x] Route placeholder `/student/notifications`
- [ ] Trang danh sách thông báo (mở/đóng đăng ký, đổi lịch, lớp hủy, từ Admin)
- [ ] Badge số notification chưa đọc trên layout

## 2.4. Teacher UI

> Tất cả 5 route teacher (`/teacher/schedule` → `/teacher/profile`) đã có **placeholder** kèm FR-ID tham chiếu.

### 2.4.1. Xem thông tin & lớp học phần (FR-TEA-INF, FR-TEA-CLS, FR-TEA-SCH)

- [x] Route placeholder `/teacher/schedule`, `/teacher/classes`, `/teacher/profile`
- [ ] Trang danh sách lớp được phân công
- [ ] Trang TKB cá nhân GV
- [ ] Trang chi tiết lớp (danh sách SV, sĩ số, lịch, phòng)
- [ ] UI gửi thông báo cho lớp (MAY)

### 2.4.2. Nhập điểm (FR-TEA-GRD)

- [x] Route placeholder `/teacher/grades`
- [ ] Trang nhập điểm dạng bảng (quá trình / giữa kỳ / cuối kỳ)
- [ ] Validation thời hạn cập nhật [!] TBD
- [ ] Nút xuất bảng điểm Excel

### 2.4.3. Khác (FR-TEA-REQ, FR-TEA-EXP, FR-TEA-NOT)

- [x] Route placeholder `/teacher/notifications`
- [ ] UI đề xuất thay đổi lịch dạy (MAY)
- [ ] Nút xuất danh sách SV
- [ ] Trang danh sách thông báo từ Admin

## 2.5. Frontend testing

- [ ] Setup Vitest + Testing Library
- [ ] Unit test cho store auth (Zustand)
- [ ] Test interceptor JWT refresh
- [ ] Component test cho Login, ProtectedRoute
- [ ] Test cho form chính (đăng ký môn, nhập điểm)

---

## 3. Non-Functional (plan §6)

- [x] NFR-SEC-001 - Xác thực trước khi truy cập (JWT)
- [x] NFR-SEC-002 - Phân quyền theo role
- [ ] NFR-SEC-003 - Bảo vệ dữ liệu điểm và thông tin cá nhân
- [ ] NFR-PER-001 - Phản hồi tra cứu trong thời gian chấp nhận được [!] TBD
- [ ] NFR-AVL-001 - Cơ chế sao lưu / phục hồi
- [ ] NFR-USA-001 - Giao diện dễ dùng
- [ ] NFR-SCL-001 - Khả năng mở rộng
- [ ] NFR-CMP-001 - Tương thích trình duyệt phổ biến

---

## 4. Verification / Testing (plan §11)

- [ ] TEST-001 - Login, logout, đổi mật khẩu, phân quyền
- [ ] TEST-002 - Quản lý tài khoản
- [ ] TEST-003 - Quản lý chương trình đào tạo
- [ ] TEST-004 - Quản lý môn học và tiên quyết
- [ ] TEST-005 - Quản lý học kỳ và thời gian đăng ký
- [ ] TEST-006 - Quản lý lớp học phần
- [ ] TEST-007 - Đăng ký môn học thủ công
- [ ] TEST-008 - Trùng lịch / tiên quyết / tín chỉ / sĩ số
- [ ] TEST-009 - Thuật toán tạo TKB tự động
- [ ] TEST-010 - Xem TKB sinh viên
- [ ] TEST-011 - Xem TKB giáo viên
- [ ] TEST-012 - Nhập điểm
- [ ] TEST-013 - Gửi / nhận thông báo
- [ ] TEST-014 - Báo cáo và thống kê

---

## 5. Open Questions / Risks (plan §12)

- [x] OPEN - Số tín chỉ tối thiểu là 1, tối đa tùy chỉnh
- [x] OPEN - Công thức tính điểm tổng kết (vd. quá trình 10% + giữa kỳ 40% + cuối kỳ 50%)
- [x] RISK - Độ phức tạp thuật toán TKB tự động khi quy mô tăng (tích hợp agent nâng cấp)

---

## 6. Sửa SRS

- [x] Cập nhật `plan.md` §2.2: `TypeORM` → `Django ORM`
