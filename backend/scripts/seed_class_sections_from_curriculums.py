"""Seed class sections from active curriculums for demo semesters.

Rule:
- 2024-2025-HK1 uses curriculum suggested_semester=1
- 2024-2025-HK2 uses curriculum suggested_semester=2
- 2025-2026-HK1 uses curriculum suggested_semester=3
- 2025-2026-HK2 uses curriculum suggested_semester=4
- 2026-2027-HK1 uses curriculum suggested_semester=1..6
- Each curriculum course gets 2-5 class sections in that mapped semester.
- Each offered course uses 2-5 distinct teachers from the major department.
- Each class section has 5 periods per session.
- Study duration is credits * 3 weeks. If that exceeds the semester length,
  the date range is capped to the full semester.

Run inside Docker backend container:
python manage.py shell -c "exec(open('/app/scripts/seed_class_sections_from_curriculums.py', encoding='utf-8').read())"
"""

from collections import defaultdict
from datetime import timedelta

from django.db import transaction

from apps.classes.models import ClassSection, Schedule
from apps.curriculums.models import Curriculum, CurriculumCourse
from apps.profiles.models import TeacherProfile
from apps.semesters.models import Semester


SEMESTER_MAP = {
    "2024-2025-HK1": (1,),
    "2024-2025-HK2": (2,),
    "2025-2026-HK1": (3,),
    "2025-2026-HK2": (4,),
    "2026-2027-HK1": (1, 2, 3, 4, 5, 6),
}

SLOT_OPTIONS = [
    (0, Schedule.Session.MORNING, 1),
    (0, Schedule.Session.AFTERNOON, 6),
    (0, Schedule.Session.EVENING, 11),
    (1, Schedule.Session.MORNING, 1),
    (1, Schedule.Session.AFTERNOON, 6),
    (1, Schedule.Session.EVENING, 11),
    (2, Schedule.Session.MORNING, 1),
    (2, Schedule.Session.AFTERNOON, 6),
    (2, Schedule.Session.EVENING, 11),
    (3, Schedule.Session.MORNING, 1),
    (3, Schedule.Session.AFTERNOON, 6),
    (3, Schedule.Session.EVENING, 11),
    (4, Schedule.Session.MORNING, 1),
    (4, Schedule.Session.AFTERNOON, 6),
    (4, Schedule.Session.EVENING, 11),
    (5, Schedule.Session.MORNING, 1),
    (5, Schedule.Session.AFTERNOON, 6),
    (5, Schedule.Session.EVENING, 11),
    (6, Schedule.Session.MORNING, 1),
    (6, Schedule.Session.AFTERNOON, 6),
    (6, Schedule.Session.EVENING, 11),
]


def section_count(curriculum_course: CurriculumCourse, semester: Semester) -> int:
    return 2 + ((curriculum_course.course_id + curriculum_course.curriculum_id + semester.term) % 4)


def compact_academic_year(value: str) -> str:
    left, right = value.split("-")
    return f"{left[-2:]}{right[-2:]}"


def class_code(curriculum: Curriculum, course_id: int, semester: Semester, index: int) -> str:
    year = compact_academic_year(semester.academic_year)
    return f"{year}H{semester.term}-M{curriculum.major_id}C{course_id}-{index:02d}"


def ranges_overlap(left_start, left_end, right_start, right_end) -> bool:
    return left_start <= right_end and right_start <= left_end


def class_date_range(semester: Semester, credits: int, offset_weeks: int):
    duration_days = max(1, credits * 3 * 7)
    semester_days = (semester.end_date - semester.start_date).days + 1
    if duration_days >= semester_days:
        return semester.start_date, semester.end_date

    max_offset_weeks = (semester_days - duration_days) // 7
    offset_weeks = offset_weeks % (max_offset_weeks + 1)
    start_date = semester.start_date + timedelta(days=offset_weeks * 7)
    end_date = start_date + timedelta(days=duration_days - 1)
    return start_date, end_date


def choose_slot_and_dates(
    teacher_id: int,
    semester: Semester,
    credits: int,
    seed: int,
    occupied_teacher: dict[int, list[tuple[int, int, int, object, object]]],
) -> tuple[int, str, int, object, object]:
    semester_days = (semester.end_date - semester.start_date).days + 1
    duration_days = max(1, credits * 3 * 7)
    max_offset_weeks = max(0, (semester_days - min(duration_days, semester_days)) // 7)
    total_date_attempts = max_offset_weeks + 1
    teacher_entries = occupied_teacher[teacher_id]

    for date_offset in range(total_date_attempts):
        start_date, end_date = class_date_range(semester, credits, seed + date_offset)
        for slot_offset in range(len(SLOT_OPTIONS)):
            weekday, session, start_period = SLOT_OPTIONS[(seed + slot_offset) % len(SLOT_OPTIONS)]
            end_period = start_period + 4
            conflict = any(
                entry_weekday == weekday
                and start_period <= entry_end_period
                and entry_start_period <= end_period
                and ranges_overlap(start_date, end_date, entry_start_date, entry_end_date)
                for (
                    entry_weekday,
                    entry_start_period,
                    entry_end_period,
                    entry_start_date,
                    entry_end_date,
                ) in teacher_entries
            )
            if not conflict:
                teacher_entries.append((weekday, start_period, end_period, start_date, end_date))
                return weekday, session, start_period, start_date, end_date

    # Fallback should be rare; keep deterministic so the seed script remains stable.
    start_date, end_date = class_date_range(semester, credits, seed)
    weekday, session, start_period = SLOT_OPTIONS[seed % len(SLOT_OPTIONS)]
    teacher_entries.append((weekday, start_period, start_period + 4, start_date, end_date))
    return weekday, session, start_period, start_date, end_date


def room_prefix(department: str) -> str:
    prefix = {
        "Công nghệ số": "CNS",
        "Kinh tế": "KT",
        "Kỹ thuật công nghệ": "KTCN",
        "Quản lý nhà nước": "QLNN",
        "Sư phạm": "SP",
    }.get(department, "A")
    return prefix


def choose_room(
    department: str,
    weekday: int,
    start_period: int,
    end_period: int,
    start_date,
    end_date,
    seed: int,
    occupied_rooms: dict[str, list[tuple[int, int, int, object, object]]],
) -> str:
    prefix = room_prefix(department)
    for offset in range(120):
        room = f"{prefix}-{((seed + offset) % 120) + 1:03d}"
        room_entries = occupied_rooms[room]
        conflict = any(
            entry_weekday == weekday
            and start_period <= entry_end_period
            and entry_start_period <= end_period
            and ranges_overlap(start_date, end_date, entry_start_date, entry_end_date)
            for (
                entry_weekday,
                entry_start_period,
                entry_end_period,
                entry_start_date,
                entry_end_date,
            ) in room_entries
        )
        if not conflict:
            room_entries.append((weekday, start_period, end_period, start_date, end_date))
            return room
    room = f"{prefix}-{(seed % 120) + 1:03d}"
    occupied_rooms[room].append((weekday, start_period, end_period, start_date, end_date))
    return room


def teacher_pool_by_department() -> dict[str, list[TeacherProfile]]:
    pools: dict[str, list[TeacherProfile]] = defaultdict(list)
    teachers = TeacherProfile.objects.filter(user__username__startswith="gv").select_related("user").order_by("teacher_code")
    for teacher in teachers:
        pools[teacher.department].append(teacher)
    return pools


def seed():
    semesters = {
        semester.code: semester
        for semester in Semester.objects.filter(code__in=SEMESTER_MAP.keys()).order_by("code")
    }
    missing_semesters = sorted(set(SEMESTER_MAP) - set(semesters))
    if missing_semesters:
        raise RuntimeError(f"Thiếu học kỳ: {', '.join(missing_semesters)}")

    teacher_pools = teacher_pool_by_department()
    created = 0
    updated = 0
    schedules_written = 0
    occupied_teacher: dict[int, list[tuple[int, int, int, object, object]]] = defaultdict(list)
    occupied_rooms: dict[str, list[tuple[int, int, int, object, object]]] = defaultdict(list)
    summary: dict[str, int] = defaultdict(int)

    curriculums = Curriculum.objects.filter(is_active=True).select_related("major").order_by("code")
    for curriculum in curriculums:
        department = curriculum.major.department
        teachers = teacher_pools.get(department, [])
        if len(teachers) < 2:
            raise RuntimeError(f"Khoa {department} cần ít nhất 2 giáo viên seed.")

        for semester_code, suggested_values in SEMESTER_MAP.items():
            semester = semesters[semester_code]
            links = (
                CurriculumCourse.objects.filter(
                    curriculum=curriculum,
                    suggested_semester__in=suggested_values,
                )
                .select_related("course")
                .order_by("suggested_semester", "course__code")
            )
            for link in links:
                count = min(section_count(link, semester), len(teachers), 5)
                teacher_start = (link.course_id + semester.term + curriculum.major_id) % len(teachers)
                for number in range(1, count + 1):
                    teacher = teachers[(teacher_start + number - 1) % len(teachers)]
                    code = class_code(curriculum, link.course_id, semester, number)
                    cs, was_created = ClassSection.objects.update_or_create(
                        code=code,
                        defaults={
                            "course": link.course,
                            "semester": semester,
                            "teacher": teacher,
                            "periods_per_session": 5,
                            "max_students": 45 + ((link.course_id + number) % 4) * 5,
                            "status": ClassSection.Status.OPEN,
                            "note": (
                                f"Seed từ {curriculum.code}, "
                                f"học kỳ gợi ý {link.suggested_semester}."
                            ),
                        },
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1

                    Schedule.objects.filter(class_section=cs).delete()
                    weekday, session, start_period, start_date, end_date = choose_slot_and_dates(
                        teacher.id,
                        semester,
                        link.course.credits,
                        link.course_id + curriculum.major_id + number,
                        occupied_teacher,
                    )
                    room = choose_room(
                        department,
                        weekday,
                        start_period,
                        start_period + 4,
                        start_date,
                        end_date,
                        link.course_id + curriculum.major_id + number,
                        occupied_rooms,
                    )
                    Schedule.objects.create(
                        class_section=cs,
                        weekday=weekday,
                        session=session,
                        start_period=start_period,
                        room=room,
                        start_date=start_date,
                        end_date=end_date,
                    )
                    schedules_written += 1
                    summary[semester.code] += 1

    return created, updated, schedules_written, summary


with transaction.atomic():
    created_count, updated_count, schedule_count, by_semester = seed()

print(f"Class sections: +{created_count} created, {updated_count} updated")
print(f"Schedules written: {schedule_count}")
print("Class sections by semester:")
for code in sorted(by_semester):
    print(f"- {code}: {by_semester[code]}")
