# Plan - Tính năng TKB tự động (FR-STU-TKB)

## 1. Mục tiêu

Route `/student/auto` dùng để sinh viên tạo thời khóa biểu tự động từ các lớp học phần đang mở. Sinh viên không nhập môn tự do. Hệ thống chỉ cho chọn các môn có lớp học phần hợp lệ trong học kỳ đang mở đăng ký.

Tính năng này phục vụ đồ án/báo cáo nên cần:

- Có cơ sở lý thuyết để trình bày: Constraint Satisfaction Problem (CSP).
- Có thuật toán implement và demo được: Backtracking + MRV + cắt nhánh khi trùng lịch.
- Có tiêu chí "phù hợp" rõ ràng: hard constraints bắt buộc và soft constraints chấm điểm.
- Có giao diện để sinh viên tìm kiếm, lọc môn, chọn giáo viên từng môn và xem nhiều phương án TKB.

Vấn đề "không biết thế nào là tối ưu" được xử lý bằng cách định nghĩa:

- **Hard constraints**: điều kiện bắt buộc, vi phạm là loại ngay.
- **Soft constraints**: tiêu chí ưu tiên, được chấm điểm và sắp xếp.
- **Kết quả**: trả về tối đa `max_results` phương án khả thi có điểm phù hợp cao, không khẳng định là "tất cả phương án tối ưu toàn cục" khi có giới hạn số lượng.

## 2. Mô hình bài toán

### CSP

- **Variables**: danh sách môn sinh viên chọn.
- **Domain**: tập lớp học phần đang mở của từng môn.
- **Assignment**: mỗi môn được gán đúng 1 lớp học phần.
- **Hard constraints**:
  - Học kỳ đang mở đăng ký.
  - Môn thuộc chương trình đào tạo của sinh viên.
  - Môn có lớp học phần `OPEN`, chưa đầy.
  - Sinh viên không thiếu môn tiên quyết.
  - Sinh viên chưa học môn đó, nếu có điểm thì báo "Môn đã học rồi".
  - Lớp được chọn không trùng lịch với các lớp đã đăng ký.
  - Các lớp trong cùng phương án không trùng lịch nhau.
- **Soft constraints**:
  - Ưu tiên ca học.
  - Ngày muốn tránh.
  - Tăng số ngày nghỉ trong tuần.
  - Giáo viên ưu tiên chung nếu có.

### Định nghĩa "phù hợp"

Một phương án TKB phù hợp là phương án:

1. Thỏa tất cả hard constraints.
2. Có điểm tổng cao theo soft constraints sinh viên chọn.
3. Có thể giải thích được bằng breakdown điểm: ngày muốn tránh, ca học, giáo viên, ngày nghỉ.

Công thức tổng:

```text
total = w_weekday * s_weekday
      + w_session * s_session
      + w_teacher * s_teacher
      + w_free_day * s_free_day
```

Mỗi sub-score nằm trong `[0, 100]`. Trọng số lấy theo preset.

## 3. Luồng người dùng

### Bước 1 - Chọn học kỳ

- Mặc định chọn học kỳ đang mở đăng ký.
- Nếu học kỳ chưa mở đăng ký, nút tìm phương án bị vô hiệu hóa và hiện "Ngoài thời gian đăng ký".

### Bước 2 - Tải danh sách môn có lớp học phần đang mở

Frontend gọi:

```http
GET /api/auto-schedule/available-courses/?semester=<id>&search=&unlearned_only=true
```

Backend chỉ trả về các môn thỏa đồng thời:

- Thuộc chương trình đào tạo của sinh viên.
- Có ít nhất 1 lớp học phần trong học kỳ đã chọn.
- Lớp học phần có `status=OPEN`.
- Lớp học phần còn sĩ số.

Danh sách hiển thị theo **môn học**, không hiển thị rời rạc theo từng lớp học phần.

### Bước 3 - Tìm kiếm và filter

Trang `/student/auto` có các bộ lọc:

- Tìm kiếm theo mã môn, tên môn, mã lớp học phần, tên giáo viên.
- Filter chương trình đào tạo: mặc định là CTĐT của sinh viên.
- Filter "Môn chưa học": loại các môn sinh viên đã có điểm.
- Trạng thái gợi ý trên từng môn:
  - Đã học.
  - Đã đạt.
  - Thiếu tiên quyết.
  - Đã đăng ký.
  - Có thể đăng ký.

Nếu bật "Môn chưa học", môn đã có điểm không xuất hiện trong danh sách chọn. Nếu sinh viên vẫn gửi môn đã học lên endpoint suggest, backend trả lỗi:

```text
Môn đã học rồi.
```

### Bước 4 - Chọn môn và giáo viên từng môn

Mỗi item môn học có thể bấm để mở chi tiết:

- Danh sách lớp học phần đang mở của môn đó.
- Giáo viên đang dạy các lớp đó.
- Lịch học, sĩ số, phòng, mã lớp.

Sinh viên có 2 lựa chọn cho từng môn:

- Chọn giáo viên cụ thể: domain của môn chỉ gồm lớp học phần do giáo viên đó dạy.
- Để "Tự chọn": backend không ràng buộc giáo viên. Hệ thống có thể trộn thứ tự các lớp hợp lệ của môn đó trước khi backtracking để tạo cảm giác ngẫu nhiên, sau đó vẫn chấm điểm và sắp xếp theo mức độ phù hợp.

Lưu ý cho báo cáo: "ngẫu nhiên" ở đây không có nghĩa bỏ qua tối ưu. Nó chỉ là không có ràng buộc giáo viên, hệ thống tự chọn trong các lớp hợp lệ.

### Bước 5 - Tìm phương án

Frontend gọi:

```http
POST /api/auto-schedule/suggest/
```

Payload:

```json
{
  "semester": 1,
  "course_ids": [101, 102, 103],
  "course_teacher_constraints": {
    "101": 12
  },
  "avoid_weekdays": [6],
  "preferred_sessions": ["MORNING"],
  "preferred_teacher_ids": [],
  "preset": "BALANCED",
  "max_results": 50
}
```

Trong đó:

- `course_ids`: các môn sinh viên đã chọn.
- `course_teacher_constraints`: map `course_id -> teacher_id`; chỉ gửi những môn sinh viên đã chọn giáo viên.
- Môn không có trong `course_teacher_constraints` được xem là "Tự chọn".

### Bước 6 - Xem kết quả và áp dụng

Mỗi phương án hiển thị:

- Điểm tổng.
- Breakdown: weekday/session/teacher/free_day.
- Danh sách lớp học phần được chọn.
- Giáo viên, sĩ số, lịch học, phòng.
- Preview bằng `ScheduleGrid`.
- Nút "Áp dụng" để đăng ký các lớp trong phương án.

## 4. API và serializer

### Endpoint available courses

```http
GET /api/auto-schedule/available-courses/
```

Query params:

| Param | Bắt buộc | Ý nghĩa |
|---|---:|---|
| `semester` | Có | Học kỳ cần tạo TKB |
| `search` | Không | Tìm theo mã môn, tên môn, mã lớp, tên GV |
| `unlearned_only` | Không | `true` để chỉ lấy môn chưa có điểm |

Response đề xuất:

```json
{
  "count": 2,
  "results": [
    {
      "course_id": 101,
      "course_code": "CS101",
      "course_name": "Lập trình cơ bản",
      "credits": 3,
      "suggested_semester": 1,
      "has_grade": false,
      "passed": false,
      "missing_prerequisites": [],
      "registered": false,
      "teachers": [
        {
          "teacher_id": 12,
          "teacher_name": "Nguyễn Văn A",
          "class_sections": [
            {
              "id": 501,
              "code": "CS101-01",
              "enrolled_count": 35,
              "max_students": 50,
              "schedules": []
            }
          ]
        }
      ]
    }
  ]
}
```

### Endpoint suggest

```http
POST /api/auto-schedule/suggest/
```

Validation:

- Chỉ sinh viên được gọi.
- Học kỳ phải đang trong thời gian đăng ký.
- Tất cả `course_ids` phải thuộc CTĐT của sinh viên.
- Tất cả môn phải có lớp học phần đang mở, chưa đầy.
- Nếu môn đã có điểm thì trả lỗi "Môn đã học rồi".
- Nếu thiếu tiên quyết thì trả lỗi danh sách môn tiên quyết thiếu.
- Nếu `teacher_id` được chọn cho một môn, giáo viên đó phải có lớp đang mở của môn đó.

Response:

```json
{
  "count": 2,
  "results": [
    {
      "class_sections": [],
      "score": 92.5,
      "breakdown": {
        "weekday": 100,
        "session": 80,
        "teacher": 90,
        "free_day": 85.71,
        "total": 92.5
      },
      "stats": {
        "study_days": 1,
        "free_days": 6
      }
    }
  ]
}
```

## 5. Thuật toán

### Tạo domain

Với mỗi môn đã chọn:

1. Lấy các lớp học phần của môn trong học kỳ.
2. Lọc `status=OPEN`.
3. Lọc chưa đầy.
4. Lọc theo CTĐT của sinh viên.
5. Nếu môn có teacher constraint, chỉ giữ lớp của giáo viên đó.
6. Nếu môn không có teacher constraint, giữ tất cả lớp hợp lệ. Có thể shuffle domain để tạo sự đa dạng khi sinh viên bấm tìm lại.

Nếu domain rỗng, trả lỗi:

```text
Môn <mã_môn> không có lớp học phần phù hợp.
```

### Lấy lịch đã đăng ký

Trước khi backtracking, lấy các registration hiện có của sinh viên trong học kỳ:

- `PENDING`
- `CONFIRMED`

Dùng lịch của các lớp này làm `used_schedules` ban đầu. Như vậy mọi phương án đề xuất sẽ không trùng với lịch sinh viên đã đăng ký.

### MRV

Sắp xếp các môn theo số lớp hợp lệ tăng dần:

```text
courses_ordered = sort(courses, key = len(domain[course]))
```

Môn có ít lựa chọn được xử lý trước để cắt nhánh sớm.

### Backtracking

Pseudocode:

```text
function SUGGEST(student, semester, selectedCourses, preferences):
    validate_registration_window(semester)
    validate_courses_in_curriculum(student, selectedCourses)
    validate_not_learned(student, selectedCourses)
    validate_prerequisites(student, selectedCourses)

    usedSchedules = schedules_from_existing_registrations(student, semester)
    domains = build_domains(selectedCourses, semester, teacherConstraints)
    order = sort_by_domain_size(domains)

    feasible = []
    BACKTRACK(order, 0, [], usedSchedules, feasible, maxResults)

    candidates = score(feasible, preferences)
    return sort_desc(candidates, by = score.total)

function BACKTRACK(order, idx, selected, usedSchedules, feasible, maxResults):
    if len(feasible) >= maxResults:
        return

    if idx == len(order):
        feasible.add(copy(selected))
        return

    course = order[idx]
    for classSection in domains[course]:
        if has_conflict(classSection.schedules, usedSchedules):
            continue

        selected.push(classSection)
        usedSchedules.push_all(classSection.schedules)
        BACKTRACK(order, idx + 1, selected, usedSchedules, feasible, maxResults)
        selected.pop()
        usedSchedules.remove_all(classSection.schedules)
```

### Conflict check

Hai lịch học trùng nhau khi:

```text
same weekday
and left.start_period <= right.end_period
and right.start_period <= left.end_period
```

Nếu cần xét lớp học không kéo dài cả học kỳ, có thể bổ sung điều kiện date range overlap. Với bản demo hiện tại, giả định mỗi lớp học phần lặp lại trong toàn học kỳ.

## 6. Scoring

### Preset

| Preset | Weekday | Session | Teacher | Free day | Khi dùng |
|---|---:|---:|---:|---:|---|
| `BALANCED` | 0.25 | 0.25 | 0.25 | 0.25 | Mặc định |
| `TEACHER_FIRST` | 0.15 | 0.15 | 0.55 | 0.15 | Ưu tiên GV |
| `SESSION_FIRST` | 0.15 | 0.55 | 0.15 | 0.15 | Ưu tiên ca học |
| `COMPACT_FIRST` | 0.15 | 0.15 | 0.15 | 0.55 | Ưu tiên nhiều ngày nghỉ |

### Weekday score

Nếu sinh viên chọn ngày muốn tránh:

```text
s_weekday = 100 * (1 - số_buổi_rơi_vào_ngày_tránh / tổng_số_buổi)
```

Nếu không chọn ngày muốn tránh, score = 100.

### Session score

Nếu sinh viên chọn ca ưu tiên:

```text
s_session = 100 * số_buổi_đúng_ca / tổng_số_buổi
```

Nếu không chọn ca, score = 100.

### Teacher score

Có 2 loại giáo viên:

- Giáo viên chọn riêng cho từng môn: hard constraint, dùng để lọc domain.
- Giáo viên ưu tiên chung: soft constraint, dùng để chấm điểm nếu UI có bộ lọc này.

Nếu không chọn giáo viên ưu tiên chung, score = 100.

### Free day score

Free day score ưu tiên các phương án gom lịch vào ít ngày học hơn, để sinh viên có nhiều ngày nghỉ hơn trong tuần.

```text
study_days = số ngày có ít nhất 1 buổi học
free_days = 7 - study_days
s_free_day = 100 * free_days / 7
```

Nếu hai phương án có cùng hard constraints và các ưu tiên khác tương đương, phương án có nhiều ngày nghỉ hơn sẽ được xếp cao hơn khi preset ưu tiên tiêu chí này.

## 7. Frontend

### File chính

| File | Việc cần làm |
|---|---|
| `frontend/src/api/autoSchedule.ts` | Thêm API client và types |
| `frontend/src/pages/student/AutoSchedulePage.tsx` | Xây trang tạo TKB tự động |
| `frontend/src/App.tsx` | Gắn route `/student/auto` vào page mới |
| `frontend/src/components/ui/ScheduleGrid.tsx` | Reuse để preview lịch |

### UI đề xuất

Trang chia 2 vùng:

- Bên trái: học kỳ, search, filter môn chưa học, danh sách môn.
- Bên phải: preferences, nút tìm phương án, danh sách phương án.

Mỗi dòng môn học có:

- Checkbox chọn môn.
- Mã môn, tên môn, số tín chỉ.
- Trạng thái: chưa học/đã học/thiếu tiên quyết/đã đăng ký.
- Nút xem chi tiết.

Khi bấm chi tiết:

- Hiện các lớp học phần đang mở của môn.
- Hiện giáo viên theo nhóm.
- Cho chọn:
  - "Tự chọn"
  - Một giáo viên cụ thể.

### Áp dụng phương án

Ban đầu có thể reuse endpoint `/api/registrations/` cho từng lớp, nhưng cần cảnh báo rủi ro đăng ký một phần nếu một request giữa chừng bị lỗi.

Khuyến nghị cho bản hoàn chỉnh:

```http
POST /api/auto-schedule/apply/
```

Endpoint này nhận danh sách `class_section_ids` và tạo registration trong transaction.

## 8. Backend

### File chính

| File | Việc cần làm |
|---|---|
| `backend/apps/registrations/auto_schedule.py` | Thuật toán CSP, scoring, domain builder |
| `backend/apps/registrations/serializers.py` | Request/response serializers |
| `backend/apps/registrations/views.py` | `AvailableCoursesView`, `AutoScheduleSuggestView` |
| `backend/apps/registrations/urls.py` | Thêm routes auto schedule |
| `backend/apps/registrations/tests_auto_schedule.py` | Test endpoint và thuật toán |

### Hàm nên tách riêng

- `get_student_curriculum(student)`
- `get_learned_course_ids(student)`
- `get_passed_course_ids(student)`
- `get_existing_schedules(student, semester)`
- `build_available_courses(student, semester, search, unlearned_only)`
- `build_domain(course, semester, teacher_id)`
- `suggest_schedules(student, semester, course_ids, prefs, max_results)`
- `score_assignment(class_sections, schedules_cache, prefs)`

Tách như vậy giúp code dễ test và dễ trình bày trong báo cáo.

## 9. Test plan

### Backend tests

- `available-courses` chỉ trả môn có lớp học phần `OPEN`.
- `available-courses` không trả môn ngoài CTĐT của sinh viên.
- `unlearned_only=true` loại môn đã có điểm.
- Search tìm theo mã môn, tên môn, mã lớp, tên giáo viên.
- Suggest báo lỗi nếu học kỳ ngoài thời gian đăng ký.
- Suggest báo lỗi nếu môn ngoài CTĐT.
- Suggest báo lỗi nếu môn đã có điểm.
- Suggest báo lỗi nếu thiếu tiên quyết.
- Chọn GV từng môn làm domain chỉ còn lớp của GV đó.
- Không chọn GV thì domain gồm tất cả lớp hợp lệ.
- Kết quả không trùng lịch với lớp đã đăng ký.
- Kết quả không trùng lịch nội bộ giữa các môn đã chọn.
- `max_results` giới hạn số phương án trả về.

### Frontend checks

- Load trang `/student/auto`.
- Search và filter môn chưa học hoạt động.
- Bấm môn mở được chi tiết lớp/GV.
- Chọn GV từng môn gửi đúng `course_teacher_constraints`.
- Để "Tự chọn" không gửi constraint cho môn đó.
- Bấm tìm hiện danh sách phương án và preview bằng ScheduleGrid.
- Bấm áp dụng đăng ký đúng các lớp trong phương án.

## 10. Nội dung báo cáo gợi ý

1. Phát biểu bài toán: đầu vào, đầu ra, ràng buộc.
2. Mô hình CSP: variables, domain, constraints.
3. Thuật toán Backtracking + MRV + cắt nhánh trùng lịch.
4. Hàm chấm điểm weighted scoring.
5. Cơ chế chọn giáo viên từng môn và "Tự chọn".
6. Phân tích độ phức tạp:

```text
Worst case: O(product(|D_i|))
```

Trong đó `D_i` là tập lớp học phần hợp lệ của môn i.

7. Thực nghiệm:
   - 3 môn x 3 lớp.
   - 5 môn x 5 lớp.
   - So sánh preset BALANCED, SESSION_FIRST, COMPACT_FIRST.
8. Hạn chế:
   - Chưa tối ưu Pareto.
   - Chưa tính khoảng cách phòng học.
   - Nếu dùng apply nhiều request có thể đăng ký một phần, nên có apply endpoint transaction.
   - Nếu muốn "ngẫu nhiên" thực sự thì cần seed để test ổn định.

## 11. Checklist sau khi implement

Sau khi code xong cần cập nhật `doc/checklist.md`:

- Đánh dấu các FR-STU-TKB đã hoàn thành.
- Ghi rõ endpoint `available-courses`, `suggest`, và nếu có `apply`.
- Ghi rõ đã có test backend cho domain/filter/scoring/conflict.
- Ghi rõ đã có trang frontend `/student/auto`.
