"""Seed bulk: tạo nhiều SV + enroll vào lớp + grades.

Mục tiêu:
- Mỗi ngành có 15-20 SV (tổng ~80-100)
- Mỗi SV đăng ký 5-8 lớp ở HK hiện tại
- Mỗi SV đã học 6-10 lớp HK trước có grade
- → GV thấy 10-30 SV/lớp + có điểm để demo nhập điểm UI

Chạy:
docker compose exec backend python manage.py shell -c "exec(open('/app/scripts/seed_bulk_students_with_data.py', encoding='utf-8').read())"
"""
import random
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.classes.models import ClassSection
from apps.curriculums.models import Curriculum, CurriculumCourse
from apps.grades.models import Grade
from apps.majors.models import Major
from apps.profiles.models import StudentProfile
from apps.registrations.models import Registration
from apps.semesters.models import Semester

User = get_user_model()

random.seed(42)  # Reproducible

# Họ + tên đệm + tên (VN realistic)
HO_LIST = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
           "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đoàn", "Cao", "Tô", "Trịnh"]
TEN_DEM_NAM = ["Văn", "Quốc", "Hữu", "Minh", "Đức", "Anh", "Tuấn", "Hoàng", "Thành", "Khánh"]
TEN_DEM_NU = ["Thị", "Ngọc", "Thuý", "Hồng", "Diễm", "Thanh", "Bích", "Phương", "Hà", "Mai"]
TEN_NAM = ["An", "Bình", "Cường", "Dũng", "Hải", "Hiếu", "Khôi", "Lâm", "Minh", "Nam",
           "Phong", "Quang", "Sơn", "Tài", "Trí", "Vinh", "Vũ", "Hùng", "Lộc", "Phúc"]
TEN_NU = ["An", "Bích", "Châu", "Diệp", "Giang", "Hằng", "Hồng", "Hương", "Lan", "Linh",
          "Mai", "My", "Nga", "Nhi", "Oanh", "Quỳnh", "Thu", "Trang", "Vy", "Yến"]


def vn_name() -> tuple[str, str]:
    """Trả (full_name, gender_code) random."""
    is_male = random.random() < 0.5
    ho = random.choice(HO_LIST)
    if is_male:
        ten_dem = random.choice(TEN_DEM_NAM)
        ten = random.choice(TEN_NAM)
    else:
        ten_dem = random.choice(TEN_DEM_NU)
        ten = random.choice(TEN_NU)
    return f"{ho} {ten_dem} {ten}", "M" if is_male else "F"


# Cấu hình SV per major + bắt đầu MSSV
TARGET_STUDENTS_PER_MAJOR = 18

# MSSV prefix theo ngành (tự sinh khi không có sẵn)
MAJOR_MSSV_PREFIX = {
    "CNOTO": "2424801030",  # khoá 2024 → enrollment_year=2024
    "KTPM": "2425801030",   # 2025
    "QTKD": "2422801030",   # 2022
    "SPTH": "2425801040",   # 2025
    "TNMT": "2423801030",   # 2023
}
MAJOR_ENROLLMENT_YEAR = {
    "CNOTO": 2024,
    "KTPM": 2025,
    "QTKD": 2022,
    "SPTH": 2025,
    "TNMT": 2023,
}


def total_score(seed: int, weak: bool = False) -> Decimal:
    """Sinh điểm tổng (4.0-9.5). weak=True → bias xuống 5.0-7.0."""
    if weak:
        v = 5.0 + (seed % 20) / 10.0  # 5.0 - 6.9
    else:
        v = 5.5 + (seed % 40) / 10.0  # 5.5 - 9.4
    return Decimal(str(round(v, 2)))


@transaction.atomic
def create_student(major: Major, idx: int) -> StudentProfile | None:
    """Tạo SV nếu chưa có (idempotent theo student_code)."""
    prefix = MAJOR_MSSV_PREFIX.get(major.code, "242000000")
    code = f"{prefix}{idx:03d}"  # vd 2425801030001
    if StudentProfile.objects.filter(student_code=code).exists():
        return None

    full_name, _gender = vn_name()
    username = code  # username = MSSV cho đơn giản
    if User.objects.filter(username=username).exists():
        return None

    user = User.objects.create_user(
        username=username,
        password="sv12345",
        email=f"{username}@student.dkmh.edu.vn",
        full_name=full_name,
        role="STUDENT",
    )
    profile = StudentProfile.objects.create(
        user=user,
        student_code=code,
        major=major,
        enrollment_year=MAJOR_ENROLLMENT_YEAR.get(major.code, 2024),
        is_active=True,
    )
    return profile


def get_curriculum(major: Major) -> Curriculum | None:
    cohort = MAJOR_ENROLLMENT_YEAR.get(major.code, 2024)
    cur = Curriculum.objects.filter(major=major, cohort_year=cohort, is_active=True).first()
    if cur:
        return cur
    return Curriculum.objects.filter(major=major, is_active=True).order_by("-cohort_year").first()


def list_curriculum_courses_for_semester(
    curriculum: Curriculum, suggested_semester: int
) -> list[CurriculumCourse]:
    return list(
        curriculum.curriculum_courses.filter(suggested_semester=suggested_semester)
        .select_related("course")
    )


def list_open_classes_for_course(
    course_id: int, semester: Semester, allow_closed: bool = False
) -> list[ClassSection]:
    """allow_closed=True cho phép HK đã đóng (dùng cho seed history)."""
    statuses = [ClassSection.Status.OPEN]
    if allow_closed:
        statuses.append(ClassSection.Status.CLOSED)
    return list(
        ClassSection.objects.filter(
            course_id=course_id,
            semester=semester,
            status__in=statuses,
        )
        .select_related("teacher")
        .prefetch_related("schedules")
    )


def has_schedule_conflict(student: StudentProfile, candidate: ClassSection, semester: Semester) -> bool:
    """Check trùng lịch với các registration đã có của SV trong semester (CONFIRMED)."""
    new_schedules = list(candidate.schedules.all())
    if not new_schedules:
        return False
    qs = (
        Registration.objects.filter(
            student=student,
            semester=semester,
            status__in=[Registration.Status.PENDING, Registration.Status.CONFIRMED],
        )
        .exclude(class_section_id=candidate.id)
        .prefetch_related("class_section__schedules")
    )
    for reg in qs:
        for new_s in new_schedules:
            for ex in reg.class_section.schedules.all():
                if (
                    new_s.weekday == ex.weekday
                    and new_s.start_period <= ex.end_period
                    and ex.start_period <= new_s.end_period
                ):
                    return True
    return False


@transaction.atomic
def enroll_student_in_semester(
    student: StudentProfile,
    semester: Semester,
    suggested_semester: int,
    add_grade: bool,
    max_courses: int = 6,
) -> int:
    """Enroll SV vào ≤ max_courses lớp của semester. Nếu add_grade=True thì tạo Grade.

    Returns số lớp đã enroll thành công.
    """
    curriculum = get_curriculum(student.major)
    if not curriculum:
        return 0

    cc_list = list_curriculum_courses_for_semester(curriculum, suggested_semester)
    if not cc_list:
        return 0

    enrolled = 0
    seed_offset = student.id * 17 + suggested_semester * 53
    random.Random(seed_offset).shuffle(cc_list)

    for cc in cc_list:
        if enrolled >= max_courses:
            break
        # Đã đăng ký course này trong semester chưa
        if Registration.objects.filter(
            student=student,
            semester=semester,
            class_section__course=cc.course,
        ).exists():
            continue

        # Cho phép CLOSED nếu đang seed past semester có grade
        candidates = list_open_classes_for_course(
            cc.course.id, semester, allow_closed=add_grade,
        )
        if not candidates:
            continue

        # Spread across class sections: pick based on student.id hash
        random.Random(student.id * 41 + cc.course.id).shuffle(candidates)
        chosen = None
        for cs in candidates:
            if cs.enrolled_count >= cs.max_students:
                continue
            if has_schedule_conflict(student, cs, semester):
                continue
            chosen = cs
            break

        if not chosen:
            continue

        reg = Registration.objects.create(
            student=student,
            class_section=chosen,
            semester=semester,
            status=Registration.Status.CONFIRMED,
        )

        if add_grade:
            seed = student.id * 31 + cc.course.id * 7 + suggested_semester
            # ~10% rớt
            weak = (seed % 100) < 10
            base_total = total_score(seed, weak=weak)
            # Reverse engineer process/midterm/final to match total via 0.1/0.4/0.5
            # process_score 0-10, midterm 0-10, final 0-10
            # total = 0.1*p + 0.4*m + 0.5*f
            # Simple: m = base, f = base ± 0.5, p = base ± 1
            mid = float(base_total)
            final = max(0.0, min(10.0, mid + ((seed % 11) - 5) / 10))
            process = max(0.0, min(10.0, mid + ((seed % 21) - 10) / 10))
            Grade.objects.create(
                registration=reg,
                process_score=Decimal(str(round(process, 2))),
                midterm_score=Decimal(str(round(mid, 2))),
                final_score=Decimal(str(round(final, 2))),
            )

        enrolled += 1

    return enrolled


def main():
    print("=" * 70)
    print("Seed bulk students + registrations + grades")
    print("=" * 70)

    # Tìm semesters
    sem_2024_h1 = Semester.objects.filter(code="2024-2025-HK1").first()
    sem_2024_h2 = Semester.objects.filter(code="2024-2025-HK2").first()
    sem_2025_h1 = Semester.objects.filter(code="2025-2026-HK1").first()
    sem_2025_h2 = Semester.objects.filter(code="2025-2026-HK2").first()
    sem_2026_h1 = Semester.objects.filter(code="2026-2027-HK1").first()

    # Map suggested_semester → (semester, add_grade)
    plan = [
        (sem_2024_h1, 1, True),
        (sem_2024_h2, 2, True),
        (sem_2025_h1, 3, True),
        (sem_2025_h2, 4, True),
        (sem_2026_h1, 5, False),  # HK đang mở — không grade
    ]
    plan = [(s, ss, g) for (s, ss, g) in plan if s is not None]

    print(f"Semesters trong plan: {[s.code for s, _, _ in plan]}")
    print()

    total_new_students = 0
    total_new_regs = 0
    total_new_grades = 0

    for major in Major.objects.all():
        existing = StudentProfile.objects.filter(major=major).count()
        need = max(0, TARGET_STUDENTS_PER_MAJOR - existing)
        print(f"Ngành {major.code} ({major.name}): có {existing} SV, cần thêm {need}")

        if need == 0:
            continue

        # Find max existing index for this major
        prefix = MAJOR_MSSV_PREFIX.get(major.code, "")
        existing_codes = [
            int(p.student_code.replace(prefix, ""))
            for p in StudentProfile.objects.filter(student_code__startswith=prefix)
            if p.student_code.replace(prefix, "").isdigit()
        ]
        start_idx = (max(existing_codes) + 1) if existing_codes else 1

        for i in range(need):
            student = create_student(major, start_idx + i)
            if not student:
                continue
            total_new_students += 1

            for sem, ss, add_grade in plan:
                n = enroll_student_in_semester(student, sem, ss, add_grade=add_grade)
                total_new_regs += n
                if add_grade:
                    total_new_grades += n

    print()
    print("=" * 70)
    print(f"✓ Tạo {total_new_students} SV mới")
    print(f"✓ Tạo {total_new_regs} registrations mới")
    print(f"✓ Tạo {total_new_grades} grades mới")
    print()
    print("Stats sau khi seed:")
    print(f"  Tổng SV: {StudentProfile.objects.count()}")
    print(f"  Tổng Registration CONFIRMED: {Registration.objects.filter(status='CONFIRMED').count()}")
    print(f"  Tổng Grade có điểm: {Grade.objects.filter(total_score__isnull=False).count()}")


main()
