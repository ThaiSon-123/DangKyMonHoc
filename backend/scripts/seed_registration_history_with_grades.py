"""Seed registration history and grades for one demo student per major.

Run inside Docker backend container:
python manage.py shell -c "exec(open('/app/scripts/seed_registration_history_with_grades.py', encoding='utf-8').read())"
"""

from datetime import timedelta
from decimal import Decimal

from django.db import transaction

from apps.classes.models import ClassSection
from apps.curriculums.models import Curriculum
from apps.grades.models import Grade
from apps.profiles.models import StudentProfile
from apps.registrations.models import Registration


STUDENT_BY_MAJOR = {
    "CNOTO": "2424801030030",
    "KTPM": "2425801030030",
    "QTKD": "2422801030030",
    "SPTH": "2425801040030",
    "TNMT": "2423801030030",
}

SEMESTER_BY_SUGGESTED = {
    1: "2024-2025-HK1",
    2: "2024-2025-HK2",
    3: "2025-2026-HK1",
    4: "2025-2026-HK2",
}

EXCLUDED_SEMESTERS = {"2026-2027-HK1"}


def score(seed: int, offset: int) -> Decimal:
    value = Decimal("5.00") + (Decimal((seed * 37 + offset * 19) % 501) / Decimal("100"))
    return value.quantize(Decimal("0.01"))


def choose_class_section(
    curriculum: Curriculum,
    course_id: int,
    semester_code: str,
    index: int,
    used_teacher_ids: set[int],
) -> ClassSection:
    sections = list(
        ClassSection.objects.filter(
            course_id=course_id,
            semester__code=semester_code,
        )
        .filter(note__contains=curriculum.code)
        .select_related("semester", "teacher")
        .order_by("teacher__teacher_code", "code")
    )
    if not sections:
        sections = list(
            ClassSection.objects.filter(
                course_id=course_id,
                semester__code=semester_code,
            )
            .select_related("semester", "teacher")
            .order_by("teacher__teacher_code", "code")
        )
    if not sections:
        raise RuntimeError(
            f"Không tìm thấy lớp học phần cho {curriculum.code}, course_id={course_id}, kỳ {semester_code}."
        )
    for section in sections:
        if section.teacher_id and section.teacher_id not in used_teacher_ids:
            return section
    return sections[index % len(sections)]


def registered_time(class_section: ClassSection, index: int):
    semester = class_section.semester
    if semester.registration_start:
        return semester.registration_start + timedelta(hours=index % 24)
    return None


def seed_history() -> tuple[int, int, list[str]]:
    created_registrations = 0
    updated_registrations = 0
    messages = []
    used_teacher_ids = set()

    for major_index, (major_code, student_code) in enumerate(STUDENT_BY_MAJOR.items(), start=1):
        student = StudentProfile.objects.select_related("major", "user").get(
            student_code=student_code,
            major__code=major_code,
        )
        curriculum = (
            Curriculum.objects.filter(major=student.major, is_active=True)
            .order_by("-cohort_year", "code")
            .first()
        )
        if not curriculum:
            raise RuntimeError(f"Không tìm thấy chương trình đào tạo active cho ngành {major_code}.")

        links = list(
            curriculum.curriculum_courses.filter(
                suggested_semester__in=SEMESTER_BY_SUGGESTED,
            )
            .select_related("course")
            .order_by("suggested_semester", "course__code")
        )
        major_created = 0
        major_updated = 0

        for index, link in enumerate(links, start=1):
            semester_code = SEMESTER_BY_SUGGESTED[link.suggested_semester]
            if semester_code in EXCLUDED_SEMESTERS:
                continue

            class_section = choose_class_section(
                curriculum=curriculum,
                course_id=link.course_id,
                semester_code=semester_code,
                index=index + major_index,
                used_teacher_ids=used_teacher_ids,
            )
            registration, was_created = Registration.objects.update_or_create(
                student=student,
                class_section=class_section,
                defaults={
                    "semester": class_section.semester,
                    "status": Registration.Status.CONFIRMED,
                    "cancelled_at": None,
                    "cancel_reason": "",
                },
            )
            registered_at = registered_time(class_section, index)
            if registered_at:
                Registration.objects.filter(pk=registration.pk).update(registered_at=registered_at)

            Grade.objects.update_or_create(
                registration=registration,
                defaults={
                    "process_score": score(index + major_index, 0),
                    "midterm_score": score(index + major_index, 1),
                    "final_score": score(index + major_index, 2),
                    "note": "Seed lịch sử đăng ký.",
                },
            )

            if was_created:
                created_registrations += 1
                major_created += 1
            else:
                updated_registrations += 1
                major_updated += 1
            if class_section.teacher_id:
                used_teacher_ids.add(class_section.teacher_id)

        messages.append(
            f"{major_code} ({student_code}): +{major_created} created, {major_updated} updated"
        )

    return created_registrations, updated_registrations, messages


def clear_existing_history():
    return Registration.objects.filter(
        student__student_code__in=STUDENT_BY_MAJOR.values(),
        semester__code__in=SEMESTER_BY_SUGGESTED.values(),
    ).delete()


with transaction.atomic():
    deleted = clear_existing_history()
    created, updated, summary = seed_history()

print(f"Registration history seeded: +{created} created, {updated} updated")
print("Cleared existing history:", deleted)
print("Included semesters:", ", ".join(SEMESTER_BY_SUGGESTED.values()))
print("Excluded semesters:", ", ".join(sorted(EXCLUDED_SEMESTERS)))
for line in summary:
    print("-", line)
