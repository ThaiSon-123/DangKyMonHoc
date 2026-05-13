"""Tests for Business Rules BR-001 → BR-006 trên Registration."""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.classes.models import ClassSection, Schedule
from apps.courses.models import Prerequisite
from apps.grades.models import Grade
from apps.registrations.models import Registration


@pytest.fixture
def api(student_user):
    client = APIClient()
    client.force_authenticate(user=student_user)
    return client


@pytest.fixture
def admin_api(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


# ---------- BR-003: chỉ cho đăng ký khi học kỳ mở ----------

def test_br003_reject_when_semester_closed(api, student_profile, course_factory, class_section_factory, closed_semester):
    course = course_factory()
    cs = class_section_factory(course, semester=closed_semester)
    res = api.post("/api/registrations/", {"class_section": cs.id}, format="json")
    assert res.status_code == 400
    assert "Học kỳ chưa được mở" in str(res.data)


def test_br003_reject_before_registration_start(api, student_profile, open_semester, course_factory, class_section_factory):
    open_semester.registration_start = timezone.now() + timedelta(days=1)
    open_semester.save()
    course = course_factory()
    cs = class_section_factory(course)
    res = api.post("/api/registrations/", {"class_section": cs.id}, format="json")
    assert res.status_code == 400
    assert "Đăng ký bắt đầu" in str(res.data)


def test_br003_reject_after_registration_end(api, student_profile, open_semester, course_factory, class_section_factory):
    open_semester.registration_end = timezone.now() - timedelta(days=1)
    open_semester.save()
    course = course_factory()
    cs = class_section_factory(course)
    res = api.post("/api/registrations/", {"class_section": cs.id}, format="json")
    assert res.status_code == 400
    assert "quá thời gian đăng ký" in str(res.data)


# ---------- BR-005: lớp đầy ----------

def test_br005_reject_when_class_full(api, student_profile, course_factory, class_section_factory):
    course = course_factory()
    cs = class_section_factory(course, max_students=1)
    cs.enrolled_count = 1  # giả lập đầy
    cs.save()
    res = api.post("/api/registrations/", {"class_section": cs.id}, format="json")
    assert res.status_code == 400
    assert "đã đầy" in str(res.data)


# ---------- BR-002: môn tiên quyết ----------

def test_br002_reject_when_prerequisite_not_passed(
    api, student_profile, course_factory, class_section_factory
):
    prereq_course = course_factory(code="CS100", name="Intro")
    main_course = course_factory(code="CS200", name="Advanced")
    Prerequisite.objects.create(course=main_course, required_course=prereq_course)
    cs = class_section_factory(main_course)
    res = api.post("/api/registrations/", {"class_section": cs.id}, format="json")
    assert res.status_code == 400
    assert "tiên quyết" in str(res.data)
    assert "CS100" in str(res.data)


def test_br002_allow_when_prerequisite_passed(
    api, student_profile, course_factory, class_section_factory, open_semester
):
    prereq_course = course_factory(code="CS100", name="Intro")
    main_course = course_factory(code="CS200", name="Advanced")
    Prerequisite.objects.create(course=main_course, required_course=prereq_course)

    # SV đã pass CS100 (CONFIRMED + total_score >= 4.0)
    prereq_cs = class_section_factory(
        prereq_course, weekday=2, session=Schedule.Session.AFTERNOON, start_period=6
    )
    prereq_reg = Registration.objects.create(
        student=student_profile, class_section=prereq_cs, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    Grade.objects.create(
        registration=prereq_reg,
        process_score=Decimal("8"), midterm_score=Decimal("7"), final_score=Decimal("8"),
    )

    main_cs = class_section_factory(main_course, weekday=1, start_period=1)
    res = api.post("/api/registrations/", {"class_section": main_cs.id}, format="json")
    assert res.status_code == 201, res.data


# ---------- BR-001: không chặn theo giới hạn tín chỉ ----------

def test_br001_allows_registration_without_credit_limit(
    api, student_profile, open_semester, course_factory, class_section_factory, settings
):
    settings.REGISTRATION_MAX_CREDITS_PER_SEMESTER = 6
    # Đăng ký môn 3TC trước
    c1 = course_factory(code="CS101", credits=3)
    cs1 = class_section_factory(c1, weekday=0, start_period=1)
    Registration.objects.create(
        student=student_profile, class_section=cs1, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    # Môn thứ 2 làm tổng vượt max cũ nhưng BR-001 hiện không áp dụng giới hạn tín chỉ
    c2 = course_factory(code="CS102", credits=4)
    cs2 = class_section_factory(c2, weekday=1, start_period=1)
    res = api.post("/api/registrations/", {"class_section": cs2.id}, format="json")
    assert res.status_code == 201, res.data


# ---------- BR-004: trùng lịch ----------

def test_br004_reject_when_schedule_conflicts(
    api, student_profile, open_semester, course_factory, class_section_factory
):
    c1 = course_factory(code="CS101")
    c2 = course_factory(code="CS102")
    cs1 = class_section_factory(c1, weekday=0, start_period=1)  # T2 tiết 1-3
    cs2 = class_section_factory(c2, weekday=0, start_period=3)  # T2 tiết 3-5 (trùng)
    Registration.objects.create(
        student=student_profile, class_section=cs1, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    res = api.post("/api/registrations/", {"class_section": cs2.id}, format="json")
    assert res.status_code == 400
    assert "Trùng lịch" in str(res.data)


def test_br004_allow_different_slots(
    api, student_profile, open_semester, course_factory, class_section_factory
):
    c1 = course_factory(code="CS101")
    c2 = course_factory(code="CS102")
    cs1 = class_section_factory(c1, weekday=0, start_period=1)
    cs2 = class_section_factory(
        c2, weekday=0, session=Schedule.Session.AFTERNOON, start_period=6
    )  # khác khoảng tiết
    Registration.objects.create(
        student=student_profile, class_section=cs1, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    res = api.post("/api/registrations/", {"class_section": cs2.id}, format="json")
    assert res.status_code == 201, res.data


# ---------- Signal: enrolled_count tự cập nhật ----------

def test_signal_updates_enrolled_count(
    api, student_profile, course_factory, class_section_factory
):
    course = course_factory()
    cs = class_section_factory(course)
    assert cs.enrolled_count == 0
    res = api.post("/api/registrations/", {"class_section": cs.id}, format="json")
    assert res.status_code == 201
    cs.refresh_from_db()
    assert cs.enrolled_count == 1


def test_signal_decrements_on_cancel(
    api, student_profile, open_semester, course_factory, class_section_factory
):
    course = course_factory()
    cs = class_section_factory(course)
    reg = Registration.objects.create(
        student=student_profile, class_section=cs, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    cs.refresh_from_db()
    assert cs.enrolled_count == 1

    res = api.post(f"/api/registrations/{reg.id}/cancel/", {"cancel_reason": "test"}, format="json")
    assert res.status_code == 200
    cs.refresh_from_db()
    assert cs.enrolled_count == 0


# ---------- BR-006: thời hạn hủy ----------

def test_br006_allow_cancel_within_window(
    api, student_profile, open_semester, course_factory, class_section_factory
):
    course = course_factory()
    cs = class_section_factory(course)
    reg = Registration.objects.create(
        student=student_profile, class_section=cs, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    res = api.post(f"/api/registrations/{reg.id}/cancel/", {"cancel_reason": "đổi ý"}, format="json")
    assert res.status_code == 200
    reg.refresh_from_db()
    assert reg.status == Registration.Status.CANCELLED
    assert reg.cancel_reason == "đổi ý"


def test_br006_reject_cancel_after_deadline(
    api, student_profile, course_factory, class_section_factory, open_semester, settings
):
    settings.REGISTRATION_CANCEL_GRACE_DAYS = 0
    open_semester.registration_end = timezone.now() - timedelta(days=1)
    open_semester.save()
    course = course_factory()
    cs = class_section_factory(course)
    reg = Registration.objects.create(
        student=student_profile, class_section=cs, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    res = api.post(f"/api/registrations/{reg.id}/cancel/", {"cancel_reason": "muộn"}, format="json")
    assert res.status_code == 403
    assert "quá thời hạn hủy" in str(res.data).lower()


def test_br006_admin_can_force_cancel_after_deadline(
    admin_api, student_profile, course_factory, class_section_factory, open_semester, settings
):
    settings.REGISTRATION_CANCEL_GRACE_DAYS = 0
    open_semester.registration_end = timezone.now() - timedelta(days=1)
    open_semester.save()
    course = course_factory()
    cs = class_section_factory(course)
    reg = Registration.objects.create(
        student=student_profile, class_section=cs, semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    res = admin_api.post(
        f"/api/registrations/{reg.id}/cancel/",
        {"cancel_reason": "admin force"}, format="json"
    )
    assert res.status_code == 200
