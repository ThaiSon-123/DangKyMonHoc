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
- [x] Cấu hình JWT auth (SimpleJWT) — access 60', refresh 7 ngày
- [x] Cấu hình Swagger / OpenAPI (drf-spectacular) tại `/api/docs/`
- [x] Cấu hình CORS cho frontend (5173, 3000)
- [x] Custom User model với role `ADMIN / STUDENT / TEACHER` + `is_locked` + `phone` + `full_name` (plan §7.2.1)
- [x] Endpoint login/refresh JWT + `LockedAwareJWTAuthentication` chặn user đã khoá
- [x] Endpoint quản lý user (Admin only) + `/me`
- [x] Chặn tạo / đổi role ADMIN qua API (FR-ADM-ACC-006)
- [x] `StandardPagination` — client override `page_size` (max 1000)
- [x] `HandleProtectedDeleteMixin` — trả 409 friendly khi xoá entity có FK PROTECT
- [x] `UserProfileFieldsMixin` — auto-sync StudentProfile.major + TeacherProfile.department khi tạo/sửa User

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
- [x] `.gitignore` ở root project (bao gồm `.codex/`, `*.tsbuildinfo`)
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
- [x] Script `seed_teachers.py` — seed 15 GV với các khoa khác nhau
- [x] Script `realign_teacher_departments.py` — đồng bộ khoa GV với Major.department

## 1.2. Auth & Account API

### 1.2.1. Auth chung (FR-GEN)

- [x] FR-GEN-001 - `POST /api/auth/login/` (JWT)
- [x] FR-GEN-001a - Tài khoản `is_locked=True` không login / refresh / dùng access; trả thông báo VN
- [ ] FR-GEN-002 - `POST /api/auth/logout/` (blacklist refresh token)
- [ ] FR-GEN-003 - `POST /api/accounts/change-password/`
- [ ] FR-GEN-004 - Quên mật khẩu (gửi email reset) (SHOULD)
- [x] FR-GEN-005 - `GET /api/accounts/users/me/`
- [ ] FR-GEN-006 - `PATCH /api/accounts/users/me/`
- [x] FR-GEN-007 - Permission class theo role (`IsAdminRole`, `IsAdminOrReadOnly`)

### 1.2.2. Admin quản lý tài khoản (FR-ADM-ACC)

- [x] FR-ADM-ACC-001 - API tạo SV/GV (auto-sync `StudentProfile.major` hoặc `TeacherProfile.department`)
- [x] FR-ADM-ACC-002 - API cập nhật user (PATCH qua `UserViewSet`)
- [x] FR-ADM-ACC-003 - Toggle `is_locked` qua PATCH
- [x] FR-ADM-ACC-004 - API gán/đổi role (qua PATCH, chặn gán ADMIN qua `perform_update`)
- [x] FR-ADM-ACC-005 - Query param search/filter users (`?search=`, `?role=`, `?is_locked=`)
- [x] FR-ADM-ACC-006 - Chặn role=ADMIN khi tạo + đổi qua API
- [x] Backend validation: SV bắt buộc có `student_major`, GV bắt buộc có `teacher_department`

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
- [x] FR-ADM-CRS-005 - API gán môn tiên quyết qua `prerequisite_ids` trong CourseSerializer
- [x] Query param filter `?department=`, `?major=`, `?curriculum=` cho list courses

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

### 1.3.6. Đăng ký môn học - Admin (FR-ADM-REG)

- [x] FR-ADM-REG-001 - API mở đợt đăng ký (`POST /api/semesters/{id}/open/`)
- [x] FR-ADM-REG-002 - API đóng đợt đăng ký (`POST /api/semesters/{id}/close/`)
- [ ] FR-ADM-REG-003 - API thống kê SV theo lớp (đã có `enrolled_count`, cần endpoint aggregate)
- [x] FR-ADM-REG-004 - Logic detect trùng lịch (BR-004)
- [x] FR-ADM-REG-005 - API hủy đăng ký SV (`POST /api/registrations/{id}/cancel/`)
- [ ] FR-ADM-REG-006 - Endpoint xuất CSV/Excel danh sách đăng ký
- [x] Filter list registrations theo `?semester=`, `?status=`, `?class_section=`, `?student=`

### 1.3.7. Báo cáo & thống kê (FR-ADM-RPT)

- [ ] FR-ADM-RPT-001 - API thống kê SV theo môn
- [ ] FR-ADM-RPT-002 - API thống kê SV theo ngành
- [ ] FR-ADM-RPT-003 - API thống kê lớp đầy / còn chỗ
- [ ] FR-ADM-RPT-004 - Xuất Excel / PDF (SHOULD)

### 1.3.8. Thông báo Admin (FR-ADM-NOT)

- [x] Model `Notification` + `NotificationRead`
- [x] FR-ADM-NOT-001 - API gửi thông báo cho SV (audience=ALL_STUDENTS / SPECIFIC)
- [x] FR-ADM-NOT-002 - API gửi thông báo cho GV (audience=ALL_TEACHERS)
- [x] Filter theo role: SV/GV chỉ thấy noti phù hợp + đích danh; Admin thấy tất cả
- [x] **FR-TEA-CLS-005**: `POST /api/class-sections/{id}/notify/` — GV gửi noti cho SV của lớp phụ trách
  - Validate GV phụ trách lớp (403 nếu không); Admin gửi được mọi lớp
  - Auto audience=SPECIFIC, recipients = SV CONFIRMED của lớp
  - 6 pytest cases pass (positive / 403 other GV / Admin bypass / SV reject / missing title / empty class)

## 1.4. Student domain APIs

### 1.4.1. Xem thông tin học tập (FR-STU-INF, FR-STU-CUR)

- [x] FR-STU-INF-001 - API thông tin cá nhân SV (`/me` + `StudentProfile`)
- [x] FR-STU-CUR-001 - `GET /api/curriculums/my/` — auto match CTĐT theo `major` + `enrollment_year` của SV (fallback cohort gần nhất)
- [x] FR-STU-CUR-002 - API trả danh sách môn trong CTĐT (qua nested `curriculum_courses`)
- [x] FR-STU-CUR-003 - Trả về flag `is_required` (bắt buộc / tự chọn)
- [ ] FR-STU-CUR-004 - API tính tiến độ hoàn thành CTĐT — cần aggregate với Registration + Grade (SHOULD)

### 1.4.2. Xem môn học được đăng ký (FR-STU-CRS)

- [ ] FR-STU-CRS-001 - API danh sách lớp học phần SV được phép đăng ký
- [x] FR-STU-CRS-002 - Filter theo `semester_id` (query param)
- [ ] FR-STU-CRS-003 - Filter theo `major_id`
- [ ] FR-STU-CRS-004 - Detail trả về môn + tín chỉ + tiên quyết

### 1.4.3. Đăng ký môn học thủ công (FR-STU-REG)

- [x] FR-STU-REG-001 - API chọn course (qua POST `/api/registrations/`)
- [x] FR-STU-REG-002 - API chọn ClassSection
- [ ] FR-STU-REG-003 - Logic lọc theo teacher (cần endpoint riêng)
- [ ] FR-STU-REG-004 - Logic lọc theo ngày/ca học
- [x] FR-STU-REG-005 - Validation trùng lịch trước khi commit (BR-004) ✓
- [x] FR-STU-REG-006 - Validation môn tiên quyết (BR-002) ✓
- [x] ~~FR-STU-REG-007 - Validation giới hạn tín chỉ~~ — **BR-001 đảo: KHÔNG áp dụng** (plan §5)
- [x] FR-STU-REG-008 - `POST /api/registrations/` xác nhận
- [x] FR-STU-REG-009 - `POST /api/registrations/{id}/cancel/` (BR-006)

### 1.4.4. Tự động tạo TKB (FR-STU-TKB)

- [ ] FR-STU-TKB-001 → 009 - Toàn bộ TKB algorithm chưa implement

### 1.4.5. Xem TKB & lịch sử (FR-STU-SCH, FR-STU-HIS)

- [ ] FR-STU-SCH-001 - API TKB theo tuần
- [ ] FR-STU-SCH-002 - API TKB theo học kỳ
- [ ] FR-STU-SCH-003 - Endpoint xuất TKB (PDF/Excel) (SHOULD)
- [x] FR-STU-HIS-001 - API lịch sử đăng ký (qua `GET /api/registrations/?student=me`)

### 1.4.6. Nhận thông báo (FR-STU-NOT)

- [ ] FR-STU-NOT-001 - Sinh notification khi mở/đóng đăng ký (signal)
- [ ] FR-STU-NOT-002 - Sinh notification khi lịch học thay đổi
- [ ] FR-STU-NOT-003 - Sinh notification khi lớp bị hủy
- [x] FR-STU-NOT-004 - API list notifications của user (filter theo audience)
- [x] API `POST /notifications/{id}/mark-read/` — đánh dấu đã đọc
- [x] API `POST /notifications/mark-all-read/` — đánh dấu đọc tất cả
- [x] API `GET /notifications/unread-count/` — số chưa đọc cho badge
- [x] Field `is_read` trong NotificationSerializer (computed per user)
- [x] API `GET /students/me/` — SV xem hồ sơ cá nhân
- [x] API `GET /teachers/me/` — GV xem hồ sơ cá nhân

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
- [x] FR-TEA-NOT-001 - API list notifications của GV

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

- [x] Setup pytest-django + conftest fixtures
- [x] API test BR-002 → BR-006 (Registration) — 14 cases
- [x] API test BR-007 + BR-008 + BR-009 (Grade) — 4 cases
- [x] API test accounts (locked user / CRUD / role validation) — 6 cases
- [x] API test courses (CRUD + prerequisites + filter) — 6 cases
- [x] API test majors (CRUD) — 3 cases
- [x] API test classes/notify_class (FR-TEA-CLS-005) — 6 cases
- [x] **Tổng: 39/39 tests pass**
- [ ] Unit test cho models (validators, custom methods, `Schedule.clean()`)
- [ ] API test cho auth flow (login / refresh / 401 → refresh)
- [ ] API test cho TKB algorithm
- [ ] API test cho Schedule conflict detection (BR-010 boundary cases)

---

# 2. Frontend (React + Vite)

## 2.1. Auth & Shared UI

- [x] **Design system** — IBM Plex Sans/Mono, navy formal palette, tailwind theme tokens
- [x] **UI primitives** — Icon (38 line-icons), Button (5 variants), Card, Badge (5 tones), Stat, Input
- [x] **Sidebar** — dark navy `#0e1c33`, section grouping, nav theo role, avatar dùng `getInitials()`
- [x] **TopBar** — breadcrumb tự sinh, search bar, bell, avatar dropdown logout
- [x] **Placeholder page** — dùng chung cho route con chưa làm + FR-ID tham chiếu
- [x] **Routing đầy đủ** — toàn bộ nav trong sidebar đều ấn được
- [x] **Modal** component (ESC + backdrop click + 3 size)
- [x] **Table** component (typed `Column<T>`, mono cells, empty state, loading)
- [x] **Pagination** component (Previous/Next + page numbers + range info, wired vào 8 list page)
- [x] **ScheduleGrid** component — grid 7 ngày × 15 tiết, 8 màu, click event, session boundaries
- [x] **`extractApiError`** util — đọc lỗi DRF
- [x] **API services typed** (`users`, `majors`, `courses`, `semesters`, `curriculums`, `classes`, `teachers`, `registrations`, `notifications`, `students`)
- [x] **`semesterLabel(suggested, cohortYear)`** util — derive nhãn "HK X - Năm học YYYY-YYYY"
- [x] **`getInitials(fullName)`** util — chữ cái đầu cho avatar
- [x] FR-GEN-001 - Trang Login 3-portal (SV navy / GV teal / Admin tím) với 2FA toggle + xử lý error tài khoản khoá
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
- [x] Trang danh sách + search + pagination
- [x] Filter theo role (ADMIN/TEACHER/STUDENT) + trạng thái (locked/active)
- [x] Modal tạo SV/GV với form đầy đủ (username, password ≥8 chars, email, full_name, role, phone)
- [x] Modal cập nhật tài khoản (username readonly, không hiển thị password)
- [x] Dropdown chọn role STUDENT/TEACHER (chặn ADMIN ở UI + BE)
- [x] Field `student_major` (dropdown từ Major) khi role=STUDENT
- [x] Field `teacher_department` (dropdown từ Major.department) khi role=TEACHER
- [x] Action toggle khoá/mở khoá + chặn tự khoá chính mình
- [x] Modal xác nhận xoá + chặn xoá Admin / xoá chính mình
- [x] Badge "Bạn" cho user đang đăng nhập + tooltip giải thích nút disabled

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
- [x] Filter theo Khoa / Ngành / CTĐT (cascading dropdowns)
- [x] UI hiển thị tiên quyết dạng badge + multi-select autocomplete trong form
- [x] UI xoá môn học (modal confirm + thông báo 409 friendly)
- [x] Label "tiết" (thay "giờ") cho LT/TH

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
- [x] UI thiết lập sĩ số tối đa + hiển thị enrolled_count + Badge "Đầy"
- [x] Badge trạng thái (DRAFT/OPEN/CLOSED/CANCELLED)

### 2.2.7. Quản lý đăng ký môn học (FR-ADM-REG) ✅ DONE

- [x] Route `/admin/registrations` — trang thật
- [x] Trang danh sách đăng ký + search MSSV/mã lớp + pagination
- [x] Filter theo học kỳ / lớp HP / trạng thái
- [x] KPI stats: tổng / confirmed / cancelled / pending
- [x] UI huỷ đăng ký cho SV (modal lý do, soft cancel)
- [x] UI xoá vĩnh viễn bản ghi (cho data lỗi/test)
- [x] Mở / đóng đợt đăng ký vẫn ở SemestersPage
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

- [x] **Route `/student/profile`** — trang hồ sơ cá nhân SV
  - Avatar gradient navy + tên + MSSV
  - Card "Thông tin học vụ": ngành, khóa (K2026), GPA, TC đã hoàn thành
  - Card "Thông tin liên hệ": username, email, phone, trạng thái bảo mật
  - 4 KPI: GPA / TC tích luỹ / Số năm đào tạo / Trạng thái
- [x] **Route `/student/curriculum`** — trang thật, gọi `GET /api/curriculums/my/`
- [x] Trang chương trình đào tạo của ngành (header + 4 KPI stats)
- [x] Tỷ lệ hoàn thành CTĐT (progress bar TC vs yêu cầu)
- [x] Grid phân bố 5 khối kiến thức (Đại cương/Cơ sở ngành/Chuyên ngành/Tự chọn/Tốt nghiệp)
- [x] Hiển thị danh sách môn nhóm theo học kỳ với nhãn "HK X - Năm học YYYY-YYYY"
- [x] Mỗi môn: code / tên / TC / khối kiến thức (badge) / bắt buộc-tự chọn (badge)
- [x] Empty state khi SV không có CTĐT match
- [ ] Hiển thị tiến độ hoàn thành môn (đã học / đang học / chưa học) — cần Grade data
- [ ] Filter / sort theo khối kiến thức

### 2.3.2. Xem môn học được đăng ký (FR-STU-CRS)

- [ ] Trang danh sách môn được phép đăng ký
- [ ] Filter theo học kỳ
- [ ] Filter theo ngành
- [ ] Modal chi tiết môn (tín chỉ, tiên quyết, các lớp mở)

### 2.3.3. Đăng ký môn học thủ công (FR-STU-REG) ✅ DONE

- [x] **Route `/student/register`** — trang thật
- [x] Dropdown chọn học kỳ (default = học kỳ đang mở)
- [x] List lớp HP `status=OPEN` của học kỳ + search theo mã/tên
- [x] Hiển thị: mã lớp / môn / TC / GV / lịch học / sĩ số (đỏ khi đầy)
- [x] Badge "Đã đăng ký" cho lớp SV đã đăng ký
- [x] Nút **Đăng ký** disabled khi: lớp đầy / học kỳ chưa mở
- [x] Modal **Xác nhận** hiển thị chi tiết lớp + lịch học + thông báo các BR sẽ check
- [x] Hiển thị error backend friendly (BR-002 → 006)
- [x] Success banner sau khi đăng ký thành công (auto-hide 4s)
- [x] Card "Lớp đã đăng ký" hiển thị toàn bộ reg trong kỳ + nút Huỷ
- [x] Modal huỷ đăng ký với lý do
- [x] Warning banner khi học kỳ chưa mở
- [x] Stats: lớp đã đăng ký / tổng TC / lớp mở của kỳ

### 2.3.4. Tự động tạo TKB (FR-STU-TKB)

- [x] Route placeholder `/student/auto`
- [ ] Toàn bộ UI TKB algorithm chưa làm

### 2.3.5. Xem TKB & lịch sử (FR-STU-SCH, FR-STU-HIS) ✅ DONE

- [x] **Route `/student/schedule`** — TKB view theo tuần (grid 7 ngày × 15 tiết)
- [x] Component `ScheduleGrid` reusable với 8 màu phân biệt môn
- [x] Phân chia rõ Sáng (1-5) / Chiều (6-10) / Tối (11-15) với border-t đậm
- [x] Click ô buổi học → modal chi tiết (thứ / tiết / phòng / GV)
- [x] Card "Danh sách môn đăng ký" dưới grid (mỗi môn 1 thẻ với badge TC)
- [x] 4 KPI stats: môn / buổi/tuần / TC / số đăng ký
- [x] Empty state khi chưa đăng ký môn nào
- [ ] TKB view theo học kỳ (currently 1 view duy nhất)
- [ ] Nút xuất TKB (SHOULD)
- [x] **Route `/student/history`** — Trang lịch sử đăng ký
- [x] Filter theo học kỳ + trạng thái
- [x] Table với cột: HK / môn / lớp / TC / trạng thái (badge) / thời gian / lý do hủy
- [x] Nút Huỷ trên dòng `status != CANCELLED` + warning banner BR-006
- [x] 4 KPI stats: tổng / confirmed / cancelled / TC đang học

### 2.3.6. Nhận thông báo (FR-STU-NOT) ✅ DONE

- [x] **Route `/student/notifications`** — trang thật
- [x] Trang danh sách thông báo (card list, không phải table) + pagination
- [x] Hiển thị `is_read` status với badge "chưa đọc" + ring viền navy
- [x] Click 1 noti → mở modal chi tiết + auto mark-read
- [x] Nút "Đánh dấu đã đọc tất cả" + counter unread
- [x] Icon + tone theo category (megaphone/calendar/clipboard/settings/bell)
- [x] Relative time ("5 phút trước", "2 ngày trước"...)
- [x] Empty state đẹp khi không có noti
- [ ] Badge số notification chưa đọc trên layout TopBar

## 2.4. Teacher UI

> Tất cả 5 route teacher (`/teacher/schedule` → `/teacher/profile`) đã có **placeholder** kèm FR-ID tham chiếu.

### 2.4.1. Xem thông tin & lớp học phần (FR-TEA-INF, FR-TEA-CLS, FR-TEA-SCH) ✅ DONE

- [x] **Route `/teacher/profile`** — hồ sơ GV (avatar emerald + thông tin công tác + liên hệ)
- [x] **Route `/teacher/classes`** — list lớp phụ trách + 3 KPI + filter học kỳ
- [x] **Route `/teacher/classes/:id`** — chi tiết lớp + 4 KPI + lịch học + danh sách SV
- [x] **Route `/teacher/schedule`** — TKB cá nhân GV (dùng lại ScheduleGrid với màu emerald palette)
- [x] Link nhanh từ class list → nhập điểm + xem SV
- [x] **UI gửi thông báo cho lớp** (FR-TEA-CLS-005) — modal trong ClassDetailPage với title / body / category + count SV nhận

### 2.4.2. Nhập điểm (FR-TEA-GRD) ✅ DONE

- [x] **Route `/teacher/grades`** với dropdown chọn lớp
- [x] Trang nhập điểm dạng bảng (QT/GK/CK) inline editable
- [x] **Auto-preview** total_score + grade_letter ngay khi gõ (client-side calc theo BR-009)
- [x] Sau khi save: cập nhật chính xác từ backend response (total_score, grade_letter, gpa_4)
- [x] **Nút Lưu** chỉ enable khi dirty + nút "Lưu tất cả" batch save
- [x] Hiển thị error per-row khi save fail (vd. BR-008 quá hạn)
- [x] Badge "Đã lưu" / "Đang nhập" cho mỗi dòng
- [x] 4 KPI stats: Sĩ số / Đã nhập / Đạt ≥4 / GPA TB lớp
- [x] Preselect class qua query param `?class=<id>` (link từ ClassesPage)
- [x] Backend filter `?class_section=` cho grades
- [ ] Nút xuất bảng điểm Excel

### 2.4.3. Khác (FR-TEA-REQ, FR-TEA-EXP, FR-TEA-NOT) — Notifications DONE

- [x] **Route `/teacher/notifications`** — copy pattern từ student, filter theo audience GV
- [x] Auto mark-read khi click + "Đánh dấu đã đọc tất cả"
- [x] **Compose noti cho lớp** từ `ClassDetailPage` → SV nhận ngay (FR-TEA-CLS-005)
- [ ] UI đề xuất thay đổi lịch dạy (MAY)
- [ ] Nút xuất danh sách SV

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
- [x] NFR-SEC-003 - Bảo vệ dữ liệu điểm: GradeViewSet filter theo role
- [x] **Bonus security**: Locked user không login / refresh / dùng access token cũ
- [ ] NFR-PER-001 - Phản hồi tra cứu trong thời gian chấp nhận được [!] TBD
- [ ] NFR-AVL-001 - Cơ chế sao lưu / phục hồi
- [x] NFR-USA-001 - Giao diện navy formal IBM Plex Sans, design system nhất quán
- [x] NFR-SCL-001 - Pagination 25/page, max 1000
- [ ] NFR-CMP-001 - Tương thích trình duyệt phổ biến

---

## 4. Verification / Testing (plan §11)

- [x] TEST-001 - Login + phân quyền (manual + 6 pytest cases trong accounts)
- [x] TEST-002 - Quản lý tài khoản (UI + API tests)
- [x] TEST-003 - Quản lý CTĐT (CRUD via UI + import xlsx)
- [x] TEST-004 - Quản lý môn học và tiên quyết (CRUD via UI + 6 pytest)
- [x] TEST-005 - Quản lý học kỳ và thời gian đăng ký (CRUD via UI + open/close)
- [x] TEST-006 - Quản lý lớp học phần (CRUD + schedule via UI)
- [ ] TEST-007 - Đăng ký môn học thủ công SV side (BE ready, FE pending)
- [x] TEST-008 - BR-002 → BR-006 + signal (18 pytest cases pass)
- [ ] TEST-009 - Thuật toán tạo TKB tự động (chưa implement)
- [ ] TEST-010 - Xem TKB sinh viên (chưa implement)
- [ ] TEST-011 - Xem TKB giáo viên (chưa implement)
- [x] TEST-012 - Nhập điểm + BR-007/BR-008/BR-009 (pytest cases + auto-compute)
- [x] TEST-013 - Gửi thông báo từ Admin (UI + API)
- [ ] TEST-014 - Báo cáo và thống kê (chưa implement)

---

## 5. Open Questions / Risks (plan §12) — **đã chốt hết qua BR mới**

- [x] OPEN - Số tín chỉ tối thiểu / tối đa → **KHÔNG áp dụng** (BR-001 đảo ngược)
- [x] OPEN - Công thức tính điểm tổng kết → **10% + 40% + 50%** (BR-009)
- [x] OPEN - Thời hạn hủy đăng ký → **trong thời gian đăng ký** (BR-006)
- [x] OPEN - Thời hạn cập nhật điểm → **2 tuần sau khi kết thúc môn** (BR-008)
- [x] OPEN - Quy ước tiết học → **15 tiết/ngày, sáng 1-5 / chiều 6-10 / tối 11-15** (BR-010)
- [x] RISK - Độ phức tạp thuật toán TKB tự động khi quy mô tăng (sẽ tích hợp agent / heuristic sau)

---

## 6. Sửa SRS

- [x] Cập nhật `plan.md` §2.2: `TypeORM` → `Django ORM`
- [x] Cập nhật `plan.md` §5: BR-001 → BR-011 (thêm BR-008, BR-009, BR-010, BR-011 + đảo ngược BR-001)
- [x] Cập nhật `plan.md` §7.2: bổ sung `Major.duration_years`, `Semester.term` int 1/2/3, `Grade.gpa_4`, `Schedule` mới với session + start_period + end_period, `ClassSection.periods_per_session`, `User.full_name`

---

## 7. Tổng quan tiến độ

| Layer | Hoàn thành | Ghi chú |
|---|---|---|
| Hạ tầng (mục 0) | 95% | Còn ERD diagram + README root |
| Backend models (1.1) | 100% | 15 entity đầy đủ, migration OK, đã có seed scripts |
| Backend Admin API (1.2 – 1.3) | ~90% | Còn Reports + nút export CSV/Excel |
| Backend SV/GV API (1.4 – 1.5) | ~70% | Cơ bản qua các ViewSet + `/curriculums/my/`, `/students/me/`, `/notifications/mark-read/`, etc. |
| Backend BR (1.6) | 100% | Tất cả 11 BR đã wire + 39 tests pass |
| Backend testing (1.7) | 55% | 39 tests (BR + accounts + courses + majors + notify_class); còn auth/algorithm tests |
| Frontend foundation (2.1) | 95% | Có ScheduleGrid mới. Còn toast, confirm dialog, skeleton loader |
| Frontend admin (2.2) | ~80% | **8/10 module** xong; còn Reports, Settings |
| Frontend student (2.3) | ~85% | **5/6 module** xong (Curriculum, Đăng ký, TKB, Lịch sử, Thông báo, Hồ sơ); chỉ thiếu **Auto TKB** (defer) |
| Frontend teacher (2.4) | ~95% | **5/5 module** xong + tính năng **gửi noti cho lớp**; chỉ thiếu export Excel + đề xuất đổi lịch (MAY) |
| Frontend testing (2.5) | 0% | Chưa setup Vitest |

**Tổng cộng**: 305 mục đã làm `[x]` / 82 mục chưa làm `[ ]` (387 items)

### Modules UI hoàn thành

**Admin — 8/10 module:**
1. ✅ Tài khoản (`/admin/accounts`) — CRUD + lock/unlock + role validation
2. ✅ Ngành đào tạo (`/admin/majors`)
3. ✅ Chương trình đào tạo (`/admin/curriculum` + detail) — kèm import xlsx
4. ✅ Môn học (`/admin/courses`) — filter cascading + prerequisite multi-select
5. ✅ Học kỳ (`/admin/semesters`) — open/close action
6. ✅ Lớp học phần (`/admin/classes` + detail) — schedule management
7. ✅ Quản lý đăng ký (`/admin/registrations`) — filter + cancel + delete
8. ✅ Gửi thông báo (`/admin/notifications`) — soạn + audience SPECIFIC autocomplete
- ⬜ Báo cáo (`/admin/reports`) — chưa làm
- ⬜ Cấu hình (`/admin/settings`) — chưa làm

**Sinh viên — 5/6 module:**
1. ✅ Chương trình đào tạo (`/student/curriculum`) — auto match theo major + cohort
2. ✅ Đăng ký môn học (`/student/register`) — wire BR-002 → BR-006
3. ✅ Thời khóa biểu (`/student/schedule`) — grid 7×15 với 8 màu
4. ✅ Lịch sử đăng ký (`/student/history`) — filter + cancel
5. ✅ Thông báo (`/student/notifications`) — mark-read + autocomplete
6. ✅ Hồ sơ cá nhân (`/student/profile`)
- ⏸ Tạo TKB tự động (`/student/auto`) — defer

**Giáo viên — 5/5 module:**
1. ✅ Lịch dạy (`/teacher/schedule`) — TKB grid, color theo môn
2. ✅ Lớp phụ trách (`/teacher/classes` + `/teacher/classes/:id`) — list + chi tiết SV
3. ✅ Nhập điểm (`/teacher/grades`) — inline edit + auto-compute BR-009
4. ✅ Thông báo (`/teacher/notifications`) — mark-read flow
5. ✅ Hồ sơ (`/teacher/profile`) — avatar emerald, thông tin công tác

### Bước tiếp theo khuyến nghị

1. **Admin: Reports** (`/admin/reports`) — thống kê SV theo môn / ngành / lớp đầy (4 biểu đồ)
2. **Admin: Settings** (`/admin/settings`) — cấu hình BR-006/008 grace days
3. **Sinh viên: Auto TKB** (`/student/auto`) — module phức tạp với thuật toán search tổ hợp
4. **Backend testing** — auth flow + admin CRUD + algorithm tests
5. **Frontend testing** — Vitest + Testing Library cho store, interceptor, form

---

## Lịch sử các thay đổi lớn

### Phase 1 — Setup (mục 0)

- Khởi tạo backend Django + frontend React + Docker compose + JWT auth + Swagger

### Phase 2 — Data Model (mục 1.1)

- 15 entity + migrations + seed scripts
- Schema updates theo plan §7.2: `full_name`, `duration_years`, `term` int, `Schedule` mới, `gpa_4`

### Phase 3 — Backend BR (mục 1.6)

- 11 Business Rules wire vào serializer / view / signal
- 33 pytest cases pass

### Phase 4 — Frontend foundation (mục 2.1)

- Design system navy formal + UI primitives + routing + dashboards
- Pagination + Modal + Table generic + extractApiError + semesterLabel + getInitials

### Phase 5 — Admin UI modules (mục 2.2)

- 8/10 module DONE: Accounts, Majors, Courses, Semesters, Curriculum, Classes, Registrations, Notifications
- Mỗi module có CRUD + filter + pagination + 409 friendly delete

### Phase 6 — Git recovery

- Drop commit `e470eab` chứa secret token
- Restore 38 file từ commit `02941a3` (chứa AccountsPage + RegistrationsPage + NotificationsPage + LockedAware auth)
- Resolve 15 file có git merge conflict markers
- 33/33 tests pass, push thành công

### Phase 7 — Student UI modules (mục 2.3)

- 5/6 module DONE: Chương trình đào tạo, Thông báo, Hồ sơ, Đăng ký môn học, Thời khóa biểu, Lịch sử đăng ký
- Backend mới: `GET /curriculums/my/`, `GET /students/me/`, `GET /teachers/me/`, `POST /notifications/{id}/mark-read/`, `POST /notifications/mark-all-read/`, `GET /notifications/unread-count/`
- Component mới: `ScheduleGrid` (7 ngày × 15 tiết, 8 màu, click event, BR-010 session boundaries)
- Module **Auto TKB** defer vì cần thuật toán search tổ hợp lớp HP phức tạp

### Phase 8 — Teacher UI modules (mục 2.4)

- **5/5 module DONE**: Profile, Notifications, Schedule, Classes (+ detail), Grades
- Backend mới: `?class_section=` filter cho `/grades/`, `student_name` field trong Registration + Grade serializer
- API service mới: `api/grades.ts` (create/update + auto-compute readonly fields)
- Highlight: **GradesPage** với inline-edit + auto-preview total/letter ngay khi gõ + batch save
