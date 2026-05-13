"""Tests for BR-007: GV chỉ nhập điểm cho lớp được phân công."""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.profiles.models import TeacherProfile
from apps.registrations.models import Registration


@pytest.fixture
def other_teacher_profile(db):
    u = User.objects.create_user(
        username="gv002", password="pass", role=Role.TEACHER, email="gv002@x.com"
    )
    return TeacherProfile.objects.create(user=u, teacher_code="GV002")


def _api_for(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def test_br007_teacher_can_grade_own_class(
    teacher_profile, student_profile, open_semester, course_factory, class_section_factory
):
    course = course_factory()
    cs = class_section_factory(course, teacher=teacher_profile)
    reg = Registration.objects.create(
        student=student_profile, class_section=cs, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    api = _api_for(teacher_profile.user)
    # 10*0.10 + 10*0.40 + 9*0.50 = 1 + 4 + 4.5 = 9.5 → A
    res = api.post(
        "/api/grades/",
        {"registration": reg.id, "process_score": "10", "midterm_score": "10", "final_score": "9"},
        format="json",
    )
    assert res.status_code == 201, res.data
    assert res.data["grade_letter"] == "A"


def test_br007_teacher_cannot_grade_other_class(
    teacher_profile, other_teacher_profile, student_profile, open_semester,
    course_factory, class_section_factory,
):
    course = course_factory()
    # Lớp được phân công cho other_teacher
    cs = class_section_factory(course, teacher=other_teacher_profile)
    reg = Registration.objects.create(
        student=student_profile, class_section=cs, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    # teacher_profile (không phụ trách lớp) cố nhập điểm
    api = _api_for(teacher_profile.user)
    res = api.post(
        "/api/grades/",
        {"registration": reg.id, "process_score": "8", "midterm_score": "7", "final_score": "9"},
        format="json",
    )
    assert res.status_code == 403
    assert "không được phân công" in str(res.data).lower()


def test_grade_auto_compute_total_and_letter(
    teacher_profile, student_profile, open_semester, course_factory, class_section_factory
):
    course = course_factory()
    cs = class_section_factory(course, teacher=teacher_profile)
    reg = Registration.objects.create(
        student=student_profile, class_section=cs, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    api = _api_for(teacher_profile.user)
    # 10% * 6 + 40% * 7 + 50% * 5 = 0.6 + 2.8 + 2.5 = 5.9 → C
    res = api.post(
        "/api/grades/",
        {"registration": reg.id, "process_score": "6", "midterm_score": "7", "final_score": "5"},
        format="json",
    )
    assert res.status_code == 201
    assert float(res.data["total_score"]) == 5.9
    assert res.data["grade_letter"] == "C"


def test_grade_update_window_blocks_late_update(
    teacher_profile, student_profile, course_factory, class_section_factory, settings
):
    """Sau end_date + GRADE_UPDATE_GRACE_DAYS không cho cập nhật."""
    from apps.semesters.models import Semester
    from datetime import date

    settings.GRADE_UPDATE_GRACE_DAYS = 0
    sem = Semester.objects.create(
        code="OLD", name="Old", term=Semester.Term.HK1, academic_year="2020-2021",
        start_date=date(2020, 9, 1), end_date=date(2021, 1, 31), is_open=False,
    )
    course = course_factory()
    cs = class_section_factory(course, teacher=teacher_profile, semester=sem)
    reg = Registration.objects.create(
        student=student_profile, class_section=cs, semester=sem,
        status=Registration.Status.CONFIRMED,
    )
    api = _api_for(teacher_profile.user)
    res = api.post(
        "/api/grades/",
        {"registration": reg.id, "process_score": "5", "midterm_score": "5", "final_score": "5"},
        format="json",
    )
    assert res.status_code == 403
    assert "quá thời hạn cập nhật" in str(res.data).lower()
