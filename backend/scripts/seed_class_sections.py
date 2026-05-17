"""Seed 10 lớp học phần cho học kỳ đang mở.

Mỗi lớp:
- Gán 1 GV xoay vòng qua danh sách TeacherProfile
- Mỗi lớp 1 buổi/tuần, 3 tiết liên tiếp, không trùng slot với lớp khác
- status=OPEN để SV đăng ký được ngay
- max_students=50 mặc định

Chạy: docker compose exec backend python manage.py shell < scripts/seed_class_sections.py
"""
from apps.classes.models import ClassSection, Schedule
from apps.courses.models import Course
from apps.profiles.models import TeacherProfile
from apps.semesters.models import Semester

# Cấu hình 10 slot lịch học không trùng nhau (weekday + session + start_period + room)
SLOTS = [
    (0, Schedule.Session.MORNING,    1, "A1.01"),  # T2 sáng tiết 1-3
    (0, Schedule.Session.AFTERNOON,  6, "A1.02"),  # T2 chiều tiết 6-8
    (1, Schedule.Session.MORNING,    1, "B2.01"),  # T3 sáng
    (1, Schedule.Session.AFTERNOON,  6, "B2.02"),  # T3 chiều
    (2, Schedule.Session.MORNING,    1, "C3.01"),  # T4 sáng
    (2, Schedule.Session.AFTERNOON,  6, "C3.02"),  # T4 chiều
    (3, Schedule.Session.MORNING,    1, "D4.01"),  # T5 sáng
    (3, Schedule.Session.AFTERNOON,  6, "D4.02"),  # T5 chiều
    (4, Schedule.Session.MORNING,    1, "E5.01"),  # T6 sáng
    (4, Schedule.Session.AFTERNOON,  6, "E5.02"),  # T6 chiều
]


def run():
    # Lấy học kỳ đang mở
    semester = Semester.objects.filter(is_open=True).first()
    if not semester:
        print("✗ Không có học kỳ nào. Tạo học kỳ trước.")
        return
    print(f"✓ Học kỳ: {semester.code}")

    # Lấy 10 môn đầu tiên (sort by code)
    courses = list(Course.objects.filter(is_active=True).order_by("code")[:10])
    if len(courses) < 10:
        print(f"✗ Cần ≥ 10 môn, hiện có {len(courses)}.")
        return
    print(f"✓ Lấy 10 môn từ {courses[0].code} đến {courses[-1].code}")

    # Lấy danh sách GV
    teachers = list(TeacherProfile.objects.filter(is_active=True).order_by("teacher_code"))
    if not teachers:
        print("✗ Không có GV nào. Chạy seed_teachers.py trước.")
        return
    print(f"✓ Có {len(teachers)} GV để xoay vòng")

    created_classes = 0
    created_schedules = 0
    skipped = 0

    for idx, (course, slot) in enumerate(zip(courses, SLOTS), start=1):
        weekday, session, start_period, room = slot
        teacher = teachers[idx % len(teachers)]
        code = f"{course.code}.{idx:02d}"

        # Tạo ClassSection (idempotent)
        cs, c_created = ClassSection.objects.get_or_create(
            code=code,
            defaults={
                "course": course,
                "semester": semester,
                "teacher": teacher,
                "periods_per_session": 3,
                "max_students": 50,
                "status": ClassSection.Status.OPEN,
                "note": f"Lớp seed tự động cho môn {course.code}",
            },
        )
        if c_created:
            created_classes += 1
            print(f"  + {code} ({course.name[:35]:35}) | GV {teacher.teacher_code}")
        else:
            skipped += 1
            print(f"  ~ {code} đã tồn tại, bỏ qua")
            continue

        # Tạo Schedule cho lớp
        Schedule.objects.create(
            class_section=cs,
            weekday=weekday,
            session=session,
            start_period=start_period,
            room=room,
        )
        created_schedules += 1

    print()
    print(f"✓ Đã tạo {created_classes} lớp HP mới ({skipped} đã tồn tại trước đó)")
    print(f"✓ Đã tạo {created_schedules} lịch học")
    print(f"✓ Tổng ClassSection hiện tại: {ClassSection.objects.count()}")


run()
