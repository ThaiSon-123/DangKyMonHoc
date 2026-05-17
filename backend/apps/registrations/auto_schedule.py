"""TKB tự động (FR-STU-TKB): Backtracking + MRV trên CSP.

Variables: các môn SV chọn
Domain:    list ClassSection của mỗi môn (status=OPEN, semester đúng, chưa đầy, hợp CTĐT)
Hard:      BR-002 (prereq), BR-003 (HK đang mở), BR-004 (không trùng lịch),
           BR-005 (lớp chưa đầy), CTĐT match, môn chưa học (no grade)
Soft:      4 sub-scores → weighted score [0, 100] theo preset
Reference: Russell & Norvig, AI: A Modern Approach, Ch.6 Constraint Satisfaction
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from django.conf import settings
from django.db.models import F, Prefetch, Q
from django.utils import timezone

from apps.classes.models import ClassSection, Schedule
from apps.courses.models import Course
from apps.curriculums.models import Curriculum
from apps.grades.models import Grade
from apps.registrations.models import Registration


# ───────────────────────── Data classes ─────────────────────────


class PriorityPreset(str, Enum):
    """5 chế độ ưu tiên — quyết định bộ trọng số cho weighted sum.

    AUTO: hệ thống tự tính trọng số dựa trên các tiêu chí SV đã khai báo input.
    """
    BALANCED = "BALANCED"
    TEACHER_FIRST = "TEACHER_FIRST"
    SESSION_FIRST = "SESSION_FIRST"
    COMPACT_FIRST = "COMPACT_FIRST"
    AUTO = "AUTO"


# (w_weekday, w_session, w_teacher, w_free_day) — tổng = 1.0
# AUTO không có entry — tính động trong Preferences.weights
PRESET_WEIGHTS: dict[PriorityPreset, tuple[float, float, float, float]] = {
    PriorityPreset.BALANCED:       (0.25, 0.25, 0.25, 0.25),
    PriorityPreset.TEACHER_FIRST:  (0.15, 0.15, 0.55, 0.15),
    PriorityPreset.SESSION_FIRST:  (0.15, 0.55, 0.15, 0.15),
    PriorityPreset.COMPACT_FIRST:  (0.15, 0.15, 0.15, 0.55),
}

# Trọng số "filler" cho tiêu chí không được chọn trong AUTO mode
AUTO_FILLER_WEIGHT = 0.15


@dataclass(frozen=True)
class Preferences:
    """Soft constraints + preset + per-course hard filter GV."""
    avoid_weekdays: frozenset[int] = field(default_factory=frozenset)
    preferred_sessions: frozenset[str] = field(default_factory=frozenset)
    preferred_teacher_ids: frozenset[int] = field(default_factory=frozenset)
    preset: PriorityPreset = PriorityPreset.BALANCED
    # Hard filter: course_id → teacher_id
    course_teacher_constraints: dict[int, int] = field(default_factory=dict)

    @property
    def weights(self) -> tuple[float, float, float, float]:
        if self.preset == PriorityPreset.AUTO:
            return self._compute_auto_weights()
        return PRESET_WEIGHTS[self.preset]

    def _compute_auto_weights(self) -> tuple[float, float, float, float]:
        """Tự chia trọng số dựa trên tiêu chí SV khai báo input.

        - Weekday "active" nếu có avoid_weekdays.
        - Session "active" nếu có preferred_sessions.
        - Teacher "active" nếu có preferred_teacher_ids hoặc course_teacher_constraints.
        - Free_day không có UI input → luôn nhận trọng số filler.

        K = số tiêu chí active. Trọng số:
        - K = 0 → balanced (0.25 mỗi).
        - K ≥ 1 → main = (1 − (4−K) × 0.15) / K cho cái active, 0.15 cho cái còn lại.
        """
        active = (
            bool(self.avoid_weekdays),         # weekday
            bool(self.preferred_sessions),     # session
            bool(self.preferred_teacher_ids) or bool(self.course_teacher_constraints),  # teacher
            False,                             # free_day không có input trực tiếp
        )
        k = sum(active)
        if k == 0:
            return (0.25, 0.25, 0.25, 0.25)
        main = (1.0 - (4 - k) * AUTO_FILLER_WEIGHT) / k
        return tuple(main if a else AUTO_FILLER_WEIGHT for a in active)  # type: ignore[return-value]


@dataclass
class Candidate:
    class_sections: list[ClassSection]
    score: float
    breakdown: dict[str, float]
    stats: dict[str, int]


class AutoScheduleError(Exception):
    """Raised khi input không hợp lệ hoặc không có domain."""

    def __init__(self, message: str, details: list[str] | None = None):
        super().__init__(message)
        self.details = details or []


# ───────────────────────── Curriculum / Grade helpers ─────────────────────────


def get_student_curriculum(student) -> Curriculum | None:
    """Tìm CTĐT của SV: ưu tiên match major + cohort, fallback gần nhất."""
    cur = Curriculum.objects.filter(
        major=student.major,
        cohort_year=student.enrollment_year,
        is_active=True,
    ).first()
    if cur:
        return cur
    return (
        Curriculum.objects.filter(
            major=student.major,
            cohort_year__lte=student.enrollment_year,
            is_active=True,
        )
        .order_by("-cohort_year")
        .first()
    )


def get_curriculum_course_ids(student) -> set[int]:
    """Set course_id thuộc CTĐT của SV. Empty nếu SV chưa match CTĐT nào."""
    cur = get_student_curriculum(student)
    if not cur:
        return set()
    return set(cur.curriculum_courses.values_list("course_id", flat=True))


def get_learned_course_ids(student) -> set[int]:
    """Course_id mà SV đã CÓ ĐIỂM (bất kể đậu hay rớt). Dùng để chặn đăng ký lại."""
    qs = (
        Grade.objects.filter(
            registration__student=student,
            total_score__isnull=False,
        )
        .values_list("registration__class_section__course_id", flat=True)
    )
    return set(qs)


def get_passed_course_ids(student) -> set[int]:
    """Course_id mà SV đã PASS (grade ≥ passing). Dùng để kiểm prereq."""
    passing = settings.GRADE_PASSING_SCORE
    qs = (
        Grade.objects.filter(
            registration__student=student,
            registration__status=Registration.Status.CONFIRMED,
            total_score__gte=passing,
        )
        .values_list("registration__class_section__course_id", flat=True)
    )
    return set(qs)


def get_registered_course_ids(student, semester_id: int) -> set[int]:
    """Course_id SV đã đăng ký trong semester (PENDING/CONFIRMED)."""
    active = [Registration.Status.PENDING, Registration.Status.CONFIRMED]
    qs = (
        Registration.objects.filter(
            student=student, semester_id=semester_id, status__in=active,
        )
        .values_list("class_section__course_id", flat=True)
    )
    return set(qs)


def get_existing_schedules(student, semester_id: int) -> list[Schedule]:
    """Schedules của các lớp SV đã đăng ký trong semester.

    Dùng làm `used_schedules` ban đầu cho backtrack → kết quả không trùng
    với lớp đã đăng ký (BR-004).
    """
    active = [Registration.Status.PENDING, Registration.Status.CONFIRMED]
    regs = (
        Registration.objects.filter(
            student=student, semester_id=semester_id, status__in=active,
        )
        .select_related("class_section")
        .prefetch_related(
            Prefetch(
                "class_section__schedules",
                queryset=Schedule.objects.select_related("class_section__course"),
            )
        )
    )
    schedules: list[Schedule] = []
    for r in regs:
        schedules.extend(r.class_section.schedules.all())
    return schedules


def get_missing_prerequisite_codes(course: Course, passed_ids: set[int]) -> list[str]:
    """List code môn tiên quyết SV CHƯA pass."""
    required = list(
        course.prerequisite_links.values_list(
            "required_course_id", "required_course__code"
        )
    )
    return [code for cid, code in required if cid not in passed_ids]


# ───────────────────────── Conflict check ─────────────────────────


def schedules_overlap(a: Schedule, b: Schedule) -> bool:
    """BR-004: cùng weekday + intersect khoảng tiết.

    Đồng logic RegistrationSerializer._schedules_overlap.
    """
    return (
        a.weekday == b.weekday
        and a.start_period <= b.end_period
        and b.start_period <= a.end_period
    )


def _any_conflict(new_schedules: list[Schedule], used: list[Schedule]) -> bool:
    for n in new_schedules:
        for u in used:
            if schedules_overlap(n, u):
                return True
    return False


def _first_overlap(
    left: list[Schedule],
    right: list[Schedule],
) -> tuple[Schedule, Schedule] | None:
    for a in left:
        for b in right:
            if schedules_overlap(a, b):
                return a, b
    return None


def _format_class_section(cs: ClassSection) -> str:
    course = cs.course
    return f"{course.code} - {course.name} ({cs.code})"


def _format_overlap(a: Schedule, b: Schedule) -> str:
    return (
        f"{a.get_weekday_display()} tiết {a.start_period}-{a.end_period} "
        f"trùng tiết {b.start_period}-{b.end_period}"
    )


def _build_no_solution_details(
    courses_ordered: list[Course],
    domains: dict[int, list[ClassSection]],
    schedules_cache: dict[int, list[Schedule]],
    existing_schedules: list[Schedule],
) -> list[str]:
    details: list[str] = []

    for course in courses_ordered:
        blocked_by_existing: list[tuple[ClassSection, Schedule, Schedule]] = []
        for cs in domains[course.id]:
            overlap = _first_overlap(schedules_cache[cs.id], existing_schedules)
            if overlap:
                blocked_by_existing.append((cs, overlap[0], overlap[1]))
        if blocked_by_existing and len(blocked_by_existing) == len(domains[course.id]):
            details.append(
                f"Môn {course.code} - {course.name}: tất cả {len(domains[course.id])} "
                "lớp mở đều trùng với lịch đã đăng ký."
            )
            for cs, new_schedule, existing_schedule in blocked_by_existing[:3]:
                details.append(
                    f"{_format_class_section(cs)} trùng lịch đã đăng ký "
                    f"{_format_class_section(existing_schedule.class_section)}: "
                    f"{_format_overlap(new_schedule, existing_schedule)}."
                )

    for idx, left_course in enumerate(courses_ordered):
        for right_course in courses_ordered[idx + 1:]:
            examples: list[str] = []
            has_compatible_pair = False
            for left_cs in domains[left_course.id]:
                for right_cs in domains[right_course.id]:
                    overlap = _first_overlap(
                        schedules_cache[left_cs.id],
                        schedules_cache[right_cs.id],
                    )
                    if overlap is None:
                        has_compatible_pair = True
                        break
                    if len(examples) < 2:
                        examples.append(
                            f"{_format_class_section(left_cs)} trùng "
                            f"{_format_class_section(right_cs)}: "
                            f"{_format_overlap(overlap[0], overlap[1])}."
                        )
                if has_compatible_pair:
                    break
            if not has_compatible_pair:
                details.append(
                    f"Môn {left_course.code} - {left_course.name} xung đột với "
                    f"môn {right_course.code} - {right_course.name}: mọi cặp lớp mở đều trùng lịch."
                )
                details.extend(examples)

    if not details:
        for course in courses_ordered:
            details.append(
                f"Môn {course.code} - {course.name}: có {len(domains[course.id])} "
                "lớp mở, nhưng không ghép được với toàn bộ các môn còn lại/lịch đã đăng ký."
            )

    return details[:12]


# ───────────────────────── Domain builder ─────────────────────────


def build_domain(
    course: Course,
    semester_id: int,
    teacher_id: int | None = None,
) -> list[ClassSection]:
    """Lọc lớp HP khả thi cho 1 môn:
       - đúng semester
       - status=OPEN
       - chưa đầy: enrolled_count < max_students (BR-005)
       - (optional) chỉ GV `teacher_id` dạy (hard constraint)
       - prefetch schedules
    """
    qs = ClassSection.objects.filter(
        course=course,
        semester_id=semester_id,
        status=ClassSection.Status.OPEN,
        enrolled_count__lt=F("max_students"),
    )
    if teacher_id is not None:
        qs = qs.filter(teacher_id=teacher_id)
    return list(qs.select_related("course").prefetch_related("schedules").order_by("code"))


# ───────────────────────── Available courses (FE bước 2) ─────────────────────────


def build_available_courses(
    student,
    semester,
    search: str = "",
    unlearned_only: bool = False,
) -> list[dict]:
    """Trả list dict course để hiển thị ở UI chọn môn.

    Hard filter: thuộc CTĐT + có lớp HP OPEN còn slot trong semester.
    """
    curriculum_ids = get_curriculum_course_ids(student)
    if not curriculum_ids:
        return []  # SV chưa match CTĐT → list rỗng

    learned_ids = get_learned_course_ids(student)
    passed_ids = get_passed_course_ids(student)
    registered_ids = get_registered_course_ids(student, semester.id)

    # Lấy tất cả ClassSection OPEN còn slot của semester
    cs_qs = (
        ClassSection.objects.filter(
            semester=semester,
            status=ClassSection.Status.OPEN,
            enrolled_count__lt=F("max_students"),
            course_id__in=curriculum_ids,
        )
        .select_related("course", "teacher__user")
        .prefetch_related("schedules")
        .order_by("course__code", "code")
    )

    if search:
        term = search.strip()
        cs_qs = cs_qs.filter(
            Q(course__code__icontains=term)
            | Q(course__name__icontains=term)
            | Q(code__icontains=term)
            | Q(teacher__user__last_name__icontains=term)
            | Q(teacher__user__first_name__icontains=term)
            | Q(teacher__user__username__icontains=term)
        )

    # Group theo course → teacher
    by_course: dict[int, dict] = {}
    for cs in cs_qs:
        course = cs.course
        if unlearned_only and course.id in learned_ids:
            continue
        entry = by_course.get(course.id)
        if entry is None:
            entry = {
                "course_id": course.id,
                "course_code": course.code,
                "course_name": course.name,
                "credits": course.credits,
                "has_grade": course.id in learned_ids,
                "passed": course.id in passed_ids,
                "missing_prerequisites": get_missing_prerequisite_codes(course, passed_ids),
                "registered": course.id in registered_ids,
                "teachers": {},  # teacher_id → entry
            }
            by_course[course.id] = entry
        teacher_id = cs.teacher_id
        teacher_entry = entry["teachers"].get(teacher_id)
        if teacher_entry is None:
            if cs.teacher:
                teacher_name = cs.teacher.user.get_full_name() or cs.teacher.user.username
            else:
                teacher_name = None
            teacher_entry = {
                "teacher_id": teacher_id,
                "teacher_name": teacher_name,
                "class_sections": [],
            }
            entry["teachers"][teacher_id] = teacher_entry
        teacher_entry["class_sections"].append(cs)

    # Convert teachers dict → list
    result: list[dict] = []
    for entry in by_course.values():
        entry["teachers"] = list(entry["teachers"].values())
        result.append(entry)
    return result


# ───────────────────────── Backtracking + Forward Checking ─────────────────────────


def _backtrack(
    courses_ordered: list[Course],
    domains: dict[int, list[ClassSection]],
    schedules_cache: dict[int, list[Schedule]],
    idx: int,
    selected: list[ClassSection],
    used_schedules: list[Schedule],
    feasible: list[list[ClassSection]],
    max_results: int,
) -> None:
    if len(feasible) >= max_results:
        return
    if idx == len(courses_ordered):
        feasible.append(list(selected))
        return

    course = courses_ordered[idx]
    for cs in domains[course.id]:
        cs_schedules = schedules_cache[cs.id]
        if _any_conflict(cs_schedules, used_schedules):
            continue
        selected.append(cs)
        used_schedules.extend(cs_schedules)
        _backtrack(
            courses_ordered, domains, schedules_cache, idx + 1,
            selected, used_schedules, feasible, max_results,
        )
        selected.pop()
        for _ in cs_schedules:
            used_schedules.pop()


# ───────────────────────── Scoring ─────────────────────────


def _score_weekday(schedules: list[Schedule], avoid: frozenset[int]) -> float:
    if not schedules or not avoid:
        return 100.0
    hits = sum(1 for s in schedules if s.weekday in avoid)
    return 100.0 * (1.0 - hits / len(schedules))


def _score_session(schedules: list[Schedule], preferred: frozenset[str]) -> float:
    if not preferred or not schedules:
        return 100.0
    hits = sum(1 for s in schedules if s.session in preferred)
    return 100.0 * hits / len(schedules)


def _score_teacher(
    class_sections: list[ClassSection], preferred: frozenset[int]
) -> float:
    if not preferred or not class_sections:
        return 100.0
    hits = sum(
        1 for cs in class_sections
        if cs.teacher_id is not None and cs.teacher_id in preferred
    )
    return 100.0 * hits / len(class_sections)


def _compute_study_days(schedules: list[Schedule]) -> int:
    """Số ngày trong tuần có ít nhất 1 buổi học."""
    return len({s.weekday for s in schedules})


def _score_free_day(schedules: list[Schedule]) -> tuple[float, int, int]:
    """100 × (7 − study_days) / 7. Return (score, study_days, free_days)."""
    study = _compute_study_days(schedules)
    free = 7 - study
    return 100.0 * free / 7, study, free


def score_assignment(
    class_sections: list[ClassSection],
    schedules_cache: dict[int, list[Schedule]],
    prefs: Preferences,
) -> tuple[float, dict[str, float], dict[str, int]]:
    """Return (total, breakdown, stats)."""
    schedules = [s for cs in class_sections for s in schedules_cache[cs.id]]

    s_weekday = _score_weekday(schedules, prefs.avoid_weekdays)
    s_session = _score_session(schedules, prefs.preferred_sessions)
    s_teacher = _score_teacher(class_sections, prefs.preferred_teacher_ids)
    s_free_day, study_days, free_days = _score_free_day(schedules)

    w_weekday, w_session, w_teacher, w_free_day = prefs.weights
    total = (
        w_weekday * s_weekday
        + w_session * s_session
        + w_teacher * s_teacher
        + w_free_day * s_free_day
    )

    breakdown = {
        "weekday": round(s_weekday, 2),
        "session": round(s_session, 2),
        "teacher": round(s_teacher, 2),
        "free_day": round(s_free_day, 2),
        "total": round(total, 2),
    }
    stats = {"study_days": study_days, "free_days": free_days}
    return total, breakdown, stats


# ───────────────────────── Public entry point ─────────────────────────


def suggest_schedules(
    student,
    semester,
    course_ids: list[int],
    prefs: Preferences,
    max_results: int = 50,
) -> list[Candidate]:
    """Trả list Candidate sort desc theo score.

    Hard constraints:
      1. Semester đang trong cửa sổ đăng ký (BR-003).
      2. Mọi course tồn tại, thuộc CTĐT của SV.
      3. Mọi course chưa có grade (chưa học rồi).
      4. Tiên quyết đầy đủ (BR-002).
      5. Mỗi course có ít nhất 1 lớp OPEN, chưa đầy.
      6. Không trùng lịch giữa các lớp (BR-004) + không trùng với lớp đã đăng ký.
    """
    # 1. Cửa sổ đăng ký:
    #    - is_open=False → vẫn chặn (HK chưa thiết lập).
    #    - Quá registration_end → chặn (đã đóng đăng ký, vô nghĩa khi tính).
    #    - now < registration_start (sắp mở) → CHO phép tính phương án trước,
    #      chỉ block khi user bấm "Áp dụng" (RegistrationSerializer.BR-003).
    if not semester.is_open:
        raise AutoScheduleError("Học kỳ chưa được mở.")
    now = timezone.now()
    if semester.registration_end and now > semester.registration_end:
        raise AutoScheduleError(
            f"Đã quá thời gian đăng ký ({semester.registration_end:%Y-%m-%d %H:%M})."
        )

    # 2. Lấy courses + check tồn tại
    courses = list(Course.objects.filter(id__in=course_ids))
    if len(courses) != len(course_ids):
        missing = set(course_ids) - {c.id for c in courses}
        raise AutoScheduleError(f"Môn không tồn tại: {sorted(missing)}")

    # 3. Check thuộc CTĐT
    curriculum_ids = get_curriculum_course_ids(student)
    if not curriculum_ids:
        raise AutoScheduleError(
            "Bạn chưa được gán Chương trình đào tạo. Liên hệ phòng đào tạo."
        )
    for c in courses:
        if c.id not in curriculum_ids:
            raise AutoScheduleError(
                f"Môn {c.code} không thuộc Chương trình đào tạo của bạn."
            )

    # 4. Check chưa học (no existing grade)
    learned_ids = get_learned_course_ids(student)
    for c in courses:
        if c.id in learned_ids:
            raise AutoScheduleError(f"Môn {c.code} đã học rồi.")

    # 5. Check prerequisites (BR-002)
    passed_ids = get_passed_course_ids(student)
    for c in courses:
        missing = get_missing_prerequisite_codes(c, passed_ids)
        if missing:
            raise AutoScheduleError(
                f"Môn {c.code} thiếu tiên quyết: {', '.join(missing)}"
            )

    # 6. Build domains (BR-005 + per-course teacher hard filter)
    domains: dict[int, list[ClassSection]] = {}
    schedules_cache: dict[int, list[Schedule]] = {}
    for c in courses:
        teacher_constraint = prefs.course_teacher_constraints.get(c.id)
        domain = build_domain(c, semester.id, teacher_id=teacher_constraint)
        if not domain:
            if teacher_constraint is not None:
                raise AutoScheduleError(
                    f"Môn {c.code}: GV được chọn không có lớp HP đang mở "
                    "(hoặc lớp đó đã đầy)."
                )
            raise AutoScheduleError(
                f"Môn {c.code} không có lớp HP phù hợp (status=OPEN, chưa đầy)."
            )
        domains[c.id] = domain
        for cs in domain:
            schedules_cache[cs.id] = list(cs.schedules.all())

    # 7. Init used_schedules = lịch các lớp SV đã đăng ký
    existing_schedules = get_existing_schedules(student, semester.id)

    # 8. MRV: sort courses theo |domain| asc
    courses_ordered = sorted(courses, key=lambda c: len(domains[c.id]))

    # 9. Backtracking
    feasible: list[list[ClassSection]] = []
    _backtrack(
        courses_ordered=courses_ordered,
        domains=domains,
        schedules_cache=schedules_cache,
        idx=0,
        selected=[],
        used_schedules=list(existing_schedules),  # start from existing
        feasible=feasible,
        max_results=max_results,
    )
    if not feasible:
        raise AutoScheduleError(
            "Không tìm được phương án TKB khả thi vì các lớp học phần bị xung đột lịch.",
            details=_build_no_solution_details(
                courses_ordered=courses_ordered,
                domains=domains,
                schedules_cache=schedules_cache,
                existing_schedules=existing_schedules,
            ),
        )

    # 10. Score + sort
    candidates: list[Candidate] = []
    for assignment in feasible:
        total, breakdown, stats = score_assignment(assignment, schedules_cache, prefs)
        candidates.append(
            Candidate(class_sections=assignment, score=total, breakdown=breakdown, stats=stats)
        )
    candidates.sort(key=lambda c: c.score, reverse=True)
    return candidates
