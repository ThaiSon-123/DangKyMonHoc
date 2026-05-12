# Software Requirements Specification - Hệ Thống Đăng Ký Môn Học

## 1. Document Information

### 1.1. Metadata

| Attribute     | Value                                                          |
| ------------- | -------------------------------------------------------------- |
| Document Name | Software Requirements Specification - Hệ Thống Đăng Ký Môn Học |
| Document ID   | SRS-DKMH                                                       |
| Project       | Hệ Thống Đăng Ký Môn Học                                       |
| Version       | v0.1                                                           |
| Status        | Draft                                                          |
| Writer        | AI Agent                                                       |
| Reviewer      | TBD                                                            |
| Created Date  | 12/05/2026                                                     |

### 1.2. Revision History

| Version | Date       | Updater  | Changes                                                                                                                              |
| ------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| v0.1    | 12/05/2026 | AI Agent | Chuẩn hóa tài liệu `plan.md` theo `doc/00-standard-for-ai-agent.md`, giữ nguyên các nội dung đã chốt về phạm vi, role và tech stack. |

### 1.3. Document Type

Tài liệu này là bản SRS cấp kế hoạch cho hệ thống đăng ký môn học.

DECISION: Tài liệu MUST tuân theo định hướng trong `doc/00-standard-for-ai-agent.md`.

TBD: Chưa có file quy ước mã tài liệu chi tiết được tham chiếu bởi `00 #3.1`, nên `Document ID` đang được đặt tạm là `SRS-DKMH`.

## 2. Source Decisions

### 2.1. Scope Decisions

DECISION: Hệ thống MUST hỗ trợ 3 role: `Admin`, `Sinh viên`, `Giáo viên`.

DECISION: Admin MUST quản lý tài khoản, ngành đào tạo, chương trình đào tạo, môn học, học kỳ, lớp học phần và đăng ký môn học.

DECISION: Sinh viên MUST đăng ký môn học và MUST có chức năng tự động tìm kiếm thời khóa biểu phù hợp.

DECISION: Khi đăng ký môn học, Sinh viên MAY chọn giáo viên nếu môn học đó có nhiều giáo viên.

DECISION: Khi đăng ký môn học, Sinh viên MAY chọn ngày học hoặc ca học mong muốn.

DECISION: Giáo viên MUST xem thời khóa biểu cá nhân.

DECISION: Giáo viên MUST nhập điểm cho lớp học phần được phân công.

### 2.2. Technology Decisions

DECISION: Frontend framework MUST sử dụng ReactJS.

DECISION: UI library MUST sử dụng Tailwind CSS.

DECISION: Backend MUST sử dụng Python.

DECISION: Database MUST sử dụng PostgreSQL.

DECISION: ORM MUST sử dụng TypeORM.

DECISION: API documentation MUST sử dụng Swagger.

DECISION: Deployment MUST sử dụng Docker.

TBD: Backend framework cụ thể chưa được chốt. Candidate hiện tại: FastAPI hoặc Django REST Framework.

TBD: State management library cho ReactJS chưa được chốt. Candidate hiện tại: Redux Toolkit hoặc Zustand.

RISK: TypeORM thường được sử dụng trong hệ sinh thái Node.js/TypeScript. Việc kết hợp backend Python với TypeORM MUST được reviewer xác nhận về tính khả thi kỹ thuật trước khi thiết kế chi tiết.

## 3. System Overview

### 3.1. Purpose

Hệ thống đăng ký môn học hỗ trợ nhà trường quản lý chương trình đào tạo, môn học, học kỳ, lớp học phần và quá trình đăng ký môn học của sinh viên. Hệ thống cũng hỗ trợ sinh viên tự động tìm kiếm thời khóa biểu phù hợp theo môn học, giáo viên và ngày học mong muốn.

### 3.2. Users and Roles

| Role      | Description                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------- |
| Admin     | Người quản trị hệ thống, chịu trách nhiệm quản lý dữ liệu đào tạo và vận hành đăng ký môn học. |
| Sinh viên | Người học, thực hiện xem chương trình đào tạo, đăng ký môn học và xem thời khóa biểu.          |
| Giáo viên | Người giảng dạy, xem lịch dạy cá nhân, xem lớp học phần được phân công và nhập điểm.           |

### 3.3. Major Business Modules

Hệ thống MUST bao gồm các module chính sau:

- Quản lý tài khoản.
- Quản lý ngành đào tạo.
- Quản lý chương trình đào tạo.
- Quản lý môn học.
- Quản lý học kỳ.
- Quản lý lớp học phần.
- Quản lý đăng ký môn học.
- Tự động tạo thời khóa biểu cho sinh viên.
- Quản lý thời khóa biểu cá nhân của giáo viên.
- Nhập điểm.
- Thông báo.
- Báo cáo và thống kê.

OPEN QUESTION: Hệ thống có cần module quản lý phòng học chi tiết hay chỉ lưu phòng học như thuộc tính của lịch học?

## 4. Functional Requirements

### 4.1. General Requirements

| ID         | Requirement                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------- |
| FR-GEN-001 | Hệ thống MUST cho phép người dùng đăng nhập bằng tài khoản hợp lệ.                            |
| FR-GEN-002 | Hệ thống MUST cho phép người dùng đăng xuất.                                                  |
| FR-GEN-003 | Hệ thống MUST cho phép người dùng đổi mật khẩu.                                               |
| FR-GEN-004 | Hệ thống SHOULD hỗ trợ quên mật khẩu.                                                         |
| FR-GEN-005 | Hệ thống MUST cho phép người dùng xem thông tin cá nhân.                                      |
| FR-GEN-006 | Hệ thống SHOULD cho phép người dùng cập nhật thông tin cá nhân trong phạm vi được phân quyền. |
| FR-GEN-007 | Hệ thống MUST kiểm soát quyền truy cập theo role: Admin, Sinh viên, Giáo viên.                |

### 4.2. Admin Requirements

#### 4.2.1. Quản lý tài khoản

| ID             | Requirement                                                  |
| -------------- | ------------------------------------------------------------ |
| FR-ADM-ACC-001 | Admin MUST tạo được tài khoản Admin, Sinh viên và Giáo viên. |
| FR-ADM-ACC-002 | Admin MUST cập nhật được thông tin tài khoản.                |
| FR-ADM-ACC-003 | Admin MUST khóa và mở khóa được tài khoản.                   |
| FR-ADM-ACC-004 | Admin MUST phân quyền người dùng theo role.                  |
| FR-ADM-ACC-005 | Admin MUST tìm kiếm và lọc danh sách tài khoản.              |

#### 4.2.2. Quản lý ngành đào tạo

| ID             | Requirement                                                                        |
| -------------- | ---------------------------------------------------------------------------------- |
| FR-ADM-MAJ-001 | Admin MUST thêm được ngành đào tạo.                                                |
| FR-ADM-MAJ-002 | Admin MUST cập nhật được thông tin ngành đào tạo.                                  |
| FR-ADM-MAJ-003 | Admin MUST xóa hoặc ngừng sử dụng được ngành đào tạo khi thỏa điều kiện nghiệp vụ. |
| FR-ADM-MAJ-004 | Hệ thống MUST hỗ trợ quản lý các ngành như CNTT, KTPM, HTTT, KHMT, ATTT.           |

#### 4.2.3. Quản lý chương trình đào tạo

| ID             | Requirement                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------- |
| FR-ADM-CUR-001 | Admin MUST tạo được chương trình đào tạo cho từng ngành.                                     |
| FR-ADM-CUR-002 | Admin MUST cập nhật được chương trình đào tạo.                                               |
| FR-ADM-CUR-003 | Admin MUST gán môn học vào chương trình đào tạo.                                             |
| FR-ADM-CUR-004 | Admin MUST phân loại môn học trong chương trình đào tạo thành môn bắt buộc hoặc môn tự chọn. |
| FR-ADM-CUR-005 | Admin MUST quản lý được số tín chỉ yêu cầu của chương trình đào tạo.                         |

#### 4.2.4. Quản lý môn học

| ID             | Requirement                                                        |
| -------------- | ------------------------------------------------------------------ |
| FR-ADM-CRS-001 | Admin MUST thêm được môn học.                                      |
| FR-ADM-CRS-002 | Admin MUST cập nhật được thông tin môn học.                        |
| FR-ADM-CRS-003 | Admin MUST xóa hoặc ngừng mở môn học khi thỏa điều kiện nghiệp vụ. |
| FR-ADM-CRS-004 | Admin MUST quản lý được số tín chỉ của môn học.                    |
| FR-ADM-CRS-005 | Admin MUST quản lý được môn học tiên quyết.                        |

#### 4.2.5. Quản lý học kỳ

| ID             | Requirement                                                    |
| -------------- | -------------------------------------------------------------- |
| FR-ADM-SEM-001 | Admin MUST tạo được học kỳ.                                    |
| FR-ADM-SEM-002 | Admin MUST cập nhật được thời gian học kỳ.                     |
| FR-ADM-SEM-003 | Admin MUST mở hoặc đóng học kỳ.                                |
| FR-ADM-SEM-004 | Admin MUST cấu hình được thời gian đăng ký môn học của học kỳ. |

#### 4.2.6. Quản lý lớp học phần

| ID             | Requirement                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| FR-ADM-CLS-001 | Admin MUST tạo được lớp học phần cho môn học.                                 |
| FR-ADM-CLS-002 | Admin MUST gán được giáo viên giảng dạy cho lớp học phần.                     |
| FR-ADM-CLS-003 | Admin MUST thiết lập được lịch học của lớp học phần.                          |
| FR-ADM-CLS-004 | Admin MUST thiết lập được phòng học của lớp học phần.                         |
| FR-ADM-CLS-005 | Admin MUST thiết lập được số lượng sinh viên tối đa của lớp học phần.         |
| FR-ADM-CLS-006 | Admin MUST cập nhật được thông tin lớp học phần khi thỏa điều kiện nghiệp vụ. |

#### 4.2.7. Quản lý đăng ký môn học

| ID             | Requirement                                                            |
| -------------- | ---------------------------------------------------------------------- |
| FR-ADM-REG-001 | Admin MUST mở được đợt đăng ký môn học.                                |
| FR-ADM-REG-002 | Admin MUST đóng được đợt đăng ký môn học.                              |
| FR-ADM-REG-003 | Admin MUST theo dõi được số lượng sinh viên đăng ký theo lớp học phần. |
| FR-ADM-REG-004 | Hệ thống MUST phát hiện đăng ký bị trùng lịch.                         |
| FR-ADM-REG-005 | Admin MAY hủy đăng ký môn học cho sinh viên khi có lý do hợp lệ.       |
| FR-ADM-REG-006 | Admin MUST xuất được danh sách đăng ký môn học.                        |

#### 4.2.8. Báo cáo và thống kê

| ID             | Requirement                                                           |
| -------------- | --------------------------------------------------------------------- |
| FR-ADM-RPT-001 | Admin MUST xem được thống kê số lượng sinh viên đăng ký theo môn học. |
| FR-ADM-RPT-002 | Admin MUST xem được thống kê số lượng sinh viên đăng ký theo ngành.   |
| FR-ADM-RPT-003 | Admin MUST xem được thống kê lớp học phần đầy hoặc còn chỗ.           |
| FR-ADM-RPT-004 | Admin SHOULD xuất được báo cáo dưới định dạng Excel hoặc PDF.         |

### 4.3. Sinh Viên Requirements

#### 4.3.1. Xem thông tin học tập

| ID             | Requirement                                                        |
| -------------- | ------------------------------------------------------------------ |
| FR-STU-INF-001 | Sinh viên MUST xem được thông tin cá nhân.                         |
| FR-STU-CUR-001 | Sinh viên MUST xem được chương trình đào tạo của ngành đang học.   |
| FR-STU-CUR-002 | Sinh viên MUST xem được danh sách môn học theo ngành.              |
| FR-STU-CUR-003 | Sinh viên MUST phân biệt được môn bắt buộc và môn tự chọn.         |
| FR-STU-CUR-004 | Sinh viên SHOULD xem được tiến độ hoàn thành chương trình đào tạo. |

#### 4.3.2. Xem môn học được đăng ký

| ID             | Requirement                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| FR-STU-CRS-001 | Sinh viên MUST xem được danh sách môn học được phép đăng ký.                   |
| FR-STU-CRS-002 | Sinh viên MUST lọc được môn học theo học kỳ.                                   |
| FR-STU-CRS-003 | Sinh viên MUST lọc được môn học theo ngành.                                    |
| FR-STU-CRS-004 | Sinh viên MUST xem được thông tin môn học, số tín chỉ và điều kiện tiên quyết. |

#### 4.3.3. Đăng ký môn học thủ công

| ID             | Requirement                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| FR-STU-REG-001 | Sinh viên MUST chọn được môn học muốn đăng ký.                                  |
| FR-STU-REG-002 | Sinh viên MUST chọn được lớp học phần của môn học.                              |
| FR-STU-REG-003 | Sinh viên MAY chọn giáo viên nếu môn học đó có nhiều giáo viên.                 |
| FR-STU-REG-004 | Sinh viên MAY chọn ngày học hoặc ca học mong muốn.                              |
| FR-STU-REG-005 | Hệ thống MUST kiểm tra trùng lịch trước khi xác nhận đăng ký.                   |
| FR-STU-REG-006 | Hệ thống MUST kiểm tra điều kiện môn học tiên quyết trước khi xác nhận đăng ký. |
| FR-STU-REG-007 | Hệ thống MUST kiểm tra giới hạn số tín chỉ trước khi xác nhận đăng ký.          |
| FR-STU-REG-008 | Sinh viên MUST xác nhận đăng ký môn học trước khi hệ thống ghi nhận đăng ký.    |
| FR-STU-REG-009 | Sinh viên MAY hủy đăng ký môn học trong thời gian cho phép.                     |

#### 4.3.4. Tự động tạo thời khóa biểu

| ID             | Requirement                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| FR-STU-TKB-001 | Sinh viên MUST chọn được danh sách môn học cần đăng ký để tạo thời khóa biểu tự động.      |
| FR-STU-TKB-002 | Sinh viên MAY chọn giáo viên ưu tiên cho từng môn học.                                     |
| FR-STU-TKB-003 | Sinh viên MAY chọn ngày học ưu tiên.                                                       |
| FR-STU-TKB-004 | Sinh viên MAY chọn ca học ưu tiên.                                                         |
| FR-STU-TKB-005 | Hệ thống MUST tự động tìm kiếm thời khóa biểu phù hợp dựa trên các lựa chọn của sinh viên. |
| FR-STU-TKB-006 | Hệ thống SHOULD gợi ý nhiều phương án thời khóa biểu hợp lệ.                               |
| FR-STU-TKB-007 | Hệ thống SHOULD sắp xếp phương án theo mức độ phù hợp với ưu tiên của sinh viên.           |
| FR-STU-TKB-008 | Hệ thống MUST cảnh báo khi không tìm được thời khóa biểu hợp lệ.                           |
| FR-STU-TKB-009 | Sinh viên MUST xác nhận phương án thời khóa biểu trước khi hệ thống ghi nhận đăng ký.      |

#### 4.3.5. Xem thời khóa biểu và lịch sử

| ID             | Requirement                                         |
| -------------- | --------------------------------------------------- |
| FR-STU-SCH-001 | Sinh viên MUST xem được thời khóa biểu theo tuần.   |
| FR-STU-SCH-002 | Sinh viên MUST xem được thời khóa biểu theo học kỳ. |
| FR-STU-SCH-003 | Sinh viên SHOULD xuất được thời khóa biểu.          |
| FR-STU-HIS-001 | Sinh viên MUST xem được lịch sử đăng ký môn học.    |

#### 4.3.6. Nhận thông báo

| ID             | Requirement                                                      |
| -------------- | ---------------------------------------------------------------- |
| FR-STU-NOT-001 | Sinh viên MUST nhận được thông báo mở hoặc đóng đăng ký môn học. |
| FR-STU-NOT-002 | Sinh viên MUST nhận được thông báo khi lịch học thay đổi.        |
| FR-STU-NOT-003 | Sinh viên MUST nhận được thông báo khi lớp học phần bị hủy.      |

### 4.4. Giáo Viên Requirements

#### 4.4.1. Xem thông tin và lớp học phần

| ID             | Requirement                                                     |
| -------------- | --------------------------------------------------------------- |
| FR-TEA-INF-001 | Giáo viên MUST xem được thông tin cá nhân.                      |
| FR-TEA-CLS-001 | Giáo viên MUST xem được danh sách lớp học phần được phân công.  |
| FR-TEA-SCH-001 | Giáo viên MUST xem được thời khóa biểu cá nhân.                 |
| FR-TEA-CLS-002 | Giáo viên MUST xem được danh sách sinh viên trong lớp học phần. |
| FR-TEA-CLS-003 | Giáo viên MUST xem được sĩ số lớp.                              |
| FR-TEA-CLS-004 | Giáo viên MUST xem được lịch học và phòng học của lớp học phần. |
| FR-TEA-CLS-005 | Giáo viên MAY gửi thông báo cho sinh viên trong lớp.            |

#### 4.4.2. Nhập điểm

| ID             | Requirement                                                                              |
| -------------- | ---------------------------------------------------------------------------------------- |
| FR-TEA-GRD-001 | Giáo viên MUST nhập được điểm quá trình cho sinh viên trong lớp học phần được phân công. |
| FR-TEA-GRD-002 | Giáo viên MUST nhập được điểm giữa kỳ cho sinh viên trong lớp học phần được phân công.   |
| FR-TEA-GRD-003 | Giáo viên MUST nhập được điểm cuối kỳ cho sinh viên trong lớp học phần được phân công.   |
| FR-TEA-GRD-004 | Giáo viên MAY cập nhật điểm trong thời gian cho phép.                                    |
| FR-TEA-GRD-005 | Giáo viên MUST xuất được bảng điểm lớp học phần.                                         |

#### 4.4.3. Khác

| ID             | Requirement                                                      |
| -------------- | ---------------------------------------------------------------- |
| FR-TEA-REQ-001 | Giáo viên MAY đề xuất thay đổi lịch dạy.                         |
| FR-TEA-EXP-001 | Giáo viên MUST xuất được danh sách sinh viên trong lớp học phần. |

## 5. Business Rules

| ID     | Rule                                                                                    |
| ------ | --------------------------------------------------------------------------------------- |
| BR-001 | Hệ thống MUST áp dụng giới hạn số tín chỉ tối thiểu và tối đa cho mỗi học kỳ.           |
| BR-002 | Hệ thống MUST kiểm tra môn học tiên quyết trước khi cho phép sinh viên đăng ký môn học. |
| BR-003 | Hệ thống MUST chỉ cho phép sinh viên đăng ký trong thời gian mở đăng ký.                |
| BR-004 | Hệ thống MUST không cho phép đăng ký nếu lịch học bị trùng.                             |
| BR-005 | Hệ thống MUST không cho phép đăng ký nếu lớp học phần đã đạt số lượng sinh viên tối đa. |
| BR-006 | Hệ thống MUST áp dụng quy định hủy đăng ký môn học theo thời gian cho phép.             |
| BR-007 | Hệ thống MUST chỉ cho phép giáo viên nhập điểm cho lớp học phần được phân công.         |

TBD: Giá trị cụ thể của số tín chỉ tối thiểu, số tín chỉ tối đa, thời gian được hủy đăng ký và thời gian được cập nhật điểm chưa được cung cấp.

## 6. Non-Functional Requirements

| ID          | Requirement                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| NFR-PER-001 | Hệ thống SHOULD phản hồi các thao tác tra cứu thông thường trong thời gian chấp nhận được theo tiêu chí TBD. |
| NFR-SEC-001 | Hệ thống MUST xác thực người dùng trước khi truy cập chức năng nội bộ.                                       |
| NFR-SEC-002 | Hệ thống MUST phân quyền theo role Admin, Sinh viên và Giáo viên.                                            |
| NFR-SEC-003 | Hệ thống MUST bảo vệ dữ liệu điểm và dữ liệu cá nhân của người dùng.                                         |
| NFR-AVL-001 | Hệ thống SHOULD có cơ chế sao lưu và phục hồi dữ liệu.                                                       |
| NFR-USA-001 | Giao diện SHOULD dễ sử dụng cho nghiệp vụ đăng ký môn học, xem thời khóa biểu và nhập điểm.                  |
| NFR-SCL-001 | Hệ thống SHOULD có khả năng mở rộng để tăng số lượng sinh viên, môn học và lớp học phần.                     |
| NFR-CMP-001 | Giao diện SHOULD tương thích với các trình duyệt phổ biến.                                                   |

TBD: Chưa có chỉ tiêu định lượng cho hiệu năng, khả dụng, sao lưu và tương thích trình duyệt.

## 7. Data Model Draft

### 7.1. Entities

Hệ thống SHOULD có các entity dữ liệu dự kiến sau:

- User.
- Role.
- Student.
- Teacher.
- Major.
- Curriculum.
- Course.
- Prerequisite.
- Semester.
- ClassSection.
- Schedule.
- Room.
- Registration.
- Grade.
- Notification.

### 7.2. Key Relationships

| Relationship                          | Description                                                   |
| ------------------------------------- | ------------------------------------------------------------- |
| Major - Curriculum                    | Một ngành đào tạo có một hoặc nhiều chương trình đào tạo.     |
| Curriculum - Course                   | Một chương trình đào tạo gồm nhiều môn học.                   |
| Course - Prerequisite                 | Một môn học MAY có một hoặc nhiều môn tiên quyết.             |
| Course - ClassSection                 | Một môn học MAY có nhiều lớp học phần.                        |
| ClassSection - Teacher                | Một lớp học phần MUST có giáo viên được phân công.            |
| ClassSection - Schedule               | Một lớp học phần MUST có lịch học.                            |
| Student - Registration - ClassSection | Sinh viên đăng ký vào lớp học phần thông qua bản ghi đăng ký. |
| ClassSection - Grade - Student        | Điểm được nhập theo sinh viên trong từng lớp học phần.        |

TBD: Thuộc tính chi tiết, khóa chính, khóa ngoại và ràng buộc database sẽ được xác định trong tài liệu thiết kế cơ sở dữ liệu.

## 8. User Interface Scope

Hệ thống SHOULD có các màn hình chính sau:

- Giao diện đăng nhập.
- Dashboard Admin.
- Dashboard Sinh viên.
- Dashboard Giáo viên.
- Giao diện quản lý tài khoản.
- Giao diện quản lý ngành đào tạo.
- Giao diện quản lý chương trình đào tạo.
- Giao diện quản lý môn học.
- Giao diện quản lý học kỳ.
- Giao diện quản lý lớp học phần.
- Giao diện quản lý đăng ký môn học.
- Giao diện đăng ký môn học của sinh viên.
- Giao diện tạo thời khóa biểu tự động.
- Giao diện xem thời khóa biểu của sinh viên.
- Giao diện xem thời khóa biểu cá nhân của giáo viên.
- Giao diện nhập điểm.
- Giao diện báo cáo và thống kê.

## 9. Use Cases

| ID         | Use Case                                   |
| ---------- | ------------------------------------------ |
| UC-ADM-001 | Admin quản lý tài khoản.                   |
| UC-ADM-002 | Admin quản lý ngành đào tạo.               |
| UC-ADM-003 | Admin quản lý chương trình đào tạo.        |
| UC-ADM-004 | Admin quản lý môn học.                     |
| UC-ADM-005 | Admin quản lý học kỳ.                      |
| UC-ADM-006 | Admin quản lý lớp học phần.                |
| UC-ADM-007 | Admin quản lý đăng ký môn học.             |
| UC-STU-001 | Sinh viên đăng ký môn học thủ công.        |
| UC-STU-002 | Sinh viên tạo thời khóa biểu tự động.      |
| UC-STU-003 | Sinh viên hủy đăng ký môn học.             |
| UC-STU-004 | Sinh viên xem thời khóa biểu.              |
| UC-TEA-001 | Giáo viên xem lớp học phần được phân công. |
| UC-TEA-002 | Giáo viên xem thời khóa biểu cá nhân.      |
| UC-TEA-003 | Giáo viên nhập điểm.                       |
| UC-TEA-004 | Giáo viên gửi thông báo cho sinh viên.     |

## 10. Technology Stack

| Layer              | Decision                                |
| ------------------ | --------------------------------------- |
| Frontend framework | ReactJS                                 |
| UI library         | Tailwind CSS                            |
| Backend language   | Python                                  |
| Backend framework  | TBD: FastAPI hoặc Django REST Framework |
| API style          | RESTful API                             |
| Authentication     | JWT, refresh token                      |
| Authorization      | Role-based access control               |
| Database           | PostgreSQL                              |
| ORM                | TypeORM                                 |
| API documentation  | Swagger                                 |
| Deployment         | Docker                                  |
| Version control    | Git, GitHub                             |
| API testing        | Postman hoặc Insomnia                   |

RISK: Backend Python và ORM TypeORM có thể không đồng nhất về hệ sinh thái. Reviewer SHOULD xác nhận lại trước khi triển khai HLD/LLD.

## 11. Verification Plan

| ID       | Verification Scope                                                       |
| -------- | ------------------------------------------------------------------------ |
| TEST-001 | Test đăng nhập, đăng xuất, đổi mật khẩu và phân quyền theo role.         |
| TEST-002 | Test chức năng quản lý tài khoản của Admin.                              |
| TEST-003 | Test chức năng quản lý chương trình đào tạo.                             |
| TEST-004 | Test chức năng quản lý môn học và môn tiên quyết.                        |
| TEST-005 | Test chức năng quản lý học kỳ và thời gian đăng ký.                      |
| TEST-006 | Test chức năng quản lý lớp học phần.                                     |
| TEST-007 | Test chức năng đăng ký môn học thủ công.                                 |
| TEST-008 | Test kiểm tra trùng lịch, môn tiên quyết, giới hạn tín chỉ và sĩ số lớp. |
| TEST-009 | Test thuật toán tạo thời khóa biểu tự động.                              |
| TEST-010 | Test chức năng xem thời khóa biểu của sinh viên.                         |
| TEST-011 | Test chức năng xem thời khóa biểu cá nhân của giáo viên.                 |
| TEST-012 | Test chức năng nhập điểm của giáo viên.                                  |
| TEST-013 | Test chức năng thông báo.                                                |
| TEST-014 | Test báo cáo và thống kê.                                                |

## 12. Open Questions, Assumptions and Risks

### 12.1. Open Questions

OPEN QUESTION: Reviewer cần xác nhận backend framework cụ thể: FastAPI hay Django REST Framework.

OPEN QUESTION: Reviewer cần xác nhận state management library cho ReactJS.

OPEN QUESTION: Reviewer cần xác nhận cách sử dụng TypeORM với backend Python.

OPEN QUESTION: Reviewer cần cung cấp quy định cụ thể về số tín chỉ tối thiểu, số tín chỉ tối đa, thời hạn hủy đăng ký và thời hạn cập nhật điểm.

OPEN QUESTION: Reviewer cần xác nhận cách tính điểm tổng kết từ điểm quá trình, giữa kỳ và cuối kỳ.

### 12.2. Assumptions

ASSUMPTION: Hệ thống sử dụng RESTful API để frontend ReactJS giao tiếp với backend Python.

ASSUMPTION: Tài khoản Sinh viên và Giáo viên được Admin tạo hoặc nhập từ nguồn dữ liệu nhà trường.

ASSUMPTION: Một môn học có thể có nhiều lớp học phần và nhiều giáo viên giảng dạy thông qua các lớp học phần khác nhau.

### 12.3. Risks

RISK: Thuật toán tự động tạo thời khóa biểu có thể phức tạp nếu số lượng môn học, giáo viên, phòng học và ràng buộc ưu tiên tăng cao.

RISK: Nếu quy định nghiệp vụ về tín chỉ, môn tiên quyết và thời hạn đăng ký chưa rõ, hệ thống có thể xử lý đăng ký không đúng mong đợi.

RISK: Stack Python + TypeORM cần được kiểm chứng sớm để tránh ảnh hưởng đến thiết kế backend và database.

## 13. Appendix

TBD: Sơ đồ use case.

TBD: Sơ đồ ERD.

TBD: Sơ đồ luồng xử lý đăng ký môn học.

TBD: Sơ đồ thuật toán tạo thời khóa biểu tự động.

TBD: Mẫu báo cáo và biểu mẫu.
