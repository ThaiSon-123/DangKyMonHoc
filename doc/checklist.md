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
- [x] `Major` (majors) - ngành đào tạo
- [x] `Curriculum` + `CurriculumCourse` (curriculums) - CTĐT + môn trong CTĐT (knowledge_block, is_required, suggested_semester)
- [x] `Course` (courses) - môn học + theory/practice hours
- [x] `Prerequisite` (courses) - môn tiên quyết (self-ref M2M qua through)
- [x] `Semester` (semesters) - học kỳ + registration_start/end + is_open
- [x] `ClassSection` (classes) - lớp HP + max/enrolled_count + status
- [x] `Schedule` (classes) - lịch học (weekday + time_slot + room)
- [x] `Registration` (registrations) - đăng ký môn
- [x] `Grade` (grades) - điểm + auto-compute total + grade_letter
- [x] `Notification` + `NotificationRead` (notifications) - thông báo + audience targeting
- [x] `StudentProfile` (profiles) - MSSV, major, enrollment_year, gpa, completed_credits
- [x] `TeacherProfile` (profiles) - mã GV, department, title

### ⚙ Schema audit + hiệu chỉnh theo plan §7

- [x] `Schedule` (đã refactor) — `session` + `start_period` + `end_period` + UniqueConstraint `(class_section, weekday, start_period)`
- [x] `ClassSection` — `periods_per_session` + indexes + `clean()` enforce teacher khi `status=OPEN`
- [x] `Registration.save()` — tự đồng bộ `semester` theo `class_section.semester`
- [x] `Registration` — composite indexes `(student, semester)`, `(class_section, status)`, `(semester, status)`
- [x] `Course.credits/theory_hours/practice_hours` — Validators
- [x] `Grade.process/midterm/final_score` — Validators 0–10
- [x] `StudentProfile.gpa` — Validators 0–10
- [x] **Seed 5 ngành** CNTT / KTPM / HTTT / KHMT / ATTT (FR-ADM-MAJ-004)
- [x] Management command `setup_profiles` — backfill profile

### ⚙ Schema audit lần 2 — sau cập nhật plan §7.2

- [x] `Major.duration_years` PositiveSmallInteger (plan §7.2.4) — default 4
- [x] `Semester.term` CharField → **PositiveSmallInteger 1/2/3** (plan §7.2.9) — data migration `0002_term_to_integer.py`
- [x] `Grade.gpa_4` DecimalField(3,2) auto-compute từ total_score (plan §7.2.13)
- [x] Frontend types update: `SemesterTerm = 1 | 2 | 3`, `Major.duration_years`
- [x] Frontend pages update: `MajorsPage` form + table có duration_years, `SemestersPage` select integer
- [x] BR-001 đã bỏ check tín chỉ theo plan §5 line 342 (DECISION: không áp dụng kiểm tra tín chỉ)
- [ ] **Defer**: `Schedule.weekday` đang là PositiveSmallInteger nhưng plan §7.2.11 nói CharField(16) — đụng nhiều code/test, để sau
- [ ] **Defer**: `User.full_name` (plan §7.2.1) — Django AbstractUser dùng first_name/last_name, có `get_full_name()` đủ dùng
- [x] Verify: 18/18 tests pass + frontend build 277 kB pass

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
- [x] FR-ADM-ACC-002 - API cập nhật user (PATCH/PUT trên ViewSet)
- [x] FR-ADM-ACC-003 - API khoá/mở khoá (`is_locked`) qua PATCH
- [x] FR-ADM-ACC-004 - API gán/đổi role qua PATCH
- [x] FR-ADM-ACC-005 - Query param search/filter users (search + role + is_locked)
- [x] FR-ADM-ACC-006 - Chặn role=ADMIN khi tạo qua API

## 1.3. Admin domain APIs

### 1.3.1. Ngành đào tạo (FR-ADM-MAJ)

- [x] FR-ADM-MAJ-001 - API thêm ngành (`POST /api/majors/`)
- [x] FR-ADM-MAJ-002 - API cập nhật ngành (PATCH/PUT)
- [x] FR-ADM-MAJ-003 - API xoá ngành + flag `is_active` (soft delete qua PATCH)
- [ ] FR-ADM-MAJ-004 - Seed dữ liệu CNTT, KTPM, HTTT, KHMT, ATTT (migration data)

### 1.3.2. Chương trình đào tạo (FR-ADM-CUR)

- [x] FR-ADM-CUR-001 - API tạo CTĐT theo ngành (`POST /api/curriculums/`)
- [x] FR-ADM-CUR-002 - API cập nhật CTĐT
- [x] FR-ADM-CUR-003 - API gán môn (`POST /api/curriculum-courses/`)
- [x] FR-ADM-CUR-004 - Field `is_required` + `knowledge_block` cho môn
- [x] FR-ADM-CUR-005 - Field `total_credits_required`

### 1.3.3. Môn học (FR-ADM-CRS)

- [x] FR-ADM-CRS-001 - API thêm môn (`POST /api/courses/`)
- [x] FR-ADM-CRS-002 - API cập nhật môn
- [x] FR-ADM-CRS-003 - API xoá / ngừng môn (`is_active`)
- [x] FR-ADM-CRS-004 - Field `credits` + theory_hours / practice_hours
- [x] FR-ADM-CRS-005 - API gán môn tiên quyết (`POST /api/prerequisites/`)

### 1.3.4. Học kỳ (FR-ADM-SEM)

- [x] FR-ADM-SEM-001 - API tạo học kỳ (`POST /api/semesters/`)
- [x] FR-ADM-SEM-002 - API cập nhật thời gian + validation start<end
- [x] FR-ADM-SEM-003 - API mở/đóng học kỳ (`POST /api/semesters/{id}/open|close/`)
- [x] FR-ADM-SEM-004 - Field `registration_start/end`

### 1.3.5. Lớp học phần (FR-ADM-CLS)

- [x] FR-ADM-CLS-001 - API tạo lớp HP (`POST /api/class-sections/`)
- [x] FR-ADM-CLS-002 - API gán GV (FK `teacher`)
- [x] FR-ADM-CLS-003 - API set lịch học (`POST /api/schedules/`)
- [x] FR-ADM-CLS-004 - Field `room` trong Schedule
- [x] FR-ADM-CLS-005 - Field `max_students` + enrolled_count + is_full
- [x] FR-ADM-CLS-006 - API cập nhật lớp HP

### 1.3.6. Đăng ký môn học - Admin (FR-ADM-REG)

- [x] FR-ADM-REG-001 - API mở đợt đăng ký (`POST /api/semesters/{id}/open/`)
- [x] FR-ADM-REG-002 - API đóng đợt đăng ký (`POST /api/semesters/{id}/close/`)
- [ ] FR-ADM-REG-003 - API thống kê SV theo lớp (đã có enrolled_count, cần endpoint aggregate)
- [x] FR-ADM-REG-004 - Logic detect trùng lịch (BR-004 wire trong RegistrationSerializer) ✓
- [x] FR-ADM-REG-005 - API hủy đăng ký SV (`POST /api/registrations/{id}/cancel/`)
- [ ] FR-ADM-REG-006 - Endpoint xuất CSV/Excel danh sách đăng ký

### 1.3.7. Báo cáo & thống kê (FR-ADM-RPT)

- [ ] FR-ADM-RPT-001 - API thống kê SV theo môn
- [ ] FR-ADM-RPT-002 - API thống kê SV theo ngành
- [ ] FR-ADM-RPT-003 - API thống kê lớp đầy / còn chỗ
- [ ] FR-ADM-RPT-004 - Xuất Excel / PDF (SHOULD)

### 1.3.8. Thông báo Admin (FR-ADM-NOT)

- [x] FR-ADM-NOT-001 - API gửi thông báo cho SV (audience=ALL_STUDENTS hoặc recipients cụ thể)
- [x] FR-ADM-NOT-002 - API gửi thông báo cho GV (audience=ALL_TEACHERS)

## 1.4. Student domain APIs

### 1.4.1. Xem thông tin học tập (FR-STU-INF, FR-STU-CUR)

- [x] FR-STU-INF-001 - API thông tin SV (`GET /api/students/?user=me` hoặc `/api/accounts/users/me/`)
- [x] FR-STU-CUR-001 - API xem CTĐT (`GET /api/curriculums/?major=X`)
- [x] FR-STU-CUR-002 - API danh sách môn theo ngành (qua curriculum)
- [x] FR-STU-CUR-003 - Trả về flag bắt buộc / tự chọn (field `is_required`)
- [ ] FR-STU-CUR-004 - API tính tiến độ hoàn thành CTĐT (SHOULD - cần endpoint riêng)

### 1.4.2. Xem môn học được đăng ký (FR-STU-CRS)

- [x] FR-STU-CRS-001 - API danh sách lớp HP (`GET /api/class-sections/`)
- [x] FR-STU-CRS-002 - Filter theo `?semester=X`
- [ ] FR-STU-CRS-003 - Filter theo major (cần thêm qua course→curriculum)
- [x] FR-STU-CRS-004 - Detail trả về môn + tín chỉ + tiên quyết (CourseSerializer)

### 1.4.3. Đăng ký môn học thủ công (FR-STU-REG)

- [x] FR-STU-REG-001 - API chọn course (qua Course filter)
- [x] FR-STU-REG-002 - API chọn ClassSection (`GET /api/class-sections/?course=X`)
- [x] FR-STU-REG-003 - Filter theo teacher (`?teacher=X`)
- [ ] FR-STU-REG-004 - Logic lọc theo ngày/ca học (cần filter qua Schedule)
- [x] FR-STU-REG-005 - Validation trùng lịch trước khi commit (BR-004) ✓
- [x] FR-STU-REG-006 - Validation môn tiên quyết (BR-002) ✓
- [x] FR-STU-REG-007 - Validation giới hạn tín chỉ (BR-001) ✓
- [x] FR-STU-REG-008 - `POST /api/registrations/` xác nhận (CRUD đã có)
- [x] FR-STU-REG-009 - `DELETE /api/registrations/{id}/` (CRUD đã có)

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

- [ ] FR-STU-SCH-001 - API TKB theo tuần (cần endpoint riêng aggregate)
- [ ] FR-STU-SCH-002 - API TKB theo học kỳ (có thể derive từ registrations)
- [ ] FR-STU-SCH-003 - Endpoint xuất TKB (PDF/Excel) (SHOULD)
- [x] FR-STU-HIS-001 - API lịch sử đăng ký (`GET /api/registrations/`)

### 1.4.6. Nhận thông báo (FR-STU-NOT)

- [ ] FR-STU-NOT-001 - Sinh notification khi mở/đóng đăng ký (signal)
- [ ] FR-STU-NOT-002 - Sinh notification khi lịch học thay đổi (signal)
- [ ] FR-STU-NOT-003 - Sinh notification khi lớp bị hủy (signal)
- [x] FR-STU-NOT-004 - API list notifications của user (`GET /api/notifications/` lọc theo audience)

## 1.5. Teacher domain APIs

### 1.5.1. Xem thông tin & lớp học phần (FR-TEA-INF, FR-TEA-CLS, FR-TEA-SCH)

- [x] FR-TEA-INF-001 - API thông tin GV (dùng chung `/api/accounts/users/me/` hoặc `/api/teachers/`)
- [x] FR-TEA-CLS-001 - API danh sách lớp được phân công (`GET /api/class-sections/?teacher=X`)
- [ ] FR-TEA-SCH-001 - API TKB cá nhân GV (cần endpoint aggregate)
- [x] FR-TEA-CLS-002 - API danh sách SV trong lớp (`GET /api/registrations/?class_section=X`)
- [x] FR-TEA-CLS-003 - Trường `enrolled_count` / `max_students` + `is_full`
- [x] FR-TEA-CLS-004 - Detail trả lịch học + phòng (ScheduleSerializer nested)
- [ ] FR-TEA-CLS-005 - API gửi thông báo cho lớp (MAY - cần action endpoint)

### 1.5.2. Nhập điểm (FR-TEA-GRD)

- [x] FR-TEA-GRD-001 - API nhập điểm quá trình (`POST/PATCH /api/grades/` field process_score)
- [x] FR-TEA-GRD-002 - API nhập điểm giữa kỳ (field midterm_score)
- [x] FR-TEA-GRD-003 - API nhập điểm cuối kỳ (field final_score)
- [ ] FR-TEA-GRD-004 - Validation thời hạn cập nhật [!] TBD
- [ ] FR-TEA-GRD-005 - Endpoint xuất bảng điểm Excel

### 1.5.3. Khác (FR-TEA-REQ, FR-TEA-EXP, FR-TEA-NOT)

- [ ] FR-TEA-REQ-001 - API đề xuất thay đổi lịch dạy (MAY)
- [ ] FR-TEA-EXP-001 - Endpoint xuất danh sách SV (Excel)
- [x] FR-TEA-NOT-001 - API list notifications GV (chung `/api/notifications/`)

## 1.6. Business Rules (plan §5)

- [x] BR-001 - Giới hạn tín chỉ max/kỳ (env `REG_MAX_CREDITS`, default 24) — check trong RegistrationSerializer
- [x] BR-002 - Check môn tiên quyết khi đăng ký (so với grade.total_score >= passing)
- [x] BR-003 - Chỉ cho đăng ký khi `Semester.is_open` + trong cửa sổ `registration_start/end`
- [x] BR-004 - Chặn đăng ký khi trùng `(weekday, time_slot)` với reg khác
- [x] BR-005 - Chặn đăng ký khi `enrolled_count >= max_students`
- [x] BR-006 - Áp dụng thời hạn hủy (registration_end + GRACE_DAYS) — Admin bypass
- [x] BR-007 - GV chỉ nhập điểm cho lớp được phân công + thời hạn cập nhật điểm
- [x] **Bonus**: Signal auto cập nhật `enrolled_count` khi reg confirm/cancel
- [x] **Bonus**: Soft delete reg (DELETE → status=CANCELLED + cancelled_at)
- [x] **Bonus**: Endpoint riêng `POST /api/registrations/{id}/cancel/` với reason

## 1.7. Backend testing

- [x] Setup pytest-django + conftest fixtures (admin/teacher/student users, profiles, semesters, course/class factories)
- [x] API test cho student registration (BR-001 → BR-006) — 14 cases
- [x] API test cho grade entry (BR-007 + auto-compute total + thời hạn cập nhật) — 4 cases
- [ ] Unit test cho models (validators, custom methods)
- [ ] API test cho auth flow (login / refresh / 401 → refresh)
- [ ] API test cho admin CRUD (Major / Course / Semester / ClassSection)
- [ ] API test cho TKB algorithm

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
- [x] **Modal** component (with ESC + backdrop click + size sm/md/lg)
- [x] **Table** component (typed Column<T>, mono cells, empty state, loading)
- [x] **Pagination** component — Previous/Next + page numbers + range info (đã wire vào 4 list page)
- [x] **`extractApiError`** util — đọc lỗi DRF (field errors / detail / non_field_errors)
- [x] **API services** (`majors.ts`, `courses.ts`, `semesters.ts`, `curriculums.ts`) typed + accept `page` / `page_size`
- [x] Backend `config/pagination.StandardPagination` — cho phép client override `page_size` (max 1000)
- [x] **HandleProtectedDeleteMixin** — backend trả 409 + message thân thiện khi xoá entity có FK liên kết

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

- [x] Route `/admin/majors` — trang thật
- [x] Trang danh sách table + search box (`?search=`)
- [x] Modal tạo ngành mới
- [x] Modal sửa ngành
- [x] Modal xác nhận xoá
- [x] Toggle `is_active` qua field trong form

### 2.2.3. Quản lý chương trình đào tạo (FR-ADM-CUR)

- [x] Route `/admin/curriculum` — trang thật
- [x] Trang danh sách CTĐT theo ngành (filter major + search)
- [x] Trang chi tiết `/admin/curriculum/:id` + nested CurriculumCourse
- [x] UI phân loại bắt buộc / tự chọn (checkbox + Badge)
- [x] UI chọn khối kiến thức (Đại cương / Cơ sở ngành / Chuyên ngành / Tự chọn / Tốt nghiệp)
- [x] UI assign học kỳ gợi ý + group view by HK
- [x] UI thêm môn vào CTĐT (modal với dropdown chọn course)
- [x] UI gỡ môn khỏi CTĐT
- [x] UI quản lý tổng tín chỉ yêu cầu (field trong form)
- [x] Stats: tổng môn / tổng TC / bắt buộc vs tự chọn / số HK

### 2.2.4. Quản lý môn học (FR-ADM-CRS)

- [x] Route `/admin/courses` — trang thật
- [x] Trang danh sách + CRUD môn học (form full với credits / tiết LT / tiết TH)
- [x] UI hiển thị + chỉnh tín chỉ
- [x] UI hiển thị môn tiên quyết dạng badge (chỉ display)
- [x] UI xoá môn học (modal confirm)
- [x] Đổi label "giờ" → "tiết" cho LT/TH theo yêu cầu nghiệp vụ
- [ ] UI gán môn tiên quyết qua multi-select (cần thêm endpoint prerequisite riêng)

### 2.2.5. Quản lý học kỳ (FR-ADM-SEM)

- [x] Route `/admin/semesters` — trang thật
- [x] Trang danh sách + CRUD học kỳ
- [x] UI mở/đóng học kỳ (nút Open/Close gọi action endpoint)
- [x] UI thiết lập `start_date`, `end_date`, `registration_start`, `registration_end` (datetime-local)

### 2.2.6. Quản lý lớp học phần (FR-ADM-CLS)

- [x] Route `/admin/classes` — trang thật
- [x] Trang danh sách lớp + filter theo học kỳ / trạng thái + search + pagination
- [x] CRUD lớp học phần (form: code, course, semester, teacher, periods/buổi, sĩ số, status, note)
- [x] Dropdown gán GV cho lớp (fetch toàn bộ TeacherProfile)
- [x] Route `/admin/classes/:id` — chi tiết lớp + 4 KPI stats
- [x] UI thiết lập lịch học hàng tuần (table + add/edit/delete schedule)
- [x] UI chọn buổi (Sáng/Chiều/Tối) + start_period (validate theo session range)
- [x] UI thiết lập phòng + date range tùy chọn (lịch riêng)
- [x] UI thiết lập sĩ số tối đa + hiển thị enrolled_count
- [x] Badge trạng thái (DRAFT/OPEN/CLOSED/CANCELLED) + Badge "Đầy" khi enrolled >= max

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
