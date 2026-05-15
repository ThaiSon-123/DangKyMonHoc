"""Move conflicting registrations to alternate class sections of the same course/semester."""

from django.db import transaction

from apps.classes.models import ClassSection
from apps.classes.models import Schedule
from apps.registrations.models import Registration


STUDENT_CODES = [
    "2424801030030",
    "2425801030030",
    "2422801030030",
    "2425801040030",
    "2423801030030",
]


def overlaps(left_start, left_end, right_start, right_end) -> bool:
    if not left_start or not left_end or not right_start or not right_end:
        return True
    return left_start <= right_end and right_start <= left_end


def period_overlaps(left_start: int, left_end: int, right_start: int, right_end: int) -> bool:
    return left_start <= right_end and right_start <= left_end


def schedule_conflicts(candidate_section: ClassSection, accepted_sections: list[ClassSection]) -> bool:
    candidate_schedules = list(candidate_section.schedules.all())
    for section in accepted_sections:
        for left in candidate_schedules:
            for right in section.schedules.all():
                if left.weekday != right.weekday:
                    continue
                if not overlaps(left.start_date, left.end_date, right.start_date, right.end_date):
                    continue
                if period_overlaps(left.start_period, left.end_period, right.start_period, right.end_period):
                    return True
    return False


def has_evening(section: ClassSection) -> bool:
    return section.schedules.filter(start_period__gte=11).exists() or section.schedules.filter(end_period__gt=10).exists()


def move_section_to_fit(section: ClassSection, accepted_sections: list[ClassSection]):
    schedule = list(section.schedules.all())[0]
    slots = [
        (Schedule.Session.MORNING, 1, section.periods_per_session),
        (Schedule.Session.AFTERNOON, 6, 6 + section.periods_per_session - 1),
    ]
    for weekday in range(7):
        for session, start_period, end_period in slots:
            old_values = (schedule.weekday, schedule.session, schedule.start_period, schedule.end_period)
            schedule.weekday = weekday
            schedule.session = session
            schedule.start_period = start_period
            schedule.end_period = end_period
            if not schedule_conflicts(section, accepted_sections):
                return (schedule.id, weekday, session, start_period)
            schedule.weekday, schedule.session, schedule.start_period, schedule.end_period = old_values
    return None


updates = []
schedule_updates = []

for student_code in STUDENT_CODES:
    registrations = list(
        Registration.objects.filter(student__student_code=student_code)
        .select_related("class_section", "class_section__course", "semester")
        .prefetch_related("class_section__schedules")
        .order_by("semester__code", "class_section__course__code", "class_section__code")
    )
    accepted_sections = []
    used_section_ids = {registration.class_section_id for registration in registrations}

    for registration in registrations:
        current = registration.class_section
        if not schedule_conflicts(current, accepted_sections) and not has_evening(current):
            accepted_sections.append(current)
            continue

        alternatives = (
            ClassSection.objects.filter(
                course=current.course,
                semester=registration.semester,
            )
            .exclude(id__in=used_section_ids)
            .prefetch_related("schedules")
            .order_by("teacher__teacher_code", "code")
        )
        replacement = None
        for section in alternatives:
            if has_evening(section):
                continue
            if not schedule_conflicts(section, accepted_sections):
                replacement = section
                break
        if not replacement:
            schedule_update = move_section_to_fit(current, accepted_sections)
            if not schedule_update:
                raise RuntimeError(
                    f"Không tìm thấy lớp thay thế hoặc khung giờ không trùng lịch cho {student_code}, "
                    f"môn {current.course.code}, kỳ {registration.semester.code}."
                )
            schedule_updates.append((current.code, *schedule_update))
            accepted_sections.append(current)
            continue

        updates.append((registration.id, current.code, replacement.code))
        registration.class_section = replacement
        registration.semester = replacement.semester
        accepted_sections.append(replacement)
        used_section_ids.add(replacement.id)

with transaction.atomic():
    for _, schedule_id, weekday, session, start_period in schedule_updates:
        schedule = Schedule.objects.get(pk=schedule_id)
        schedule.weekday = weekday
        schedule.session = session
        schedule.start_period = start_period
        schedule.save()
    for registration_id, _, replacement_code in updates:
        registration = Registration.objects.get(pk=registration_id)
        registration.class_section = ClassSection.objects.get(code=replacement_code)
        registration.semester = registration.class_section.semester
        registration.save(update_fields=["class_section", "semester"])

print(f"Registration conflicts resolved: {len(updates)}")
print(f"Class schedules adjusted for registration conflicts: {len(schedule_updates)}")
for class_code, _, weekday, session, start_period in schedule_updates:
    print(f"- {class_code}: weekday {weekday}, {session}, start period {start_period}")
for registration_id, old_code, new_code in updates:
    print(f"- registration {registration_id}: {old_code} -> {new_code}")
