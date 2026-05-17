"""Tests cho TKB tự động (FR-STU-TKB) — algorithm + endpoint.

Coverage hard constraints:
- BR-002 (prereq), BR-003 (HK đang mở), BR-004 (không trùng lịch),
  BR-005 (lớp chưa đầy), CTĐT match, môn chưa học (no grade).
Coverage soft constraints:
- preferred_sessions, preferred_teacher_ids, free_day, weekday avoid.
- Preset weights (BALANCED, TEACHER_FIRST, SESSION_FIRST, COMPACT_FIRST).
Coverage endpoints:
- /available-courses/ list grouped + status flags + filter.
- /suggest/ permission, validation, response shape.
"""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.classes.models import ClassSection, Schedule
from apps.courses.models import Prerequisite
from apps.curriculums.models import Curriculum, CurriculumCourse
from apps.grades.models import Grade
from apps.registrations.models import Registration
from apps.registrations.auto_schedule import (
    AutoScheduleError,
    PriorityPreset,
    Preferences,
    suggest_schedules,
)


# ───────────────────────── Fixtures ─────────────────────────


@pytest.fixture
def curriculum(student_profile):
    """CTĐT match major + cohort_year của student_profile."""
    return Curriculum.objects.create(
        code="CTDT-CNTT-2021",
        name="CTDT CNTT 2021",
        major=student_profile.major,
        cohort_year=student_profile.enrollment_year,
        is_active=True,
        total_credits_required=140,
    )


@pytest.fixture
def add_to_curriculum(curriculum):
    """Helper: thêm course vào CTĐT."""
    def _add(course, suggested_semester=1, is_required=True):
        CurriculumCourse.objects.create(
            curriculum=curriculum,
            course=course,
            is_required=is_required,
            suggested_semester=suggested_semester,
        )
        return course
    return _add


@pytest.fixture
def other_teacher(db):
    from apps.accounts.models import Role, User
    from apps.profiles.models import TeacherProfile
    u = User.objects.create_user(
        username="gv_ats", password="pass", role=Role.TEACHER, email="gv_ats@x.com"
    )
    return TeacherProfile.objects.create(user=u, teacher_code="GV_ATS")


def _api(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def _make_class(course, class_section_factory, *, weekday=0,
                session=Schedule.Session.MORNING, start_period=1, teacher=None):
    kwargs = {"weekday": weekday, "session": session, "start_period": start_period}
    if teacher is not None:
        kwargs["teacher"] = teacher
    return class_section_factory(course, **kwargs)


# ───────────────────────── Algorithm tests ─────────────────────────


def test_smoke_two_courses_two_classes_each_no_conflict(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    """2 môn, mỗi môn 2 lớp HP không trùng → 4 phương án (2×2)."""
    c1 = add_to_curriculum(course_factory(code="CS101"))
    c2 = add_to_curriculum(course_factory(code="CS102"))
    _make_class(c1, class_section_factory, weekday=0, start_period=1)
    _make_class(c1, class_section_factory, weekday=1, start_period=1)
    _make_class(c2, class_section_factory, weekday=2, session=Schedule.Session.AFTERNOON, start_period=6)
    _make_class(c2, class_section_factory, weekday=3, session=Schedule.Session.AFTERNOON, start_period=6)

    candidates = suggest_schedules(
        student=student_profile,
        semester=open_semester,
        course_ids=[c1.id, c2.id],
        prefs=Preferences(),
    )
    assert len(candidates) == 4
    for cand in candidates:
        assert len(cand.class_sections) == 2
        assert "study_days" in cand.stats
        assert "free_days" in cand.stats


def test_conflict_without_feasible_schedule_reports_details(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    c1 = add_to_curriculum(course_factory(code="CS201"))
    c2 = add_to_curriculum(course_factory(code="CS202"))
    _make_class(c1, class_section_factory, weekday=0, start_period=1)
    _make_class(c2, class_section_factory, weekday=0, start_period=1)  # trùng

    with pytest.raises(AutoScheduleError) as exc:
        suggest_schedules(
            student=student_profile, semester=open_semester,
            course_ids=[c1.id, c2.id], prefs=Preferences(),
        )

    assert "Không tìm được phương án" in str(exc.value)
    assert any("CS201" in detail and "CS202" in detail for detail in exc.value.details)


def test_existing_registration_blocks_conflict(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    """Lịch của registration đã có làm `used_schedules` ban đầu — lớp trùng sẽ bị loại."""
    c_existing = add_to_curriculum(course_factory(code="CSE-EXIST"))
    cs_existing = _make_class(c_existing, class_section_factory, weekday=0, start_period=1)
    # Tạo registration cho cs_existing
    Registration.objects.create(
        student=student_profile, class_section=cs_existing, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    # Môn mới có 2 lớp, 1 trùng với existing
    c_new = add_to_curriculum(course_factory(code="CSE-NEW"))
    _make_class(c_new, class_section_factory, weekday=0, start_period=1)  # trùng
    cs_ok = _make_class(c_new, class_section_factory, weekday=2, start_period=1)

    candidates = suggest_schedules(
        student=student_profile, semester=open_semester,
        course_ids=[c_new.id], prefs=Preferences(),
    )
    assert len(candidates) == 1
    assert candidates[0].class_sections[0].id == cs_ok.id


def test_course_not_in_curriculum_raises(
    student_profile, open_semester, course_factory, class_section_factory,
):
    """Môn không thuộc CTĐT → AutoScheduleError."""
    c = course_factory(code="CS-NOCTDT")
    _make_class(c, class_section_factory)
    with pytest.raises(AutoScheduleError) as exc:
        suggest_schedules(
            student=student_profile, semester=open_semester,
            course_ids=[c.id], prefs=Preferences(),
        )
    assert "Chương trình đào tạo" in str(exc.value) or "không thuộc" in str(exc.value).lower()


def test_already_learned_course_raises(
    student_profile, open_semester, course_factory, class_section_factory,
    add_to_curriculum, closed_semester,
):
    """Môn SV đã có điểm → AutoScheduleError "Môn đã học rồi"."""
    c = add_to_curriculum(course_factory(code="CS-LEARNED"))
    # Tạo grade cho SV ở học kỳ cũ
    cs_old = _make_class(c, class_section_factory)
    reg_old = Registration.objects.create(
        student=student_profile, class_section=cs_old, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    Grade.objects.create(
        registration=reg_old,
        process_score=Decimal("7"), midterm_score=Decimal("7"), final_score=Decimal("7"),
    )
    # Tạo lớp mới của môn này
    _make_class(c, class_section_factory, weekday=1, start_period=1)

    with pytest.raises(AutoScheduleError) as exc:
        suggest_schedules(
            student=student_profile, semester=open_semester,
            course_ids=[c.id], prefs=Preferences(),
        )
    assert "đã học rồi" in str(exc.value).lower()


def test_missing_prerequisite_raises(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    prereq = add_to_curriculum(course_factory(code="CS100"))
    main = add_to_curriculum(course_factory(code="CS300"))
    Prerequisite.objects.create(course=main, required_course=prereq)
    _make_class(main, class_section_factory)
    with pytest.raises(AutoScheduleError) as exc:
        suggest_schedules(
            student=student_profile, semester=open_semester,
            course_ids=[main.id], prefs=Preferences(),
        )
    assert "CS300" in str(exc.value)
    assert "CS100" in str(exc.value)


def test_full_class_excluded_from_domain(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    c = add_to_curriculum(course_factory(code="CS400"))
    cs1 = _make_class(c, class_section_factory, weekday=0, start_period=1)
    cs2 = _make_class(c, class_section_factory, weekday=1, start_period=1)
    cs1.max_students = 5
    cs1.enrolled_count = 5
    cs1.save()
    candidates = suggest_schedules(
        student=student_profile, semester=open_semester,
        course_ids=[c.id], prefs=Preferences(),
    )
    assert len(candidates) == 1
    assert candidates[0].class_sections[0].id == cs2.id


def test_no_open_class_raises(
    student_profile, open_semester, course_factory, add_to_curriculum,
):
    c = add_to_curriculum(course_factory(code="CS500"))
    with pytest.raises(AutoScheduleError) as exc:
        suggest_schedules(
            student=student_profile, semester=open_semester,
            course_ids=[c.id], prefs=Preferences(),
        )
    assert "không có lớp HP" in str(exc.value)


def test_semester_closed_raises(
    student_profile, closed_semester, course_factory, class_section_factory, add_to_curriculum,
):
    """HK `is_open=False` → AutoScheduleError."""
    c = add_to_curriculum(course_factory(code="CS-CLOSED"))
    with pytest.raises(AutoScheduleError) as exc:
        suggest_schedules(
            student=student_profile, semester=closed_semester,
            course_ids=[c.id], prefs=Preferences(),
        )
    assert "chưa được mở" in str(exc.value).lower()


def test_upcoming_semester_allows_suggest(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    """HK sắp mở (now < registration_start) vẫn cho tìm phương án.
    Apply sẽ bị chặn ở RegistrationSerializer (BR-003) — không phải ở suggest.
    """
    from datetime import timedelta
    open_semester.registration_start = timezone.now() + timedelta(days=3)
    open_semester.registration_end = timezone.now() + timedelta(days=20)
    open_semester.save()

    c = add_to_curriculum(course_factory(code="CS-UPCOMING"))
    _make_class(c, class_section_factory)
    candidates = suggest_schedules(
        student=student_profile, semester=open_semester,
        course_ids=[c.id], prefs=Preferences(),
    )
    assert len(candidates) == 1  # vẫn trả phương án


def test_past_registration_end_raises(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    """Quá registration_end → AutoScheduleError (đã đóng đăng ký)."""
    from datetime import timedelta
    open_semester.registration_end = timezone.now() - timedelta(days=1)
    open_semester.save()

    c = add_to_curriculum(course_factory(code="CS-PASTEND"))
    _make_class(c, class_section_factory)
    with pytest.raises(AutoScheduleError) as exc:
        suggest_schedules(
            student=student_profile, semester=open_semester,
            course_ids=[c.id], prefs=Preferences(),
        )
    assert "quá thời gian đăng ký" in str(exc.value).lower()


def test_scoring_prefers_morning_when_requested(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    c = add_to_curriculum(course_factory(code="CS600"))
    cs_morning = _make_class(c, class_section_factory, weekday=0, session=Schedule.Session.MORNING, start_period=1)
    cs_afternoon = _make_class(c, class_section_factory, weekday=1, session=Schedule.Session.AFTERNOON, start_period=6)
    candidates = suggest_schedules(
        student=student_profile, semester=open_semester,
        course_ids=[c.id],
        prefs=Preferences(preferred_sessions=frozenset({"MORNING"})),
    )
    assert candidates[0].class_sections[0].id == cs_morning.id
    assert candidates[0].breakdown["session"] == 100.0
    assert candidates[1].breakdown["session"] == 0.0


def test_preset_teacher_first_promotes_preferred_teacher(
    student_profile, open_semester, course_factory, class_section_factory,
    teacher_profile, other_teacher, add_to_curriculum,
):
    c = add_to_curriculum(course_factory(code="CS700"))
    cs_pref = _make_class(c, class_section_factory, weekday=0, start_period=1, teacher=teacher_profile)
    _make_class(c, class_section_factory, weekday=1, start_period=1, teacher=other_teacher)
    candidates = suggest_schedules(
        student=student_profile, semester=open_semester,
        course_ids=[c.id],
        prefs=Preferences(
            preferred_teacher_ids=frozenset({teacher_profile.id}),
            preset=PriorityPreset.TEACHER_FIRST,
        ),
    )
    assert candidates[0].class_sections[0].id == cs_pref.id
    assert candidates[0].score - candidates[1].score > 30


def test_preset_compact_first_prioritizes_free_days(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    """COMPACT_FIRST: phương án ít ngày học (nhiều ngày nghỉ) thắng."""
    c1 = add_to_curriculum(course_factory(code="CS801"))
    c2 = add_to_curriculum(course_factory(code="CS802"))
    # cs1 có 2 lựa chọn: T2 vs T4
    cs1_t2 = _make_class(c1, class_section_factory, weekday=0, start_period=1)
    _make_class(c1, class_section_factory, weekday=2, start_period=1)
    # cs2 cố định T2 chiều
    cs2 = _make_class(c2, class_section_factory, weekday=0, session=Schedule.Session.AFTERNOON, start_period=6)

    # 2 tổ hợp:
    # A: cs1_t2 + cs2 → cùng T2 → study_days=1, free_days=6 → s_free_day=85.7
    # B: cs1_t4 + cs2 → T4 + T2 → study_days=2, free_days=5 → s_free_day=71.4
    candidates = suggest_schedules(
        student=student_profile, semester=open_semester,
        course_ids=[c1.id, c2.id],
        prefs=Preferences(preset=PriorityPreset.COMPACT_FIRST),
    )
    # Top phải là tổ hợp A (1 ngày học)
    top_class_ids = {cs.id for cs in candidates[0].class_sections}
    assert cs1_t2.id in top_class_ids
    assert candidates[0].stats["study_days"] == 1
    assert candidates[0].stats["free_days"] == 6
    assert candidates[0].breakdown["free_day"] > candidates[1].breakdown["free_day"]


def test_course_teacher_constraint_hard_filters(
    student_profile, open_semester, course_factory, class_section_factory,
    teacher_profile, other_teacher, add_to_curriculum,
):
    c = add_to_curriculum(course_factory(code="CSTC1"))
    cs_a = _make_class(c, class_section_factory, weekday=0, start_period=1, teacher=teacher_profile)
    _make_class(c, class_section_factory, weekday=1, start_period=1, teacher=other_teacher)
    cands_locked = suggest_schedules(
        student=student_profile, semester=open_semester,
        course_ids=[c.id],
        prefs=Preferences(course_teacher_constraints={c.id: teacher_profile.id}),
    )
    assert len(cands_locked) == 1
    assert cands_locked[0].class_sections[0].id == cs_a.id


def test_auto_preset_weights_no_input_is_balanced():
    """AUTO + không có input nào → (0.25, 0.25, 0.25, 0.25)."""
    prefs = Preferences(preset=PriorityPreset.AUTO)
    assert prefs.weights == (0.25, 0.25, 0.25, 0.25)


def test_auto_preset_weights_one_input():
    """AUTO + 1 tiêu chí input → cái đó 0.55, các cái còn lại 0.15."""
    prefs = Preferences(
        preset=PriorityPreset.AUTO,
        preferred_sessions=frozenset({"MORNING"}),
    )
    w_weekday, w_session, w_teacher, w_free_day = prefs.weights
    assert w_session == 0.55
    assert w_weekday == 0.15
    assert w_teacher == 0.15
    assert w_free_day == 0.15
    assert round(sum(prefs.weights), 4) == 1.0


def test_auto_preset_weights_two_inputs():
    """AUTO + 2 tiêu chí → mỗi cái 0.35, các cái còn lại 0.15."""
    prefs = Preferences(
        preset=PriorityPreset.AUTO,
        preferred_sessions=frozenset({"MORNING"}),
        avoid_weekdays=frozenset({5, 6}),
    )
    w_weekday, w_session, w_teacher, w_free_day = prefs.weights
    assert w_weekday == 0.35
    assert w_session == 0.35
    assert w_teacher == 0.15
    assert w_free_day == 0.15
    assert round(sum(prefs.weights), 4) == 1.0


def test_auto_preset_teacher_active_via_course_constraint():
    """Course-level teacher constraint cũng kích hoạt 'teacher active' trong AUTO."""
    prefs = Preferences(
        preset=PriorityPreset.AUTO,
        course_teacher_constraints={1: 10},
    )
    w_weekday, w_session, w_teacher, w_free_day = prefs.weights
    assert w_teacher == 0.55  # chỉ 1 active → 0.55
    assert w_weekday == 0.15
    assert w_session == 0.15
    assert w_free_day == 0.15


def test_auto_preset_three_inputs():
    """AUTO + 3 tiêu chí → mỗi cái ~0.283, free_day 0.15."""
    prefs = Preferences(
        preset=PriorityPreset.AUTO,
        avoid_weekdays=frozenset({6}),
        preferred_sessions=frozenset({"MORNING"}),
        preferred_teacher_ids=frozenset({1}),
    )
    w_weekday, w_session, w_teacher, w_free_day = prefs.weights
    assert round(w_weekday, 3) == round((1 - 0.15) / 3, 3)
    assert round(w_session, 3) == round((1 - 0.15) / 3, 3)
    assert round(w_teacher, 3) == round((1 - 0.15) / 3, 3)
    assert w_free_day == 0.15
    assert round(sum(prefs.weights), 4) == 1.0


def test_max_results_caps_output(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    c1 = add_to_curriculum(course_factory(code="CS901"))
    c2 = add_to_curriculum(course_factory(code="CS902"))
    for wd in range(4):
        _make_class(c1, class_section_factory, weekday=wd, start_period=1)
    for wd in range(4):
        _make_class(c2, class_section_factory, weekday=wd, session=Schedule.Session.AFTERNOON, start_period=6)
    candidates = suggest_schedules(
        student=student_profile, semester=open_semester,
        course_ids=[c1.id, c2.id], prefs=Preferences(), max_results=3,
    )
    assert len(candidates) == 3


# ───────────────────────── Endpoint tests ─────────────────────────


def test_suggest_requires_student_role(
    teacher_profile, open_semester,
):
    api = _api(teacher_profile.user)
    res = api.post(
        "/api/auto-schedule/suggest/",
        {"semester": open_semester.id, "course_ids": [1]},
        format="json",
    )
    assert res.status_code == 403


def test_suggest_endpoint_smoke(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    c1 = add_to_curriculum(course_factory(code="CSE02"))
    c2 = add_to_curriculum(course_factory(code="CSE03"))
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
    assert body["count"] == 1
    cand = body["results"][0]
    assert set(cand["breakdown"].keys()) == {"weekday", "session", "teacher", "free_day", "total"}
    assert "stats" in cand
    assert set(cand["stats"].keys()) == {"study_days", "free_days"}


def test_suggest_endpoint_no_feasible_schedule_returns_conflict_details(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    c1 = add_to_curriculum(course_factory(code="CSE-CF1"))
    c2 = add_to_curriculum(course_factory(code="CSE-CF2"))
    _make_class(c1, class_section_factory, weekday=0, start_period=1)
    _make_class(c2, class_section_factory, weekday=0, start_period=1)

    api = _api(student_profile.user)
    res = api.post(
        "/api/auto-schedule/suggest/",
        {"semester": open_semester.id, "course_ids": [c1.id, c2.id]},
        format="json",
    )

    assert res.status_code == 400
    assert "Không tìm được phương án" in res.data["detail"]
    assert any("CSE-CF1" in detail and "CSE-CF2" in detail for detail in res.data["details"])


def test_available_courses_endpoint(
    student_profile, open_semester, course_factory, class_section_factory,
    teacher_profile, add_to_curriculum,
):
    """GET /available-courses/ trả courses thuộc CTĐT + có lớp HP OPEN."""
    c_in = add_to_curriculum(course_factory(code="AVL01"))
    _make_class(c_in, class_section_factory, teacher=teacher_profile)
    # Course không trong CTĐT
    c_out = course_factory(code="AVL02")
    _make_class(c_out, class_section_factory)

    api = _api(student_profile.user)
    res = api.get(f"/api/auto-schedule/available-courses/?semester={open_semester.id}")
    assert res.status_code == 200, res.data
    codes = {r["course_code"] for r in res.data["results"]}
    assert "AVL01" in codes
    assert "AVL02" not in codes

    course = next(r for r in res.data["results"] if r["course_code"] == "AVL01")
    assert course["has_grade"] is False
    assert course["passed"] is False
    assert course["registered"] is False
    assert len(course["teachers"]) == 1
    assert course["teachers"][0]["teacher_id"] == teacher_profile.id


def test_available_courses_unlearned_only_filter(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    c1 = add_to_curriculum(course_factory(code="UNL01"))
    c2 = add_to_curriculum(course_factory(code="UNL02"))
    cs1 = _make_class(c1, class_section_factory)
    _make_class(c2, class_section_factory, weekday=1)
    # SV đã có điểm c1
    reg = Registration.objects.create(
        student=student_profile, class_section=cs1, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    Grade.objects.create(
        registration=reg,
        process_score=Decimal("5"), midterm_score=Decimal("5"), final_score=Decimal("5"),
    )
    api = _api(student_profile.user)
    res = api.get(
        f"/api/auto-schedule/available-courses/?semester={open_semester.id}&unlearned_only=true",
    )
    codes = {r["course_code"] for r in res.data["results"]}
    assert "UNL01" not in codes
    assert "UNL02" in codes


def test_available_courses_search(
    student_profile, open_semester, course_factory, class_section_factory, add_to_curriculum,
):
    c1 = add_to_curriculum(course_factory(code="SEARCH-A", name="Lập trình cơ bản"))
    c2 = add_to_curriculum(course_factory(code="SEARCH-B", name="Toán cao cấp"))
    _make_class(c1, class_section_factory)
    _make_class(c2, class_section_factory, weekday=1)
    api = _api(student_profile.user)
    res = api.get(
        f"/api/auto-schedule/available-courses/?semester={open_semester.id}&search=Toán",
    )
    codes = {r["course_code"] for r in res.data["results"]}
    assert "SEARCH-B" in codes
    assert "SEARCH-A" not in codes
