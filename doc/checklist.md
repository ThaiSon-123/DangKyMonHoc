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
- [x] Dockerfile frontend (multi-stage: dev / build / production nginx)
- [x] docker-compose tích hợp full-stack (`docker-compose.yml` ở root)
- [x] docker-compose production (`docker-compose.prod.yml`)
- [x] File `.env.production.example`
- [x] `.dockerignore` cho backend & frontend
- [x] `.gitignore` ở root project
- [x] Service pgAdmin tích hợp trong docker-compose

### 0.4. Tài liệu

- [x] SRS (`plan.md`) — đã cập nhật §5 BR-001 → 011 và §7.2 schema
- [x] README backend
- [x] Design bundle Anthropic Design (`doc/design-bundle/`)
- [ ] README root project (mô tả full-stack)
- [ ] Sơ đồ ERD (TBD trong plan §13)
- [ ] Sơ đồ use case (TBD trong plan §13)
- [ ] Sơ đồ luồng đăng ký môn học (TBD trong plan §13)

---

# 1. Backend (Django REST Framework)

## 1.1. Data Models & Migrations (plan §7)

- [x] `User` (accounts) - 3 role + `is_locked` + `phone` + `full_name` (plan §7.2.1 — gộp first/last name)
- [x] `Major` - ngành đào tạo + `duration_years` (plan §7.2.4)
- [x] Seed 5 ngành CNTT / KTPM / HTTT / KHMT / ATTT (FR-ADM-MAJ-004)
- [x] `Curriculum` - chương trình đào tạo + `cohort_year` + `total_credits_required`
- [x] `CurriculumCourse` - bảng trung gian + `knowledge_block` + `is_required` + `suggested_semester`
- [x] `Course` - môn học + `credits` + `theory_hours` + `practice_hours`
- [x] `Prerequisite` - môn tiên quyết (M2M qua Course)
- [x] `Semester` - học kỳ + `term` IntegerField 1/2/3 + `registration_start/end` + `is_open`
- [x] `ClassSection` - lớp học phần + `periods_per_session` (BR-011) + `enrolled_count` + `max_students`
- [x] `Schedule` - lịch học + `weekday` + `session` (MORNING/AFTERNOON/EVENING) + `start_period` + `end_period` auto (BR-010)
- [x] `Registration` - đăng ký môn học + soft delete (CANCELLED)
- [x] `Grade` - điểm + `total_score` + `gpa_4` + `grade_letter` auto-compute (BR-009)
- [x] `Notification` + `NotificationRead` - thông báo + trạng thái đã đọc
- [x] `StudentProfile` - student_code, major, enrollment_year, gpa, completed_credits
- [x] `TeacherProfile` - teacher_code, department, title
- [x] Management command `setup_profiles` — backfill profile cho user chưa có
- [x] Management command `import_curriculum_xlsx` — import CTĐT từ file Excel

## 1.2. Auth & Account API

### 1.2.1. Auth chung (FR-GEN)

- [x] FR-GEN-001 - `POST /api/auth/login/` (JWT)
- [x] FR-GEN-001a - Tài khoản `is_locked=True` không đăng nhập / refresh / dùng access token cũ; trả đúng thông báo liên hệ admin
- [ ] FR-GEN-002 - `POST /api/auth/logout/` (blacklist refresh token)
- [ ] FR-GEN-003 - `POST /api/accounts/change-password/`
- [ ] FR-GEN-004 - Quên mật khẩu (gửi email reset) (SHOULD)
- [x] FR-GEN-005 - `GET /api/accounts/users/me/`
- [ ] FR-GEN-006 - `PATCH /api/accounts/users/me/`
- [x] FR-GEN-007 - Permission class theo role (`IsAdminRole`, `IsAdminOrReadOnly`)

### 1.2.2. Admin quản lý tài khoản (FR-ADM-ACC)

- [x] FR-ADM-ACC-001 - API tạo SV/GV
- [x] FR-ADM-ACC-002 - API cập nhật user (PATCH qua `UserViewSet`)
- [x] FR-ADM-ACC-003 - Toggle `is_locked` qua PATCH (FE wire xong, không cần endpoint riêng)
- [x] FR-ADM-ACC-004 - API gán/đổi role (qua PATCH, chặn gán ADMIN qua `perform_update`)
- [x] FR-ADM-ACC-005 - Query param search/filter users (`?search=`, `?role=`, `?is_locked=`)
- [x] FR-ADM-ACC-006 - Chặn role=ADMIN khi tạo + đổi qua API
- [x] Backend: tạo/sửa Sinh viên bắt buộc có `student_major` và đồng bộ `StudentProfile.major`
- [x] Backend: tạo/sửa Giáo viên bắt buộc có `teacher_department` và đồng bộ `TeacherProfile.department`

## 1.3. Admin domain APIs

### 1.3.1. Ngành đào tạo (FR-ADM-MAJ)

- [x] FR-ADM-MAJ-001 - API thêm ngành
- [x] FR-ADM-MAJ-002 - API cập nhật ngành
- [x] FR-ADM-MAJ-003 - API xoá ngành (PROTECT khi có liên kết, hoặc `is_active=False`)
- [x] FR-ADM-MAJ-004 - Seed dữ liệu CNTT, KTPM, HTTT, KHMT, ATTT

### 1.3.2. Chương trình đào tạo (FR-ADM-CUR)

- [x] FR-ADM-CUR-001 - API tạo chương trình theo ngành
- [x] FR-ADM-CUR-002 - API cập nhật chương trình
- [x] FR-ADM-CUR-003 - API gán môn học vào chương trình (`POST /api/curriculum-courses/`)
- [x] FR-ADM-CUR-004 - Field `is_required` cho môn (bắt buộc/tự chọn)
- [x] FR-ADM-CUR-005 - Field tổng tín chỉ yêu cầu (`total_credits_required`)
- [x] Field `knowledge_block` (GENERAL / BASIC / MAJOR / ELECTIVE / THESIS)
- [x] Field `suggested_semester` cho gợi ý kỳ

### 1.3.3. Môn học (FR-ADM-CRS)

- [x] FR-ADM-CRS-001 - API thêm môn học
- [x] FR-ADM-CRS-002 - API cập nhật môn học
- [x] FR-ADM-CRS-003 - API xoá / ngừng môn học (PROTECT khi liên kết)
- [x] FR-ADM-CRS-004 - Field `credits` + `theory_hours` + `practice_hours`
- [x] FR-ADM-CRS-005 - API gán môn tiên quyết (Prerequisite M2M)
- [x] Course API hỗ trợ ghi danh sách môn tiên quyết qua `prerequisite_ids`
- [x] Course API hỗ trợ filter theo `department`, `major`, `curriculum`

### 1.3.4. Học kỳ (FR-ADM-SEM)

- [x] FR-ADM-SEM-001 - API tạo học kỳ
- [x] FR-ADM-SEM-002 - API cập nhật thời gian học kỳ
- [x] FR-ADM-SEM-003 - API mở / đóng (`POST /api/semesters/{id}/open/`, `/close/`)
- [x] FR-ADM-SEM-004 - Field `registration_start/end`

### 1.3.5. Lớp học phần (FR-ADM-CLS)

- [x] FR-ADM-CLS-001 - API tạo lớp học phần
- [x] FR-ADM-CLS-002 - API gán giáo viên (bắt buộc khi status=OPEN qua `clean()`)
- [x] FR-ADM-CLS-003 - API set lịch học (`Schedule` CRUD qua `/api/schedules/`)
- [x] FR-ADM-CLS-004 - Field `room` trong Schedule
- [x] FR-ADM-CLS-005 - Field `max_students` + auto `enrolled_count` qua signal
- [x] FR-ADM-CLS-006 - API cập nhật lớp học phần
- [x] BR-011: Field `periods_per_session` (1-5) bắt buộc khi tạo
- [x] Schedule có ngày bắt đầu học / ngày kết thúc học và thứ học trong tuần

### 1.3.6. Đăng ký môn học - Admin (FR-ADM-REG)

- [x] FR-ADM-REG-001 - API mở đợt đăng ký (`POST /api/semesters/{id}/open/`)
- [x] FR-ADM-REG-002 - API đóng đợt đăng ký (`POST /api/semesters/{id}/close/`)
- [ ] FR-ADM-REG-003 - API thống kê SV theo lớp (đã có `enrolled_count`, cần endpoint aggregate)
- [x] FR-ADM-REG-004 - Logic detect trùng lịch (BR-004)
- [x] FR-ADM-REG-005 - API hủy đăng ký SV (`POST /api/registrations/{id}/cancel/`)
- [ ] FR-ADM-REG-006 - Endpoint xuất CSV/Excel danh sách đăng ký
- [x] Filter list registrations theo `?semester=`, `?status=`, `?class_section=`, `?student=` + search MSSV/mã lớp

### 1.3.7. Báo cáo & thống kê (FR-ADM-RPT)

- [ ] FR-ADM-RPT-001 - API thống kê SV theo môn
- [ ] FR-ADM-RPT-002 - API thống kê SV theo ngành
- [ ] FR-ADM-RPT-003 - API thống kê lớp đầy / còn chỗ
- [ ] FR-ADM-RPT-004 - Xuất Excel / PDF (SHOULD)

### 1.3.8. Thông báo Admin (FR-ADM-NOT)

- [x] Model `Notification` + `NotificationRead`
- [x] FR-ADM-NOT-001 - API gửi thông báo cho SV (audience=ALL_STUDENTS / SPECIFIC) — `POST /api/notifications/`
- [x] FR-ADM-NOT-002 - API gửi thông báo cho GV (audience=ALL_TEACHERS) — cùng endpoint, audience filter
- [x] Filter theo role: SV/GV chỉ thấy noti audience phù hợp hoặc đích danh; Admin thấy tất cả

## 1.4. Student domain APIs

### 1.4.1. Xem thông tin học tập (FR-STU-INF, FR-STU-CUR)

- [x] FR-STU-INF-001 - API thông tin cá nhân SV (`/me` + `StudentProfile`)
- [ ] FR-STU-CUR-001 - API xem chương trình đào tạo của ngành mình
- [ ] FR-STU-CUR-002 - API xem danh sách môn theo ngành
- [ ] FR-STU-CUR-003 - Trả về flag bắt buộc / tự chọn
- [ ] FR-STU-CUR-004 - API tính tiến độ hoàn thành CTĐT (SHOULD)

### 1.4.2. Xem môn học được đăng ký (FR-STU-CRS)

- [ ] FR-STU-CRS-001 - API danh sách lớp học phần SV được phép đăng ký
- [x] FR-STU-CRS-002 - Filter theo `semester_id` (query param đã có ở ClassSectionViewSet)
- [ ] FR-STU-CRS-003 - Filter theo `major_id`
- [ ] FR-STU-CRS-004 - Detail trả về môn + tín chỉ + tiên quyết

### 1.4.3. Đăng ký môn học thủ công (FR-STU-REG)

- [x] FR-STU-REG-001 - API chọn course (qua POST `/api/registrations/`)
- [x] FR-STU-REG-002 - API chọn ClassSection
- [ ] FR-STU-REG-003 - Logic lọc theo teacher (cần endpoint riêng)
- [ ] FR-STU-REG-004 - Logic lọc theo ngày / ca học
- [x] FR-STU-REG-005 - Validation trùng lịch trước khi commit (BR-004)
- [x] FR-STU-REG-006 - Validation môn tiên quyết (BR-002)
- [x] ~~FR-STU-REG-007 - Validation giới hạn tín chỉ~~ — **BR-001 đảo: KHÔNG áp dụng** (plan §5)
- [x] FR-STU-REG-008 - `POST /api/registrations/` xác nhận
- [x] FR-STU-REG-009 - `POST /api/registrations/{id}/cancel/` (BR-006)

### 1.4.4. Tự động tạo TKB (FR-STU-TKB)

- [ ] FR-STU-TKB-001 - API nhận danh sách courses đăng ký
- [ ] FR-STU-TKB-002 - Input giáo viên ưu tiên
- [ ] FR-STU-TKB-003 - Input ngày học ưu tiên
- [ ] FR-STU-TKB-004 - Input ca học ưu tiên (sáng / chiều / tối theo BR-010)
- [ ] FR-STU-TKB-005 - Thuật toán search tổ hợp TKB không trùng
- [ ] FR-STU-TKB-006 - Trả về nhiều phương án (SHOULD)
- [ ] FR-STU-TKB-007 - Score & sort phương án (SHOULD)
- [ ] FR-STU-TKB-008 - Trả về 409/422 khi không tìm được
- [ ] FR-STU-TKB-009 - Endpoint commit phương án đã chọn

### 1.4.5. Xem TKB & lịch sử (FR-STU-SCH, FR-STU-HIS)

- [ ] FR-STU-SCH-001 - API TKB theo tuần
- [ ] FR-STU-SCH-002 - API TKB theo học kỳ
- [ ] FR-STU-SCH-003 - Endpoint xuất TKB (PDF/Excel) (SHOULD)
- [x] FR-STU-HIS-001 - API lịch sử đăng ký (qua `GET /api/registrations/?student=me`)

### 1.4.6. Nhận thông báo (FR-STU-NOT)

- [ ] FR-STU-NOT-001 - Sinh notification khi mở/đóng đăng ký (signal)
- [ ] FR-STU-NOT-002 - Sinh notification khi lịch học thay đổi
- [ ] FR-STU-NOT-003 - Sinh notification khi lớp bị hủy
- [ ] FR-STU-NOT-004 - API list notifications của user

## 1.5. Teacher domain APIs

### 1.5.1. Xem thông tin & lớp học phần (FR-TEA-INF, FR-TEA-CLS, FR-TEA-SCH)

- [x] FR-TEA-INF-001 - API thông tin GV (`/me` + `TeacherProfile`)
- [x] FR-TEA-CLS-001 - API danh sách lớp được phân công (`GET /api/class-sections/?teacher=me`)
- [ ] FR-TEA-SCH-001 - API TKB cá nhân GV (endpoint aggregate)
- [x] FR-TEA-CLS-002 - API danh sách SV trong lớp (Registration filter)
- [x] FR-TEA-CLS-003 - Field `enrolled_count` / `max_students` + `is_full`
- [x] FR-TEA-CLS-004 - Detail trả lịch học + phòng
- [ ] FR-TEA-CLS-005 - API gửi thông báo cho lớp (MAY)

### 1.5.2. Nhập điểm (FR-TEA-GRD)

- [x] FR-TEA-GRD-001 - API nhập điểm quá trình (`POST /api/grades/`)
- [x] FR-TEA-GRD-002 - API nhập điểm giữa kỳ
- [x] FR-TEA-GRD-003 - API nhập điểm cuối kỳ
- [x] FR-TEA-GRD-004 - Validation thời hạn (BR-008: 2 tuần sau end_date)
- [ ] FR-TEA-GRD-005 - Endpoint xuất bảng điểm Excel

### 1.5.3. Khác (FR-TEA-REQ, FR-TEA-EXP, FR-TEA-NOT)

- [ ] FR-TEA-REQ-001 - API đề xuất thay đổi lịch dạy (MAY)
- [ ] FR-TEA-EXP-001 - Endpoint xuất danh sách SV
- [ ] FR-TEA-NOT-001 - API list notifications của GV

## 1.6. Business Rules (plan §5)

- [x] BR-001 - **Hệ thống KHÔNG áp dụng** giới hạn tín chỉ min/max (đảo ngược theo plan)
- [x] BR-002 - Check môn tiên quyết khi đăng ký (`grade.total_score >= GRADE_PASSING_SCORE`)
- [x] BR-003 - Chỉ cho đăng ký khi `Semester.is_open` + trong cửa sổ `registration_start/end`
- [x] BR-004 - Chặn đăng ký khi overlap `(weekday, [start_period, end_period])`
- [x] BR-005 - Chặn đăng ký khi `enrolled_count >= max_students`
- [x] BR-006 - Cho phép hủy đăng ký trong thời gian đăng ký (Admin bypass deadline)
- [x] BR-007 - GV chỉ nhập điểm cho lớp được phân công
- [x] BR-008 - GV cập nhật điểm trong 2 tuần (env `GRADE_UPDATE_GRACE_DAYS=14`)
- [x] BR-009 - Công thức tổng kết: 10% QT + 40% GK + 50% CK (`Grade.compute_total`)
- [x] BR-010 - TKB 15 tiết/ngày, sáng 1-5 / chiều 6-10 / tối 11-15 (`Schedule.SESSION_PERIODS`)
- [x] BR-011 - Field `periods_per_session` bắt buộc khi tạo ClassSection
- [x] **Bonus**: Signal auto cập nhật `enrolled_count` khi reg confirm/cancel
- [x] **Bonus**: Soft delete reg (DELETE → status=CANCELLED + cancelled_at)
- [x] **Bonus**: Endpoint `POST /api/registrations/{id}/cancel/` với reason

## 1.7. Backend testing

- [x] Setup pytest-django + conftest fixtures (admin/teacher/student users, profiles, semesters, course/class factories)
- [x] API test account lock + profile bắt buộc theo role (Accounts) — 11 cases pass
- [x] API test Course prerequisite/filter và Major duration
- [x] API test BR-002 → BR-006 (Registration) — 14 cases pass
- [x] API test BR-007 + BR-008 + BR-009 auto-compute (Grade) — 4 cases pass
- [x] **Tổng: 33/33 backend tests pass**
- [ ] Unit test cho models (validators, custom methods, `Schedule.clean()`)
- [x] API test cho auth lock flow (login / refresh / access token cũ khi user bị khóa)
- [ ] API test cho admin CRUD (Major / Course / Semester / ClassSection)
- [ ] API test cho TKB algorithm
- [ ] API test cho Schedule conflict detection (BR-010 boundary cases)

---

# 2. Frontend (React + Vite)

## 2.1. Auth & Shared UI

- [x] **Design system** — IBM Plex Sans/Mono, navy formal palette, tailwind theme tokens
- [x] **UI primitives** — Icon (38 line-icons), Button (5 variants), Card, Badge (5 tones), Stat, Input
- [x] **Sidebar** — dark navy `#0e1c33`, section grouping, nav theo role
- [x] **TopBar** — breadcrumb tự sinh theo URL, search bar, bell, avatar dropdown logout
- [x] **Placeholder page** — dùng chung cho route con chưa làm + FR-ID tham chiếu
- [x] **Routing đầy đủ** — toàn bộ nav trong sidebar đều ấn được
- [x] **Modal** component (ESC + backdrop click + 3 size)
- [x] Modal body có max-height + scroll nội dung để form dài vẫn thao tác được footer
- [x] **Table** component (typed `Column<T>`, mono cells, empty state, loading)
- [x] **Pagination** component (Previous/Next + page numbers + range info, wired vào 5 list page)
- [x] **`extractApiError`** util — đọc lỗi DRF (field / detail / non_field_errors)
- [x] **API services typed** (`majors`, `courses`, `semesters`, `curriculums`, `classes`, `teachers`)
- [x] **`semesterLabel(suggested, cohortYear)`** util — derive nhãn "HK X - Năm học YYYY-YYYY"
- [x] FR-GEN-001 - Trang Login 3-portal (SV navy / GV teal / Admin tím) với 2FA toggle
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

### 2.2.1. Quản lý tài khoản (FR-ADM-ACC) ✅ DONE

- [x] Route `/admin/accounts` — trang thật
- [x] Trang danh sách tài khoản + search + pagination
- [x] Filter theo role (ADMIN/TEACHER/STUDENT) + trạng thái (locked/active)
- [x] Modal tạo SV/GV với form đầy đủ (username, password ≥8 chars, email, họ tên, role, phone)
- [x] Modal tạo/sửa account: Sinh viên bắt buộc chọn ngành học; Giáo viên bắt buộc nhập khoa
- [x] Modal cập nhật tài khoản (username readonly, không hiển thị password)
- [x] Dropdown chọn role STUDENT/TEACHER (chặn ADMIN ở UI + BE)
- [x] Action toggle khoá/mở khoá (PATCH `is_locked`) + chặn tự khoá chính mình
- [x] Modal xác nhận xoá + chặn xoá Admin / xoá chính mình
- [x] Badge "Bạn" cho user đang đăng nhập + tooltip giải thích nút disabled
- [x] Backend: `UserViewSet.perform_update` chặn đổi role thành ADMIN
- [x] Backend: `UserViewSet.perform_destroy` chặn xoá Admin / xoá chính mình
- [x] Backend: `HandleProtectedDeleteMixin` wired để trả 409 khi user có FK liên kết

### 2.2.2. Quản lý ngành đào tạo (FR-ADM-MAJ) ✅ DONE

- [x] Route `/admin/majors` — trang thật
- [x] Trang danh sách + search + pagination
- [x] Modal tạo / sửa ngành (form có `duration_years`)
- [x] Modal xác nhận xoá + thông báo 409 friendly khi có liên kết

### 2.2.3. Quản lý chương trình đào tạo (FR-ADM-CUR) ✅ DONE

- [x] Route `/admin/curriculum` — trang thật
- [x] Trang danh sách CTĐT (filter major + search + pagination)
- [x] Trang chi tiết `/admin/curriculum/:id` + nested CurriculumCourse
- [x] UI phân loại bắt buộc / tự chọn (checkbox + Badge)
- [x] UI chọn khối kiến thức (Đại cương / Cơ sở ngành / Chuyên ngành / Tự chọn / Tốt nghiệp)
- [x] UI gán học kỳ gợi ý + group view by HK với nhãn đầy đủ "HK X - Năm học YYYY-YYYY"
- [x] UI thêm / sửa / gỡ môn trong CTĐT (modal)
- [x] UI quản lý tổng tín chỉ yêu cầu
- [x] Stats: tổng môn / tổng TC / bắt buộc vs tự chọn / số HK
- [x] **Bonus**: Management command `import_curriculum_xlsx` import CTĐT từ Excel

### 2.2.4. Quản lý môn học (FR-ADM-CRS) ✅ DONE

- [x] Route `/admin/courses` — trang thật
- [x] Trang danh sách + CRUD môn học (form: credits / tiết LT / tiết TH)
- [x] Search + pagination
- [x] UI hiển thị tiên quyết dạng badge (chỉ display)
- [x] UI nhập môn tiên quyết bằng mã/tên môn qua multi-select
- [x] Filter môn học theo khoa / ngành / CTĐT
- [x] UI xoá môn học (modal confirm + thông báo 409 friendly)
- [x] Đổi label "giờ" → "tiết" theo nghiệp vụ
- [x] UI gán môn tiên quyết qua multi-select

### 2.2.5. Quản lý học kỳ (FR-ADM-SEM) ✅ DONE

- [x] Route `/admin/semesters` — trang thật
- [x] Trang danh sách + CRUD học kỳ
- [x] Field `term` IntegerChoices 1/2/3 (theo plan §7.2.9)
- [x] UI mở/đóng học kỳ (nút Open/Close gọi action endpoint)
- [x] UI thiết lập `start_date`, `end_date`, `registration_start`, `registration_end`

### 2.2.6. Quản lý lớp học phần (FR-ADM-CLS) ✅ DONE

- [x] Route `/admin/classes` — trang thật
- [x] Trang danh sách + filter theo học kỳ / trạng thái + search + pagination
- [x] CRUD lớp học phần (form: code, course, semester, teacher, periods/buổi, sĩ số, status, note)
- [x] Dropdown gán GV cho lớp (fetch toàn bộ TeacherProfile)
- [x] Route `/admin/classes/:id` — chi tiết lớp + 4 KPI stats
- [x] UI thiết lập lịch học hàng tuần (table + add/edit/delete schedule)
- [x] UI chọn buổi (Sáng/Chiều/Tối) + start_period validate theo session range (BR-010)
- [x] UI thiết lập phòng + date range tùy chọn
- [x] Form thêm/sửa lớp học phần có học thứ mấy, ngày bắt đầu học, ngày kết thúc học
- [x] Form lớp học phần bỏ trạng thái nháp khỏi lựa chọn; ghi chú chuyển xuống cuối và không bắt buộc
- [x] Modal lớp học phần rút chiều cao theo viewport và cuộn chuột trong nội dung
- [x] UI thiết lập sĩ số tối đa + hiển thị enrolled_count + Badge "Đầy"
- [x] Badge trạng thái (OPEN/CLOSED/CANCELLED; dữ liệu DRAFT cũ vẫn được đọc an toàn)

### 2.2.7. Quản lý đăng ký môn học (FR-ADM-REG) ✅ DONE

- [x] Route `/admin/registrations` — trang thật
- [x] Trang danh sách đăng ký + search MSSV/mã lớp + pagination
- [x] Filter theo học kỳ / lớp HP / trạng thái
- [x] KPI stats: tổng / confirmed / cancelled / pending (theo trang hiện tại)
- [x] UI huỷ đăng ký cho SV (modal lý do, soft cancel)
- [x] UI xoá vĩnh viễn bản ghi (cho data lỗi/test)
- [x] Mở / đóng đợt đăng ký vẫn ở SemestersPage (FR-ADM-SEM-003)
- [ ] Nút xuất CSV/Excel danh sách đăng ký

### 2.2.8. Báo cáo & thống kê (FR-ADM-RPT)

- [x] Route placeholder `/admin/reports`
- [ ] Trang dashboard biểu đồ thống kê SV theo môn
- [ ] Trang thống kê SV theo ngành
- [ ] Trang thống kê lớp đầy / còn chỗ
- [ ] Nút export Excel / PDF (SHOULD)

### 2.2.9. Gửi thông báo (FR-ADM-NOT) ✅ DONE

- [x] Route `/admin/notifications` — trang thật
- [x] Trang danh sách thông báo đã gửi + search + pagination
- [x] Modal **Soạn thông báo**: title / body (textarea) / category / audience
- [x] Audience: ALL / ALL_STUDENTS / ALL_TEACHERS / SPECIFIC
- [x] Khi chọn SPECIFIC: autocomplete search user (theo username / full_name / email), chips selected
- [x] Badge category (5 tone màu) + audience (4 tone)
- [x] Modal **Xem chi tiết** hiển thị nội dung đầy đủ + danh sách người nhận
- [x] Modal xác nhận xoá

### 2.2.10. Cấu hình hệ thống

- [x] Route placeholder `/admin/settings`
- [ ] UI cấu hình thời hạn hủy đăng ký
- [ ] UI cấu hình thời hạn cập nhật điểm (BR-008)
- [x] BR-001 đã bỏ — không còn UI cấu hình tín chỉ min/max

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
- [ ] Hiển thị warning trùng lịch / thiếu tiên quyết (BR-001 đã bỏ, không cần warn tín chỉ)
- [ ] Confirm modal xác nhận đăng ký
- [ ] Action hủy đăng ký

### 2.3.4. Tự động tạo TKB (FR-STU-TKB)

- [x] Route placeholder `/student/auto`
- [ ] Trang chọn danh sách môn cần đăng ký
- [ ] UI chọn GV ưu tiên
- [ ] UI chọn ngày học ưu tiên
- [ ] UI chọn ca học ưu tiên (Sáng / Chiều / Tối theo BR-010)
- [ ] Hiển thị nhiều phương án TKB (SHOULD)
- [ ] Hiển thị warning khi không có phương án
- [ ] Confirm modal xác nhận phương án

### 2.3.5. Xem TKB & lịch sử (FR-STU-SCH, FR-STU-HIS)

- [x] Route placeholder `/student/schedule`, `/student/history`
- [ ] TKB view theo tuần (grid 7 ngày × 15 tiết)
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
- [ ] Hiển thị auto-compute `total_score` + `grade_letter` + `gpa_4` (đã có ở BE)
- [ ] Validation thời hạn cập nhật (BR-008: 2 tuần sau end_date) — đã có ở BE
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

## 5. Open Questions / Risks (plan §12) — **đã chốt hết qua BR mới**

- [x] OPEN - Số tín chỉ tối thiểu / tối đa → **đã chốt: KHÔNG áp dụng** (BR-001 đảo ngược)
- [x] OPEN - Công thức tính điểm tổng kết → **đã chốt: 10% + 40% + 50%** (BR-009)
- [x] OPEN - Thời hạn hủy đăng ký → **đã chốt: trong thời gian đăng ký** (BR-006)
- [x] OPEN - Thời hạn cập nhật điểm → **đã chốt: 2 tuần sau khi kết thúc môn** (BR-008)
- [x] OPEN - Quy ước tiết học → **đã chốt: 15 tiết/ngày, sáng 1-5 / chiều 6-10 / tối 11-15** (BR-010)
- [x] RISK - Độ phức tạp thuật toán TKB tự động khi quy mô tăng (sẽ tích hợp agent / heuristic sau)

---

## 6. Sửa SRS

- [x] Cập nhật `plan.md` §2.2: `TypeORM` → `Django ORM`
- [x] Cập nhật `plan.md` §5: BR-001 → BR-011 (thêm BR-008, BR-009, BR-010, BR-011 + đảo ngược BR-001)
- [x] Cập nhật `plan.md` §7.2: bổ sung `Major.duration_years`, `Semester.term` int 1/2/3, `Grade.gpa_4`, `Schedule` mới với session + start_period + end_period, `ClassSection.periods_per_session`

---

## 7. Tổng quan tiến độ

| Layer | Hoàn thành | Ghi chú |
|---|---|---|
| Hạ tầng (mục 0) | 95% | Còn ERD diagram + README root |
| Backend models (1.1) | 100% | 15 entity đầy đủ, migration OK |
| Backend Admin API (1.2 – 1.3) | ~75% | Còn Reports, Notifications send, vài endpoint xuất file |
| Backend Student/Teacher API (1.4 – 1.5) | ~50% | Cơ bản qua các ViewSet chung; còn TKB algorithm + endpoint aggregate |
| Backend BR (1.6) | 100% | Tất cả 11 BR đã wire; full backend 33/33 tests pass |
| Backend testing (1.7) | 40% | Có accounts/auth lock, courses, majors, registration, grade; còn CRUD rộng hơn/algorithm tests |
| Frontend foundation (2.1) | 95% | Còn toast, confirm dialog, skeleton loader |
| Frontend admin (2.2) | ~85% | 8/10 module xong (Accounts, Majors, Courses, Semesters, Curriculum, Classes, **Registrations**, **Notifications**); còn Reports, Settings |
| Frontend student (2.3) | 0% | Chỉ placeholder |
| Frontend teacher (2.4) | 0% | Chỉ placeholder |
| Frontend testing (2.5) | 0% | Chưa setup Vitest |

### Bước tiếp theo khuyến nghị

1. **Sinh viên: Đăng ký môn học** — wire toàn bộ flow BR-002 → BR-006
2. **Giáo viên: Nhập điểm** — flow nhập điểm + auto-compute hiển thị ngay
3. **Quản lý đăng ký Admin** — theo dõi sĩ số, hủy đăng ký, xuất danh sách
4. **TKB grid view** — UI 7 ngày × 15 tiết cho cả SV và GV
5. **TKB algorithm** — module phức tạp nhất, để sau khi UI cơ bản đã chạy
