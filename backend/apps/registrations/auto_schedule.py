"""TKB tự động: Backtracking + Forward Checking trên CSP (BR-002, BR-004, BR-005).

Variables: các môn SV chọn
Domain:    list ClassSection của mỗi môn (status=OPEN, semester đúng, chưa đầy)
Hard:      không trùng lịch (BR-004), không thiếu prereq (BR-002), chưa đầy (BR-005)
Soft:      4 preferences → weighted score [0, 100]

Reuse: RegistrationSerializer._schedules_overlap (apps/registrations/serializers.py:103-109)
Ref:   Russell & Norvig, AI: A Modern Approach, Ch.6 Constraint Satisfaction Problems
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from django.conf import settings
from django.db.models import F

from apps.classes.models import ClassSection, Schedule
from apps.courses.models import Course
from apps.registrations.models import Registration


# ───────────────────────── Data classes ─────────────────────────


class PriorityPreset(str, Enum):
    """4 chế độ ưu tiên — quyết định bộ trọng số cho weighted sum."""
    BALANCED = "BALANCED"
    TEACHER_FIRST = "TEACHER_FIRST"
    SESSION_FIRST = "SESSION_FIRST"
    COMPACT_FIRST = "COMPACT_FIRST"


# Lookup table: preset → (w_weekday, w_session, w_teacher, w_gap), tổng = 1.0
PRESET_WEIGHTS: dict[PriorityPreset, tuple[float, float, float, float]] = {
    PriorityPreset.BALANCED:       (0.25, 0.25, 0.25, 0.25),
    PriorityPreset.TEACHER_FIRST:  (0.15, 0.15, 0.55, 0.15),
    PriorityPreset.SESSION_FIRST:  (0.15, 0.55, 0.15, 0.15),
    PriorityPreset.COMPACT_FIRST:  (0.15, 0.15, 0.15, 0.55),
}


@dataclass(frozen=True)
class Preferences:
    """4 soft constraints + preset trọng số + per-course hard filter GV."""
    avoid_weekdays: frozenset[int] = field(default_factory=frozenset)
    preferred_sessions: frozenset[str] = field(default_factory=frozenset)
    preferred_teacher_ids: frozenset[int] = field(default_factory=frozenset)
    minimize_gaps: bool = True
    preset: PriorityPreset = PriorityPreset.BALANCED
    # Hard filter: map course_id → teacher_id. Nếu set, chỉ giữ lớp HP của môn đó do
    # GV chỉ định dạy. Course không có entry → giữ nguyên domain (chọn "ngẫu nhiên").
    course_teacher_constraints: dict[int, int] = field(default_factory=dict)

    @property
    def weights(self) -> tuple[float, float, float, float]:
        """Trả (w_weekday, w_session, w_teacher, w_gap) dựa preset."""
        return PRESET_WEIGHTS[self.preset]


@dataclass
class Candidate:
    """1 phương án TKB khả thi."""
    class_sections: list[ClassSection]
    score: float
    breakdown: dict[str, float]


# ───────────────────────── Conflict check ─────────────────────────


def _schedules_overlap(a: Schedule, b: Schedule) -> bool:
    """BR-004: cùng weekday + intersect khoảng tiết.

    Logic giống RegistrationSerializer._schedules_overlap (apps/registrations/serializers.py:103-109).
    Tách ra đây để tránh circular import + tránh khởi tạo serializer.
    """
    return (
        a.weekday == b.weekday
        and a.start_period <= b.end_period
        and b.start_period <= a.end_period
    )


def _any_conflict(new_schedules: list[Schedule], used: list[Schedule]) -> bool:
    """O(|new| × |used|) — đủ nhanh vì |used| ≤ ~10 (tối đa 10 môn × ~2 buổi)."""
    for n in new_schedules:
        for u in used:
            if _schedules_overlap(n, u):
                return True
    return False


# ───────────────────────── Hard constraints (lọc domain) ─────────────────────────


def _build_domain(
    course: Course,
    semester_id: int,
    teacher_id: int | None = None,
) -> list[ClassSection]:
    """Lọc lớp HP khả thi cho 1 môn (hard constraints):
       - đúng semester
       - status=OPEN
       - chưa đầy: enrolled_count < max_students (BR-005)
       - (optional) chỉ GV `teacher_id` dạy
       - prefetch schedules (tránh N+1 trong backtrack)
    """
    qs = ClassSection.objects.filter(
        course=course,
        semester_id=semester_id,
        status=ClassSection.Status.OPEN,
        enrolled_count__lt=F("max_students"),
    )
    if teacher_id is not None:
        qs = qs.filter(teacher_id=teacher_id)
    return list(qs.prefetch_related("schedules").order_by("code"))


def _passed_course_ids(student) -> set[int]:
    """BR-002: lấy set course_id mà SV đã pass (grade ≥ PASSING_SCORE).

    Reuse logic giống RegistrationSerializer._check_prerequisites (line 88-95).
    """
    passing_score = settings.GRADE_PASSING_SCORE
    qs = (
        Registration.objects.filter(
            student=student,
            status=Registration.Status.CONFIRMED,
            grade__total_score__gte=passing_score,
        )
        .values_list("class_section__course_id", flat=True)
    )
    return set(qs)


def _missing_prerequisites(course: Course, passed_ids: set[int]) -> list[str]:
    """Trả list code môn tiên quyết SV CHƯA pass."""
    required = list(
        course.prerequisite_links.values_list(
            "required_course_id", "required_course__code"
        )
    )
    return [code for cid, code in required if cid not in passed_ids]


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
    """DFS, dừng khi đủ max_results.

    Variable selection: courses_ordered đã sort theo |domain| asc (MRV).
    Forward checking: kiểm tra conflict với used_schedules trước khi recurse.
    """
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
        # Chọn cs
        selected.append(cs)
        used_schedules.extend(cs_schedules)
        _backtrack(
            courses_ordered, domains, schedules_cache, idx + 1,
            selected, used_schedules, feasible, max_results,
        )
        # Backtrack
        selected.pop()
        for _ in cs_schedules:
            used_schedules.pop()


# ───────────────────────── Scoring ─────────────────────────


# Hằng số phạt: mỗi tiết trống giữa 2 buổi cùng ngày trừ 5 điểm
GAP_PENALTY_PER_PERIOD = 5.0


def _score_weekday(schedules: list[Schedule], avoid: frozenset[int]) -> float:
    """% schedules KHÔNG rơi vào avoid_weekdays. 100 nếu avoid rỗng."""
    if not schedules or not avoid:
        return 100.0
    hits = sum(1 for s in schedules if s.weekday in avoid)
    return 100.0 * (1.0 - hits / len(schedules))


def _score_session(schedules: list[Schedule], preferred: frozenset[str]) -> float:
    """% schedules thuộc preferred_sessions. 100 nếu preferred rỗng."""
    if not preferred:
        return 100.0
    if not schedules:
        return 100.0
    hits = sum(1 for s in schedules if s.session in preferred)
    return 100.0 * hits / len(schedules)


def _score_teacher(
    class_sections: list[ClassSection], preferred: frozenset[int]
) -> float:
    """% lớp HP có teacher trong preferred. 100 nếu preferred rỗng."""
    if not preferred:
        return 100.0
    if not class_sections:
        return 100.0
    hits = sum(
        1 for cs in class_sections
        if cs.teacher_id is not None and cs.teacher_id in preferred
    )
    return 100.0 * hits / len(class_sections)


def _score_gap(schedules: list[Schedule]) -> float:
    """Tổng số tiết trống giữa các buổi trong cùng 1 ngày.

    Vd: T2 có buổi tiết 1-3 và 6-8 → gap = 2 tiết (4, 5).
    Score = max(0, 100 - tổng_gap × 5).
    """
    by_day: dict[int, list[Schedule]] = {}
    for s in schedules:
        by_day.setdefault(s.weekday, []).append(s)

    total_gap = 0
    for day_schedules in by_day.values():
        if len(day_schedules) < 2:
            continue
        sorted_s = sorted(day_schedules, key=lambda x: x.start_period)
        for prev, cur in zip(sorted_s, sorted_s[1:]):
            gap = cur.start_period - prev.end_period - 1
            if gap > 0:
                total_gap += gap

    return max(0.0, 100.0 - total_gap * GAP_PENALTY_PER_PERIOD)


def score_assignment(
    class_sections: list[ClassSection],
    schedules_cache: dict[int, list[Schedule]],
    prefs: Preferences,
) -> tuple[float, dict[str, float]]:
    """Tính 4 sub-scores [0-100] rồi weighted sum theo preset."""
    schedules = [
        s for cs in class_sections for s in schedules_cache[cs.id]
    ]

    s_weekday = _score_weekday(schedules, prefs.avoid_weekdays)
    s_session = _score_session(schedules, prefs.preferred_sessions)
    s_teacher = _score_teacher(class_sections, prefs.preferred_teacher_ids)
    s_gap = _score_gap(schedules) if prefs.minimize_gaps else 100.0

    w_weekday, w_session, w_teacher, w_gap = prefs.weights
    total = (
        w_weekday * s_weekday
        + w_session * s_session
        + w_teacher * s_teacher
        + w_gap * s_gap
    )

    return total, {
        "weekday": round(s_weekday, 2),
        "session": round(s_session, 2),
        "teacher": round(s_teacher, 2),
        "gap": round(s_gap, 2),
        "total": round(total, 2),
    }


# ───────────────────────── Public entry point ─────────────────────────


class AutoScheduleError(Exception):
    """Raised khi input không hợp lệ hoặc không có domain."""


def suggest_schedules(
    student,
    semester,
    course_ids: list[int],
    prefs: Preferences,
    max_results: int = 50,
) -> list[Candidate]:
    """Trả list Candidate sort desc theo score.

    Raises AutoScheduleError nếu:
      - 1 course không tồn tại
      - 1 course thiếu prereq (BR-002)
      - 1 course không có lớp HP khả thi (domain rỗng)
    """
    # 1. Lấy courses
    courses = list(Course.objects.filter(id__in=course_ids))
    if len(courses) != len(course_ids):
        missing = set(course_ids) - {c.id for c in courses}
        raise AutoScheduleError(f"Môn không tồn tại: {sorted(missing)}")

    # 2. Check prerequisites (BR-002) — fail-fast trước khi backtrack
    passed_ids = _passed_course_ids(student)
    for c in courses:
        missing_prereqs = _missing_prerequisites(c, passed_ids)
        if missing_prereqs:
            raise AutoScheduleError(
                f"Môn {c.code} thiếu tiên quyết: {', '.join(missing_prereqs)}"
            )

    # 3. Build domains (BR-005 filter chưa đầy + per-course teacher hard filter)
    domains: dict[int, list[ClassSection]] = {}
    schedules_cache: dict[int, list[Schedule]] = {}
    for c in courses:
        teacher_constraint = prefs.course_teacher_constraints.get(c.id)
        domain = _build_domain(c, semester.id, teacher_id=teacher_constraint)
        if not domain:
            if teacher_constraint is not None:
                raise AutoScheduleError(
                    f"Môn {c.code}: không có lớp HP nào do GV ID={teacher_constraint} "
                    f"dạy (hoặc lớp đó đã đầy)."
                )
            raise AutoScheduleError(
                f"Môn {c.code} không có lớp HP khả thi (status=OPEN, chưa đầy)."
            )
        domains[c.id] = domain
        for cs in domain:
            schedules_cache[cs.id] = list(cs.schedules.all())

    # 4. MRV heuristic: order courses by |domain| asc → fail-fast tổ hợp khó
    courses_ordered = sorted(courses, key=lambda c: len(domains[c.id]))

    # 5. Backtracking
    feasible: list[list[ClassSection]] = []
    _backtrack(
        courses_ordered=courses_ordered,
        domains=domains,
        schedules_cache=schedules_cache,
        idx=0,
        selected=[],
        used_schedules=[],
        feasible=feasible,
        max_results=max_results,
    )

    # 6. Score + sort
    candidates: list[Candidate] = []
    for assignment in feasible:
        score, breakdown = score_assignment(assignment, schedules_cache, prefs)
        candidates.append(
            Candidate(class_sections=assignment, score=score, breakdown=breakdown)
        )
    candidates.sort(key=lambda c: c.score, reverse=True)

    return candidates
