"""Tests cho TKB tự động (FR-STU-TKB) — algorithm + endpoint.

Coverage:
- Smoke: 2 môn × 2 lớp không trùng → Cartesian product
- Conflict: 2 môn cùng giờ → loại trừ
- Hard constraints: prereq (BR-002), full class (BR-005)
- Scoring: preferred_sessions
- Preset weights: TEACHER_FIRST, COMPACT_FIRST tạo ranking khác BALANCED
- Endpoint: permission, validation, response shape
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.classes.models import ClassSection, Schedule
from apps.courses.models import Prerequisite
from apps.grades.models import Grade
from apps.registrations.models import Registration
from apps.registrations.auto_schedule import (
    AutoScheduleError,
    PriorityPreset,
    Preferences,
    suggest_schedules,
)


# ───────────────────────── Helpers ─────────────────────────


def _api(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def _make_class(course, class_section_factory, *, weekday=0, session=Schedule.Session.MORNING, start_period=1, teacher=None):
    """Tạo lớp HP với 1 schedule."""
    kwargs = {"weekday": weekday, "session": session, "start_period": start_period}
    if teacher is not None:
        kwargs["teacher"] = teacher
    return class_section_factory(course, **kwargs)


# ───────────────────────── Algorithm tests ─────────────────────────


def test_smoke_two_courses_two_classes_each_no_conflict(
    student_profile, open_semester, course_factory, class_section_factory
):
    """2 môn, mỗi môn 2 lớp HP, không trùng lịch → 4 phương án (2×2)."""
    c1 = course_factory(code="CS101")
    c2 = course_factory(code="CS102")
    # CS101: T2 sáng 1, T3 sáng 1
    _make_class(c1, class_section_factory, weekday=0, start_period=1)
    _make_class(c1, class_section_factory, weekday=1, start_period=1)
    # CS102: T4 chiều 6, T5 chiều 6 (không trùng)
    _make_class(c2, class_section_factory, weekday=2, session=Schedule.Session.AFTERNOON, start_period=6)
    _make_class(c2, class_section_factory, weekday=3, session=Schedule.Session.AFTERNOON, start_period=6)

    candidates = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c1.id, c2.id],
        prefs=Preferences(),
    )
    assert len(candidates) == 4
    # Mỗi candidate có đúng 2 class_sections
    for cand in candidates:
        assert len(cand.class_sections) == 2


def test_conflict_excludes_overlapping_combos(
    student_profile, open_semester, course_factory, class_section_factory
):
    """2 môn, lớp duy nhất của cả 2 cùng T2 sáng → 0 phương án."""
    c1 = course_factory(code="CS201")
    c2 = course_factory(code="CS202")
    _make_class(c1, class_section_factory, weekday=0, start_period=1)
    _make_class(c2, class_section_factory, weekday=0, start_period=1)  # trùng

    candidates = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c1.id, c2.id],
        prefs=Preferences(),
    )
    assert candidates == []


def test_missing_prerequisite_raises(
    student_profile, open_semester, course_factory, class_section_factory
):
    """BR-002: 1 môn thiếu prereq → AutoScheduleError."""
    prereq = course_factory(code="CS100")
    main = course_factory(code="CS300")
    Prerequisite.objects.create(course=main, required_course=prereq)
    _make_class(main, class_section_factory)

    with pytest.raises(AutoScheduleError) as exc_info:
        suggest_schedules(
            student=student_profile,
            semester=open_semester,
            course_ids=[main.id],
            prefs=Preferences(),
        )
    assert "CS300" in str(exc_info.value)
    assert "CS100" in str(exc_info.value)


def test_full_class_excluded_from_domain(
    student_profile, open_semester, course_factory, class_section_factory
):
    """BR-005: lớp đầy → loại khỏi domain. 2 lớp HP nhưng 1 lớp đầy → 1 phương án."""
    c = course_factory(code="CS400")
    cs1 = _make_class(c, class_section_factory, weekday=0, start_period=1)
    cs2 = _make_class(c, class_section_factory, weekday=1, start_period=1)
    # Lấp đầy cs1
    cs1.max_students = 5
    cs1.enrolled_count = 5
    cs1.save()

    candidates = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c.id],
        prefs=Preferences(),
    )
    assert len(candidates) == 1
    assert candidates[0].class_sections[0].id == cs2.id


def test_no_open_class_raises(
    student_profile, open_semester, course_factory
):
    """Môn không có lớp HP nào (chưa tạo lớp) → AutoScheduleError."""
    c = course_factory(code="CS500")
    with pytest.raises(AutoScheduleError) as exc_info:
        suggest_schedules(
            student=student_profile,
            semester=open_semester,
            course_ids=[c.id],
            prefs=Preferences(),
        )
    assert "không có lớp HP" in str(exc_info.value)


def test_scoring_prefers_morning_when_requested(
    student_profile, open_semester, course_factory, class_section_factory
):
    """preferred_sessions=MORNING → lớp sáng score cao hơn lớp chiều."""
    c = course_factory(code="CS600")
    cs_morning = _make_class(c, class_section_factory, weekday=0, session=Schedule.Session.MORNING, start_period=1)
    cs_afternoon = _make_class(c, class_section_factory, weekday=1, session=Schedule.Session.AFTERNOON, start_period=6)

    candidates = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c.id],
        prefs=Preferences(preferred_sessions=frozenset({"MORNING"})),
    )
    assert len(candidates) == 2
    # Top phương án phải là cs_morning
    assert candidates[0].class_sections[0].id == cs_morning.id
    assert candidates[0].breakdown["session"] == 100.0
    assert candidates[1].class_sections[0].id == cs_afternoon.id
    assert candidates[1].breakdown["session"] == 0.0


def test_preset_teacher_first_promotes_preferred_teacher(
    student_profile, open_semester, course_factory, class_section_factory, teacher_profile, other_teacher
):
    """TEACHER_FIRST: lớp có GV ưu tiên thắng cách biệt; BALANCED có thể hoà."""
    c = course_factory(code="CS700")
    cs_preferred = _make_class(c, class_section_factory, weekday=0, start_period=1, teacher=teacher_profile)
    cs_other = _make_class(c, class_section_factory, weekday=1, start_period=1, teacher=other_teacher)

    prefs_teacher = Preferences(
        preferred_teacher_ids=frozenset({teacher_profile.id}),
        preset=PriorityPreset.TEACHER_FIRST,
    )
    candidates = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c.id],
        prefs=prefs_teacher,
    )
    assert candidates[0].class_sections[0].id == cs_preferred.id
    # Cách biệt phải > 30 điểm (vì s_teacher chênh 100)
    assert candidates[0].score - candidates[1].score > 30


def test_preset_compact_first_prioritizes_low_gap(
    student_profile, open_semester, course_factory, class_section_factory
):
    """COMPACT_FIRST: phương án có gap=0 thắng phương án có gap lớn."""
    # 2 môn, mỗi môn 1 lựa chọn ngày khác nhau
    # Phương án A: cả 2 buổi T2 nối tiếp (gap=0)
    # Phương án B: T2 buổi sáng + T2 buổi chiều cách xa (gap>0)
    c1 = course_factory(code="CS801")
    c2 = course_factory(code="CS802")

    # CS801: 2 lớp - sáng tiết 1-3 hoặc sáng tiết 1-3 ở ngày khác
    cs1_compact = _make_class(c1, class_section_factory, weekday=0, start_period=1)  # T2 sáng 1-3
    cs1_other = _make_class(c1, class_section_factory, weekday=2, start_period=1)    # T4 sáng 1-3
    # CS802: lớp nối tiếp T2 sáng 4-? (impossible — sáng 1-5). Dùng T2 sáng tiết 4 (chỉ 1 tiết... vẫn cần periods_per_session)
    # → Đơn giản hơn: CS802 chỉ có 1 lớp T2 chiều 6-8 (gap 0 với cs1_compact vì khác buổi)
    # Wait: gap chỉ tính trong cùng day giữa các buổi. T2 sáng 1-3 + T2 chiều 6-8 → gap = 6-3-1 = 2 (vì sang chiều)
    # cs2 cố định T2 chiều 6
    cs2 = _make_class(c2, class_section_factory, weekday=0, session=Schedule.Session.AFTERNOON, start_period=6)

    # Tổ hợp A: cs1_compact (T2 sáng 1-3) + cs2 (T2 chiều 6-8) → cùng T2 → gap = 2
    # Tổ hợp B: cs1_other (T4 sáng 1-3) + cs2 (T2 chiều 6-8) → khác ngày → gap = 0
    candidates_compact = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c1.id, c2.id],
        prefs=Preferences(preset=PriorityPreset.COMPACT_FIRST),
    )
    # Top phải là tổ hợp B (gap=0)
    top_ids = {cs.id for cs in candidates_compact[0].class_sections}
    assert cs1_other.id in top_ids
    assert candidates_compact[0].breakdown["gap"] == 100.0
    assert candidates_compact[1].breakdown["gap"] < 100.0


def test_max_results_caps_output(
    student_profile, open_semester, course_factory, class_section_factory
):
    """max_results=3 → trả tối đa 3 phương án dù khả thi nhiều hơn."""
    c1 = course_factory(code="CS901")
    c2 = course_factory(code="CS902")
    # 4 lớp mỗi môn → 16 tổ hợp nếu không trùng
    for wd in range(4):
        _make_class(c1, class_section_factory, weekday=wd, start_period=1)
    for wd in range(4):
        _make_class(c2, class_section_factory, weekday=wd, session=Schedule.Session.AFTERNOON, start_period=6)

    candidates = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c1.id, c2.id],
        prefs=Preferences(),
        max_results=3,
    )
    assert len(candidates) == 3


# ───────────────────────── Endpoint tests ─────────────────────────


def test_endpoint_requires_student_role(
    teacher_profile, open_semester, course_factory, class_section_factory
):
    """GV gọi endpoint → 403."""
    c = course_factory(code="CSE01")
    _make_class(c, class_section_factory)
    api = _api(teacher_profile.user)
    res = api.post(
        "/api/auto-schedule/suggest/",
        {"semester": open_semester.id, "course_ids": [c.id]},
        format="json",
    )
    assert res.status_code == 403


def test_endpoint_smoke(
    student_profile, open_semester, course_factory, class_section_factory
):
    """SV gọi với 2 môn không trùng → 200 + danh sách candidates."""
    c1 = course_factory(code="CSE02")
    c2 = course_factory(code="CSE03")
    _make_class(c1, class_section_factory, weekday=0, start_period=1)
    _make_class(c2, class_section_factory, weekday=1, session=Schedule.Session.AFTERNOON, start_period=6)

    api = _api(student_profile.user)
    res = api.post(
        "/api/auto-schedule/suggest/",
        {"semester": open_semester.id, "course_ids": [c1.id, c2.id]},
        format="json",
    )
    assert res.status_code == 200, res.data
    body = res.data
    assert "count" in body and "results" in body
    assert body["count"] == 1
    cand = body["results"][0]
    assert "class_sections" in cand
    assert "score" in cand
    assert "breakdown" in cand
    assert set(cand["breakdown"].keys()) == {"weekday", "session", "teacher", "gap", "total"}


def test_endpoint_invalid_course_returns_400(
    student_profile, open_semester
):
    """course_id không tồn tại → 400 với message Vietnam."""
    api = _api(student_profile.user)
    res = api.post(
        "/api/auto-schedule/suggest/",
        {"semester": open_semester.id, "course_ids": [99999]},
        format="json",
    )
    assert res.status_code == 400
    assert "không tồn tại" in str(res.data).lower()


def test_course_teacher_constraint_hard_filters_domain(
    student_profile, open_semester, course_factory, class_section_factory,
    teacher_profile, other_teacher,
):
    """Hard filter per-course: course_teacher_constraints[c.id] = teacher_id
    → chỉ giữ lớp HP của course đó do teacher đó dạy.
    """
    c = course_factory(code="CSTC1")
    cs_a = _make_class(c, class_section_factory, weekday=0, start_period=1, teacher=teacher_profile)
    cs_b = _make_class(c, class_section_factory, weekday=1, start_period=1, teacher=other_teacher)

    # Không constraint → 2 phương án
    cands_all = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c.id],
        prefs=Preferences(),
    )
    assert len(cands_all) == 2

    # Constraint chọn teacher_profile → chỉ 1 phương án (cs_a)
    cands_locked = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c.id],
        prefs=Preferences(course_teacher_constraints={c.id: teacher_profile.id}),
    )
    assert len(cands_locked) == 1
    assert cands_locked[0].class_sections[0].id == cs_a.id


def test_course_teacher_constraint_no_matching_class_raises(
    student_profile, open_semester, course_factory, class_section_factory, teacher_profile, other_teacher,
):
    """Constraint trỏ tới GV không dạy môn đó → raise."""
    c = course_factory(code="CSTC2")
    _make_class(c, class_section_factory, teacher=teacher_profile)
    # other_teacher không dạy môn này
    with pytest.raises(AutoScheduleError) as exc_info:
        suggest_schedules(
            student=student_profile,
            semester=open_semester,
            course_ids=[c.id],
            prefs=Preferences(course_teacher_constraints={c.id: other_teacher.id}),
        )
    assert "GV ID" in str(exc_info.value) or "không có lớp" in str(exc_info.value).lower()


def test_endpoint_with_course_teacher_constraints(
    student_profile, open_semester, course_factory, class_section_factory, teacher_profile,
):
    """Endpoint accept course_teacher_constraints field."""
    c = course_factory(code="CSTC3")
    _make_class(c, class_section_factory, teacher=teacher_profile)
    api = _api(student_profile.user)
    res = api.post(
        "/api/auto-schedule/suggest/",
        {
            "semester": open_semester.id,
            "course_ids": [c.id],
            "course_teacher_constraints": {str(c.id): teacher_profile.id},
        },
        format="json",
    )
    assert res.status_code == 200, res.data
    assert res.data["count"] == 1


def test_endpoint_preset_in_request(
    student_profile, open_semester, course_factory, class_section_factory
):
    """preset=COMPACT_FIRST hợp lệ → 200."""
    c = course_factory(code="CSE04")
    _make_class(c, class_section_factory)
    api = _api(student_profile.user)
    res = api.post(
        "/api/auto-schedule/suggest/",
        {
            "semester": open_semester.id,
            "course_ids": [c.id],
            "preset": "COMPACT_FIRST",
        },
        format="json",
    )
    assert res.status_code == 200, res.data


# ───────────────────────── Fixtures cục bộ ─────────────────────────


@pytest.fixture
def other_teacher(db):
    """GV thứ hai để test teacher preference."""
    from apps.accounts.models import Role, User
    from apps.profiles.models import TeacherProfile
    u = User.objects.create_user(
        username="gv_ats", password="pass", role=Role.TEACHER, email="gv_ats@x.com"
    )
    return TeacherProfile.objects.create(user=u, teacher_code="GV_ATS")
