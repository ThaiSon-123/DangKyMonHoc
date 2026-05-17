"""Move all evening schedules (periods 11-15) to daytime slots.

Run inside Docker backend container:
python manage.py shell -c "exec(open('/app/scripts/move_evening_schedules_to_daytime.py', encoding='utf-8').read())"
"""

from dataclasses import dataclass

from django.db import transaction

from apps.classes.models import ClassSection
from apps.classes.models import Schedule
from apps.profiles.models import TeacherProfile
from apps.registrations.models import Registration


DAYTIME_SLOTS = [
    (Schedule.Session.MORNING, 1, 5),
    (Schedule.Session.AFTERNOON, 6, 10),
]


@dataclass
class Placement:
    schedule_id: int
    class_section_id: int
    semester_id: int
    teacher_id: int | None
    room: str
    weekday: int
    start_period: int
    end_period: int
    start_date: object
    end_date: object
    student_ids: set[int]


def overlaps(left_start, left_end, right_start, right_end) -> bool:
    if not left_start or not left_end or not right_start or not right_end:
        return True
    return left_start <= right_end and right_start <= left_end


def period_overlaps(left_start: int, left_end: int, right_start: int, right_end: int) -> bool:
    return left_start <= right_end and right_start <= left_end


def has_conflict(candidate: Placement, placements: dict[int, Placement]) -> bool:
    for other in placements.values():
        if other.schedule_id == candidate.schedule_id:
            continue
        if other.semester_id != candidate.semester_id:
            continue
        if other.weekday != candidate.weekday:
            continue
        if not overlaps(candidate.start_date, candidate.end_date, other.start_date, other.end_date):
            continue
        if not period_overlaps(
            candidate.start_period,
            candidate.end_period,
            other.start_period,
            other.end_period,
        ):
            continue
        if other.class_section_id == candidate.class_section_id:
            return True
        if candidate.teacher_id and other.teacher_id == candidate.teacher_id:
            return True
        if candidate.room and other.room and other.room == candidate.room:
            return True
        if candidate.student_ids and candidate.student_ids.intersection(other.student_ids):
            return True
    return False


def candidate_days(original_weekday: int) -> list[int]:
    return [original_weekday] + [weekday for weekday in range(7) if weekday != original_weekday]


def candidate_slots(schedule_id: int):
    slots = DAYTIME_SLOTS if schedule_id % 2 == 0 else list(reversed(DAYTIME_SLOTS))
    return slots


def teacher_options(schedule: Schedule, teachers_by_department: dict[str, list[int]]) -> list[int]:
    current_teacher_id = schedule.class_section.teacher_id
    department = schedule.class_section.teacher.department if schedule.class_section.teacher_id else ""
    candidates = []
    if current_teacher_id:
        candidates.append(current_teacher_id)
    for teacher_id in teachers_by_department.get(department, []):
        if teacher_id not in candidates:
            candidates.append(teacher_id)
    return candidates


schedules = list(
    Schedule.objects.select_related(
        "class_section",
        "class_section__semester",
        "class_section__teacher",
    )
    .all()
    .order_by("class_section__semester__code", "weekday", "start_period", "class_section__code")
)

student_map = {
    schedule_id: set(student_ids)
    for schedule_id, student_ids in (
        (
            schedule.id,
            Registration.objects.filter(
                class_section_id=schedule.class_section_id,
                status__in=[Registration.Status.PENDING, Registration.Status.CONFIRMED],
            ).values_list("student_id", flat=True),
        )
        for schedule in schedules
    )
}

placements = {
    schedule.id: Placement(
        schedule_id=schedule.id,
        class_section_id=schedule.class_section_id,
        semester_id=schedule.class_section.semester_id,
        teacher_id=schedule.class_section.teacher_id,
        room=schedule.room,
        weekday=schedule.weekday,
        start_period=schedule.start_period,
        end_period=schedule.end_period,
        start_date=schedule.start_date,
        end_date=schedule.end_date,
        student_ids=set(student_map[schedule.id]),
    )
    for schedule in schedules
}

rooms = sorted({schedule.room for schedule in schedules if schedule.room})
teachers_by_department = {}
for teacher in TeacherProfile.objects.filter(is_active=True).order_by("teacher_code"):
    teachers_by_department.setdefault(teacher.department, []).append(teacher.id)

targets = [schedule for schedule in schedules if schedule.start_period >= 11 or schedule.end_period > 10]
changes = []

for schedule in targets:
    original = placements[schedule.id]
    chosen = None
    room_options = [original.room] + [room for room in rooms if room != original.room]
    for teacher_id in teacher_options(schedule, teachers_by_department):
        for room in room_options:
            for weekday in candidate_days(original.weekday):
                for session, start_period, end_period in candidate_slots(schedule.id):
                    candidate = Placement(
                        schedule_id=original.schedule_id,
                        class_section_id=original.class_section_id,
                        semester_id=original.semester_id,
                        teacher_id=teacher_id,
                        room=room,
                        weekday=weekday,
                        start_period=start_period,
                        end_period=end_period,
                        start_date=original.start_date,
                        end_date=original.end_date,
                        student_ids=original.student_ids,
                    )
                    if not has_conflict(candidate, placements):
                        chosen = (candidate, session)
                        break
                if chosen:
                    break
            if chosen:
                break
        if chosen:
            break
    if not chosen:
        if original.student_ids:
            raise RuntimeError(
                f"Không tìm được khung 1-5/6-10 không trùng cho lịch đã có đăng ký "
                f"{schedule.id} ({schedule.class_section.code})."
            )
        session, start_period, end_period = candidate_slots(schedule.id)[0]
        chosen = (
            Placement(
                schedule_id=original.schedule_id,
                class_section_id=original.class_section_id,
                semester_id=original.semester_id,
                teacher_id=original.teacher_id,
                room=original.room,
                weekday=original.weekday,
                start_period=start_period,
                end_period=end_period,
                start_date=original.start_date,
                end_date=original.end_date,
                student_ids=original.student_ids,
            ),
            session,
            "forced",
        )
    else:
        chosen = (chosen[0], chosen[1], "checked")

    candidate, session, mode = chosen
    placements[schedule.id] = candidate
    changes.append(
        (
            schedule.id,
            schedule.class_section.code,
            schedule.weekday,
            schedule.start_period,
            schedule.end_period,
            candidate.weekday,
            candidate.start_period,
            candidate.end_period,
            session,
            original.teacher_id,
            original.room,
            candidate.teacher_id,
            candidate.room,
            mode,
        )
    )

with transaction.atomic():
    for schedule_id, _, _, _, _, weekday, start_period, _, session, _, _, teacher_id, room, _ in changes:
        schedule = Schedule.objects.select_related("class_section").get(pk=schedule_id)
        if schedule.class_section.teacher_id != teacher_id:
            ClassSection.objects.filter(pk=schedule.class_section_id).update(teacher_id=teacher_id)
            schedule.class_section.teacher_id = teacher_id
        schedule.room = room
        schedule.weekday = weekday
        schedule.session = session
        schedule.start_period = start_period
        schedule.save()

print(f"Moved schedules: {len(changes)}")
print("Remaining schedules with periods 11-15:", Schedule.objects.filter(start_period__gte=11).count())
print("Remaining schedules ending after period 10:", Schedule.objects.filter(end_period__gt=10).count())
print(
    "Class sections with teacher changed:",
    sum(1 for change in changes if change[9] != change[11]),
)
print("Schedules with room changed:", sum(1 for change in changes if change[10] != change[12]))
print("Schedules moved with conflict-checked placement:", sum(1 for change in changes if change[13] == "checked"))
print("Schedules moved by forced daytime fallback:", sum(1 for change in changes if change[13] == "forced"))
print("Sample changes:")
for change in changes[:10]:
    _, code, old_weekday, old_start, old_end, new_weekday, new_start, new_end, session, _, _, _, _, mode = change
    print(f"- {code}: weekday {old_weekday}, periods {old_start}-{old_end} -> weekday {new_weekday}, periods {new_start}-{new_end}, {session}")
