"""Seed past-semester enrollments + grades cho SV đã tạo.

Mỗi SV đã có ở DB sẽ được enroll vào ~5 lớp/HK ở 4 HK trước (status=CLOSED OK)
+ tạo Grade với điểm random.

Chạy:
docker compose exec backend python manage.py shell -c "exec(open('/app/scripts/seed_past_enrollments_and_grades.py', encoding='utf-8').read())"
"""
import random
from decimal import Decimal

from django.db import transaction

from apps.classes.models import ClassSection
from apps.curriculums.models import Curriculum, CurriculumCourse
from apps.grades.models import Grade
from apps.profiles.models import StudentProfile
from apps.registrations.models import Registration
from apps.semesters.models import Semester

random.seed(42)


PLAN = [
    ("2024-2025-HK1", 1),
    ("2024-2025-HK2", 2),
    ("2025-2026-HK1", 3),
    ("2025-2026-HK2", 4),
]
MAX_COURSES_PER_SEM = 5


def random_score(seed: int) -> tuple[float, float, float]:
    rng = random.Random(seed)
    weak = (seed % 100) < 10  # ~10% rớt
    if weak:
        mid = rng.uniform(3.5, 5.5)
    else:
        mid = rng.uniform(5.5, 9.5)
    final = max(0.0, min(10.0, mid + rng.uniform(-0.7, 0.7)))
    process = max(0.0, min(10.0, mid + rng.uniform(-1.0, 1.5)))
    return round(process, 2), round(mid, 2), round(final, 2)


def get_curriculum(student: StudentProfile) -> Curriculum | None:
    cur = Curriculum.objects.filter(
        major=student.major, cohort_year=student.enrollment_year, is_active=True,
    ).first()
    if cur:
        return cur
    return Curriculum.objects.filter(major=student.major, is_active=True).order_by("-cohort_year").first()


def has_schedule_conflict(student: StudentProfile, candidate: ClassSection, semester: Semester) -> bool:
    new_s = list(candidate.schedules.all())
    if not new_s:
        return False
    qs = Registration.objects.filter(
        student=student, semester=semester, status=Registration.Status.CONFIRMED,
    ).prefetch_related("class_section__schedules")
    for reg in qs:
        for a in new_s:
            for b in reg.class_section.schedules.all():
                if (
                    a.weekday == b.weekday
                    and a.start_period <= b.end_period
                    and b.start_period <= a.end_period
                ):
                    return True
    return False


@transaction.atomic
def enroll_one(student: StudentProfile, semester: Semester, suggested_semester: int):
    """Enroll student vào ≤ MAX_COURSES_PER_SEM lớp + tạo Grade."""
    curriculum = get_curriculum(student)
    if not curriculum:
        return 0

    cc_list = list(
        curriculum.curriculum_courses.filter(suggested_semester=suggested_semester)
        .select_related("course")
    )
    random.Random(student.id * 17 + suggested_semester * 53).shuffle(cc_list)

    enrolled = 0
    for cc in cc_list:
        if enrolled >= MAX_COURSES_PER_SEM:
            break
        if Registration.objects.filter(
            student=student, semester=semester, class_section__course=cc.course,
        ).exists():
            continue

        candidates = list(
            ClassSection.objects.filter(
                course=cc.course,
                semester=semester,
                status__in=[ClassSection.Status.OPEN, ClassSection.Status.CLOSED],
            )
            .prefetch_related("schedules")
        )
        if not candidates:
            continue

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
            student=student, class_section=chosen, semester=semester,
            status=Registration.Status.CONFIRMED,
        )

        seed = student.id * 31 + cc.course.id * 7 + suggested_semester
        p, m, f = random_score(seed)
        Grade.objects.create(
            registration=reg,
            process_score=Decimal(str(p)),
            midterm_score=Decimal(str(m)),
            final_score=Decimal(str(f)),
        )
        enrolled += 1
    return enrolled


def main():
    print("=" * 70)
    print("Seed past-semester enrollments + grades")
    print("=" * 70)

    semesters = {}
    for code, ss in PLAN:
        sem = Semester.objects.filter(code=code).first()
        if sem:
            semesters[ss] = sem
        else:
            print(f"⚠ Không tìm thấy HK {code}")

    students = list(StudentProfile.objects.all())
    print(f"Tổng SV: {len(students)}")

    total_regs = 0
    total_grades = 0
    for idx, student in enumerate(students, 1):
        student_total = 0
        for ss, sem in semesters.items():
            n = enroll_one(student, sem, ss)
            student_total += n
            total_regs += n
            total_grades += n  # mỗi reg có 1 grade
        if idx % 20 == 0:
            print(f"  ... {idx}/{len(students)} SV (avg {student_total} lớp/SV)")

    print()
    print(f"✓ Tạo {total_regs} registrations + {total_grades} grades")
    print(f"Stats: tổng reg = {Registration.objects.filter(status='CONFIRMED').count()}")
    print(f"       tổng grade = {Grade.objects.filter(total_score__isnull=False).count()}")


main()
