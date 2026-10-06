# Checklist New: Role Ke Toan va Chuc Nang Diem Danh

> **Pham vi:** Bo sung day du cac phan con thieu theo tai lieu yeu cau: role Ke toan, chuc nang hoc phi/thanh toan/cong no, va chuc nang diem danh cho Giao vien/Sinh vien.
>
> **Gia dinh:** Project hien tai la Django REST Framework + React/Vite, khong phai Flutter. Checklist nay uu tien hoan thien tren stack hien co. Neu bat buoc lam mobile Flutter, can tao checklist rieng cho mobile app.

## 0. Ket Qua Check Rieng Theo Yeu Cau Moi

- [x] Checklist hien da co muc gia tin chi theo nganh: `MajorTuitionRate`.
- [x] Checklist hien da co muc gia tin chi theo khoi mon/khoi kien thuc: `KnowledgeBlockTuitionRate`.
- [x] Checklist hien da co muc gia rieng cho tin chi ly thuyet va thuc hanh: `CreditTypeTuitionRate`.
- [ ] Can lam ro cac cau hinh gia tren nam trong role Ke toan va hien thi day du tren trang `/accountant/tuition-settings`.
- [ ] Can bo sung hoc phi tung mon/lop vao page dang ky mon hien co: `frontend/src/pages/student/RegisterPage.tsx`.
- [ ] Can bo sung page sinh vien xem hoc phi tong hop theo hoc ky giong Hinh 2.
- [ ] Can bo sung page sinh vien dong hoc phi/thanh toan truc tuyen giong Hinh 3.
- [ ] Can bo sung cac page sau khi bam nut `Thanh toan`: xac nhan khoan thu, chon phuong thuc, hien QR/chuyen khoan, ket qua thanh toan, bien lai.

## 1. Tieu Chi Hoan Thanh

- [ ] He thong co role `ACCOUNTANT` o backend va frontend.
- [ ] Admin/Phong dao tao tao, sua, khoa/mo khoa tai khoan Ke toan duoc.
- [ ] Ke toan dang nhap va vao duoc khu vuc rieng `/accountant`.
- [ ] Ke toan cau hinh duoc hoc phi theo hoc ky, nganh, khoi kien thuc, tin chi ly thuyet va tin chi thuc hanh.
- [ ] He thong tinh hoc phi tu dong theo dang ky mon hoc da xac nhan.
- [ ] Ke toan xem danh sach hoc phi, cong no, thanh toan va xac nhan dong hoc phi.
- [ ] Ke toan dieu chinh hoc phi khi sinh vien huy/dang ky them mon, mien giam, hoan tien hoac thu bo sung.
- [ ] Ke toan xuat duoc bien lai/phieu thu dang file hoac du lieu in an.
- [ ] Ke toan xem duoc bao cao tai chinh hoc phi theo hoc ky, nganh, lop hoc phan va sinh vien.
- [ ] Trang dang ky mon hien hoc phi tam tinh cua tung mon/lop trong danh sach mon da dang ky.
- [ ] Trang dang ky mon hien tong so mon, tong tin chi va tong hoc phi tam tinh.
- [ ] Sinh vien co page `Xem hoc phi` tong hop theo tat ca hoc ky voi cac cot: HP chua giam, Mien giam, Phai thu, Da thu, Con no.
- [ ] Sinh vien co page `Dong hoc phi`/`Thanh toan truc tuyen` liet ke phieu thu con no va nut `Thanh toan`.
- [ ] Sau khi bam `Thanh toan`, sinh vien di qua flow thanh toan gom xac nhan, chon phuong thuc, thuc hien thanh toan va xem ket qua/bien lai.
- [ ] Giao vien tao buoi diem danh cho lop minh phu trach.
- [ ] Giao vien diem danh tung sinh vien voi trang thai Co mat, Vang co phep, Vang khong phep, Di tre.
- [ ] Giao vien cap nhat diem danh khi co ly do hop le va he thong luu lich su thoi gian cap nhat.
- [ ] Giao vien xem lich su diem danh theo lop hoc phan va tung buoi hoc.
- [ ] Sinh vien xem duoc diem danh cua chinh minh theo tung lop hoc phan.
- [ ] API co test phan quyen: Admin, Ke toan, Giao vien, Sinh vien.
- [ ] Frontend build thanh cong va backend test pass.

## 2. Database Va Migration

### 2.1. Role Va Profile Ke Toan

- [ ] Sua `backend/apps/accounts/models.py`.
  - [ ] Them `ACCOUNTANT = "ACCOUNTANT", "Ke toan"` vao `Role`.
  - [ ] Kiem tra `role` max length hien la 16, du chua gia tri `ACCOUNTANT`.
- [ ] Tao migration cho role moi neu can thiet.
- [ ] Sua hoac mo rong `backend/apps/profiles/models.py`.
  - [ ] Tao model `AccountantProfile`.
  - [ ] Field de xuat:
    - [ ] `user = OneToOneField(User, related_name="accountant_profile")`
    - [ ] `accountant_code`
    - [ ] `department`
    - [ ] `position`
    - [ ] `is_active`
    - [ ] `created_at`
    - [ ] `updated_at`
- [ ] Tao migration cho `AccountantProfile`.
- [ ] Dang ky model trong `backend/apps/profiles/admin.py`.
- [ ] Cap nhat serializer profile neu co endpoint profile rieng.
- [ ] Them index/constraint:
  - [ ] `accountant_code` unique.
  - [ ] `user` unique qua OneToOne.

### 2.2. Database Hoc Phi

- [ ] Tao app moi: `backend/apps/tuition`.
- [ ] Them `"apps.tuition"` vao `INSTALLED_APPS`.
- [ ] Tao cac model chinh trong `backend/apps/tuition/models.py`.
- [ ] Tao model `TuitionPolicy`.
  - [ ] `semester = ForeignKey(Semester)`
  - [ ] `name`
  - [ ] `status = DRAFT | ACTIVE | ARCHIVED`
  - [ ] `effective_from`
  - [ ] `effective_to`
  - [ ] `created_by = ForeignKey(User)`
  - [ ] `created_at`
  - [ ] `updated_at`
  - [ ] Constraint: moi hoc ky chi co mot policy `ACTIVE`.
- [ ] Tao model `MajorTuitionRate`.
  - [ ] `policy = ForeignKey(TuitionPolicy)`
  - [ ] `major = ForeignKey(Major)`
  - [ ] `default_credit_price`
  - [ ] Unique: `policy + major`.
- [ ] Tao model `KnowledgeBlockTuitionRate`.
  - [ ] `policy = ForeignKey(TuitionPolicy)`
  - [ ] `major = ForeignKey(Major, null=True, blank=True)`
  - [ ] `knowledge_block = GENERAL | BASIC | MAJOR | ELECTIVE | THESIS`
  - [ ] `credit_price`
  - [ ] Unique: `policy + major + knowledge_block`.
- [ ] Tao model `CreditTypeTuitionRate`.
  - [ ] `policy = ForeignKey(TuitionPolicy)`
  - [ ] `major = ForeignKey(Major, null=True, blank=True)`
  - [ ] `theory_credit_price`
  - [ ] `practice_credit_price`
  - [ ] Unique: `policy + major`.
- [ ] Tao model `TuitionDiscount`.
  - [ ] `student = ForeignKey(StudentProfile)`
  - [ ] `semester = ForeignKey(Semester)`
  - [ ] `discount_type = SCHOLARSHIP | EXEMPTION | REFUND | OTHER`
  - [ ] `amount`
  - [ ] `percent`
  - [ ] `reason`
  - [ ] `approved_by = ForeignKey(User)`
  - [ ] `created_at`
- [ ] Tao model `TuitionInvoice`.
  - [ ] `student = ForeignKey(StudentProfile)`
  - [ ] `semester = ForeignKey(Semester)`
  - [ ] `policy = ForeignKey(TuitionPolicy)`
  - [ ] `status = DRAFT | ISSUED | PARTIALLY_PAID | PAID | OVERDUE | CANCELLED`
  - [ ] `subtotal_amount`
  - [ ] `discount_amount`
  - [ ] `adjustment_amount`
  - [ ] `total_amount`
  - [ ] `paid_amount`
  - [ ] `debt_amount`
  - [ ] `due_date`
  - [ ] `issued_at`
  - [ ] `created_at`
  - [ ] `updated_at`
  - [ ] Unique: `student + semester`.
- [ ] Tao model `TuitionInvoiceLine`.
  - [ ] `invoice = ForeignKey(TuitionInvoice)`
  - [ ] `registration = ForeignKey(Registration)`
  - [ ] `course = ForeignKey(Course)`
  - [ ] `class_section = ForeignKey(ClassSection)`
  - [ ] `knowledge_block`
  - [ ] `credits`
  - [ ] `theory_hours`
  - [ ] `practice_hours`
  - [ ] `unit_price`
  - [ ] `amount`
  - [ ] Unique: `invoice + registration`.
- [ ] Tao model `TuitionReceipt` hoac bo sung field phieu thu vao `TuitionInvoice`.
  - [ ] `receipt_no`
  - [ ] `invoice = ForeignKey(TuitionInvoice)`
  - [ ] `student = ForeignKey(StudentProfile)`
  - [ ] `semester = ForeignKey(Semester)`
  - [ ] `content`
  - [ ] `amount`
  - [ ] `status = UNPAID | PROCESSING | PAID | CANCELLED | EXPIRED`
  - [ ] `created_at`
  - [ ] `paid_at`
  - [ ] Unique: `receipt_no`.
- [ ] Tao model `PaymentTransaction`.
  - [ ] `invoice = ForeignKey(TuitionInvoice)`
  - [ ] `receipt = ForeignKey(TuitionReceipt, null=True, blank=True)`
  - [ ] `amount`
  - [ ] `method = CASH | BANK_TRANSFER | QR | CARD | ONLINE_GATEWAY | OTHER`
  - [ ] `reference_code`
  - [ ] `gateway_transaction_id`
  - [ ] `payment_url`
  - [ ] `qr_payload`
  - [ ] `status = PENDING | SUCCESS | FAILED | CANCELLED | EXPIRED`
  - [ ] `paid_at`
  - [ ] `confirmed_by = ForeignKey(User)`
  - [ ] `note`
  - [ ] `created_at`
- [ ] Tao model `TuitionAdjustment`.
  - [ ] `invoice = ForeignKey(TuitionInvoice)`
  - [ ] `amount`
  - [ ] `adjustment_type = ADDITIONAL_CHARGE | DISCOUNT | REFUND | CORRECTION`
  - [ ] `reason`
  - [ ] `created_by = ForeignKey(User)`
  - [ ] `created_at`
- [ ] Tao migration cho toan bo module hoc phi.
- [ ] Them database indexes:
  - [ ] `TuitionInvoice(semester, status)`
  - [ ] `TuitionInvoice(student, semester)`
  - [ ] `PaymentTransaction(paid_at)`
  - [ ] `PaymentTransaction(confirmed_by)`
  - [ ] `TuitionInvoiceLine(class_section)`

### 2.3. Database Diem Danh

- [ ] Tao app moi: `backend/apps/attendance`.
- [ ] Them `"apps.attendance"` vao `INSTALLED_APPS`.
- [ ] Tao model `AttendanceSession`.
  - [ ] `class_section = ForeignKey(ClassSection)`
  - [ ] `schedule = ForeignKey(Schedule, null=True, blank=True)`
  - [ ] `session_date`
  - [ ] `session = MORNING | AFTERNOON | EVENING`
  - [ ] `start_period`
  - [ ] `end_period`
  - [ ] `room`
  - [ ] `created_by = ForeignKey(User)`
  - [ ] `note`
  - [ ] `created_at`
  - [ ] `updated_at`
  - [ ] Unique: `class_section + session_date + start_period`.
- [ ] Tao model `AttendanceRecord`.
  - [ ] `attendance_session = ForeignKey(AttendanceSession)`
  - [ ] `registration = ForeignKey(Registration)`
  - [ ] `student = ForeignKey(StudentProfile)`
  - [ ] `status = PRESENT | EXCUSED_ABSENT | UNEXCUSED_ABSENT | LATE`
  - [ ] `note`
  - [ ] `marked_by = ForeignKey(User)`
  - [ ] `marked_at`
  - [ ] `updated_at`
  - [ ] Unique: `attendance_session + student`.
- [ ] Tao model `AttendanceChangeLog` neu can audit ro rang.
  - [ ] `record = ForeignKey(AttendanceRecord)`
  - [ ] `old_status`
  - [ ] `new_status`
  - [ ] `changed_by = ForeignKey(User)`
  - [ ] `reason`
  - [ ] `changed_at`
- [ ] Tao migration cho module diem danh.
- [ ] Them database indexes:
  - [ ] `AttendanceSession(class_section, session_date)`
  - [ ] `AttendanceRecord(student, status)`
  - [ ] `AttendanceRecord(registration)`

## 3. Backend

### 3.1. Phan Quyen Va Tai Khoan

- [ ] Sua `backend/apps/accounts/permissions.py`.
  - [ ] Them `IsAccountantRole`.
  - [ ] Them permission dung chung neu can: `IsAdminOrAccountant`.
  - [ ] Them permission dung chung neu can: `IsTeacherOwnerOrAdmin`.
- [ ] Sua `backend/apps/accounts/serializers.py`.
  - [ ] Cho phep tao role `ACCOUNTANT`.
  - [ ] Khong bat `student_major` khi role la `ACCOUNTANT`.
  - [ ] Khong bat `teacher_department` khi role la `ACCOUNTANT`.
  - [ ] Sync `AccountantProfile` khi tao/sua user co role `ACCOUNTANT`.
  - [ ] Tra ve field `accountant_department`, `accountant_code`, `accountant_position` neu UI can hien thi.
- [ ] Sua `backend/apps/accounts/views.py`.
  - [ ] Cho filter `role=ACCOUNTANT`.
  - [ ] Dam bao van chan tao role `ADMIN` qua API.
  - [ ] Dam bao admin khong the tu xoa minh.
- [ ] Sua tests account:
  - [ ] Admin tao duoc account Ke toan.
  - [ ] Admin sua duoc thong tin Ke toan.
  - [ ] Admin khoa/mo khoa duoc Ke toan.
  - [ ] User thuong khong tao duoc Ke toan.
  - [ ] Ke toan bi khoa khong login duoc.

### 3.2. Backend Hoc Phi

- [ ] Tao `backend/apps/tuition/apps.py`.
- [ ] Tao `backend/apps/tuition/admin.py`.
- [ ] Tao `backend/apps/tuition/serializers.py`.
  - [ ] `TuitionPolicySerializer`
  - [ ] `MajorTuitionRateSerializer`
  - [ ] `KnowledgeBlockTuitionRateSerializer`
  - [ ] `CreditTypeTuitionRateSerializer`
  - [ ] `TuitionDiscountSerializer`
  - [ ] `TuitionInvoiceLineSerializer`
  - [ ] `TuitionInvoiceSerializer`
  - [ ] `PaymentTransactionSerializer`
  - [ ] `TuitionAdjustmentSerializer`
  - [ ] `TuitionReportSerializer`
- [ ] Tao `backend/apps/tuition/services.py`.
  - [ ] `get_active_policy(semester)`
  - [ ] `resolve_course_knowledge_block(student, course)`
  - [ ] `resolve_unit_price(policy, student, course)`
  - [ ] `calculate_registration_line(registration, policy)`
  - [ ] `calculate_class_section_estimated_tuition(student, class_section)`
  - [ ] `calculate_registration_estimated_tuition(registration)`
  - [ ] `recalculate_invoice(student, semester)`
  - [ ] `apply_discount(invoice)`
  - [ ] `apply_adjustment(invoice)`
  - [ ] `update_invoice_payment_status(invoice)`
  - [ ] `create_unpaid_receipt(invoice)`
  - [ ] `start_online_payment(receipt, method, return_url)`
  - [ ] `handle_payment_callback(payload)`
  - [ ] `create_demo_payment_session(payment)`
  - [ ] `complete_demo_bank_payment(token, result)`
  - [ ] `confirm_payment(invoice, amount, method, reference_code, confirmed_by, note)`
- [ ] Tao mock/sandbox payment gateway cho demo QR.
  - [ ] Uu tien dung sandbox/demo cua ngan hang hoac cong thanh toan neu co.
  - [ ] Neu chua co sandbox ngan hang, dung `PAYMENT_GATEWAY_PROVIDER=mock_bank`.
  - [ ] Tao payment session voi `method=QR` va status `PENDING`.
  - [ ] Sinh ra 1 URL demo ngan hang duy nhat de dua vao QR.
  - [ ] URL demo ngan hang co token ngan han, khong dung truc tiep `payment_id` de tranh user doan URL.
  - [ ] Token het han sau 10-15 phut.
  - [ ] Quet QR mo trang demo ngan hang/sandbox.
  - [ ] Tren trang demo ngan hang, cho chon ket qua `Thanh toan thanh cong` hoac `Thanh toan that bai`.
  - [ ] Ket qua thanh cong cap nhat transaction `SUCCESS`.
  - [ ] Ket qua that bai cap nhat transaction `FAILED`.
  - [ ] Neu payment da `SUCCESS`, khong duoc dao nguoc ve `FAILED`.
  - [ ] Neu payment da `FAILED`, chi duoc thanh toan lai bang payment session moi.
- [ ] Tao `backend/apps/tuition/views.py`.
  - [ ] CRUD cau hinh policy chi cho Admin/Ke toan.
  - [ ] CRUD bang gia chi cho Admin/Ke toan.
  - [ ] Endpoint tra hoc phi tam tinh cho tung lop hoc phan trong page dang ky mon.
  - [ ] Endpoint tinh lai hoc phi cho mot sinh vien theo hoc ky.
  - [ ] Endpoint tinh lai hoc phi hang loat theo hoc ky.
  - [ ] Endpoint sinh vien xem tong hop hoc phi tat ca hoc ky.
  - [ ] Endpoint sinh vien xem chi tiet hoc phi mot hoc ky.
  - [ ] Endpoint sinh vien xem danh sach phieu thu con no de dong hoc phi.
  - [ ] Endpoint xem danh sach invoice theo hoc ky/nganh/lop/trang thai.
  - [ ] Endpoint xem chi tiet invoice.
  - [ ] Endpoint tao phieu thu/chuan bi thanh toan online.
  - [ ] Endpoint bat dau thanh toan online khi sinh vien bam `Thanh toan`.
  - [ ] Endpoint lay trang thai thanh toan de hien page ket qua.
  - [ ] Endpoint xac nhan thanh toan.
  - [ ] Endpoint them dieu chinh hoc phi.
  - [ ] Endpoint xuat bien lai/phieu thu.
  - [ ] Endpoint bao cao hoc phi.
- [ ] Tao `backend/apps/tuition/urls.py`.
  - [ ] Route `/api/tuition/policies/`
  - [ ] Route `/api/tuition/major-rates/`
  - [ ] Route `/api/tuition/knowledge-rates/`
  - [ ] Route `/api/tuition/credit-type-rates/`
  - [ ] Route `/api/tuition/discounts/`
  - [ ] Route `/api/tuition/invoices/`
  - [ ] Route `/api/tuition/receipts/`
  - [ ] Route `/api/tuition/payments/`
  - [ ] Route `/api/tuition/adjustments/`
  - [ ] Route `/api/tuition/student-summary/`
  - [ ] Route `/api/tuition/student-payment-items/`
  - [ ] Route `/api/tuition/reports/`
- [ ] Include tuition urls trong `backend/config/urls.py`.
- [ ] Tich hop voi `registrations`.
  - [ ] Khi registration `CONFIRMED`, tao/cap nhat invoice.
  - [ ] Khi registration `CANCELLED`, cap nhat invoice va adjustment neu can.
  - [ ] Registration serializer tra them `estimated_tuition_amount` de page dang ky mon hien hoc phi tung mon.
  - [ ] Available course/class-section API tra them `estimated_tuition_amount` neu can hien hoc phi truoc khi dang ky.
  - [ ] Khi class/course credits thay doi, co command tinh lai hoc phi.
- [ ] Tao management command.
  - [ ] `recalculate_tuition --semester <id>`
  - [ ] `seed_tuition_demo_data`
- [ ] Tao tests backend hoc phi.
  - [ ] Gia theo nganh duoc ap dung khi khong co gia chi tiet hon.
  - [ ] Gia theo khoi kien thuc uu tien hon gia nganh.
  - [ ] Gia ly thuyet/thuc hanh ap dung dung khi mon co `theory_hours` va `practice_hours`.
  - [ ] Mien giam theo so tien.
  - [ ] Mien giam theo phan tram.
  - [ ] API tra dung hoc phi tam tinh tung mon trong danh sach dang ky.
  - [ ] API tong hop hoc phi tat ca hoc ky tra dung HP chua giam, mien giam, phai thu, da thu, con no.
  - [ ] API danh sach phieu thu chi tra cac phieu con no/chua thanh toan cho sinh vien hien tai.
  - [ ] Start online payment tao transaction `PENDING`.
  - [ ] Payment callback thanh cong cap nhat transaction `SUCCESS`, receipt `PAID`, invoice `PAID` hoac `PARTIALLY_PAID`.
  - [ ] Payment callback that bai/het han khong tang `paid_amount`.
  - [ ] Thanh toan mot phan thanh `PARTIALLY_PAID`.
  - [ ] Thanh toan du thanh `PAID`.
  - [ ] Qua han thanh `OVERDUE`.
  - [ ] Sinh vien chi xem invoice cua chinh minh.
  - [ ] Ke toan xem duoc tat ca invoice.
  - [ ] Giao vien khong xem duoc invoice.
  - [ ] Admin/Ke toan moi duoc xac nhan thanh toan.

### 3.3. Backend Diem Danh

- [ ] Tao `backend/apps/attendance/apps.py`.
- [ ] Tao `backend/apps/attendance/admin.py`.
- [ ] Tao `backend/apps/attendance/serializers.py`.
  - [ ] `AttendanceSessionSerializer`
  - [ ] `AttendanceRecordSerializer`
  - [ ] `AttendanceBulkMarkSerializer`
  - [ ] `AttendanceChangeLogSerializer`
  - [ ] `StudentAttendanceSummarySerializer`
- [ ] Tao `backend/apps/attendance/services.py`.
  - [ ] `assert_teacher_owns_class(user, class_section)`
  - [ ] `create_attendance_session(class_section, schedule, session_date, created_by)`
  - [ ] `build_records_for_confirmed_students(attendance_session)`
  - [ ] `bulk_mark_attendance(attendance_session, records, marked_by)`
  - [ ] `update_attendance_record(record, status, note, changed_by, reason)`
  - [ ] `get_student_attendance_summary(student, semester)`
- [ ] Tao `backend/apps/attendance/views.py`.
  - [ ] Endpoint tao buoi diem danh.
  - [ ] Endpoint danh sach buoi diem danh theo lop.
  - [ ] Endpoint chi tiet mot buoi diem danh.
  - [ ] Endpoint bulk update diem danh tung sinh vien.
  - [ ] Endpoint lich su diem danh theo lop.
  - [ ] Endpoint sinh vien xem diem danh cua minh.
- [ ] Tao `backend/apps/attendance/urls.py`.
  - [ ] Route `/api/attendance/sessions/`
  - [ ] Route `/api/attendance/records/`
  - [ ] Route `/api/attendance/my-attendance/`
  - [ ] Route `/api/attendance/reports/`
- [ ] Include attendance urls trong `backend/config/urls.py`.
- [ ] Cap nhat `backend/apps/classes/views.py` neu muon dat action diem danh duoi class-section.
  - [ ] Route de xuat: `/api/class-sections/{id}/attendance-sessions/`.
- [ ] Tao tests backend diem danh.
  - [ ] Giao vien tao duoc buoi diem danh cho lop minh phu trach.
  - [ ] Giao vien khong tao duoc buoi diem danh cho lop cua giao vien khac.
  - [ ] Sinh vien khong tao duoc buoi diem danh.
  - [ ] Admin xem duoc lich su diem danh.
  - [ ] Tao buoi diem danh sinh ra record cho sinh vien `CONFIRMED`.
  - [ ] Sinh vien `CANCELLED` khong nam trong record diem danh.
  - [ ] Khong tao trung buoi diem danh cung lop, ngay, tiet bat dau.
  - [ ] Bulk mark cap nhat dung trang thai.
  - [ ] Cap nhat diem danh tao `AttendanceChangeLog`.
  - [ ] Sinh vien chi xem duoc diem danh cua chinh minh.

### 3.4. Bao Cao Va Export Backend

- [ ] Mo rong bao cao Admin neu can trong `backend/apps/accounts/reports.py`.
  - [ ] Them tong cong no.
  - [ ] Them tong da thu.
  - [ ] Them so sinh vien no hoc phi.
  - [ ] Them ty le vang/di tre theo hoc ky.
- [ ] Tao bao cao rieng cho Ke toan trong `backend/apps/tuition/views.py`.
  - [ ] Theo hoc ky.
  - [ ] Theo nganh.
  - [ ] Theo lop hoc phan.
  - [ ] Theo sinh vien.
- [ ] Tao export CSV/XLSX/PDF neu can.
  - [ ] Danh sach cong no.
  - [ ] Danh sach thanh toan.
  - [ ] Bien lai/phieu thu.
  - [ ] Bang diem danh lop hoc phan.

## 4. Frontend

### 4.1. Role, Route, Layout

- [ ] Sua `frontend/src/types/index.ts`.
  - [ ] Them `ACCOUNTANT` vao `Role`.
  - [ ] Them field profile Ke toan neu backend tra ve.
- [ ] Sua `frontend/src/App.tsx`.
  - [ ] `RoleHome` dieu huong `ACCOUNTANT` sang `/accountant`.
  - [ ] Them ProtectedRoute cho `allowedRoles={["ACCOUNTANT"]}`.
  - [ ] Them routes Ke toan.
- [ ] Sua `frontend/src/components/Sidebar.tsx`.
  - [ ] Them menu cho Ke toan.
  - [ ] Label role: `Ke toan`.
  - [ ] Menu de xuat:
    - [ ] Tong quan
    - [ ] Cau hinh hoc phi
    - [ ] Danh sach hoc phi
    - [ ] Thanh toan
    - [ ] Cong no
    - [ ] Dieu chinh
    - [ ] Bao cao
    - [ ] Thong bao
    - [ ] Ho so
- [ ] Sua `frontend/src/components/TopBar.tsx`.
  - [ ] Them breadcrumb cho cac route `/accountant/*`.
- [ ] Sua `frontend/src/lib/routes.ts`.
  - [ ] `profilePathForRole("ACCOUNTANT") = "/accountant/profile"`.
  - [ ] `loginPathForRole` neu can route login rieng cho Ke toan.
- [ ] Sua `frontend/src/routes/ProtectedRoute.tsx` neu type Role thay doi lam loi.

### 4.2. Quan Ly Tai Khoan Admin

- [ ] Sua `frontend/src/api/users.ts`.
  - [ ] Cho `role: "ACCOUNTANT"`.
  - [ ] Them field `accountant_department`, `accountant_position` neu co.
- [ ] Sua `frontend/src/pages/admin/AccountsPage.tsx`.
  - [ ] Them option role `Ke toan`.
  - [ ] Them label va badge tone cho `ACCOUNTANT`.
  - [ ] Khi chon Ke toan, khong hien field `Ngành học` va `Khoa giáo viên`.
  - [ ] Hien field phong ban/chuc vu Ke toan neu can.
  - [ ] Filter theo role co Ke toan.
  - [ ] Subtitle khong con ghi chi tao Sinh vien/Giao vien.
- [ ] Test UI:
  - [ ] Tao tai khoan Ke toan.
  - [ ] Sua tai khoan Ke toan.
  - [ ] Khoa/mo khoa tai khoan Ke toan.
  - [ ] Loc danh sach theo Ke toan.

### 4.3. API Client Hoc Phi

- [ ] Tao `frontend/src/api/tuition.ts`.
- [ ] Khai bao types:
  - [ ] `TuitionPolicy`
  - [ ] `MajorTuitionRate`
  - [ ] `KnowledgeBlockTuitionRate`
  - [ ] `CreditTypeTuitionRate`
  - [ ] `TuitionDiscount`
  - [ ] `TuitionInvoice`
  - [ ] `TuitionInvoiceLine`
  - [ ] `TuitionReceipt`
  - [ ] `PaymentTransaction`
  - [ ] `TuitionAdjustment`
  - [ ] `TuitionReportSummary`
  - [ ] `StudentTuitionSummary`
  - [ ] `StudentPaymentItem`
  - [ ] `OnlinePaymentSession`
- [ ] Tao API functions:
  - [ ] `listTuitionPolicies`
  - [ ] `createTuitionPolicy`
  - [ ] `updateTuitionPolicy`
  - [ ] `activateTuitionPolicy`
  - [ ] `listMajorTuitionRates`
  - [ ] `saveMajorTuitionRate`
  - [ ] `listKnowledgeBlockRates`
  - [ ] `saveKnowledgeBlockRate`
  - [ ] `listCreditTypeRates`
  - [ ] `saveCreditTypeRate`
  - [ ] `listTuitionInvoices`
  - [ ] `getTuitionInvoice`
  - [ ] `recalculateTuitionInvoice`
  - [ ] `getClassSectionEstimatedTuition`
  - [ ] `getStudentTuitionSummary`
  - [ ] `getStudentTuitionDetail`
  - [ ] `listStudentPaymentItems`
  - [ ] `startOnlinePayment`
  - [ ] `getOnlinePaymentStatus`
  - [ ] `confirmTuitionPayment`
  - [ ] `createTuitionAdjustment`
  - [ ] `getTuitionReport`
  - [ ] `exportReceipt`

### 4.4. Trang Ke Toan

- [ ] Tao `frontend/src/pages/AccountantDashboard.tsx`.
  - [ ] Tong phai thu.
  - [ ] Tong da thu.
  - [ ] Tong con no.
  - [ ] So sinh vien no hoc phi.
  - [ ] Thanh toan gan day.
  - [ ] Canh bao qua han.
- [ ] Tao folder `frontend/src/pages/accountant`.
- [ ] Tao `frontend/src/pages/accountant/TuitionSettingsPage.tsx`.
  - [ ] Chon hoc ky.
  - [ ] Quan ly policy.
  - [ ] Cau hinh gia tin chi theo nganh bang `MajorTuitionRate`.
  - [ ] Cau hinh gia theo khoi mon/khoi kien thuc bang `KnowledgeBlockTuitionRate`.
  - [ ] Cau hinh gia tin chi ly thuyet va tin chi thuc hanh bang `CreditTypeTuitionRate`.
  - [ ] Hien ro thu tu uu tien tinh gia: thuc hanh/ly thuyet neu co cau hinh -> khoi mon -> nganh.
  - [ ] Co nut luu nhap lieu hang loat cho bang gia theo nganh.
  - [ ] Co nut luu nhap lieu hang loat cho bang gia theo khoi mon.
  - [ ] Co nut luu nhap lieu hang loat cho bang gia ly thuyet/thuc hanh.
  - [ ] Cau hinh mien giam.
- [ ] Tao `frontend/src/pages/accountant/InvoicesPage.tsx`.
  - [ ] Loc theo hoc ky.
  - [ ] Loc theo nganh.
  - [ ] Loc theo lop.
  - [ ] Loc theo trang thai thanh toan.
  - [ ] Tim theo MSSV/ho ten.
  - [ ] Hien subtotal, discount, adjustment, total, paid, debt.
  - [ ] Mo modal chi tiet invoice.
- [ ] Tao `frontend/src/pages/accountant/PaymentsPage.tsx`.
  - [ ] Tim invoice.
  - [ ] Nhap so tien.
  - [ ] Chon hinh thuc: tien mat, chuyen khoan, the, khac.
  - [ ] Nhap ma tham chieu.
  - [ ] Xac nhan thanh toan.
  - [ ] Hien lich su thanh toan.
- [ ] Tao `frontend/src/pages/accountant/DebtsPage.tsx`.
  - [ ] Danh sach sinh vien chua dong/dong thieu/qua han.
  - [ ] Loc theo hoc ky/nganh/lop.
  - [ ] Gui thong bao nhac no neu backend ho tro.
  - [ ] Export danh sach cong no.
- [ ] Tao `frontend/src/pages/accountant/AdjustmentsPage.tsx`.
  - [ ] Them mien giam/thu bo sung/hoan tien/dieu chinh.
  - [ ] Bat buoc nhap ly do.
  - [ ] Hien lich su dieu chinh.
- [ ] Tao `frontend/src/pages/accountant/ReportsPage.tsx`.
  - [ ] Bao cao theo hoc ky.
  - [ ] Bao cao theo nganh.
  - [ ] Bao cao theo lop hoc phan.
  - [ ] Bao cao theo sinh vien.
  - [ ] Bieu do tong phai thu/da thu/con no.
- [ ] Tao `frontend/src/pages/accountant/ProfilePage.tsx`.
- [ ] Tao `frontend/src/pages/accountant/NotificationsPage.tsx` neu Ke toan nhan/gui thong bao rieng.

### 4.5. Student UI Hoc Phi Va Diem Danh

- [ ] Sua page dang ky mon hien co `frontend/src/pages/student/RegisterPage.tsx` theo Hinh 1.
  - [ ] Them cot `Hoc phi tam tinh` vao bang `Lop da dang ky`.
  - [ ] Moi dong dang ky hien tien cua tung mon/lop theo `estimated_tuition_amount`.
  - [ ] Neu backend chua co policy hoc phi active, hien `Chua cau hinh` hoac `0` theo quy uoc thong nhat.
  - [ ] Them tong hoc phi tam tinh trong subtitle/card summary: tong mon, tong tin chi, tong hoc phi.
  - [ ] Modal xac nhan dang ky hien them hoc phi tam tinh cua lop sap dang ky.
  - [ ] Sau khi dang ky/huy mon, refresh lai hoc phi tam tinh va tong hoc phi.
  - [ ] Them format tien VND dung `vi-VN`, vi du `16,929,000`.
  - [ ] Neu can, them cot hoc phi vao danh sach lop HP mo de sinh vien thay truoc khi bam dang ky.
- [ ] Tao `frontend/src/pages/student/TuitionPage.tsx`.
  - [ ] Dat title `Xem hoc phi` giong Hinh 2.
  - [ ] Co select `Tong hop hoc phi tat ca hoc ky`.
  - [ ] Co nut `In`.
  - [ ] Co nut `Xuat Excel`.
  - [ ] Bang tong hop co cot `STT`.
  - [ ] Bang tong hop co cot `Nien hoc hoc ky`.
  - [ ] Bang tong hop co cot `HP chua giam`.
  - [ ] Bang tong hop co cot `Mien giam`.
  - [ ] Bang tong hop co cot `Phai thu`.
  - [ ] Bang tong hop co cot `Da thu`.
  - [ ] Bang tong hop co cot `Con no`.
  - [ ] Co dong nhom `Thu hoc phi`.
  - [ ] Co dong `TONG` cho nhom.
  - [ ] Co dong `TONG CONG` toan bo.
  - [ ] So tien con no hien mau do khi lon hon 0.
  - [ ] Hien `So tai khoan ngan hang cua sinh vien` neu backend co du lieu.
  - [ ] Click vao mot hoc ky mo chi tiet danh sach mon tao ra hoc phi.
  - [ ] Chi tiet hoc ky hien danh sach mon, so tin chi, hoc phi truoc giam, mien giam, phai thu, da thu, con no.
  - [ ] Xem lich su thanh toan theo hoc ky.
  - [ ] Tai/xem bien lai neu co.
- [ ] Tao `frontend/src/pages/student/PaymentPage.tsx`.
  - [ ] Dat title `Thanh toan truc tuyen` giong Hinh 3.
  - [ ] Hien bang `Danh sach phieu thu hoc phi, cac khoan thu khac`.
  - [ ] Bang co cot `STT`.
  - [ ] Bang co cot `So phieu`.
  - [ ] Bang co cot `Noi dung`.
  - [ ] Bang co cot `So tien`.
  - [ ] Chi hien phieu thu con no/chua thanh toan.
  - [ ] Co nut `$ Thanh toan` o duoi bang.
  - [ ] Neu khong co phieu thu con no, hien empty state ro rang.
- [ ] Tao cac page sau khi bam `Thanh toan`.
  - [ ] `frontend/src/pages/student/payment/PaymentConfirmPage.tsx`: xac nhan phieu thu, so tien, thong tin sinh vien.
  - [ ] `frontend/src/pages/student/payment/PaymentMethodPage.tsx`: chon phuong thuc thanh toan.
  - [ ] `frontend/src/pages/student/payment/BankTransferPage.tsx`: hien thong tin chuyen khoan/QR/ma noi dung.
  - [ ] `frontend/src/pages/student/payment/PaymentProcessingPage.tsx`: trang dang xu ly va polling trang thai.
  - [ ] `frontend/src/pages/student/payment/PaymentResultPage.tsx`: ket qua thanh cong/that bai/het han.
  - [ ] `frontend/src/pages/student/payment/PaymentReceiptPage.tsx`: hien bien lai sau khi thanh toan thanh cong.
- [ ] Lam cu the QR demo trong `BankTransferPage.tsx`.
  - [ ] Goi `startOnlinePayment(receiptId, { method: "QR" })`.
  - [ ] Hien thong tin phieu thu: so phieu, noi dung, so tien, thoi gian het han.
  - [ ] Hien 1 QR duy nhat tu `qr_payload` neu dung gateway that.
  - [ ] Neu dung sandbox/demo ngan hang, 1 QR duy nhat tro den URL sandbox ngan hang.
  - [ ] Neu dung mock bank noi bo, 1 QR duy nhat lay tu `demo_bank_qr_payload`.
  - [ ] QR co nut copy link ben duoi de test khi khong quet duoc.
  - [ ] Sau khi nguoi dung quet QR, trang tu dong polling `getOnlinePaymentStatus(paymentId)`.
  - [ ] Neu status `SUCCESS`, dieu huong sang `/student/payment/:paymentId/result?status=success`.
  - [ ] Neu status `FAILED`, dieu huong sang `/student/payment/:paymentId/result?status=failed`.
  - [ ] Neu het han, dieu huong sang `/student/payment/:paymentId/result?status=expired`.
- [ ] Tao page demo ngan hang de mo tren dien thoai sau khi quet QR neu dung mock bank.
  - [ ] Route frontend de xuat: `/payment-demo-bank/:token`.
  - [ ] Page hien giao dien giong trang thanh toan ngan hang demo: ten don vi, so phieu, so tien, noi dung.
  - [ ] Page co nut `Thanh toan thanh cong`.
  - [ ] Page co nut `Thanh toan that bai`.
  - [ ] Khi bam nut, page goi backend `POST /api/tuition/payments/demo-bank/{token}/complete/` voi body `{ "result": "SUCCESS" }` hoac `{ "result": "FAILED" }`.
  - [ ] Page hien ket qua ngan gon sau khi gui: `Thanh toan demo thanh cong` hoac `Thanh toan demo that bai`.
  - [ ] Page nhac nguoi dung quay lai man hinh thanh toan tren may tinh/app.
- [ ] Them route `/student/tuition` trong `frontend/src/App.tsx`.
- [ ] Them menu `Hoc phi` vao sidebar sinh vien.
- [ ] Them route `/student/payment` trong `frontend/src/App.tsx`.
- [ ] Them route `/student/payment/:receiptId/confirm`.
- [ ] Them route `/student/payment/:receiptId/method`.
- [ ] Them route `/student/payment/:receiptId/bank-transfer`.
- [ ] Them route `/student/payment/:paymentId/processing`.
- [ ] Them route `/student/payment/:paymentId/result`.
- [ ] Them route `/student/payment/:paymentId/receipt`.
- [ ] Them route `/payment-demo-bank/:token` cho QR demo 1 ma.
- [ ] Them menu `Dong hoc phi` hoac `Thanh toan` vao sidebar sinh vien.
- [ ] Tao `frontend/src/pages/student/AttendancePage.tsx`.
  - [ ] Chon hoc ky.
  - [ ] Xem diem danh theo lop hoc phan.
  - [ ] Hien so buoi co mat, vang phep, vang khong phep, di tre.
  - [ ] Xem chi tiet tung buoi.
- [ ] Them route `/student/attendance`.
- [ ] Them menu `Diem danh` vao sidebar sinh vien.

### 4.6. Teacher UI Diem Danh

- [ ] Tao `frontend/src/api/attendance.ts`.
  - [ ] `listAttendanceSessions`
  - [ ] `createAttendanceSession`
  - [ ] `getAttendanceSession`
  - [ ] `bulkMarkAttendance`
  - [ ] `updateAttendanceRecord`
  - [ ] `getMyAttendance`
  - [ ] `exportAttendanceSheet`
- [ ] Tao types diem danh trong `frontend/src/types/domain.ts`.
  - [ ] `AttendanceStatus`
  - [ ] `AttendanceSession`
  - [ ] `AttendanceRecord`
  - [ ] `AttendanceSummary`
- [ ] Sua `frontend/src/pages/teacher/ClassDetailPage.tsx`.
  - [ ] Them nut `Diem danh`.
  - [ ] Them tab hoac card `Lich su diem danh`.
  - [ ] Link sang `/teacher/classes/:id/attendance`.
- [ ] Tao `frontend/src/pages/teacher/AttendancePage.tsx`.
  - [ ] Hien thong tin lop.
  - [ ] Tao buoi diem danh tu lich hoc.
  - [ ] Tao buoi diem danh thu cong theo ngay/buoi/tiet.
  - [ ] Bang danh sach sinh vien.
  - [ ] Chon nhanh tat ca `Co mat`.
  - [ ] Doi tung sinh vien sang Vang co phep/Vang khong phep/Di tre.
  - [ ] Ghi chu tung sinh vien.
  - [ ] Luu hang loat.
  - [ ] Hien trang thai da luu.
- [ ] Tao `frontend/src/pages/teacher/AttendanceHistoryPage.tsx` neu tach trang lich su.
- [ ] Them route:
  - [ ] `/teacher/classes/:id/attendance`
  - [ ] `/teacher/classes/:id/attendance/:sessionId`
- [ ] Them menu hoac shortcut diem danh trong teacher dashboard.

## 5. API Contract De Xuat

### 5.1. Tuition

- [ ] `GET /api/tuition/policies/?semester=<id>`
- [ ] `POST /api/tuition/policies/`
- [ ] `PATCH /api/tuition/policies/{id}/`
- [ ] `POST /api/tuition/policies/{id}/activate/`
- [ ] `GET /api/tuition/estimate/class-section/{id}/?semester=<id>`
- [ ] `GET /api/tuition/invoices/?semester=<id>&status=<status>&major=<id>&class_section=<id>&search=<text>`
- [ ] `GET /api/tuition/invoices/{id}/`
- [ ] `POST /api/tuition/invoices/{id}/recalculate/`
- [ ] `POST /api/tuition/invoices/recalculate-bulk/`
- [ ] `GET /api/tuition/student-summary/?mode=all|semester&semester=<id>`
- [ ] `GET /api/tuition/student-summary/{semester_id}/detail/`
- [ ] `GET /api/tuition/student-payment-items/`
- [ ] `GET /api/tuition/receipts/{id}/`
- [ ] `POST /api/tuition/receipts/{id}/start-payment/`
- [ ] `GET /api/tuition/payments/{id}/status/`
- [ ] `POST /api/tuition/payments/callback/`
- [ ] `GET /api/tuition/payments/demo-bank/{token}/`
- [ ] `POST /api/tuition/payments/demo-bank/{token}/complete/`
- [ ] `POST /api/tuition/invoices/{id}/payments/`
- [ ] `POST /api/tuition/invoices/{id}/adjustments/`
- [ ] `GET /api/tuition/invoices/{id}/receipt/`
- [ ] `GET /api/tuition/reports/summary/?semester=<id>`

### 5.2. Tuition Response Fields Can Co Cho 3 Man Hinh

- [ ] Response cho page dang ky mon co field tren registration:
  - [ ] `estimated_tuition_amount`
  - [ ] `tuition_calculation_status = CALCULATED | MISSING_POLICY | MISSING_RATE`
  - [ ] `tuition_note`
- [ ] Response cho page dang ky mon co field tong hop:
  - [ ] `registered_count`
  - [ ] `total_credits`
  - [ ] `total_estimated_tuition_amount`
- [ ] Response cho page `Xem hoc phi` co danh sach tung hoc ky:
  - [ ] `semester_id`
  - [ ] `semester_label`
  - [ ] `subtotal_amount` tuong ung `HP chua giam`
  - [ ] `discount_amount` tuong ung `Mien giam`
  - [ ] `total_amount` tuong ung `Phai thu`
  - [ ] `paid_amount` tuong ung `Da thu`
  - [ ] `debt_amount` tuong ung `Con no`
- [ ] Response cho dong tong page `Xem hoc phi`:
  - [ ] `subtotal_total`
  - [ ] `discount_total`
  - [ ] `receivable_total`
  - [ ] `paid_total`
  - [ ] `debt_total`
- [ ] Response cho page `Dong hoc phi` co danh sach phieu thu:
  - [ ] `receipt_id`
  - [ ] `receipt_no`
  - [ ] `content`
  - [ ] `amount`
  - [ ] `status`
  - [ ] `can_pay`
- [ ] Response start payment:
  - [ ] `payment_id`
  - [ ] `receipt_id`
  - [ ] `amount`
  - [ ] `method`
  - [ ] `payment_url`
  - [ ] `qr_payload`
  - [ ] `demo_bank_url`
  - [ ] `demo_bank_qr_payload`
  - [ ] `expires_at`

### 5.3. Attendance

- [ ] `GET /api/attendance/sessions/?class_section=<id>`
- [ ] `POST /api/attendance/sessions/`
- [ ] `GET /api/attendance/sessions/{id}/`
- [ ] `POST /api/attendance/sessions/{id}/mark/`
- [ ] `PATCH /api/attendance/records/{id}/`
- [ ] `GET /api/attendance/my-attendance/?semester=<id>`
- [ ] `GET /api/attendance/reports/class-section/{id}/`
- [ ] `GET /api/attendance/sessions/{id}/export/`

## 6. Business Rules Can Cai Dat

### 6.1. Hoc Phi

- [ ] Chi Ke toan/Admin duoc cau hinh hoc phi.
- [ ] Chi Ke toan/Admin duoc xac nhan thanh toan.
- [ ] Sinh vien chi xem hoc phi cua chinh minh.
- [ ] Giao vien khong xem duoc hoc phi sinh vien.
- [ ] Moi hoc ky chi co mot policy dang `ACTIVE`.
- [ ] Neu khong co policy active, khong duoc tinh invoice chinh thuc.
- [ ] Gia theo loai tin chi ly thuyet/thuc hanh uu tien hon gia khoi kien thuc neu policy cau hinh nhu vay.
- [ ] Gia theo khoi kien thuc uu tien hon gia mac dinh theo nganh.
- [ ] Hoc phi tung mon tren page dang ky mon phai lay tu cung cong thuc voi invoice, khong tinh rieng tren frontend.
- [ ] Hoc phi tam tinh co the hien truoc khi invoice chinh thuc duoc phat hanh.
- [ ] Page `Xem hoc phi` tong hop tat ca hoc ky chi tinh cac invoice cua sinh vien dang dang nhap.
- [ ] Page `Dong hoc phi` chi hien cac phieu thu co `debt_amount > 0` hoac receipt `UNPAID`.
- [ ] Khi sinh vien dang ky them mon da `CONFIRMED`, invoice tang them line.
- [ ] Khi sinh vien huy mon, invoice cap nhat line va adjustment theo quy dinh.
- [ ] Thanh toan khong duoc vuot qua tong con no, tru khi co nghiep vu thu thua/hoan tien ro rang.
- [ ] Khi sinh vien bam `Thanh toan`, he thong tao transaction `PENDING` truoc khi dieu huong sang trang thanh toan.
- [ ] Neu thanh toan online thanh cong, receipt thanh `PAID` va invoice cap nhat `paid_amount`.
- [ ] Neu thanh toan online that bai/huy/het han, receipt van `UNPAID` va invoice khong doi `paid_amount`.
- [ ] Dieu chinh hoc phi bat buoc co ly do.
- [ ] Bien lai chi xuat khi co payment da xac nhan.

### 6.2. Diem Danh

- [ ] Chi giao vien phu trach lop hoac Admin duoc tao/xem/sua diem danh lop.
- [ ] Sinh vien chi xem duoc diem danh cua chinh minh.
- [ ] Mot buoi diem danh gan voi lop hoc phan va ngay hoc cu the.
- [ ] Khong tao trung buoi diem danh cung lop, cung ngay, cung tiet bat dau.
- [ ] Record diem danh chi tao cho registration `CONFIRMED`.
- [ ] Khi sua diem danh, phai luu `marked_by`, `marked_at`, `updated_at`.
- [ ] Neu co `AttendanceChangeLog`, moi lan doi trang thai phai ghi lai trang thai cu, trang thai moi, nguoi doi va ly do.
- [ ] Trang thai hop le:
  - [ ] `PRESENT`: Co mat
  - [ ] `EXCUSED_ABSENT`: Vang co phep
  - [ ] `UNEXCUSED_ABSENT`: Vang khong phep
  - [ ] `LATE`: Di tre

## 7. Seed Data Va Demo

- [ ] Sua script seed user de tao them tai khoan Ke toan.
  - [ ] Username de xuat: `kt001`.
  - [ ] Password demo theo convention hien co cua project.
  - [ ] Role: `ACCOUNTANT`.
- [ ] Tao seed tuition demo.
  - [ ] Policy active cho hoc ky hien tai.
  - [ ] Gia mac dinh theo nganh de test `MajorTuitionRate`.
  - [ ] Gia theo khoi kien thuc de test `KnowledgeBlockTuitionRate`.
  - [ ] Gia ly thuyet/thuc hanh de test `CreditTypeTuitionRate`.
  - [ ] It nhat mot mon thuan ly thuyet.
  - [ ] It nhat mot mon co thuc hanh.
  - [ ] It nhat mot mon thuoc moi khoi kien thuc: dai cuong, co so nganh, chuyen nganh, tu chon, tot nghiep.
  - [ ] Du lieu hoc phi page dang ky mon co mot dong hien tien tung mon khac 0.
  - [ ] Du lieu tong hop page `Xem hoc phi` co nhieu hoc ky, trong do co hoc ky con no.
  - [ ] Du lieu page `Dong hoc phi` co it nhat mot phieu thu con no so tien mau: `16,929,000`.
  - [ ] Mot vai invoice da thanh toan, thanh toan mot phan, con no.
  - [ ] Mot vai receipt `UNPAID`, `PAID`, `EXPIRED`.
  - [ ] Mot vai transaction `PENDING`, `SUCCESS`, `FAILED`.
  - [ ] Mot receipt demo con no de test QR success.
  - [ ] Mot receipt demo con no de test QR failed.
  - [ ] Script seed in ra username/password sinh vien demo va so phieu demo.
- [ ] Tao seed attendance demo.
  - [ ] Voi moi lop co sinh vien confirmed, tao 2-3 buoi diem danh.
  - [ ] Phan bo trang thai co mat/vang/di tre de test UI.

## 8. Testing Va Verification

### 8.1. Backend Test Commands

- [ ] Chay test accounts:
  - [ ] `cd backend`
  - [ ] `pytest apps/accounts -q`
- [ ] Chay test tuition:
  - [ ] `cd backend`
  - [ ] `pytest apps/tuition -q`
- [ ] Chay test attendance:
  - [ ] `cd backend`
  - [ ] `pytest apps/attendance -q`
- [ ] Chay regression cac module lien quan:
  - [ ] `cd backend`
  - [ ] `pytest apps/registrations apps/classes apps/grades -q`
- [ ] Chay full backend test:
  - [ ] `cd backend`
  - [ ] `pytest -q`

### 8.2. Frontend Test Commands

- [ ] Cai dependencies neu chua co:
  - [ ] `cd frontend`
  - [ ] `npm install`
- [ ] Typecheck:
  - [ ] `cd frontend`
  - [ ] `npm run build`
- [ ] Neu co lint script:
  - [ ] `cd frontend`
  - [ ] `npm run lint`

### 8.3. Manual QA

- [ ] Admin login.
- [ ] Admin tao account Ke toan.
- [ ] Ke toan login.
- [ ] Ke toan tao policy hoc phi.
- [ ] Ke toan cau hinh gia tin chi.
- [ ] Ke toan cau hinh gia tin chi theo nganh va luu thanh cong.
- [ ] Ke toan cau hinh gia theo khoi mon/khoi kien thuc va luu thanh cong.
- [ ] Ke toan cau hinh gia ly thuyet/thuc hanh va luu thanh cong.
- [ ] Sinh vien dang ky mon.
- [ ] Page dang ky mon hien cot `Hoc phi tam tinh` trong bang lop da dang ky.
- [ ] Page dang ky mon moi dong mon/lop da dang ky hien dung tien tung mon.
- [ ] Page dang ky mon hien tong mon, tong tin chi, tong hoc phi tam tinh.
- [ ] Huy/dang ky them mon lam tong hoc phi tam tinh cap nhat lai.
- [ ] Invoice duoc tao hoac tinh lai dung.
- [ ] Sinh vien vao page `Xem hoc phi`.
- [ ] Page `Xem hoc phi` hien bang tong hop theo hoc ky voi cac cot giong Hinh 2.
- [ ] Page `Xem hoc phi` dong `TONG CONG` tinh dung.
- [ ] Page `Xem hoc phi` cot `Con no` hien mau do khi con no > 0.
- [ ] Nut `In` tren page `Xem hoc phi` hoat dong hoac co placeholder ro rang.
- [ ] Nut `Xuat Excel` tren page `Xem hoc phi` hoat dong hoac co placeholder ro rang.
- [ ] Sinh vien vao page `Dong hoc phi`/`Thanh toan truc tuyen`.
- [ ] Page `Dong hoc phi` hien danh sach phieu thu con no voi so phieu, noi dung, so tien.
- [ ] Bam nut `Thanh toan` mo dung page xac nhan thanh toan.
- [ ] Page xac nhan thanh toan hien dung so phieu, noi dung, so tien.
- [ ] Page chon phuong thuc thanh toan hien cac option hop le.
- [ ] Page chuyen khoan/QR hien dung so tien va noi dung chuyen khoan.
- [ ] Page QR demo hien 1 ma QR duy nhat.
- [ ] Quet QR bang dien thoai mo trang demo ngan hang/sandbox.
- [ ] Tren trang demo ngan hang, bam `Thanh toan thanh cong` cap nhat payment thanh `SUCCESS`.
- [ ] Sau khi thanh toan demo thanh cong, man hinh processing/result tren may tinh hien thanh cong.
- [ ] Sau khi thanh toan demo thanh cong, receipt thanh `PAID` va invoice cap nhat `paid_amount`.
- [ ] Tren trang demo ngan hang, bam `Thanh toan that bai` cap nhat payment thanh `FAILED`.
- [ ] Sau khi thanh toan demo that bai, man hinh processing/result hien that bai.
- [ ] Sau khi thanh toan demo that bai, receipt van `UNPAID` va invoice khong tang `paid_amount`.
- [ ] Nut copy link QR demo hoat dong neu khong quet QR.
- [ ] Page dang xu ly payment polling duoc trang thai.
- [ ] Payment thanh cong hien page ket qua thanh cong va link bien lai.
- [ ] Payment that bai/het han hien page ket qua that bai va cho thanh toan lai.
- [ ] Ke toan xac nhan thanh toan mot phan.
- [ ] Trang thai invoice thanh `PARTIALLY_PAID`.
- [ ] Ke toan xac nhan thanh toan du.
- [ ] Trang thai invoice thanh `PAID`.
- [ ] Sinh vien xem duoc hoc phi cua minh.
- [ ] Sinh vien khong xem duoc hoc phi cua sinh vien khac.
- [ ] Giao vien login.
- [ ] Giao vien vao lop phu trach.
- [ ] Giao vien tao buoi diem danh.
- [ ] Giao vien danh dau tat ca co mat.
- [ ] Giao vien sua mot sinh vien thanh di tre.
- [ ] Sinh vien login va xem diem danh cua minh.
- [ ] Giao vien khac khong sua duoc diem danh lop khong phu trach.

## 9. Tai Lieu Va OpenAPI

- [ ] Cap nhat `backend/README.md`.
  - [ ] Them role Ke toan.
  - [ ] Them API hoc phi.
  - [ ] Them API diem danh.
- [ ] Cap nhat `frontend/README.md`.
  - [ ] Them route Ke toan.
  - [ ] Them huong dan test cac man hinh moi.
- [ ] Kiem tra Swagger/OpenAPI.
  - [ ] `/api/docs/` hien group tuition.
  - [ ] `/api/docs/` hien group attendance.
  - [ ] Serializer request/response ro rang.
- [ ] Cap nhat tai lieu demo tai khoan.
- [ ] Ghi chu rang repo hien la React/Vite web frontend, khong phai Flutter.

## 10. Deployment Va Cau Hinh

- [ ] Them migrations moi vao repository.
- [ ] Kiem tra Docker backend chay migrate thanh cong.
- [ ] Kiem tra frontend build production thanh cong.
- [ ] Neu co env can them, cap nhat `.env.production.example`.
- [ ] Kiem tra Render config neu backend deploy tren Render.
- [ ] Kiem tra CORS neu them route frontend moi.
- [ ] Neu thanh toan online dung cong thanh toan that, them env gateway vao `.env.production.example`.
  - [ ] `PAYMENT_GATEWAY_PROVIDER`
  - [ ] `PAYMENT_GATEWAY_API_KEY`
  - [ ] `PAYMENT_GATEWAY_SECRET`
  - [ ] `PAYMENT_RETURN_URL`
  - [ ] `PAYMENT_CALLBACK_URL`
- [ ] Neu chi demo thanh toan noi bo, ghi ro trong README rang payment gateway dang la mock.
- [ ] Neu can quet QR demo bang dien thoai, cau hinh URL public/LAN de dien thoai truy cap duoc.
  - [ ] `PAYMENT_DEMO_PUBLIC_BASE_URL`, vi du URL deploy staging hoac LAN URL.
  - [ ] Khong dung `localhost` trong QR neu quet bang dien thoai that.
  - [ ] QR demo phai tro den frontend URL public/LAN `/payment-demo-bank/:token`.
  - [ ] Frontend URL public/LAN goi duoc backend API demo-bank.
- [ ] Backup database truoc khi migrate tren production.
- [ ] Chay command seed demo chi tren moi truong dev/staging.

## 11. Thu Tu Trien Khai De Xuat

- [ ] Buoc 1: Them role `ACCOUNTANT` va profile Ke toan.
- [ ] Buoc 2: Cap nhat Admin Accounts UI de tao/sua/loc Ke toan.
- [ ] Buoc 3: Tao khung route/layout Ke toan frontend.
- [ ] Buoc 4: Tao database va service hoc phi.
- [ ] Buoc 5: Tao UI Ke toan cau hinh gia tin chi theo nganh/khoi mon/ly thuyet-thuc hanh.
- [ ] Buoc 6: Tao API hoc phi tam tinh cho page dang ky mon.
- [ ] Buoc 7: Sua page dang ky mon de hien hoc phi tung mon va tong hoc phi tam tinh.
- [ ] Buoc 8: Tao API tong hop hoc phi va page sinh vien `Xem hoc phi`.
- [ ] Buoc 9: Tao API phieu thu/thanh toan va page sinh vien `Dong hoc phi`.
- [ ] Buoc 10: Tao cac page sau nut `Thanh toan`: confirm, method, QR/chuyen khoan, processing, result, receipt.
- [ ] Buoc 11: Tao UI Ke toan quan ly invoice/thanh toan/cong no/dieu chinh/bao cao.
- [ ] Buoc 12: Tao database va API attendance.
- [ ] Buoc 13: Tao UI giao vien diem danh.
- [ ] Buoc 14: Tao UI sinh vien xem diem danh.
- [ ] Buoc 15: Them bao cao, export, bien lai.
- [ ] Buoc 16: Seed data, docs, full regression test.

## 12. Rui Ro Can Kiem Tra Ky

- [ ] Migration role moi co lam hong user cu khong.
- [ ] Viec tinh hoc phi co xu ly dung khi sinh vien huy mon sau khi da thanh toan mot phan khong.
- [ ] Gia theo khoi kien thuc co lay dung tu `CurriculumCourse` cua nganh sinh vien khong.
- [ ] Mot mon co nhieu chuong trinh dao tao co bi lay sai knowledge block khong.
- [ ] Invoice co bi tao trung khi user bam tinh lai nhieu lan khong.
- [ ] Payment co bi ghi nhan hai lan khi request bi retry khong.
- [ ] Hoc phi tung mon tren page dang ky mon co bi lech voi invoice line khong.
- [ ] Page dang ky mon co bi cham neu phai tinh hoc phi cho nhieu lop hoc phan khong.
- [ ] Khi chua cau hinh policy hoc phi, UI co hien trang thai ro rang thay vi loi trang khong.
- [ ] Gia ly thuyet/thuc hanh co bi tinh sai voi mon co `theory_hours=0` hoac `practice_hours=0` khong.
- [ ] Page `Xem hoc phi` tong tat ca hoc ky co bi tinh ca invoice cancelled khong.
- [ ] Page `Dong hoc phi` co an cac phieu da thanh toan het khong.
- [ ] Khi user bam `Thanh toan` nhieu lan lien tiep, he thong co tao nhieu transaction pending cho cung receipt khong.
- [ ] Payment callback den muon sau khi receipt het han co bi cap nhat sai thanh da thanh toan khong.
- [ ] Polling trang processing co dung dung khi payment thanh cong/that bai/het han khong.
- [ ] Bien lai co chi hien sau khi payment success khong.
- [ ] QR demo 1 ma co dung URL public/LAN thay vi `localhost` khi quet bang dien thoai khong.
- [ ] Token QR demo 1 ma co het han dung thoi gian khong.
- [ ] Bam `Thanh toan thanh cong` lan 2 tren cung trang demo ngan hang co bi cong tien hai lan khong.
- [ ] Bam `Thanh toan that bai` sau khi da thanh cong co bi dao nguoc trang thai khong.
- [ ] Bam `Thanh toan thanh cong` sau khi da that bai co bi doi trang thai payment cu khong, hay bat buoc tao payment moi.
- [ ] Dien thoai va may tinh polling co dong bo trang thai nhanh va dung khong.
- [ ] Giao vien co xem/sua duoc diem danh lop khong phu trach khong.
- [ ] Sinh vien cancelled co con nam trong danh sach diem danh khong.
- [ ] Bulk mark diem danh co cap nhat nham record cua lop khac khong.
- [ ] Frontend route protect co day Ke toan ve dung dashboard khong.
- [ ] Sidebar va TopBar co loi type khi them role moi khong.
