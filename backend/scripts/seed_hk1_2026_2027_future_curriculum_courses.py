"""Seed future curriculum courses into 2026-2027-HK1 only.

The requested real-time range HK1 2026-2027 to HK2 2027-2028 maps to
suggested semesters 5-8 for the active 2024 curriculums. All generated
class sections are placed in semester 2026-2027-HK1.

Rules:
- Skip any curriculum/course group that already has 2-5 sections in 2026-2027-HK1.
- Add missing groups up to a deterministic target of 2-5 sections.
- Use 2-5 distinct teachers for each generated group when the department has enough teachers.
- Every class section has 5 periods per session.
- Study duration is credits * 3 weeks.
- Use only periods 1-5 or 6-10.

Run inside Docker backend container:
python manage.py shell -c "exec(open('/app/scripts/seed_hk1_2026_2027_future_curriculum_courses.py', encoding='utf-8').read())"
"""

from collections import defaultdict
from datetime import timedelta

from django.db import transaction

from apps.classes.models import ClassSection, Schedule
from apps.curriculums.models import Curriculum, CurriculumCourse
from apps.profiles.models import TeacherProfile
from apps.semesters.models import Semester


TARGET_SEMESTER_CODE = "2026-2027-HK1"
TARGET_SUGGESTED_SEMESTERS = (5, 6, 7, 8)

DAYTIME_SLOTS = [
    (0, Schedule.Session.MORNING, 1),
    (0, Schedule.Session.AFTERNOON, 6),
    (1, Schedule.Session.MORNING, 1),
    (1, Schedule.Session.AFTERNOON, 6),
    (2, Schedule.Session.MORNING, 1),
    (2, Schedule.Session.AFTERNOON, 6),
    (3, Schedule.Session.MORNING, 1),
    (3, Schedule.Session.AFTERNOON, 6),
    (4, Schedule.Session.MORNING, 1),
    (4, Schedule.Session.AFTERNOON, 6),
    (5, Schedule.Session.MORNING, 1),
    (5, Schedule.Session.AFTERNOON, 6),
    (6, Schedule.Session.MORNING, 1),
    (6, Schedule.Session.AFTERNOON, 6),
]


def target_section_count(link: CurriculumCourse, semester: Semester) -> int:
    return 2 + ((link.course_id + link.curriculum_id + semester.term) % 4)


def compact_academic_year(value: str) -> str:
    left, right = value.split("-")
    return f"{left[-2:]}{right[-2:]}"


def class_code(curriculum: Curriculum, course_id: int, semester: Semester, index: int) -> str:
    year = compact_academic_year(semester.academic_year)
    return f"{year}H{semester.term}-M{curriculum.major_id}C{course_id}-{index:02d}"


def ranges_overlap(left_start, left_end, right_start, right_end) -> bool:
    return left_start <= right_end and right_start <= left_end


def class_date_range(semester: Semester, credits: int, seed: int):
    duration_days = max(1, credits * 3 * 7)
    semester_days = (semester.end_date - semester.start_date).days + 1
    if duration_days >= semester_days:
        return semester.start_date, semester.end_date

    max_offset_weeks = max(0, (semester_days - duration_days) // 7)
    offset_weeks = seed % (max_offset_weeks + 1)
    start_date = semester.start_date + timedelta(days=offset_weeks * 7)
    end_date = start_date + timedelta(days=duration_days - 1)
    return start_date, end_date


def conflicts(entries, weekday, start_period, end_period, start_date, end_date) -> bool:
    return any(
        entry_weekday == weekday
        and start_period <= entry_end_period
        and entry_start_period <= end_period
        and ranges_overlap(start_date, end_date, entry_start_date, entry_end_date)
        for entry_weekday, entry_start_period, entry_end_period, entry_start_date, entry_end_date in entries
    )


def load_occupancy():
    teacher_entries: dict[int, list[tuple[int, int, int, object, object]]] = defaultdict(list)
    room_entries: dict[str, list[tuple[int, int, int, object, object]]] = defaultdict(list)
    schedules = Schedule.objects.filter(class_section__semester__code=TARGET_SEMESTER_CODE).select_related(
        "class_section",
        "class_section__teacher",
    )
    for schedule in schedules:
        entry = (
            schedule.weekday,
            schedule.start_period,
            schedule.end_period,
            schedule.start_date,
            schedule.end_date,
        )
        if schedule.class_section.teacher_id:
            teacher_entries[schedule.class_section.teacher_id].append(entry)
        if schedule.room:
            room_entries[schedule.room].append(entry)
    return teacher_entries, room_entries


def choose_slot_and_dates(teacher_id, semester, credits, seed, teacher_entries):
    semester_days = (semester.end_date - semester.start_date).days + 1
    duration_days = max(1, credits * 3 * 7)
    max_offset_weeks = max(0, (semester_days - min(duration_days, semester_days)) // 7)

    for date_offset in range(max_offset_weeks + 1):
        start_date, end_date = class_date_range(semester, credits, seed + date_offset)
        for slot_offset in range(len(DAYTIME_SLOTS)):
            weekday, session, start_period = DAYTIME_SLOTS[(seed + slot_offset) % len(DAYTIME_SLOTS)]
            end_period = start_period + 4
            if not conflicts(
                teacher_entries[teacher_id],
                weekday,
                start_period,
                end_period,
                start_date,
                end_date,
            ):
                teacher_entries[teacher_id].append((weekday, start_period, end_period, start_date, end_date))
                return weekday, session, start_period, start_date, end_date

    start_date, end_date = class_date_range(semester, credits, seed)
    weekday, session, start_period = DAYTIME_SLOTS[seed % len(DAYTIME_SLOTS)]
    teacher_entries[teacher_id].append((weekday, start_period, start_period + 4, start_date, end_date))
    return weekday, session, start_period, start_date, end_date


def room_prefix(department: str) -> str:
    return {
        "Công nghệ số": "CNS",
        "Kinh tế": "KT",
        "Kỹ thuật công nghệ": "KTCN",
        "Quản lý nhà nước": "QLNN",
        "Sư phạm": "SP",
    }.get(department, "A")


def choose_room(department, weekday, start_period, end_period, start_date, end_date, seed, room_entries):
    prefix = room_prefix(department)
    for offset in range(200):
        room = f"{prefix}-{((seed + offset) % 200) + 1:03d}"
        if not conflicts(room_entries[room], weekday, start_period, end_period, start_date, end_date):
            room_entries[room].append((weekday, start_period, end_period, start_date, end_date))
            return room

    room = f"{prefix}-{(seed % 200) + 1:03d}"
    room_entries[room].append((weekday, start_period, end_period, start_date, end_date))
    return room


def teacher_pool_by_department() -> dict[str, list[TeacherProfile]]:
    pools: dict[str, list[TeacherProfile]] = defaultdict(list)
    teachers = TeacherProfile.objects.filter(is_active=True).select_related("user").order_by("teacher_code")
    for teacher in teachers:
        pools[teacher.department].append(teacher)
    return pools


def existing_sections(curriculum: Curriculum, course_id: int, semester: Semester):
    return ClassSection.objects.filter(
        course_id=course_id,
        semester=semester,
        note__contains=curriculum.code,
    ).order_by("code")


def seed():
    semester = Semester.objects.get(code=TARGET_SEMESTER_CODE)
    teacher_entries, room_entries = load_occupancy()
    teacher_pools = teacher_pool_by_department()
    created = 0
    schedules_created = 0
    skipped_ready = 0
    skipped_overfull = 0
    by_suggested: dict[int, int] = defaultdict(int)

    curriculums = Curriculum.objects.filter(is_active=True).select_related("major").order_by("code")
    for curriculum in curriculums:
        department = curriculum.major.department
        teachers = teacher_pools.get(department, [])
        if len(teachers) < 2:
            raise RuntimeError(f"Khoa {department} cần ít nhất 2 giáo viên active.")

        links = (
            CurriculumCourse.objects.filter(
                curriculum=curriculum,
                suggested_semester__in=TARGET_SUGGESTED_SEMESTERS,
            )
            .select_related("course")
            .order_by("suggested_semester", "course__code")
        )
        for link in links:
            current_sections = list(existing_sections(curriculum, link.course_id, semester))
            current_count = len(current_sections)
            if 2 <= current_count <= 5:
                skipped_ready += 1
                continue
            if current_count > 5:
                skipped_overfull += 1
                continue

            target_count = min(target_section_count(link, semester), len(teachers), 5)
            teacher_start = (link.course_id + semester.term + curriculum.major_id) % len(teachers)
            used_teacher_ids = {section.teacher_id for section in current_sections if section.teacher_id}

            for number in range(current_count + 1, target_count + 1):
                teacher = None
                for offset in range(len(teachers)):
                    candidate = teachers[(teacher_start + number + offset - 1) % len(teachers)]
                    if candidate.id not in used_teacher_ids:
                        teacher = candidate
                        break
                if teacher is None:
                    teacher = teachers[(teacher_start + number - 1) % len(teachers)]
                used_teacher_ids.add(teacher.id)

                code_index = number
                code = class_code(curriculum, link.course_id, semester, code_index)
                while ClassSection.objects.filter(code=code).exists():
                    code_index += 1
                    code = class_code(curriculum, link.course_id, semester, code_index)

                section = ClassSection.objects.create(
                    code=code,
                    course=link.course,
                    semester=semester,
                    teacher=teacher,
                    periods_per_session=5,
                    max_students=45 + ((link.course_id + code_index) % 4) * 5,
                    status=ClassSection.Status.OPEN if semester.is_open else ClassSection.Status.CLOSED,
                    note=f"Seed từ {curriculum.code}, học kỳ gợi ý {link.suggested_semester}.",
                )
                weekday, session, start_period, start_date, end_date = choose_slot_and_dates(
                    teacher.id,
                    semester,
                    link.course.credits,
                    link.course_id + curriculum.major_id + code_index + link.suggested_semester,
                    teacher_entries,
                )
                room = choose_room(
                    department,
                    weekday,
                    start_period,
                    start_period + 4,
                    start_date,
                    end_date,
                    link.course_id + curriculum.major_id + code_index + link.suggested_semester,
                    room_entries,
                )
                Schedule.objects.create(
                    class_section=section,
                    weekday=weekday,
                    session=session,
                    start_period=start_period,
                    room=room,
                    start_date=start_date,
                    end_date=end_date,
                )
                created += 1
                schedules_created += 1
                by_suggested[link.suggested_semester] += 1

    return created, schedules_created, skipped_ready, skipped_overfull, by_suggested


with transaction.atomic():
    created_count, schedule_count, ready_count, overfull_count, summary = seed()

print(f"Class sections created: {created_count}")
print(f"Schedules created: {schedule_count}")
print(f"Curriculum-course groups already had 2-5 sections: {ready_count}")
print(f"Curriculum-course groups over 5 sections and left unchanged: {overfull_count}")
print("New class sections by suggested semester:")
for suggested_semester in sorted(summary):
    print(f"- {suggested_semester}: {summary[suggested_semester]}")
