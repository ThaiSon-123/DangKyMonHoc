"""Tests cho action notify_class — GV gửi thông báo cho SV trong lớp phụ trách."""

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.notifications.models import Notification
from apps.profiles.models import TeacherProfile
from apps.registrations.models import Registration


@pytest.fixture
def other_teacher(db):
    u = User.objects.create_user(
        username="gv_other", password="pass", role=Role.TEACHER, email="gv_other@x.com"
    )
    return TeacherProfile.objects.create(user=u, teacher_code="GV_OTHER")


@pytest.fixture
def class_with_student(
    open_semester, teacher_profile, student_profile, course_factory, class_section_factory
):
    course = course_factory()
    cs = class_section_factory(course, teacher=teacher_profile)
    Registration.objects.create(
        student=student_profile,
        class_section=cs,
        semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    return cs


def _api_for(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def test_teacher_can_notify_own_class(class_with_student, teacher_profile, student_user):
    api = _api_for(teacher_profile.user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {
            "title": "Đổi lịch học tuần sau",
            "body": "Tuần sau lớp đổi sang phòng B5.10 thay vì A1.01.",
            "category": "SCHEDULE",
        },
        format="json",
    )
    assert res.status_code == 201, res.data
    assert res.data["recipient_count"] == 1
    assert res.data["class_code"] == class_with_student.code

    noti = Notification.objects.get(id=res.data["notification"]["id"])
    assert noti.audience == "SPECIFIC"
    assert noti.sender == teacher_profile.user
    assert student_user in noti.recipients.all()


def test_teacher_cannot_notify_other_class(class_with_student, other_teacher):
    """BR-007-like: GV không phụ trách → 403."""
    api = _api_for(other_teacher.user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {"title": "Hello", "body": "Test"},
        format="json",
    )
    assert res.status_code == 403
    assert "không phụ trách" in str(res.data).lower()


def test_admin_can_notify_any_class(class_with_student, admin_user):
    api = _api_for(admin_user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {"title": "Admin notice", "body": "Test from admin"},
        format="json",
    )
    assert res.status_code == 201
    assert res.data["recipient_count"] == 1


def test_student_cannot_notify_class(class_with_student, student_user):
    api = _api_for(student_user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {"title": "Hi", "body": "Test"},
        format="json",
    )
    assert res.status_code == 403


def test_notify_validation_missing_title(class_with_student, teacher_profile):
    api = _api_for(teacher_profile.user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {"body": "Test no title"},
        format="json",
    )
    assert res.status_code == 400
    assert "tiêu đề" in str(res.data).lower()


def test_notify_empty_class_returns_400(
    teacher_profile, course_factory, class_section_factory
):
    """Lớp chưa có SV CONFIRMED → không gửi được."""
    course = course_factory()
    cs = class_section_factory(course, teacher=teacher_profile)
    api = _api_for(teacher_profile.user)
    res = api.post(
        f"/api/class-sections/{cs.id}/notify/",
        {"title": "Hi", "body": "Test"},
        format="json",
    )
    assert res.status_code == 400
    assert "chưa có sinh viên" in str(res.data).lower()
